export async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  try {
    const response = await fetch(`http://localhost:5000${path}`, {
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

    // If not OK, log and throw
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

export async function apiUpload(path, file) {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`http://localhost:5000${path}`, {
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
