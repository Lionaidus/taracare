// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

/* ---------- CORS: รองรับหลายโดเมนผ่าน ENV ----------
   ตั้ง CORS_ORIGIN เป็นคอมมาเซป เช่น:
   CORS_ORIGIN=https://taracare.netlify.app,https://taracare.app
*/
const allowList = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowList.includes("*") || allowList.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin ${origin}`));
    },
  })
);

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
  "brachypelma","grammostola","aphonopelma","poecilotheria","avicularia",
  "ความชื้น","อุณหภูมิ","substrate","ซับสเตรต",
  "อาหาร","จิ้งหรีด","ดูบิอา","dubia",
  "ตู้เลี้ยง","ฟอสซอเรียล","อาร์โบเรียล","เทอเรสเทรียล",
  "ลอกคราบ","molt","enclosure","humidity","temperature"
];

function isOnTopic(q) {
  const s = String(q || "").toLowerCase();
  return TARANTULA_KEYWORDS.some(k => s.includes(k));
}

function clampWords(text, minW = 70, maxW = 180) {
  const words = text.trim().split(/\s+/);
  if (words.length < minW) return text.trim();
  if (words.length <= maxW) return text.trim();
  return words.slice(0, maxW).join(" ") + " …";
}

// ---------- [3.1] rate-limit แบบเบา ๆ กันสแปม ----------
const hits = new Map(); // ip -> {count, ts}
const WINDOW_MS = 10_000;
const MAX_HITS = 10;
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress || "ip";
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, ts: now };
  if (now - rec.ts > WINDOW_MS) { rec.count = 0; rec.ts = now; }
  rec.count += 1;
  hits.set(ip, rec);
  if (rec.count > MAX_HITS) return res.status(429).json({ error: "Too many requests, please slow down." });
  next();
});

// ---------- [4] เรียกโมเดลแบบ Structured output (JSON) ----------
async function askModelJSON(userMessage) {
  const generationConfig = {
    temperature: 0.25,
    topP: 0.9,
    maxOutputTokens: 320, // ~80–160 คำ
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        topic_ok: { type: "boolean" },
        style_ok: { type: "boolean" },
        answer:   { type: "string"  },
        notes:    { type: "string"  },
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
- ให้ค่าช่วงอุณหภูมิ/ความชื้นโดยประมาณ ความถี่ให้อาหาร สิ่งที่ควร/ไม่ควร ถ้าเหมาะสม
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

    // Hard guard ก่อนเรียกโมเดล
    if (!isOnTopic(prompt)) {
      return res.json({
        text:
          "ขออภัยนะครับ ผมตอบเฉพาะเรื่องทารันทูล่าเท่านั้น 😊 " +
          "ลองถามเรื่องสายพันธุ์ การเลี้ยง อุณหภูมิ/ความชื้น อาหาร ตู้เลี้ยง หรือปัญหาที่พบบ่อยดูนะครับ",
      });
    }

    // เรียกรอบแรก
    let payload = await askModelJSON(buildUserMessage(prompt));

    // ถ้าหลุดหัวข้อ
    if (!payload?.topic_ok) {
      return res.json({
        text:
          "ขออภัยครับ ผมสามารถตอบเฉพาะหัวข้อทารันทูล่าเท่านั้น " +
          "ลองถามเกี่ยวกับสายพันธุ์ การเลี้ยง อุณหภูมิ/ความชื้น อาหาร หรือปัญหาที่พบบ่อยได้เลยครับ",
      });
    }

    // ปรับสไตล์/ความยาวถ้าจำเป็น
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

    // Soft clamp
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
    corsOrigin: allowList,
    ts: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () =>
  console.log(`AI server running at http://localhost:${PORT}`)
);
