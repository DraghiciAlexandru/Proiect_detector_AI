import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

import { signUp } from "../auth/auth";

export default function SignupPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("")
    const [email, setemail] = useState("")
  
    const handleSignup = () => {
      // You can add real authentication logic here later
      signUp(email, password).then((success) => {
        if (success) {
          navigate("/");
        } else {
          alert("Signup failed. Please check your credentials and try again.");
        }
      });
    };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Create Account</h2>

        <div className="input-group">
          <label>Email</label>
          <input type="text" onChange={e => setemail(e.target.value)} placeholder="Enter your email" />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password" onChange={e => setPassword(e.target.value)} placeholder="Create a password" />
        </div>

        <button className="login-btn" onClick={handleSignup}>Sign Up</button>

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
