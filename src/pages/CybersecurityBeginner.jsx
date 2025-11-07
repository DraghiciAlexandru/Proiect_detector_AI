import React from "react";
import { useNavigate } from "react-router-dom";
import "./CybersecurityBeginner.css";
import logo from "../assets/logo.png";

export default function CybersecurityBeginner() {
  const navigate = useNavigate();

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
          <button className="login-btn" onClick={() => navigate("/login")}>
            Login
          </button>
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
          <button className="start-btn" onClick={() => alert("Starting soon!")}>
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
