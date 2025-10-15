// Centralized API base URL (auto-switches between dev + production)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Generic JSON request helper
export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user.id,
        "X-User-Email": user.email,
        "X-User-Name": user.name,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API ${method} ${path} → ${response.status}`, errorText);
      throw new Error(`Request failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error("❌ API Fetch Error:", err);
    return { error: true, message: err.message };
  }
}

// File upload helper (for syllabus uploads, etc.)
export async function apiUpload(path, file) {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "X-User-Id": user.id,
        "X-User-Email": user.email,
        "X-User-Name": user.name,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Upload Error ${path} → ${response.status}`, errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    return await response.json();
  } catch (err) {
    console.error("❌ API Upload Error:", err);
    return { error: true, message: err.message };
  }
}
