import { useState, useEffect } from "react";
import "../styles/AddClassModal.css";
import { apiFetch } from "../api";

export default function EditClassModal({ open, onClose, onUpdated, existingClass }) {
  const [form, setForm] = useState({
    title: "",
    code: "",
    instructor: "",
    term: "",
    notes: "",
    grading_policy: "",
    meetings: [],
    assignments: [],
    exams: [],
    schedule: [],
    custom_events: [],
  });

  useEffect(() => {
    if (existingClass) {
      setForm({
        title: existingClass.title || "",
        code: existingClass.code || "",
        instructor: existingClass.instructor || "",
        term: existingClass.term || "",
        notes: existingClass.notes || "",
        grading_policy: existingClass.grading_policy || "",
        meetings: existingClass.meetings || [],
        assignments: existingClass.assignments || [],
        exams: existingClass.exams || [],
        schedule: existingClass.schedule || [],
        custom_events: existingClass.custom_events || [],
      });
    }
  }, [existingClass]);

  if (!open) return null;

  const updateRow = (key, idx, field, val) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));
  };

  const addRow = (key, template) =>
    setForm((f) => ({ ...f, [key]: [...f[key], template] }));

  const delRow = (key, idx) =>
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    await apiFetch(`/api/classes/${existingClass.id}`, {
      method: "PUT",
      body: form,
    });
    onUpdated();
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close" onClick={onClose}>×</button>
        <h2>Edit Class Information</h2>

        <div className="grid-2">
          <L label="Name of Class">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </L>
          <L label="Code">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </L>
          <L label="Term">
            <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} />
          </L>
          <L label="Instructor">
            <input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} />
          </L>
          <L label="Grading Policy">
            <textarea value={form.grading_policy || ""} onChange={(e) => setForm({ ...form, grading_policy: e.target.value })} />
          </L>
          <L label="Notes">
            <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </L>
        </div>

        {/* --- Meetings --- */}
        <h3>Meetings (Lecture / Discussion)</h3>
        <div className="table">
          <div className="thead">
            <span>Type</span><span>Day</span><span>Start</span><span>End</span><span>Location</span><span></span>
          </div>
          {form.meetings.map((m, i) => (
            <div className="trow" key={i}>
              <select value={m.type || ""} onChange={(e) => updateRow("meetings", i, "type", e.target.value)}>
                <option value="">Select</option>
                <option value="Lecture">Lecture</option>
                <option value="Discussion">Discussion</option>
                <option value="Lab">Lab</option>
                <option value="Office Hours">Office Hours</option>
                <option value="Review Session">Review Session</option>
              </select>
              <select value={m.day || ""} onChange={(e) => updateRow("meetings", i, "day", e.target.value)}>
                <option value="">Day</option>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <input type="time" value={m.start_time || ""} onChange={(e) => updateRow("meetings", i, "start_time", e.target.value)} />
              <input type="time" value={m.end_time || ""} onChange={(e) => updateRow("meetings", i, "end_time", e.target.value)} />
              <input value={m.location || ""} onChange={(e) => updateRow("meetings", i, "location", e.target.value)} />
              <button className="mini danger" onClick={() => delRow("meetings", i)}>✕</button>
            </div>
          ))}
          <button className="mini" onClick={() => addRow("meetings", { type: "", day: "", start_time: "", end_time: "", location: "" })}>
            + Add Meeting
          </button>
        </div>

        {/* --- Assignments --- */}
        <h3>Assignments</h3>
        <div className="table">
          <div className="thead"><span>Title</span><span>Weight %</span><span>Due</span><span>Details</span><span></span></div>
          {form.assignments.map((a, i) => (
            <div className="trow" key={i}>
              <input value={a.title || ""} onChange={(e) => updateRow("assignments", i, "title", e.target.value)} />
              <input type="number" step="0.1" value={a.weight ?? ""} onChange={(e) => updateRow("assignments", i, "weight", e.target.value)} />
              <input value={a.due_date || ""} onChange={(e) => updateRow("assignments", i, "due_date", e.target.value)} />
              <input value={a.details || ""} onChange={(e) => updateRow("assignments", i, "details", e.target.value)} />
              <button className="mini danger" onClick={() => delRow("assignments", i)}>✕</button>
            </div>
          ))}
          <button className="mini" onClick={() => addRow("assignments", { title: "", weight: null, due_date: "", details: "" })}>
            + Add Assignment
          </button>
        </div>

        {/* --- Exams --- */}
        <h3>Exams</h3>
        <div className="table">
          <div className="thead"><span>Title</span><span>Weight %</span><span>Date</span><span>Details</span><span></span></div>
          {form.exams.map((x, i) => (
            <div className="trow" key={i}>
              <input value={x.title || ""} onChange={(e) => updateRow("exams", i, "title", e.target.value)} />
              <input type="number" step="0.1" value={x.weight ?? ""} onChange={(e) => updateRow("exams", i, "weight", e.target.value)} />
              <input value={x.date || ""} onChange={(e) => updateRow("exams", i, "date", e.target.value)} />
              <input value={x.details || ""} onChange={(e) => updateRow("exams", i, "details", e.target.value)} />
              <button className="mini danger" onClick={() => delRow("exams", i)}>✕</button>
            </div>
          ))}
          <button className="mini" onClick={() => addRow("exams", { title: "", weight: null, date: "", details: "" })}>
            + Add Exam
          </button>
        </div>

        <div className="actions">
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function L({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
