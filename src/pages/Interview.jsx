import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Interview.css";
import { getCurrentUser, logout } from "../auth/auth";
import interviewService from "../api/interviewservice";
import { createInterview, addInterviewQuestion, finishInterview } from "../db/db";

export default function Interview() {
  const { domain, level } = useParams();
  const navigate = useNavigate();

  // Chat + interview UI state
  const [conversations, setConversations] = useState([
    { id: 1, title: "First chat", score: 0 }
  ]);
  const [currentId, setCurrentId] = useState(1);
  const [history, setHistory] = useState([]);
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [finishedConversations, setFinishedConversations] = useState([]);

  const [interviewDocId, setInterviewDocId] = useState(null);
  const [user, setUser] = useState(null);

  const [showUserMenu, setShowUserMenu] = useState(false);

  const [showFinalScore, setShowFinalScore] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [finalScore, setFinalScore] = useState(0);

  // Fetch user + start interview in DB
  useEffect(() => {
    async function init() {
      const cu = await getCurrentUser();
      setUser(cu);

      if (cu) {
        const docId = await createInterview(cu.uid, domain, level);
        setInterviewDocId(docId);
      }

      await generateNextQuestion();
      setLoading(false);
    }
    init();
  }, []);

  async function generateNextQuestion() {
    try {
      const result = await interviewService.generateInterviewQuestion(domain, level, history);
      setLastQuestion(result.interviewerQuestion);
      setHistory(prev => [...prev, { role: "assistant", text: result.interviewerQuestion }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: "assistant", text: "Error: " + err.message }]);
    }
  }

  async function sendAnswer() {
    if (!answer.trim() || !user || !interviewDocId) return;

    const userAnswer = answer.trim();
    setAnswer("");
    setHistory(prev => [...prev, { role: "user", text: userAnswer }]);
    setLoading(true);

    try {
      const result = await interviewService.analyzeSingleResponse(userAnswer, {
        question: lastQuestion,
        domain,
        level
      });

      console.log(result);

      // 🔥 SAVE ANSWER + RESULT TO FIRESTORE
      await addInterviewQuestion(user.uid, interviewDocId, {
        question: lastQuestion,
        answer: userAnswer,
        confidence: result.confidence,
        classification: result.classification,
        key_indicators: result.key_indicators,
        reasoning: result.reasoning,
        human_like_score: result.human_like_score,
        analysis_summary: result.analysis_summary
      });

      if (result.feedback) {
        setHistory(prev => [...prev, { role: "assistant", text: result.feedback }]);
      }

      // const newScore = Math.floor(Math.random() * 100);
      // setConversations(prev =>
      //   prev.map(c => (c.id === currentId ? { ...c, score: newScore } : c))
      // );

      const answeredCount = history.filter(m => m.role === "user").length + 1;

      // Interview end after 5 questions
      if (answeredCount >= 2) {
        setFinishedConversations(prev => [...prev, currentId]);

        let finalScore = await showFinalResults();
        // 🔥 SAVE FINAL SCORE TO FIRESTORE

        await finishInterview(user.uid, interviewDocId, finalScore);

        // setHistory(prev => [
        //   ...prev,
        //   { role: "assistant", text: `Interview finished! Final score: ${newScore}` }
        // ]);

      } else {
        await generateNextQuestion();
      }

    } catch (err) {
      setHistory(prev => [...prev, { role: "assistant", text: "Error: " + err.message }]);
    }

    setLoading(false);
  }

  async function showFinalResults() {
    setLoading(true);
    let score = 0;
    try {
      // Convert history to conversation format for AI detection
      const conversationHistory = history.map(msg =>
        `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`
      );

      const interviewContext = {
        domain: domain,
        level: level
      };

      // Run AI detection on complete conversation
      const detectionResults = await interviewService.runAIDetection(
        conversationHistory,
        interviewContext
      );

      console.log("AI Detection Results:", detectionResults);

      // Calculate final score based on AI detection
      if (detectionResults.classification === 'human') {
        // Higher score for human-like responses
        score = Math.round(detectionResults.confidence * 100);
      } else {
        // Penalty for AI-detected responses
        score = Math.round((1 - detectionResults.confidence) * 40); // Max 40 for AI responses
      }

      // Add some randomness to simulate technical evaluation (optional)
      const technicalBonus = Math.floor(Math.random() * 20);
      score = Math.min(score + technicalBonus, 100);

      setDetectionResult(detectionResults);
      setFinalScore(score);
      setShowFinalScore(true);

      // Update conversation score
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentId ? { ...conv, score: score } : conv
        )
      );

      // Add final results to chat history
      const resultsMessage = generateResultsMessage(detectionResults, score);
      setHistory(prev => [...prev, {
        role: "assistant",
        text: resultsMessage
      }]);

    } catch (error) {
      console.error("Error calculating final results:", error);
      setHistory(prev => [...prev, {
        role: "assistant",
        text: "Error calculating final results. Please try again."
      }]);
    }
    setLoading(false);
    return score;
  }

  // NEW: Generate human-readable results message
  function generateResultsMessage(detectionResults, score) {
    const { classification, confidence, key_indicators, reasoning } = detectionResults;

    const confidencePercent = Math.round(confidence * 100);

    let message = `🎯 **INTERVIEW COMPLETE** 🎯\n\n`;
    message += `**Final Score: ${score}/100**\n\n`;

    if (classification === 'human') {
      message += `✅ **Authenticity: Human Response**\n`;
      message += `Confidence: ${confidencePercent}%\n\n`;
    } else {
      message += `🤖 **Authenticity: AI-Assisted Response**\n`;
      message += `AI Detection Confidence: ${confidencePercent}%\n\n`;
    }

    message += `\nThank you for completing the interview!`;

    return message;
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  }

  function handleNewChat() {
    const newId = Date.now();
    setConversations(prev => [...prev, { id: newId, title: "New interview", score: 0 }]);
    setCurrentId(newId);
    setHistory([]);
    generateNextQuestion();
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    setShowUserMenu(false);
  }

  return (
    <div className="app-page">

      {/* NAVBAR */}
      <nav className="app-navbar">
        <div className="app-nav-left" onClick={() => navigate("/")}>
          <h2 className="logo">Maidan</h2>
        </div>
        <div className="app-nav-right">
          {!user ? (
            <button className="login-btn" onClick={() => navigate("/login")}>Login</button>
          ) : (
            <div className="user-wrapper">
              <div
                className="user-info"
                onClick={() => setShowUserMenu(p => !p)}
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

      <div className="interview-title">
        <h1>
          Interview: {domain?.toUpperCase()} - {level?.toUpperCase()}
        </h1>
      </div>

      <div className="app-body">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <span>Interviews</span>
            <button className="buttonadd" onClick={handleNewChat}>+</button>
          </div>
          <div className="sidebar-list">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={conv.id === currentId ? "sidebar-item active" : "sidebar-item"}
                onClick={() => setCurrentId(conv.id)}
              >
                <div className="sidebar-item-content">
                  <p className="sidebar-title">{conv.title}</p>
                  <p className="sidebar-sub">
                    Score: {finishedConversations.includes(conv.id) ? conv.score : "?"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CHAT */}
        <div className="chat-shell">
          <header className="chat-header">
            <input
              className="chat-title-input"
              value={conversations.find(c => c.id === currentId)?.title || ""}
              onChange={e =>
                setConversations(prev =>
                  prev.map(c => c.id === currentId ? { ...c, title: e.target.value } : c)
                )
              }
            />
          </header>

          <main className="chat-body">
            {history.map((msg, i) => (
              <div key={i} className={`msg-row ${msg.role === "user" ? "user" : "bot"}`}>
                <div className={`msg-bubble ${msg.role === "user" ? "user" : "bot"}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="msg-row bot">
                <div className="msg-bubble bot typing">Typing...</div>
              </div>
            )}
          </main>

          <footer className="chat-input">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={finishedConversations.includes(currentId)}
            />
            <button
              onClick={sendAnswer}
              disabled={loading || finishedConversations.includes(currentId)}
            >
              Submit
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
