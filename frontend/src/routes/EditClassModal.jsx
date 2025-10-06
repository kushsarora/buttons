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
      });
    }
  }, [existingClass]);

  if (!open) return null;

  // --- Handle Input Changes ---
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTableChange = (table, index, field, value) => {
    const updated = [...form[table]];
    updated[index][field] = value;
    setForm({ ...form, [table]: updated });
  };

  const handleAddRow = (table, newRow) => {
    setForm({ ...form, [table]: [...form[table], newRow] });
  };

  const handleDeleteRow = (table, index) => {
    const updated = [...form[table]];
    updated.splice(index, 1);
    setForm({ ...form, [table]: updated });
  };

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
        <button className="close" onClick={onClose}>
          ✕
        </button>

        <h2>Edit Class Information</h2>

        {/* === BASIC INFO === */}
        <div className="grid-2">
          <div className="field">
            <label>Class Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label>Class Code</label>
            <input
              name="code"
              value={form.code}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label>Instructor</label>
            <input
              name="instructor"
              value={form.instructor}
              onChange={handleChange}
            />
          </div>
          <div className="field">
            <label>Term</label>
            <input
              name="term"
              value={form.term}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
          ></textarea>
        </div>

        <div className="field">
          <label>Grading Policy</label>
          <textarea
            name="grading_policy"
            value={form.grading_policy}
            onChange={handleChange}
          ></textarea>
        </div>

        {/* === MEETINGS TABLE === */}
        <h3>Meetings</h3>
        <div className="table">
          <div className="thead">
            <div>Type</div>
            <div>Day</div>
            <div>Start</div>
            <div>End</div>
            <div>Location</div>
            <div></div>
          </div>
          {form.meetings.map((m, i) => (
            <div key={i} className="trow">
              <input
                value={m.type}
                onChange={(e) =>
                  handleTableChange("meetings", i, "type", e.target.value)
                }
              />
              <input
                value={m.day}
                onChange={(e) =>
                  handleTableChange("meetings", i, "day", e.target.value)
                }
              />
              <input
                value={m.start_time}
                onChange={(e) =>
                  handleTableChange("meetings", i, "start_time", e.target.value)
                }
              />
              <input
                value={m.end_time}
                onChange={(e) =>
                  handleTableChange("meetings", i, "end_time", e.target.value)
                }
              />
              <input
                value={m.location}
                onChange={(e) =>
                  handleTableChange("meetings", i, "location", e.target.value)
                }
              />
              <button
                className="mini danger"
                onClick={() => handleDeleteRow("meetings", i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="mini"
            onClick={() =>
              handleAddRow("meetings", {
                type: "",
                day: "",
                start_time: "",
                end_time: "",
                location: "",
              })
            }
          >
            + Add Meeting
          </button>
        </div>

        {/* === ASSIGNMENTS === */}
        <h3>Assignments</h3>
        <div className="table">
          <div className="thead">
            <div>Title</div>
            <div>Weight</div>
            <div>Due Date</div>
            <div>Details</div>
            <div></div>
          </div>
          {form.assignments.map((a, i) => (
            <div key={i} className="trow">
              <input
                value={a.title}
                onChange={(e) =>
                  handleTableChange("assignments", i, "title", e.target.value)
                }
              />
              <input
                value={a.weight}
                onChange={(e) =>
                  handleTableChange("assignments", i, "weight", e.target.value)
                }
              />
              <input
                value={a.due_date}
                onChange={(e) =>
                  handleTableChange("assignments", i, "due_date", e.target.value)
                }
              />
              <input
                value={a.details}
                onChange={(e) =>
                  handleTableChange("assignments", i, "details", e.target.value)
                }
              />
              <button
                className="mini danger"
                onClick={() => handleDeleteRow("assignments", i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="mini"
            onClick={() =>
              handleAddRow("assignments", {
                title: "",
                weight: "",
                due_date: "",
                details: "",
              })
            }
          >
            + Add Assignment
          </button>
        </div>

        {/* === EXAMS === */}
        <h3>Exams</h3>
        <div className="table">
          <div className="thead">
            <div>Title</div>
            <div>Weight</div>
            <div>Date</div>
            <div>Details</div>
            <div></div>
          </div>
          {form.exams.map((e, i) => (
            <div key={i} className="trow">
              <input
                value={e.title}
                onChange={(ev) =>
                  handleTableChange("exams", i, "title", ev.target.value)
                }
              />
              <input
                value={e.weight}
                onChange={(ev) =>
                  handleTableChange("exams", i, "weight", ev.target.value)
                }
              />
              <input
                value={e.date}
                onChange={(ev) =>
                  handleTableChange("exams", i, "date", ev.target.value)
                }
              />
              <input
                value={e.details}
                onChange={(ev) =>
                  handleTableChange("exams", i, "details", ev.target.value)
                }
              />
              <button
                className="mini danger"
                onClick={() => handleDeleteRow("exams", i)}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="mini"
            onClick={() =>
              handleAddRow("exams", {
                title: "",
                weight: "",
                date: "",
                details: "",
              })
            }
          >
            + Add Exam
          </button>
        </div>

        {/* === SAVE === */}
        <div className="actions">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
