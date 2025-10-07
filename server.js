// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---------- [1] System instruction: ล็อกขอบเขต + สไตล์ ----------
const SYSTEM_PROMPT = (process.env.SYSTEM_PROMPT || `
คุณคือผู้ช่วย AI ของเว็บไซต์ TaraCare
- ขอบเขต: ตอบเฉพาะเรื่อง "แมงมุมทารันทูล่า" และการเลี้ยงดูที่ปลอดภัย (สายพันธุ์ พฤติกรรม อุณหภูมิ/ความชื้น อาหาร ตู้ วัสดุรองพื้น ปัญหาที่พบบ่อย การปฐมพยาบาลเบื้องต้นที่ไม่ใช่การแพทย์ ฯลฯ)
- ถ้าคำถามไม่เกี่ยวกับทารันทูล่า ให้ปฏิเสธอย่างสุภาพสั้น ๆ และชวนกลับสู่หัวข้อทารันทูล่า
- สไตล์คำตอบ: ภาษาไทย เข้าใจง่าย ได้ใจความ (~80–160 คำ หรือ bullet 5–8 ข้อ)
- ให้คำแนะนำเชิงปฏิบัติ (ช่วงอุณหภูมิ/ความชื้นโดยประมาณ ความถี่ให้อาหาร สิ่งที่ควร/ไม่ควร)
- ห้ามเดา หรือให้คำแนะนำอันตราย/ทางการแพทย์
`).trim();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------- [2] Model ----------
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

// ---------- [3] ตัวช่วย ----------
const TARANTULA_KEYWORDS = [
  "ทารันทูล่า","tarantula","แมงมุม",
  "Brachypelma","Grammostola","Aphonopelma","Poecilotheria","Avicularia",
  "ความชื้น","อุณหภูมิ","substrate","ซับสเตรต",
  "อาหาร","จิ้งหรีด","ดูบิอา","dubia",
  "ตู้เลี้ยง","ฟอสซอเรียล","อาร์โบเรียล","เทอเรสเทรียล",
  "ลอกคราบ","molt","enclosure","humidity","temperature"
];

function isOnTopic(q) {
  const s = String(q || "").toLowerCase();
  return TARANTULA_KEYWORDS.some(k => s.includes(k.toLowerCase()));
}

function clampWords(text, minW = 70, maxW = 180) {
  const words = text.trim().split(/\s+/);
  if (words.length < minW) return text.trim(); // ให้ไปรีทรายแทน
  if (words.length <= maxW) return text.trim();
  return words.slice(0, maxW).join(" ") + " …";
}

// ---------- [4] เรียกโมเดลแบบ "Structured output" (JSON) ----------
async function askModelJSON(userMessage) {
  const generationConfig = {
    temperature: 0.25,              // โฟกัสเนื้อ
    topP: 0.9,
    maxOutputTokens: 320,           // ~80–160 คำ
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        topic_ok: { type: "boolean" },       // true = อยู่ในขอบเขตทารันทูล่า
        style_ok: { type: "boolean" },       // true = ความยาว/รูปแบบพอดี
        answer:   { type: "string"  },       // เนื้อหาที่จะส่งให้ผู้ใช้
        notes:    { type: "string"  },       // โน้ตภายใน (ไม่ต้องแสดงก็ได้)
      },
      required: ["topic_ok", "answer"]
    },
  };

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig,
  });

  const raw = result?.response?.text?.() ?? "";
  try {
    return JSON.parse(raw);
  } catch {
    // เผื่อรุ่น/เวอร์ชันไม่ส่ง JSON กลับมา
    return { topic_ok: true, style_ok: false, answer: raw || "" };
  }
}

