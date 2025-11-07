import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/Home.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import App from './App.jsx'; // importul pentru chat

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />      {/* Login */}
        <Route path="/home" element={<Home />} />       {/* intermediate Home */}
        <Route path="/signup" element={<SignUpPage />} /> 
        <Route path="/app" element={<App />} />         {/* Chat */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
)