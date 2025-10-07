import { useState } from "react";
import { askAI } from "./api";

export default function ChatBox() {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  const handleAsk = async () => {
    setA("กำลังตอบ...");
    try {
      const text = await askAI(q);
      setA(text);
    } catch (err) {
      setA("เกิดข้อผิดพลาด: " + err.message);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <textarea
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="พิมพ์คำถามเกี่ยวกับทารันทูล่า..."
        className="w-full border p-2 rounded"
      />
      <button onClick={handleAsk} className="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
        ถาม
      </button>
      <div className="mt-4 whitespace-pre-line bg-gray-50 p-3 rounded">
        {a}
      </div>
    </div>
  );
}
