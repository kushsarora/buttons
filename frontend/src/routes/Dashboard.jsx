import "../styles/Dashboard.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
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
          <button className="sidebar-btn active">My Classes</button>
          <button className="sidebar-btn" onClick={() => navigate("/schedule")}>
            Schedule
          </button>
        </aside>

        {/* Main Content */}
        <main className="main-panel">
          <h1>Welcome back, {user?.name} 👋</h1>
          <p className="subtitle">Here’s an overview of your classes:</p>

          <div className="class-grid">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div className="class-card" key={cls.id}>
                  <div className="class-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        title="Class color"
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: cls.color,
                          display: "inline-block",
                          boxShadow: "0 0 0 2px rgba(0,0,0,0.05)",
                        }}
                      />
                      <h2 className="class-title" style={{ margin: 0 }}>
                        {cls.code || "Untitled"}
                      </h2>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingClass(cls);
                          setEditOpen(true);
                        }}
                      >
                        ⚙️
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(cls.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <p className="class-text">{cls.title}</p>
                  <p className="class-text">
                    <strong>Instructor:</strong> {cls.instructor || "—"}
                  </p>
                  <p className="class-text">
                    <strong>Term:</strong> {cls.term || "—"}
                  </p>
                </div>
              ))
            ) : (
              <div className="class-card">
                <p>No classes yet. Add your first one below!</p>
              </div>
            )}

            {/* Add Class Button */}
            <div className="class-card add-card">
              <button className="add-class-btn" onClick={() => setOpen(true)}>
                + Add New Class
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
