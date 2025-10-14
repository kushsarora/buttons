import "../styles/ChatAI.css";
import "../styles/Dashboard.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { Sparkles, LogOut, BookOpen, Calendar, MessageSquare, Send } from "lucide-react";

export default function ChatAI() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! 👋 I'm your AI assistant. Ask me anything about your classes or schedule." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        body: { message: userMsg },
      });
      if (res.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that right now." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <div className="logo">
          <div className="logo-icon">
            <Sparkles className="logo-sparkle" />
          </div>
          <span>BUTTONS</span>
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut className="btn-icon" />
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <button
            className={`sidebar-btn ${
              window.location.pathname === "/dashboard" ? "active" : ""
            }`}
            onClick={() => navigate("/dashboard")}
          >
            <BookOpen className="sidebar-icon" />
            My Classes
          </button>
          <button
            className={`sidebar-btn ${
              window.location.pathname === "/schedule" ? "active" : ""
            }`}
            onClick={() => navigate("/schedule")}
          >
            <Calendar className="sidebar-icon" />
            Schedule
          </button>
          <button
            className={`sidebar-btn ${
              window.location.pathname === "/chat" ? "active" : ""
            }`}
            onClick={() => navigate("/chat")}
          >
            <MessageSquare className="sidebar-icon" />
            Chat with AI
          </button>
        </aside>

        {/* Chat Panel */}
        <main className="main-panel chat-main">
          <div className="welcome-header">
            <h1>💬 Chat with AI</h1>
            <p className="subtitle">Ask about your upcoming deadlines, class times, or study sessions</p>
          </div>

          <div className="chat-container">
            <div className="messages-wrapper">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`message-row ${msg.role === "user" ? "user-row" : "ai-row"}`}
                >
                  <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "ai-bubble"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-row ai-row">
                  <div className="chat-bubble ai-bubble typing">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>
          </div>

          {/* Input */}
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send className="send-icon" />
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}