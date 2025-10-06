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
  const navigate = useNavigate();
  const calendarRef = useRef();

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
    // Ensure proper ISO format for datetime-local input
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
    if (origin !== "custom") {
      return alert("This event is generated from class data and can’t be deleted here.");
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

  // Custom render to show the colored type dot
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
          <p className="subtitle">Click a day to add an item. Custom and AI items are deletable; generated items are not.</p>

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
              // Use each event's own color (background) and textColor
              eventBackgroundColor="" // let per-event color control it
              eventBorderColor=""      // no forced border color
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
              Class:
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
            </label>

            <label>
              Event Type:
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
