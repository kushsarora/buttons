import { useState } from "react";
import { apiUpload, apiFetch } from "../api";
import "../styles/AddClassModal.css";

export default function AddClassModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState("upload");
  const [form, setForm] = useState({
    title: "",
    code: "",
    instructor: "",
    term: "",
    grading_policy: "",
    notes: "",
    meetings: [],
    assignments: [],
    exams: [],
    schedule: []
  });
  const [error, setError] = useState("");

  if (!open) return null;

  const handleFile = async (file) => {
    setError("");
    const out = await apiUpload("/api/classes/parse", file);
    if (out.error) return setError(out.error);

    const draft = out.draft || {};
    setForm((prev) => ({
      ...prev,
      title: draft.title || "",
      code: draft.title ? (draft.title || "").replace(/\s+/g, "") : prev.code,
      instructor: draft.instructor || "",
      term: draft.term || "",
      notes: draft.notes || "",
      assignments: Array.isArray(draft.assignments) ? draft.assignments : [],
      exams: Array.isArray(draft.exams) ? draft.exams : [],
    }));
    setStep("edit");
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateRow = (key, idx, field, val) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));
  };

  const addRow = (key, template) => {
    setForm((f) => ({ ...f, [key]: [...f[key], template] }));
  };

  const delRow = (key, idx) => {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== idx) }));
  };

  const onSave = async () => {
    const res = await apiFetch("/api/classes", { method: "POST", body: form });
    if (res.success) {
      onCreated();
      onClose();
      setStep("upload");
      setForm({
        title: "",
        code: "",
        instructor: "",
        term: "",
        grading_policy: "",
        notes: "",
        meetings: [],
        assignments: [],
        exams: [],
        schedule: []
      });
    } else {
      alert(res.error || "Failed to save class");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close" onClick={onClose}>×</button>

        {step === "upload" && (
          <UploadStep onFile={handleFile} error={error} />
        )}

        {step === "edit" && (
          <EditStep
            form={form}
            update={update}
            updateRow={updateRow}
            addRow={addRow}
            delRow={delRow}
            onSave={onSave}
            onBack={() => setStep("upload")}
          />
        )}
      </div>
    </div>
  );
}

function UploadStep({ onFile, error }) {
  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };
  return (
    <div className="upload-step">
      <h2>Add a New Class</h2>
      <p>Upload your syllabus (.pdf or .txt). You can edit everything before saving.</p>
      <input type="file" accept=".pdf,.txt" onChange={handleChange} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function EditStep({ form, update, updateRow, addRow, delRow, onSave, onBack }) {
  return (
    <div className="edit-step">
      <h2>Review & Edit</h2>

      <div className="grid-2">
        <L label="Name of Class">
          <input value={form.title} onChange={(e) => update("title", e.target.value)} />
        </L>
        <L label="Code">
          <input value={form.code} onChange={(e) => update("code", e.target.value)} />
        </L>
        <L label="Term">
          <input value={form.term} onChange={(e) => update("term", e.target.value)} />
        </L>
        <L label="Instructor">
          <input value={form.instructor} onChange={(e) => update("instructor", e.target.value)} />
        </L>
        <L label="Grading Policy">
          <textarea value={form.grading_policy || ""} onChange={(e) => update("grading_policy", e.target.value)} />
        </L>
        <L label="Notes">
          <textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} />
        </L>
      </div>

      <h3>Meetings (Lecture / Discussion)</h3>
      <div className="table">
        <div className="thead">
          <span>Type</span><span>Day</span><span>Start</span><span>End</span><span>Location</span><span></span>
        </div>
        {form.meetings.map((m, i) => (
          <div className="trow" key={`m-${i}`}>
            <select value={m.type || ""} onChange={(e) => updateRow("meetings", i, "type", e.target.value)}>
              <option value="">Select</option>
              <option value="Lecture">Lecture</option>
              <option value="Discussion">Discussion</option>
              <option value="Lab">Lab</option>
            </select>
            <select value={m.day || ""} onChange={(e) => updateRow("meetings", i, "day", e.target.value)}>
              <option value="">Day</option>
              {["Mon","Tue","Wed","Thu","Fri"].map((d) => (
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

      <h3>Assignments</h3>
      <div className="table">
        <div className="thead"><span>Title</span><span>Weight %</span><span>Due</span><span>Details</span><span></span></div>
        {form.assignments.map((a, i) => (
          <div className="trow" key={`a-${i}`}>
            <input value={a.title || ""} onChange={(e) => updateRow("assignments", i, "title", e.target.value)} />
            <input type="number" step="0.1" value={a.weight ?? ""} onChange={(e) => updateRow("assignments", i, "weight", e.target.value)} />
            <input value={a.due_date || ""} onChange={(e) => updateRow("assignments", i, "due_date", e.target.value)} />
            <input value={a.details || ""} onChange={(e) => updateRow("assignments", i, "details", e.target.value)} />
            <button className="mini danger" onClick={() => delRow("assignments", i)}>✕</button>
          </div>
        ))}
        <button className="mini" onClick={() => addRow("assignments", { title: "", weight: null, due_date: "", details: "" })}>+ Add Assignment</button>
      </div>

      <h3>Exams</h3>
      <div className="table">
        <div className="thead"><span>Title</span><span>Weight %</span><span>Date</span><span>Details</span><span></span></div>
        {form.exams.map((x, i) => (
          <div className="trow" key={`e-${i}`}>
            <input value={x.title || ""} onChange={(e) => updateRow("exams", i, "title", e.target.value)} />
            <input type="number" step="0.1" value={x.weight ?? ""} onChange={(e) => updateRow("exams", i, "weight", e.target.value)} />
            <input value={x.date || ""} onChange={(e) => updateRow("exams", i, "date", e.target.value)} />
            <input value={x.details || ""} onChange={(e) => updateRow("exams", i, "details", e.target.value)} />
            <button className="mini danger" onClick={() => delRow("exams", i)}>✕</button>
          </div>
        ))}
        <button className="mini" onClick={() => addRow("exams", { title: "", weight: null, date: "", details: "" })}>+ Add Exam</button>
      </div>

      <div className="actions">
        <button className="secondary" onClick={onBack}>Back</button>
        <button className="primary" onClick={onSave}>Save Class</button>
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
