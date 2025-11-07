import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Create Account</h2>

        <div className="input-group">
          <label>Email</label>
          <input type="text" placeholder="Enter your email" />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="Create a password" />
        </div>

        <button className="login-btn">Sign Up</button>

        <p className="signup-text">
          Already have an account?{" "}
          <span
            className="signup-link"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            Back to Login
          </span>
        </p>
      </div>
    </div>
  );
}
