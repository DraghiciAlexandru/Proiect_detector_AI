import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { getCurrentUser, logout } from "../auth/auth";

export default function Home() {
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showServices, setShowServices] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Error getting user:", err);
      }
    }
    fetchUser();
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


  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-left">
          <h2 className="logo">mAIdan</h2>
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
                <button onClick={goToProtected}>
                  Interview
                </button>
                <button onClick={() => navigate("/services/ai")}>
                  AI Models
                </button>
                <button onClick={() => navigate("/services/consulting")}>
                  Colaborations
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

      <main className="content">
        <h1>Welcome to Maidan</h1>
        <p>AI-powered simplicity. Let’s build something smart.</p>
      </main>
    </div>
  );
}
