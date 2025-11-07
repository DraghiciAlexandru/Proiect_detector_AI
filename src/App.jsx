import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { getCurrentUser, logout } from "./auth/auth";

export default function App() {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "First chat",
      score: 100,
      messages: [
        { role: "assistant", text: "Hi! I'm your AI assistant. How can I help?" },
      ],
    },
  ]);
  const [currentId, setCurrentId] = useState(1);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(52); // dynamic score for current chat

  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const cu = await getCurrentUser();
      setUser(cu);
    }
    fetchUser();
  }, []);

  const currentConversation = conversations.find((c) => c.id === currentId);

  async function sendMessage() {
    if (!input.trim() || !currentConversation) return;

    const userText = input.trim();
    setInput("");
    setLoading(true);

    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentId
          ? {
              ...conv,
              messages: [...conv.messages, { role: "user", text: userText }],
            }
          : conv
      )
    );

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            ...currentConversation.messages.map((m) => ({
              role: m.role,
              content: m.text,
            })),
            { role: "user", content: userText },
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || "No response.";

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentId
            ? {
                ...conv,
                messages: [...conv.messages, { role: "assistant", text: reply }],
              }
            : conv
        )
      );

      // Example: Randomize score for demo
      const newScore = Math.floor(Math.random() * 100);
      setScore(newScore);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentId ? { ...conv, score: newScore } : conv
        )
      );
    } catch (err) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === currentId
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  { role: "assistant", text: "Error: " + err.message },
                ],
              }
            : conv
        )
      );
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowUserMenu(false);
  };

  const handleNewChat = () => {
    const newId = Date.now();
    const newConv = {
      id: newId,
      title: "New interview",
      score: 0,
      messages: [
        { role: "assistant", text: "New conversation started. Ask me anything." },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setCurrentId(newId);
    setScore(0);
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === currentId ? { ...conv, title: newTitle } : conv
      )
    );
  };

  return (
    <div className="app-page">
      {/* NAVBAR */}
      <nav className="app-navbar">
        <div className="app-nav-left" onClick={() => navigate("/")}>
          <h2 className="logo">Maidan</h2>
        </div>
        <div className="app-nav-right">
          {!user ? (
            <button className="login-btn" onClick={handleLoginClick}>
              Login
            </button>
          ) : (
            <div className="user-wrapper">
              <div
                className="user-info"
                onClick={() => setShowUserMenu((p) => !p)}
              >
                {user.email}
              </div>
              {showUserMenu && (
                <div className="user-menu">
                  <button onClick={() => navigate("/profile")}>Profile</button>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* FULLSCREEN BODY */}
      <div className="app-body">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>Interviews</span>
            <button className="buttonadd" onClick={handleNewChat}>
              +
            </button>
          </div>
          <div className="sidebar-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={
                  conv.id === currentId ? "sidebar-item active" : "sidebar-item"
                }
                onClick={() => {
                  setCurrentId(conv.id);
                  setScore(conv.score);
                }}
              >
                <div className="sidebar-item-content">
                  <p className="sidebar-title">{conv.title}</p>
                  <p className="sidebar-sub">Score: {conv.score ?? 0}%</p>
                </div>

                {/* delete button shown only on hover */}
                <button
                  className="delete-chat-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent chat selection
                    setConversations((prev) => {
                      const updated = prev.filter((c) => c.id !== conv.id);
                      // if we deleted the active one, select another
                      if (conv.id === currentId && updated.length > 0) {
                        setCurrentId(updated[0].id);
                        setScore(updated[0].score);
                      }
                      return updated;
                    });
                  }}
                >
                  –
                </button>
              </div>
            ))}
          </div>

        </aside>

        {/* CHAT AREA */}
        <div className="chat-shell">
          <header className="chat-header">
            <input
              className="chat-title-input"
              value={currentConversation?.title || ""}
              onChange={handleTitleChange}
            />
            <div className="chat-progress">
              <span className="progress-label">Score :</span>
              <span className="progress-value">{score}%</span>
            </div>
          </header>

          <main className="chat-body">
            {currentConversation?.messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "msg-row user" : "msg-row bot"}
              >
                <div
                  className={
                    m.role === "user" ? "msg-bubble user" : "msg-bubble bot"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="msg-row bot">
                <div className="msg-bubble bot typing">Typing...</div>
              </div>
            )}
          </main>

          <footer className="chat-input">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
            />
            <button onClick={sendMessage} disabled={loading}>
              Send
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
