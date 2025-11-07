import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { FaGoogle, FaApple } from "react-icons/fa";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [password, setPassword] = useState("")
  const [email, setemail] = useState("")

  const handleLogin = () => {
    // You can add real authentication logic here later
    navigate("/home");
    console.log(email, password);


  };



  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back</h2>

        <div className="input-group">
          <label>Email</label>
          <input type="text" placeholder="Enter your email" 
          onChange={e=>setemail(e.target.value)}
          />
        </div>

        <div className="input-group password-group">
          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              onChange={e=>setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="social-login">
          <button className="google-btn">
            <FaGoogle className="icon" /> Login with Google
          </button>
          <button className="apple-btn">
            <FaApple className="icon" /> Login with Apple
          </button>
        </div>

        <p className="signup-text">
          Don’t have an account already?{" "}
          <span
            className="signup-link"
            onClick={() => navigate("/signup")}
            style={{ cursor: "pointer" }}
            >
            Create new account
            </span>
        </p>
      </div>
    </div>
  );
}
