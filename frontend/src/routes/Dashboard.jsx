import "../styles/Dashboard.css";
import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import AddClassModal from "./AddClassModal";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [classes, setClasses] = useState([]);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  // Fetch all user classes from backend
  const loadClasses = async () => {
    const data = await apiFetch("/api/classes");
    setClasses(data.classes || []);
  };

  useEffect(() => {
    loadClasses();
  }, []);

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

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <button className="sidebar-btn active">My Classes</button>
          <button className="sidebar-btn">Analytics</button>
        </aside>

        {/* Main Panel */}
        <main className="main-panel">
          <h1>Welcome back, {user?.name} 👋</h1>
          <p className="subtitle">Here’s an overview of your classes:</p>

          {/* Class Grid */}
          <div className="class-grid">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div className="class-card" key={cls.id}>
                  <h2>{cls.code || "Untitled"}</h2>
                  <p>{cls.title}</p>
                  <p>
                    <strong>Instructor:</strong> {cls.instructor || "—"}
                  </p>
                  <p>
                    <strong>Term:</strong> {cls.term || "—"}
                  </p>
                </div>
              ))
            ) : (
              <div className="class-card">
                <p>No classes yet. Add your first one below!</p>
              </div>
            )}

            {/* Add New Class Card */}
            <div className="class-card add-card">
              <button className="add-class-btn" onClick={() => setOpen(true)}>
                + Add New Class
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Uploading + Editing Class */}
      <AddClassModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadClasses}
      />
    </div>
  );
}
