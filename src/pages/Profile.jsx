import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { getCurrentUser, logout } from "../auth/auth";
import logo from "../assets/logo.png";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  // Load user
  useEffect(() => {
    async function fetchUser() {
      const cu = await getCurrentUser();
      setUser(cu);
    }
    fetchUser();
  }, []);

  // Load saved conversations from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("conversations");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setConversations(parsed);
      } catch (e) {
        console.error("Error parsing conversations", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowUserMenu(false);
    navigate("/login");
  };

  const totalChats = conversations.length;
  const scores = conversations.map((c) => c.score ?? 0);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  return (
    <div className="profile-page">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <img
            src={logo}
            alt="Maidan Logo"
            className="logo-image"
            onClick={() => navigate("/")}
          />
        </div>



        <div className="nav-right">
          {!user ? (
            <button className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
          ) : (
            <div className="user-wrapper">
              <div
                className="user-info"
                onClick={() => setShowUserMenu((prev) => !prev)}
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

      {/* MAIN CONTENT — fullscreen and centered */}
      <main className="profile-content">
        <h1 className="profile-title">Profile Overview</h1>

        <section className="stats-card">
          <h2>AI Usage Statistics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Total Interviews</span>
              <span className="stat-value">{totalChats}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">{avgScore}%</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Best Score</span>
              <span className="stat-value">{bestScore}%</span>
            </div>
          </div>
        </section>

        <section className="list-card">
          <h2>Interview History</h2>
          {conversations.length === 0 ? (
            <p className="empty-text">No chats saved yet.</p>
          ) : (
            <ul className="chat-list">
              {conversations.map((conv) => (
                <li key={conv.id} className="chat-item">
                  <div>
                    <p className="chat-title">{conv.title}</p>
                    <p className="chat-date">Score: {conv.score ?? 0}%</p>
                  </div>
                  <button
                    className="open-btn"
                    onClick={() => navigate("/app")}
                  >
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
