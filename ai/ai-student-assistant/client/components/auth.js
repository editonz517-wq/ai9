// ── Auth ────────────────────────────────────────────────────────────

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

async function doRegister() {
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const group    = document.getElementById('reg-group').value.trim();
  const faculty  = document.getElementById('reg-faculty').value.trim();

  if (!name || !email || !password) return toast('Заполните обязательные поля', 'error');
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, group, faculty })
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    await initApp();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return toast('Введите email и пароль', 'error');
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    await initApp();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function doLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showPage('page-landing');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}
