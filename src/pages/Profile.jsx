import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { getCurrentUser, logout } from "../auth/auth";
import logo from "../assets/logo.png";
import coinSprite from "../assets/coin-sprite.png";
import logojs from "../assets/logojs.png";
import logodevops from "../assets/logodevops.png";
import logoaiml from "../assets/logoaiml.png";
import logohtb from "../assets/logohtb.png";
import logonodejs from "../assets/logonodejs.png";
import logopython from "../assets/logopython.png";
import logoreact from "../assets/logoreact.png";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [coins, setCoins] = useState(120); // placeholder
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const cu = await getCurrentUser();
      setUser(cu);
      // here you could also fetch user coins
    }
    fetchUser();
  }, []);

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

  const accreditations = [
    {
      id: "js",
      name: "JavaScript",
      logo: logojs,
      cost: 1000,
      desc: "Issued via certificates.dev",
    },
    {
      id: "ai-ml",
      name: "AI / ML",
      logo: logoaiml,
      cost: 1200,
      desc: "Issued via accredit.org",
    },
    {
      id: "cyber",
      name: "Cybersecurity",
      logo: logohtb,
      cost: 1100,
      desc: "Issued via accredit.org",
    },
    {
      id: "devops",
      name: "DevOps",
      logo: logodevops,
      cost: 1800,
      desc: "Issued via devopsinstitute.com",
    },
    {
      id: "node",
      name: "Node.js",
      logo: logonodejs,
      cost: 800,
      desc: "Issued via flexiple.com",
    },
    {
      id: "python",
      name: "Python",
      logo: logopython,
      cost: 1000,
      desc: "Issued via w3schools.com",
    },
    {
      id: "react",
      name: "React",
      logo: logoreact,
      cost: 1200,
      desc: "Issued via certificates.dev",
    },
  ];

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
          {user && (
            <div className="coin-block">
              <div
                className="coin-sprite"
                style={{ backgroundImage: `url(${coinSprite})` }}
              />
              <span className="coin-amount">{coins}</span>
            </div>
          )}

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

      {/* MAIN CONTENT */}
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

        {/* NEW: Accreditations */}
        <section className="accreditations-card">
          <h2>Accreditations</h2>
          <p className="accreditations-subtitle">
            Spend coins to unlock verified certifications from partner sites.
          </p>
          <div className="accreditations-grid">
            {accreditations.map((acc) => (
              <div key={acc.id} className="accreditation-item">
                <div className="accreditation-header">
                  {acc.logo ? (
                    <img src={acc.logo} alt={acc.name} className="accreditation-logo" />
                  ) : (
                    <div className="accreditation-logo placeholder">
                      {acc.name[0]}
                    </div>
                  )}
                  <span className="accreditation-cost">{acc.cost} 🪙</span>
                </div>
                <div className="accreditation-body">
                  <h3>{acc.name}</h3>
                  <p>{acc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
