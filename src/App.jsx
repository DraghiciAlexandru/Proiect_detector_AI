import React, { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! I'm your AI assistant. How can I help?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userText = input.trim();

    // append user message
    setMessages((msgs) => [...msgs, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      // make API call to OpenAI
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, // your key from .env
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            ...messages.map((m) => ({ role: m.role, content: m.text })),
            { role: "user", content: userText },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";
      setMessages((msgs) => [...msgs, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: "assistant", text: "Error: " + err.message },
      ]);
    }
    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[80vh]">
        <header className="p-4 border-b">
          <h1 className="text-lg font-semibold">ChatGPT-like React App</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={`max-w-[70%] p-3 rounded-2xl ${
                  m.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-gray-200 animate-pulse">
                Typing...
              </div>
            </div>
          )}
        </main>

        <footer className="p-3 border-t flex gap-2">
          <textarea
            className="flex-1 resize-none p-2 border rounded-xl focus:outline-none focus:ring"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"
          >
            Send
          </button>
        </footer>
      </div>
    </div>
  );
}