// ---------- [5] รูปแบบคำสั่งถึงโมเดล ----------
function buildUserMessage(question) {
  return `
ภารกิจ:
- คุณต้องตอบเฉพาะ "ทารันทูล่า" เท่านั้น
- ถ้านอกขอบเขต ให้ตั้งค่า "topic_ok": false และอธิบายสั้น ๆ ใน "notes"

รูปแบบและความยาว:
- ภาษาไทย เข้าใจง่าย ได้ใจความ
- ความยาวประมาณ 80–160 คำ หรือ bullet 5–8 ข้อ
- หลีกเลี่ยงเนื้อหานอกหัวข้อ / เวิ่นเว้อ

ข้อกำหนดด้านเนื้อหา:
- ให้ค่าช่วงอุณหภูมิ/ความชื้นโดยประมาณ ความถี่การให้อาหาร สิ่งที่ควร/ไม่ควร ถ้าเหมาะสม
- หลีกเลี่ยงคำแนะนำอันตรายหรือทางการแพทย์

โจทย์ของผู้ใช้:
${question}

เอาต์พุตที่ต้องส่งกลับ (JSON เท่านั้น):
{
  "topic_ok": boolean,
  "style_ok": boolean,
  "answer": "คำตอบสำหรับผู้ใช้ (ภาษาไทย)",
  "notes": "เหตุผลย่อ (ไม่จำเป็น)"
}
`.trim();
}

// ---------- [6] Endpoint หลัก ----------
app.post("/api/ai", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "empty prompt" });

    // 6.1 กรองนอกเรื่องตั้งแต่ประตู (กันยิงคำทั่วไปเช่น “สวัสดี”)
    if (!isOnTopic(prompt)) {
      return res.json({
        text:
          "ขออภัยนะครับ ผมตอบเฉพาะเรื่องทารันทูล่าเท่านั้น 😊 " +
          "ลองถามเรื่องสายพันธุ์ การเลี้ยง อุณหภูมิ/ความชื้น อาหาร ตู้เลี้ยง หรือปัญหาที่พบบ่อยดูนะครับ",
      });
    }

    // 6.2 เรียกโมเดลรอบแรก (โหมด JSON)
    let payload = await askModelJSON(buildUserMessage(prompt));

    // 6.3 ถ้าหลุดขอบเขต ให้ปฏิเสธทันที
    if (!payload?.topic_ok) {
      return res.json({
        text:
          "ขออภัยครับ ผมสามารถตอบเฉพาะหัวข้อทารันทูล่าเท่านั้น " +
          "ลองถามเกี่ยวกับสายพันธุ์ การเลี้ยง อุณหภูมิ/ความชื้น อาหาร หรือปัญหาที่พบบ่อยได้เลยครับ",
      });
    }

    // 6.4 ถ้ารูปแบบ/ความยาวยังไม่นิ่ง ให้รีทรายสั่ง “แก้ไขให้ตรงเกณฑ์”
    let answer = String(payload?.answer || "").trim();

    const wordCount = answer ? answer.split(/\s+/).length : 0;
    const styleBad = !payload?.style_ok || wordCount < 70 || wordCount > 190;

    if (!answer || styleBad) {
      const refineMsg = `
คำตอบก่อนหน้านี้ยังไม่ตรงรูปแบบ/ความยาว
- ปรับให้อยู่ในช่วง ~80–160 คำ หรือ bullet 5–8 ข้อ
- คงขอบเขตทารันทูล่าเท่านั้น
- เน้นค่าปฏิบัติ (อุณหภูมิ/ความชื้น/ความถี่อาหาร/ควร-ไม่ควร) เท่าที่เหมาะ

คำถามเดิม:
${prompt}
`.trim();

      const refined = await askModelJSON(buildUserMessage(refineMsg));
      if (refined?.topic_ok && refined?.answer) {
        answer = refined.answer.trim();
      }
    }

    // 6.5 Soft clamp ความยาวปลายทาง
    answer = clampWords(answer, 70, 180);
    if (!answer) {
      answer =
        "ขอโทษด้วยนะครับ ตอนนี้ยังตอบไม่ได้ ลองถามใหม่อีกครั้งหรือระบุรายละเอียดเกี่ยวกับทารันทูล่าให้ชัดเจนขึ้นหน่อยได้ไหมครับ";
    }

    return res.json({ text: answer });
  } catch (e) {
    console.error("[/api/ai] error:", e?.message || e);
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

// ---------- [7] Debug ----------
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
