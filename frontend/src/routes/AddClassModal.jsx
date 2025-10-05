import { useState } from 'react';
import { apiUpload, apiFetch } from '../api';
import "../styles/AddClassModal.css";

export default function AddClassModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState('upload'); 
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleFile = async (file) => {
    setError('');
    const result = await apiUpload('/api/classes/parse', file);
    if (result.error) return setError(result.error);
    setDraft(result.draft);
    setStep('edit');
  };

  const handleSave = async () => {
    const res = await apiFetch('/api/classes', { method: 'POST', body: draft });
    if (res.success) {
      onCreated();
      onClose();
    } else {
      alert(res.error || 'Failed to save class');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="close" onClick={onClose}>×</button>

        {step === 'upload' && (
          <UploadStep onFile={handleFile} error={error} />
        )}

        {step === 'edit' && draft && (
          <EditStep draft={draft} setDraft={setDraft} onSave={handleSave} />
        )}
      </div>
    </div>
  );
}

function UploadStep({ onFile, error }) {
  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="upload-step">
      <h2>Upload a Syllabus</h2>
      <p>Drop a .pdf or .txt file or click to choose.</p>
      <input type="file" accept=".pdf,.txt" onChange={onChange} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function EditStep({ draft, setDraft, onSave }) {
  const update = (key, value) => setDraft({ ...draft, [key]: value });

  return (
    <div className="edit-step">
      <h2>Review & Edit Class Info</h2>

      <label>Title</label>
      <input value={draft.title || ''} onChange={(e) => update('title', e.target.value)} />

      <label>Code</label>
      <input value={draft.code || ''} onChange={(e) => update('code', e.target.value)} />

      <label>Instructor</label>
      <input value={draft.instructor || ''} onChange={(e) => update('instructor', e.target.value)} />

      <label>Term</label>
      <input value={draft.term || ''} onChange={(e) => update('term', e.target.value)} />

      <button onClick={onSave} className="primary">Save Class</button>
    </div>
  );
}
