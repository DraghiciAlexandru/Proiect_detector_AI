import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { getCurrentUser, logout } from "./auth/auth";
import interviewService from "./api/interviewservice"; // make sure this exists

export default function App() {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "First chat",
      score: 0,
      messages: [
        { role: "assistant", text: "Hi! I'm your AI assistant. How can I help?" },
      ],
    },
  ]);
  const [currentId, setCurrentId] = useState(1);

  // Interview flow state
  const [history, setHistory] = useState([]);
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [domain, setDomain] = useState("JavaScript"); // example
  const [level, setLevel] = useState("beginner");     // example
  const [loading, setLoading] = useState(false);

  // Track which interviews are finished
  const [finishedConversations, setFinishedConversations] = useState([]);

  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const cu = await getCurrentUser();
      setUser(cu);
    }
    fetchUser();
    generateNextQuestion(); // Start the first question automatically
  }, []);

  const currentConversation = conversations.find((c) => c.id === currentId);

  // ---------------- Interview functions ----------------
  async function generateNextQuestion() {
    try {
      const result = await interviewService.generateInterviewQuestion(domain, level, history);
      console.log("Generated Question:", result);

      setLastQuestion(result.interviewerQuestion);
      setHistory(prev => [...prev, { role: "assistant", text: result.interviewerQuestion }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: "assistant", text: "Error: " + err.message }]);
    }
  }

  async function sendAnswer() {
    if (!answer.trim()) return;

    const userAnswer = answer.trim();
    setAnswer("");
    setHistory(prev => [...prev, { role: "user", text: userAnswer }]);
    setLoading(true);

    try {
      const result = await interviewService.analyzeSingleResponse(userAnswer, {
        question: lastQuestion,
        domain,
        level,
      });
      console.log("Analysis result:", result);

      if (result.feedback) {
        setHistory(prev => [...prev, { role: "assistant", text: result.feedback }]);
      }

      // Update score in conversation (even if interview not finished)
      const newScore = Math.floor(Math.random() * 100);
      setConversations(prev =>
        prev.map(conv => conv.id === currentId ? { ...conv, score: newScore } : conv)
      );

      // Example: mark interview finished after 5 questions
      const userQuestionsCount = history.filter(m => m.role === "user").length + 1;
      if (userQuestionsCount >= 5) {
        setFinishedConversations(prev => [...prev, currentId]);
      }

      // Automatically generate next question if interview not finished
      if (!finishedConversations.includes(currentId)) {
        await generateNextQuestion();
      }
    } catch (err) {
      setHistory(prev => [...prev, { role: "assistant", text: "Error: " + err.message }]);
    }

    setLoading(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  }

  const handleLoginClick = () => navigate("/login");

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
    setConversations(prev => [newConv, ...prev]);
    setCurrentId(newId);
    setHistory([]);
    generateNextQuestion(); // start first question automatically
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setConversations(prev =>
      prev.map(conv => conv.id === currentId ? { ...conv, title: newTitle } : conv)
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
            <button className="login-btn" onClick={handleLoginClick}>Login</button>
          ) : (
            <div className="user-wrapper">
              <div className="user-info" onClick={() => setShowUserMenu(p => !p)}>
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
            <button className="buttonadd" onClick={handleNewChat}>+</button>
          </div>
          <div className="sidebar-list">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={conv.id === currentId ? "sidebar-item active" : "sidebar-item"}
                onClick={() => setCurrentId(conv.id)}
              >
                <div className="sidebar-item-content">
                  <p className="sidebar-title">{conv.title}</p>
                  <p className="sidebar-sub">
                    Score: {finishedConversations.includes(conv.id) ? conv.score : "?"}
                  </p>
                </div>
                <button
                  className="delete-chat-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConversations(prev => {
                      const updated = prev.filter(c => c.id !== conv.id);
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
          </header>

          <main className="chat-body">
            {history.map((m, i) => (
              <div key={i} className={m.role === "user" ? "msg-row user" : "msg-row bot"}>
                <div className={m.role === "user" ? "msg-bubble user" : "msg-bubble bot"}>
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
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
            />
            <button onClick={sendAnswer} disabled={loading}>Submit</button>
          </footer>
        </div>
      </div>
    </div>
  );
}
