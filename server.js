// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// --- CORS แนะนำให้กำหนด origin ผ่าน .env ---
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---[0] ตรวจค่า .env ที่จำเป็น ---
if (!process.env.GEMINI_API_KEY) {
  console.warn("[WARN] GEMINI_API_KEY is missing in environment variables.");
}

// ---[1] System Prompt: ตรึงขอบเขต + สไตล์คำตอบ ---
const SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  `
คุณคือผู้ช่วย AI ของเว็บไซต์ TaraCare
- ขอบเขต: ตอบเฉพาะเรื่อง "แมงมุมทารันทูล่า" และการเลี้ยงดูที่ปลอดภัย (เช่น สายพันธุ์ พฤติกรรม อุณหภูมิ/ความชื้น อาหาร ขนาดตู้ วัสดุรองพื้น ปัญหาที่พบบ่อย การปฐมพยาบาลเบื้องต้นที่ไม่ใช่การแพทย์ ฯลฯ)
- ถ้าโจทย์ไม่เกี่ยวกับทารันทูล่า ให้ปฏิเสธอย่างสุภาพสั้น ๆ และชวนกลับเข้าสู่หัวข้อทารันทูล่า
- สไตล์คำตอบ: ภาษาไทย เข้าใจง่าย ได้ใจความ ไม่สั้นหรือยาวเกินไป (~80–160 คำ หรือ bullet 5–8 ข้อ)
- ให้คำแนะนำที่ปฏิบัติได้จริง (เช่น ช่วงอุณหภูมิ/ความชื้นโดยประมาณ ความถี่การให้อาหาร สิ่งที่ควร/ไม่ควร)
- อย่าเดาหรือให้คำแนะนำที่เสี่ยงอันตราย/ทางการแพทย์
`.trim();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---[2] ตั้งโมเดล + systemInstruction ---
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  // ให้เรนเดอร์เป็นมาร์กดาวน์อ่านง่าย (จะไม่บังคับถ้าไม่ต้องการ)
  responseMimeType: "text/markdown",
});

// ---[3] ปรับโทน/ความยาวด้วย generationConfig ---
const generationConfig = {
  temperature: 0.3, // ลดฟุ้ง โฟกัสเนื้อหา
  topP: 0.9,
  maxOutputTokens: 320, // ประมาณ 80–160 คำ
  candidateCount: 1,
};

// ---[4] Hard Guard: ถามนอกเรื่อง ให้ปัดตกตั้งแต่ฝั่งเซิร์ฟเวอร์ ---
const TARANTULA_KEYWORDS = [
  "ทารันทูล่า",
  "tarantula",
  "แมงมุม",
  "Brachypelma",
  "Grammostola",
  "Aphonopelma",
  "Poecilotheria",
  "Avicularia",
  "ความชื้น",
  "อุณหภูมิ",
  "substrate",
  "ซับสเตรต",
  "อาหาร",
  "จิ้งหรีด",
  "ดูบิอา",
  "ตู้เลี้ยง",
  "ฟอสซอเรียล",
  "อาร์โบเรียล",
  "เทอเรสเทรียล",
  "ลอกคราบ",
  "molt",
];

function isOnTopic(q) {
  const s = String(q || "").toLowerCase();
  return TARANTULA_KEYWORDS.some((k) => s.includes(k.toLowerCase()));
}

// ---[5] ตัวช่วยบังคับความยาวปลายทาง (กันยาวเกิน) ---
function clampWords(text, maxWords = 180) {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(" ") + " …";
}

// ---[6] Endpoint หลัก ---
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "empty prompt" });

    // 6.1 Guard นอกเรื่อง
    if (!isOnTopic(prompt)) {
      return res.json({
        text:
          "ขออภัยนะครับ ผมตอบเฉพาะเรื่องทารันทูล่าเท่านั้น 😊 " +
          "ลองถามเกี่ยวกับสายพันธุ์ การเลี้ยง อุณหภูมิ/ความชื้น อาหาร ตู้เลี้ยง หรือปัญหาที่พบบ่อยได้เลย!",
      });
    }

    // 6.2 ห่อ prompt ให้โมเดลชัดเจนเรื่องรูปแบบคำตอบ
    const userMessage = `
คำถามของผู้ใช้ (เกี่ยวกับทารันทูล่าแน่นอน):
${prompt}

รูปแบบคำตอบที่ต้องการ:
- ตอบเป็นภาษาไทย เข้าใจง่าย ได้ใจความ
- โฟกัสแมงมุมทารันทูล่าเท่านั้น หากนอกขอบเขตให้ปฏิเสธสั้น ๆ และชวนกลับหัวข้อทารันทูล่า
- ยาวประมาณ 80–160 คำ หรือใช้ bullet 5–8 ข้อ (เลือกอย่างใดอย่างหนึ่งที่เหมาะ)
- ให้คำแนะนำเชิงปฏิบัติ (ช่วงอุณหภูมิ/ความชื้นโดยประมาณ ความถี่การให้อาหาร สิ่งที่ควร/ไม่ควร)
- ห้ามให้คำแนะนำอันตราย/ทางการแพทย์
`.trim();

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig,
      // safetySettings: [...] // หากต้องการปรับ threshold เฉพาะ
    });

    // 6.3 ดึงข้อความออกมาอย่างทนทานต่อเวอร์ชัน SDK
    let text = "";
    try {
      text = result?.response?.text();
    } catch {
      text =
        result?.response?.candidates?.[0]?.content?.parts
          ?.map((p) => p?.text)
          .filter(Boolean)
          .join("\n") || "";
    }

    // 6.4 Soft limit ความยาว
    text = clampWords(text, 180);

    // 6.5 กันเคสตอบว่าง
    if (!text) {
      text =
        "ขอโทษด้วยนะครับ ตอนนี้ยังตอบไม่ได้ ลองถามใหม่อีกครั้งหรือระบุรายละเอียดเกี่ยวกับทารันทูล่าให้ชัดเจนขึ้นหน่อยได้ไหมครับ";
    }

    return res.json({ text });
  } catch (e) {
    console.error("[/api/ai] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// ---[7] Debug endpoint ไว้เช็กว่ารันค่าจริงจากฝั่งโฮสต์หรือยัง ---
app.get("/api/debug", (_req, res) => {
  res.json({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    hasSystemPrompt: Boolean(process.env.SYSTEM_PROMPT),
    corsOrigin: process.env.CORS_ORIGIN || "*",
    ts: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () =>
  console.log(`AI server running at http://localhost:${PORT}`)
);
