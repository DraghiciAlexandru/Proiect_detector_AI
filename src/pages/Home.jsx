import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { getCurrentUser, logout, listenToAuthChanges } from "../auth/auth";
import logo from "../assets/logo.png";

export default function Home() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const navigate = useNavigate();

  // keep user logged in on refresh
  useEffect(() => {
    // subscribe to Firebase auth changes
    const unsub = listenToAuthChanges((firebaseUser) => {
      setUser(firebaseUser);
    });

    // also do an initial read (optional, but okay)
    (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) setUser(currentUser);
      } catch (err) {
        console.error("Error getting user:", err);
      }
    })();

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setShowUserMenu(false);
  };

  const goToProtected = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/login");
    }
  };

  // 🔒 Interviews protected too
  const goToInterviews = () => {
    if (user) {
      navigate("/interviews");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="home-container">
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
          <div
            className="nav-item"
            onMouseEnter={() => setShowServices(true)}
            onMouseLeave={() => setShowServices(false)}
          >
            <button className="nav-btn">Services</button>

            {showServices && (
              <div className="dropdown-menu">
                <button onClick={goToInterviews}>
                  Interviews
                </button>
                <button onClick={goToProtected}>
                  AI Assistant
                </button>
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
      <main className="content">
        <h1>Welcome to Maidan</h1>
        <p>AI-powered simplicity. Let’s build something smart together.</p>
      </main>
    </div>
  );
}
