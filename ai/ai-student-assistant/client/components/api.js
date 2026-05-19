// ── API Helper ──────────────────────────────────────────────────────
const BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Ошибка сервера');
  return data;
}

// Multipart (for file uploads)
async function apiUpload(path, formData) {
  const token = localStorage.getItem('token');
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Ошибка загрузки');
  return data;
}

// Toast notifications
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
