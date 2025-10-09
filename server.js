// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ใช้คีย์จาก .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// เลือกโมเดลจาก .env ได้ (ดีฟอลต์ 2.5-flash)
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
});

app.post("/api/ai", async (req, res) => {
  try {
    const userPrompt = String(req.body?.prompt || "").trim();
    if (!userPrompt) return res.status(400).json({ error: "empty prompt" });

    // 🕷️ Prompt พิเศษให้ตอบแค่เรื่องแมงมุม และฟีลมึน ๆ
    const SYSTEM_PROMPT = `
คุณคือ AI ชื่อ "TARA" เป็นผู้ช่วยที่รู้เรื่องแค่ "แมงมุมทารันทูล่า" เท่านั้น
คุณไม่รู้จักสิ่งอื่นเลย เช่น คน, สัตว์อื่น, วิทยาศาสตร์ทั่วไป หรือประวัติศาสตร์
ถ้ามีคำถามที่ไม่เกี่ยวกับทารันทูล่า ให้ตอบแบบงง ๆ หรือเปลี่ยนเรื่องกลับไปพูดถึงแมงมุมแทน
น้ำเสียงของคุณควรจะฟังดูมึน ๆ เอ๋อ ๆ หน่อย พูดซ้ำบ้าง ไม่ต้องฉลาดมาก
ตอบสั้น ๆ พอเข้าใจ ไม่ต้องอธิบายเยอะ

ตัวอย่าง:
- ถามว่า “ทารันทูล่ากินอะไร” → “กินแมลงจ้า บางทีก็กินจิ้งหรีด...อืม...น่ากินดีเนอะ”
- ถามว่า “AI คืออะไร” → “อ่า...ไม่รู้แฮะ รู้แต่ว่าแมงมุมมันชอบขุดรูนอน...”
- ถามว่า “เลี้ยงยังไง” → “ต้องมีตู้ มีดิน มีใจ แล้วก็อย่าให้มันหนี~”
`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\nคำถามของผู้ใช้: ${userPrompt}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 1.3, // ให้ตอบแบบมึน ๆ เพี้ยน ๆ หน่อย
        topP: 0.9,
        maxOutputTokens: 300,
      },
    });

    // ดึงข้อความแบบตรง ๆ
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

    res.json({ text });
  } catch (e) {
    console.error("[/api/ai] error:", e?.message || e);
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

const PORT = process.env.PORT || 5174;
app.listen(PORT, () =>
  console.log(`🕷️ AI server (มึน ๆ) running at http://localhost:${PORT}`)
);