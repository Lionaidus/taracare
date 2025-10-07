// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ---[1] กำหนด system prompt ให้ "ตรึงขอบเขต" และ "ตรึงสไตล์คำตอบ" ---
const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT || `
คุณคือผู้ช่วย AI ของเว็บไซต์ TaraCare
- ขอบเขต: ตอบเฉพาะเรื่อง "แมงมุมทารันทูล่า" และการเลี้ยงดูที่ปลอดภัย (เช่น สายพันธุ์ พฤติกรรม อุณหภูมิ/ความชื้น อาหาร ขนาดตู้ วัสดุรองพื้น ปัญหาที่พบบ่อย การปฐมพยาบาลเบื้องต้นที่ไม่ใช่การแพทย์ ฯลฯ)
- ถ้าโจทย์ไม่เกี่ยวกับทารันทูล่า ให้ปฏิเสธอย่างสุภาพสั้น ๆ และชวนกลับเข้าสู่หัวข้อทารันทูล่า
- สไตล์คำตอบ: ภาษาไทย เข้าใจง่าย ได้ใจความ ไม่สั้นหรือยาวเกินไป ( ~80–160 คำ หรือ 5–8 bullet )
- ให้คำแนะนำที่ปฏิบัติได้จริง (เช่น ช่วงอุณหภูมิ/ความชื้นโดยประมาณ, ความถี่การให้อาหาร, คำเตือนความปลอดภัย, สิ่งที่ควร/ไม่ควรทำ)
- อย่าเดาหรือให้คำแนะนำที่เสี่ยงอันตราย/ทางการแพทย์
`;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---[2] ตั้งโมเดลพร้อม systemInstruction + generationConfig คุมโทน/ความยาว---
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
  // ใส่ responseMimeType ถ้าอยากให้จัดรูปแบบอ่านง่าย
  // responseMimeType: "text/markdown",
});

const generationConfig = {
  temperature: 0.4,      // ลดฟุ้ง เก็บเนื้อ
  topP: 0.9,
  maxOutputTokens: 300,  // ประมาณ 80–160 คำพอดี ๆ
  // candidateCount: 1,   // ปกติ 1 ก็พอ
};

app.post("/api/ai", async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "empty prompt" });

    // ---[3] ห่อ prompt ผู้ใช้ให้ชัดเจนว่าเป็นคำถาม และ nhints สไตล์ ---
    const userMessage = `
คำถามของผู้ใช้:
${prompt}

รูปแบบคำตอบที่ต้องการ:
- ตอบเป็นภาษาไทย เข้าใจง่าย ได้ใจความ
- โฟกัสแมงมุมทารันทูล่าเท่านั้น หากนอกขอบเขตให้ปฏิเสธสั้น ๆ และชวนกลับหัวข้อทารันทูล่า
- ยาวประมาณ 80–160 คำ หรือใช้ bullet 5–8 ข้อ (ถ้าเหมาะกับเนื้อหา)
`;

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: userMessage }] },
      ],
      generationConfig,
      // safetySettings: [...] // ถ้าต้องปรับ threshold เพิ่มเติมค่อยใส่
    });

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
  console.log(`AI server running at http://localhost:${PORT}`)
);
