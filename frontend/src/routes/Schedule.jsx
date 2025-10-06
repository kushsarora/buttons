import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../styles/Schedule.css";

export default function Schedule() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ title: "", start: "", end: "", repeat: "none" });
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const calendarRef = useRef();

  const loadEvents = async () => {
    const data = await apiFetch("/api/schedule");
    setEvents(data.events || []);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setForm({ title: "", start: info.dateStr, end: "", repeat: "none" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) return alert("Please enter a title.");

    const res = await apiFetch("/api/schedule/add", {
      method: "POST",
      body: {
        title: form.title,
        start: form.start,
        end: form.end || null,
        type: "custom",
        repeat: form.repeat,
      },
    });

    if (res.success) {
      await loadEvents();
      setShowModal(false);
      setForm({ title: "", start: "", end: "", repeat: "none" });
    }
  };

  const handleEventClick = async (clickInfo) => {
    if (window.confirm(`Delete event "${clickInfo.event.title}"?`)) {
      await apiFetch(`/api/schedule/${clickInfo.event.id}`, { method: "DELETE" });
      clickInfo.event.remove();
    }
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
          <button className="sidebar-btn active">Schedule</button>
        </aside>

        {/* Main Panel */}
        <main className="main-panel">
          <h1>📅 Global Schedule</h1>
          <p className="subtitle">Click a date to add events or study sessions.</p>

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
              eventColor="#49A078"
            />
          </div>
        </main>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>Add Event</h2>
            <label>
              Title:
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>

            <label>
              Start Time:
              <input
                type="datetime-local"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </label>

            <label>
              End Time (optional):
              <input
                type="datetime-local"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </label>

            <label>
              Repeat:
              <select
                value={form.repeat}
                onChange={(e) => setForm({ ...form, repeat: e.target.value })}
              >
                <option value="none">None</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
              </select>
            </label>

            <div className="actions">
              <button className="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
