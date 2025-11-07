import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CybersecurityBeginner.css";
import logo from "../assets/logo.png";
import { getCurrentUser, listenToAuthChanges, logout } from "../auth/auth";

export default function CybersecurityBeginner() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ✅ Keep user logged in across refresh
  useEffect(() => {
    const unsub = listenToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
    });

    (async () => {
      const current = await getCurrentUser();
      if (current) setUser(current);
    })();

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowUserMenu(false);
    navigate("/login");
  };

  return (
    <div className="cyber-page">
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
          <button className="nav-btn" onClick={() => navigate("/interviews")}>
            Interviews
          </button>
          <button className="nav-btn" onClick={() => navigate("/profile")}>
            Profile
          </button>
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
      <main className="cyber-content">
        <h1>Cybersecurity – Beginner</h1>
        <p className="intro-text">
          Welcome to the beginner-level cybersecurity interview simulator.
          <br />
          Here you’ll start with basic security concepts, authentication, and
          network protection fundamentals.
        </p>

        <div className="cyber-actions">
          <button
            className="start-btn"
            onClick={() => navigate("/interview/cybersecurity/beginner")}
          >
            Start Interview
          </button>
          <button className="back-btn" onClick={() => navigate("/interviews")}>
            Back to Interviews
          </button>
        </div>
      </main>
    </div>
  );
}
