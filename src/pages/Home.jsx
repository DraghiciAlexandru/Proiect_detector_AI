import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { getCurrentUser, logout, listenToAuthChanges } from "../auth/auth";
import logo from "../assets/logo.png";
import coinSprite from "../assets/coin-sprite.png";

export default function Home() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const [coins, setCoins] = useState(120); // mock value, replace with real data
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = listenToAuthChanges((firebaseUser) => setUser(firebaseUser));
    (async () => {
      const current = await getCurrentUser();
      if (current) {
        setUser(current);
        // here you’d normally fetch the user’s coins
        // setCoins(current.coins || 0);
      }
    })();
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowUserMenu(false);
  };

  const goToProtected = () => (user ? navigate("/app") : navigate("/login"));
  const goToInterviews = () => (user ? navigate("/interviews") : navigate("/login"));

  return (
    <div className="home-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-left">
          <img
            src={logo}
            alt="VerifAI Logo"
            className="logo-image"
            onClick={() => navigate("/")}
          />
        </div>

        <div className="nav-center">
          <div
            className="nav-item"
            onMouseEnter={() => setShowServices(true)}
            onMouseLeave={() => setShowServices(false)}
          >
            <button className="nav-btn">Services</button>
            {showServices && (
              <div className="dropdown-menu">
                <button onClick={goToInterviews}>Interviews</button>
                <button onClick={goToProtected}>AI Assistant</button>
                <button onClick={() => navigate("/services/consulting")}>
                  Collaborations
                </button>
              </div>
            )}
          </div>
          <button className="nav-btn">Features</button>
          <button className="nav-btn">About</button>
        </div>

        <div className="nav-right">
          {/* COIN BLOCK - only when logged in */}
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

      {/* HERO SECTION */}
      <main className="content">
        <h1>Welcome to VerifAI</h1>
        <p>Test your knowledge, train smarter, and verify your authenticity with AI.</p>
      </main>

      {/* FEATURES PREVIEW */}
      <section className="features-preview">
        <div className="feature-card">
          <h3>💬 AI Interviews</h3>
          <p>Simulate real job interviews and receive instant AI-driven feedback.</p>
        </div>

        <div className="feature-card">
          <h3>🧠 Skill Verification</h3>
          <p>Prove your expertise with measurable, AI-verified performance scoring.</p>
        </div>

        <div className="feature-card">
          <h3>🤖 Authenticity Detection</h3>
          <p>Our models detect AI-generated answers to ensure fair evaluations.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="home-footer">
        <p>© {new Date().getFullYear()} VerifAI — Built with intelligence.</p>
      </footer>
    </div>
  );
}
