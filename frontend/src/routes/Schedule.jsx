import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { Sparkles, LogOut, BookOpen, Calendar, MessageSquare, Settings, Bot, X } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/Schedule.css";
import "../styles/Dashboard.css";

export default function Schedule() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    start: "",
    end: "",
    repeat: "none",
    type: "study",
    class_id: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const navigate = useNavigate();
  const calendarRef = useRef();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("aiSettings");
    return saved
      ? JSON.parse(saved)
      : {
          startHour: "09:00",
          endHour: "18:00",
          avoidWeekends: true,
          sessionsPerWeek: 3,
        };
  });

  const saveSettings = () => {
    localStorage.setItem("aiSettings", JSON.stringify(settings));
    alert("✅ Settings saved!");
    setShowSettings(false);
  };

  const loadEvents = async () => {
    const data = await apiFetch("/api/schedule");
    setEvents((data && data.events) || []);
  };

  const loadClasses = async () => {
    const data = await apiFetch("/api/classes");
    setClasses(data.classes || []);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    loadEvents();
    loadClasses();
  }, []);

  const handleDateClick = (info) => {
    const start = `${info.dateStr}T09:00`;
    const end = `${info.dateStr}T10:00`;
    setForm({
      title: "",
      start,
      end,
      repeat: "none",
      type: "study",
      class_id: classes[0]?.id || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return alert("Please enter a title.");
    if (!form.class_id) return alert("Please choose a class.");

    const res = await apiFetch("/api/schedule/add", {
      method: "POST",
      body: form,
    });

    if (res.success) {
      await loadEvents();
      setShowModal(false);
      setForm({
        title: "",
        start: "",
        end: "",
        repeat: "none",
        type: "study",
        class_id: "",
      });
    } else {
      alert(res.error || "Failed to add event");
    }
  };

  const handleEventClick = async (clickInfo) => {
    const origin = clickInfo.event.extendedProps?.origin;
    if (origin !== "custom" && origin !== "ai") {
      return alert("This event is generated from class data and can't be deleted here.");
    }
    if (window.confirm(`Delete event "${clickInfo.event.title}"?`)) {
      const res = await apiFetch(`/api/schedule/${clickInfo.event.id}`, { method: "DELETE" });
      if (res.success) {
        clickInfo.event.remove();
      } else {
        alert(res.error || "Failed to delete event");
      }
    }
  };

  const eventRender = (arg) => {
    const dotColor = arg.event.extendedProps?.dotColor || "#111";
    const title = arg.event.title;
    return (
      <div className="event-bubble">
        <span className="event-dot" style={{ background: dotColor }} />
        <span className="event-text">{title}</span>
      </div>
    );
  };

  const handleAutoSchedule = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    try {
      const payload = { settings };
      const res = await apiFetch("/api/schedule/auto", { method: "POST", body: payload });
      if (res.events || res.success) {
        setEvents(res.events || []);
        alert(`✅ AI scheduled ${res.events?.length || res.added?.length || 0} new sessions!`);
      } else {
        alert(res.message || "AI scheduling failed.");
      }
    } catch (err) {
      alert("Error running AI scheduling: " + err.message);
    } finally {
      setLoadingAI(false);
    }
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

        {/* Main Panel */}
        <main className="main-panel">
          <div className="schedule-header">
            <div className="welcome-header">
              <h1>📅 Global Schedule</h1>
              <p className="subtitle">Click a day to add an event or let AI plan study time</p>
            </div>

            <div className="schedule-actions">
              <button
                className="settings-btn"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="btn-icon" />
                Settings
              </button>

              <button
                className="ai-btn"
                onClick={handleAutoSchedule}
                disabled={loadingAI}
              >
                <Bot className="btn-icon" />
                {loadingAI ? "Scheduling..." : "Auto-Schedule with AI"}
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="legend">
            <span><span className="box meeting"></span> Lecture / Meeting</span>
            <span><span className="box assignment"></span> Assignment</span>
            <span><span className="box exam"></span> Exam</span>
            <span><span className="box study"></span> Study / Work</span>
            <span><span className="box custom"></span> Custom</span>
          </div>

          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventContent={eventRender}
              eventDisplay="block"
              height="auto"
            />
          </div>
        </main>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            <h2 className="modal-title">Add Event</h2>
            
            <div className="modal-grid">
              <div className="form-field">
                <label>Event Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Study Session"
                />
              </div>
              
              <div className="form-field">
                <label>Class</label>
                <select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code || c.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-field">
                <label>Event Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="lecture">Lecture</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="study">Study / Work</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="form-field">
                <label>Repeat</label>
                <select
                  value={form.repeat}
                  onChange={(e) => setForm({ ...form, repeat: e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                </select>
              </div>
              
              <div className="form-field">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              
              <div className="form-field">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowModal(false)}>
                <X className="btn-icon-small" />
                Cancel
              </button>
              <button className="primary" onClick={handleSave}>
                <Sparkles className="btn-icon-small" />
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowSettings(false)}>×</button>
            <h2 className="modal-title">AI Scheduling Settings</h2>

            <div className="settings-grid">
              <div className="form-field">
                <label>Study Start Hour</label>
                <input
                  type="time"
                  value={settings.startHour}
                  onChange={(e) => setSettings({ ...settings, startHour: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Study End Hour</label>
                <input
                  type="time"
                  value={settings.endHour}
                  onChange={(e) => setSettings({ ...settings, endHour: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Sessions per Week</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.sessionsPerWeek}
                  onChange={(e) =>
                    setSettings({ ...settings, sessionsPerWeek: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="form-field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.avoidWeekends}
                    onChange={(e) => setSettings({ ...settings, avoidWeekends: e.target.checked })}
                  />
                  Avoid weekends
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowSettings(false)}>
                <X className="btn-icon-small" />
                Cancel
              </button>
              <button className="primary" onClick={saveSettings}>
                <Settings className="btn-icon-small" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}