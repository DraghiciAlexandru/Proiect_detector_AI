import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Interviews.css";
import logo from "../assets/logo.png";
import coinSprite from "../assets/coin-sprite.png";
import { getUserCoins } from "../db/db";

import {
  getCurrentUser,
  listenToAuthChanges,
  logout,
} from "../auth/auth";

export default function Interviews() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [coins, setCoins] = useState(0); // placeholder; replace with real data

  const domains = [
    "JavaScript",
    "Node.js",
    "Cybersecurity",
    "DevOps",
    "Python",
    "React",
    "AI / ML",
  ];

  const difficulties = ["Beginner", "Intermediate", "Advanced"];
  const [progress, setProgress] = useState({});

  useEffect(() => {
    const unsub = listenToAuthChanges(async (firebaseUser) => {
      const userCoins = await getUserCoins(firebaseUser.uid);
      setCoins(userCoins);
      setUser(firebaseUser)
    });
    (async () => {
      const current = await getCurrentUser();
      if (current) {
        setUser(current);
        const userCoins = await getUserCoins(current.uid);
        setCoins(userCoins);
      }
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("interviewProgress_v2");
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  const saveProgress = (next) => {
    setProgress(next);
    localStorage.setItem("interviewProgress_v2", JSON.stringify(next));
  };

  const isLocked = (domain, level) => {
    const order = ["Beginner", "Intermediate", "Advanced"];
    const idx = order.indexOf(level);
    if (idx === 0) return false;
    const prevLevel = order[idx - 1];
    const domainProgress = progress[domain] || {};
    return !domainProgress[prevLevel];
  };

  const handleDifficultyClick = (domain, level) => {
    if (isLocked(domain, level)) return;

    if (domain === "Cybersecurity" && level === "Beginner") {
      const next = {
        ...progress,
        [domain]: {
          ...(progress[domain] || {}),
          [level]: true,
        },
      };
      saveProgress(next);
      navigate("/cybersecurity-beginner");
      return;
    }

    const next = {
      ...progress,
      [domain]: {
        ...(progress[domain] || {}),
        [level]: true,
      },
    };
    saveProgress(next);
    alert(`${domain} - ${level} started!`);
  };

  const handleReset = () => {
    setProgress({});
    localStorage.removeItem("interviewProgress_v2");
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowUserMenu(false);
    navigate("/login");
  };

  return (
    <div className="interviews-page">
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

        <div className="nav-center">
          <button className="nav-btn" onClick={() => navigate("/")}>
            Home
          </button>
          <button className="nav-btn" onClick={() => navigate("/app")}>
            App
          </button>
          <button className="nav-btn" onClick={() => navigate("/profile")}>
            Profile
          </button>
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

      {/* MAIN CONTENT */}
      <main className="interviews-content">
        <h1 className="interviews-title">Interviews</h1>

        <div className="domains-grid">
          {domains.map((domain) => (
            <div className="domain-card" key={domain}>
              <h2>{domain}</h2>
              <div className="difficulty-buttons">
                {difficulties.map((level) => {
                  const done = progress[domain]?.[level];
                  const locked = isLocked(domain, level);
                  return (
                    <button
                      key={level}
                      className={`difficulty-btn ${locked ? "locked" : ""} ${done ? "completed" : ""
                        }`}
                      onClick={() => handleDifficultyClick(domain, level)}
                      disabled={locked}
                    >
                      {level}
                      {done ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="interviews-footer">
          <button className="reset-btn" onClick={handleReset}>
            Reset progress
          </button>
        </div>
      </main>
    </div>
  );
}
