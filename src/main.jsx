import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import App from "./App.jsx";              // Chat
import Test from "./pages/Test.jsx";
import Profile from "./pages/Profile.jsx";
import Interviews from "./pages/Interviews.jsx"; // ✅ Interviews
import CybersecurityBeginner from "./pages/CybersecurityBeginner.jsx";
import Interview from "./pages/Interview.jsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />             
        <Route path="/login" element={<LoginPage />} />   
        <Route path="/signup" element={<SignUpPage />} /> 
        <Route path="/app" element={<App />} />           
        <Route path="/profile" element={<Profile />} />   
        <Route path="/interviews" element={<Interviews />} />  {/* ✅ Interviews */}
        <Route path="/test" element={<Test />} />  
        <Route path='/interview/:domain/:level' element={<Interview/>}/>
        <Route path="/cybersecurity-beginner" element={<CybersecurityBeginner />} />       
      </Routes>
    </BrowserRouter>
  // </StrictMode>
);
