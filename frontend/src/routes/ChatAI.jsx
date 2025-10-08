// src/routes/ChatAI.jsx
import "../styles/ChatAI.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "../styles/Dashboard.css";



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
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn’t process that right now." }]);
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
        <div className="logo">BUTTONS</div>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <button className="sidebar-btn" onClick={() => navigate("/dashboard")}>
            My Classes
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/schedule")}>
            Schedule
          </button>
          <button className="sidebar-btn active">Chat with AI</button>
        </aside>

        {/* Chat Panel */}
        <main className="main-panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <h1>💬 Chat with AI</h1>
          <p className="subtitle">Ask about your upcoming deadlines, class times, or study sessions.</p>

          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: "12px",
              padding: "20px",
              overflowY: "auto",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    background:
                      msg.role === "user"
                        ? "linear-gradient(90deg,#ff24ed,#2ffa2f)"
                        : "#f1f1f1",
                    color: msg.role === "user" ? "#fff" : "#111",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    maxWidth: "70%",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <input
              type="text"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />
            <button
              className="primary"
              onClick={handleSend}
              disabled={loading}
              style={{
                background: loading ? "#ccc" : "linear-gradient(90deg,#ff24ed,#2ffa2f)",
              }}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
