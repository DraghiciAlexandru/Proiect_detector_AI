import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Interview.css";
import { getCurrentUser, logout } from "../auth/auth";
import interviewService from "../api/interviewservice";
import {
  createInterview,
  addInterviewQuestion,
  finishInterview,
  fetchInterviewsByDomainAndLevel,
  initUserCoins,
  addUserCoins
} from "../db/db";
import logo from "../assets/logo.png";


export default function Interview() {
  const { domain, level } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [interviewDocId, setInterviewDocId] = useState(null);

  const [conversations, setConversations] = useState([]); // sidebar list
  const [currentId, setCurrentId] = useState(null);

  const [history, setHistory] = useState([]); // displayed messages
  const [readOnly, setReadOnly] = useState(false); // disables input on past interviews
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastQuestion, setLastQuestion] = useState("");

  const [finishedConversations, setFinishedConversations] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [accuracyScores, setAccuracyScores] = useState([]);
  const [averageAccuracy, setAverageAccuracy] = useState(0);
  const [detectionResult, setDetectionResult] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [showFinalScore, setShowFinalScore] = useState(false);

  // Fetch user + start interview in DB
  useEffect(() => {
    async function init() {
      const cu = await getCurrentUser();
      setUser(cu);
      if (!cu) return;

      // 1️⃣ Load previous interviews from DB
      const past = await fetchInterviewsByDomainAndLevel(cu.uid, domain, level);

      const sidebarItems = past.map(i => ({
        id: i.id,
        title: `${domain} / ${level}`,
        score: i.scoreAi ?? "?",
        history: i.questions?.flatMap(q => [
          { role: "assistant", text: q.question },
          { role: "user", text: q.answer }
        ]) ?? []
      }));

      // 2️⃣ Create new active interview
      const newId = await createInterview(cu.uid, domain, level);
      setInterviewDocId(newId);

      const newConv = {
        id: newId,
        title: `${domain} / ${level}`,
        score: "?",
        history: [],
        active: true
      };

      setConversations([...sidebarItems]);
      setCurrentId(newId);
      if (!isAnyInterviewFinished) 
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

      if (result.accuracy !== undefined) {
        setAccuracyScores(prev => [...prev, result.accuracy]);

        // Calculate running average
        const newAverage = [...accuracyScores, result.accuracy].reduce((a, b) => a + b, 0) / (accuracyScores.length + 1);
        setAverageAccuracy(newAverage);
      }

      // 🔥 SAVE ANSWER + RESULT TO FIRESTORE
      await addInterviewQuestion(user.uid, interviewDocId, {
        question: lastQuestion,
        answer: userAnswer,
        confidence: result.confidence,
        classification: result.classification,
        key_indicators: result.key_indicators,
        reasoning: result.reasoning,
        human_like_score: result.human_like_score,
        analysis_summary: result.analysis_summary,
        accuracy: result.accuracy
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

        let [scoreAi, scoreCorrectness] = await showFinalResults();
        // 🔥 SAVE FINAL SCORE TO FIRESTORE

        const coins = scoreAi >= 60 ? scoreCorrectness * 100 : 0;
        await initUserCoins(user.uid);
        await addUserCoins(user.uid, coins);

        await finishInterview(user.uid, interviewDocId, scoreAi, scoreCorrectness);

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
    let scoreAi = 0, scoreCorrectness = 0;
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
        scoreAi = Math.round(detectionResults.confidence * 100);
      } else {
        // Penalty for AI-detected responses
        scoreAi = Math.round((1 - detectionResults.confidence) * 40); // Max 40 for AI responses
      }

      scoreCorrectness = averageAccuracy;

      // if (detectionResults.classification === 'human') {
      //   // Higher score for human-like responses with good accuracy
      //   scoreCorrectness = Math.round((detectionResults.confidence * 0.6 + averageAccuracy * 0.4) * 100);
      // } else {
      //   // Penalty for AI-detected responses, but still consider accuracy
      //   scoreCorrectness = Math.round((averageAccuracy * (1 - detectionResults.confidence)) * 60);
      // }

      setDetectionResult(detectionResults);
      setFinalScore(scoreAi);
      setShowFinalScore(true);

      // Update conversation score
      setConversations(prev =>
        prev.map(conv =>
          conv.id === currentId ? { ...conv, score: scoreAi } : conv
        )
      );

      // Add final results to chat history
      const resultsMessage = generateResultsMessage(detectionResults, scoreAi);
      setHistory(prev => [...prev, {
        role: "assistant",
        text: resultsMessage
      }]);

      await addInterviewQuestion(user.uid, interviewDocId, {
        question: resultsMessage,
      });

    } catch (error) {
      console.error("Error calculating final results:", error);
      setHistory(prev => [...prev, {
        role: "assistant",
        text: "Error calculating final results. Please try again."
      }]);
    }
    setLoading(false);
    return [scoreAi, scoreCorrectness];
  }

  const isAnyInterviewFinished = finishedConversations.length > 0;

  function loadConversation(id) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;

    setCurrentId(id);

    // If ANY interview is finished, everything becomes read-only
    if (isAnyInterviewFinished) {
      setReadOnly(true);
      setHistory(conv.history || []);
      return;
    }

    // Normal behavior only when no interview was ever finished
    if (conv.active) {
      setReadOnly(false);
    } else {
      setReadOnly(true);
      setHistory(conv.history || []);
    }
  }


  // NEW: Generate human-readable results message
  function generateResultsMessage(detectionResults, score) {
    const { classification, confidence, key_indicators, reasoning } = detectionResults;

    const confidencePercent = Math.round(confidence * 100);
    const accuracyPercent = Math.round(averageAccuracy * 100);

    let message = `🎯 ** INTERVIEW COMPLETE ** 🎯\n\n`;
    message += `** Final Score: ${score}/100**\n`;
    message += `** Technical Accuracy: ${accuracyPercent}%**\n\n`;

    if (classification === 'human') {
      message += `✅ ** Authenticity: Human Response **\n`;
      message += `AI Detection Confidence: ${confidencePercent}%\n\n`;
    } else {
      message += `🤖 ** Authenticity: AI - Assisted Response **\n`;
      message += `AI Detection Confidence: ${confidencePercent}%\n\n`;
    }

    message += `Thank you for completing the interview!`;

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
    if (!isAnyInterviewFinished) 
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
          <img
            src={logo}
            alt="Maidan Logo"
            className="logo-image"
            onClick={() => navigate("/")}
          />
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
                onClick={() => loadConversation(conv.id)}
              >
                <div className="sidebar-item-content">
                  <p className="sidebar-title">{conv.title}</p>
                  <p className="sidebar-sub">Score: {conv.score}</p>
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
              placeholder={readOnly ? "Interview completed — read only mode" : "Type your answer..."}
              disabled={readOnly}
            />
            <button
              onClick={sendAnswer}
              disabled={loading || readOnly}
            >
              Submit
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}
