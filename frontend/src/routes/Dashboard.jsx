import "../styles/Dashboard.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { Sparkles, LogOut, BookOpen, Calendar, MessageSquare, Plus, Settings, Trash2 } from "lucide-react";
import AddClassModal from "./AddClassModal";
import EditClassModal from "./EditClassModal";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const loadClasses = async () => {
    const data = await apiFetch("/api/classes");
    setClasses(data.classes || []);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class?")) return;
    await apiFetch(`/api/classes/${id}`, { method: "DELETE" });
    loadClasses();
  };

  useEffect(() => {
    loadClasses();
  }, []);

  return (
    <div className="dashboard">
      {/* Top Navbar */}
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

        {/* Main Content */}
        <main className="main-panel">
          <div className="welcome-header">
            <h1>Welcome back, {user?.name} 👋</h1>
            <p className="subtitle">Here's an overview of your classes</p>
          </div>

          <div className="class-grid">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div className="class-card" key={cls.id}>
                  <div className="class-header">
                    <div className="class-title-wrapper">
                      <span
                        className="color-dot"
                        style={{ background: cls.color }}
                      />
                      <h2 className="class-title">
                        {cls.code || "Untitled"}
                      </h2>
                    </div>
                    <div className="card-actions">
                      <button
                        className="icon-btn edit-btn"
                        onClick={() => {
                          setEditingClass(cls);
                          setEditOpen(true);
                        }}
                        title="Edit class"
                      >
                        <Settings className="action-icon" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        onClick={() => handleDelete(cls.id)}
                        title="Delete class"
                      >
                        <Trash2 className="action-icon" />
                      </button>
                    </div>
                  </div>

                  <p className="class-name">{cls.title}</p>
                  <div className="class-details">
                    <p className="class-text">
                      <strong>Instructor:</strong> {cls.instructor || "—"}
                    </p>
                    <p className="class-text">
                      <strong>Term:</strong> {cls.term || "—"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="class-card empty-card">
                <p>No classes yet. Add your first one!</p>
              </div>
            )}

            {/* Add Class Button */}
            <div className="class-card add-card">
              <button className="add-class-btn" onClick={() => setOpen(true)}>
                <Plus className="add-icon" />
                Add New Class
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddClassModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadClasses}
      />

      <EditClassModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={loadClasses}
        existingClass={editingClass}
      />
    </div>
  );
}