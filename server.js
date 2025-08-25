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
    const prompt = String(req.body?.prompt || "").trim();
    if (!prompt) return res.status(400).json({ error: "empty prompt" });

    const result = await model.generateContent(prompt);

    // ดึงข้อความแบบตรง ๆ
    let text = "";
    try {
      text = result?.response?.text(); // method ของ SDK
    } catch {
      // กันไว้เผื่อเวอร์ชัน/โครงสร้างเปลี่ยน
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
