export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const res = await fetch(`http://localhost:5000${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': user.id,
      'X-User-Email': user.email,
      'X-User-Name': user.name,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function apiUpload(path, file) {
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const fd = new FormData();
  fd.append('file', file);

  const res = await fetch(`http://localhost:5000${path}`, {
    method: 'POST',
    headers: {
      'X-User-Id': user.id,
      'X-User-Email': user.email,
      'X-User-Name': user.name,
    },
    body: fd,
  });
  return res.json();
}
