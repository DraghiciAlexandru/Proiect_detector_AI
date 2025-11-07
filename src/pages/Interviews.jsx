import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Interviews.css";
import logo from "../assets/logo.png";

export default function Interviews() {
  const navigate = useNavigate();

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

  // progress shape:
  // {
  //   "JavaScript": { Beginner: true, Intermediate: false, Advanced: false },
  //   "Cybersecurity": { Beginner: true, Intermediate: true, Advanced: false }
  // }
  const [progress, setProgress] = useState({});

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

  // check lock based on previous level
  const isLocked = (domain, level) => {
    const order = ["Beginner", "Intermediate", "Advanced"];
    const idx = order.indexOf(level);

    // Beginner is never locked
    if (idx === 0) return false;

    // to unlock Intermediate -> Beginner must be true
    // to unlock Advanced -> Intermediate must be true
    const prevLevel = order[idx - 1];
    const domainProgress = progress[domain] || {};
    return !domainProgress[prevLevel];
  };

  const handleDifficultyClick = (domain, level) => {
    if (isLocked(domain, level)) return;

    // special route for cybersecurity beginner
    if (domain === "Cybersecurity" && level === "Beginner") {
      // mark it completed too
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

    // mark this level as completed (but keep others!)
    const next = {
      ...progress,
      [domain]: {
        ...(progress[domain] || {}),
        [level]: true,
      },
    };
    saveProgress(next);

    // temp action
    alert(`${domain} - ${level} started!`);
  };

  const handleReset = () => {
    setProgress({});
    localStorage.removeItem("interviewProgress_v2");
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
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
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
                      className={`difficulty-btn ${locked ? "locked" : ""} ${
                        done ? "completed" : ""
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

        {/* RESET BTN */}
        <div className="interviews-footer">
          <button className="reset-btn" onClick={handleReset}>
            Reset progress
          </button>
        </div>
      </main>
    </div>
  );
}
