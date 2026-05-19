// ── App Init & Routing ────────────────────────────────────────────────

// ── Section switching ─────────────────────────────────────────────────
function switchSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mobile-open');

  switch (name) {
    case 'chat':     loadChatList(); break;
    case 'notes':    loadNotes();    break;
    case 'tasks':    loadTasks();    break;
    case 'schedule': loadSchedule(); break;
    case 'files':    loadFiles();    break;
    case 'profile':  loadProfile();  break;
    case 'admin':    loadAdmin();    break;
  }
}

// ── Modal helpers ─────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Mobile sidebar ────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

// ── Dark / Light theme ────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── App init ──────────────────────────────────────────────────────────
async function initApp() {
  const token = localStorage.getItem('token');
  if (!token) { showPage('page-landing'); return; }

  try {
    await apiFetch('/auth/me');
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showPage('page-landing');
    return;
  }

  showPage('page-app');
  await loadProfile();
  switchSection('chat');
  initDragDrop();
  checkDeadlineNotifications();
}

// ── Deadline notifications ────────────────────────────────────────────
async function checkDeadlineNotifications() {
  try {
    const tasks = await apiFetch('/tasks');
    const now   = new Date();
    tasks.forEach(t => {
      if (t.status === 'done') return;
      const deadline = new Date(t.deadline);
      const diffHrs  = (deadline - now) / 3600000;
      if (diffHrs > 0 && diffHrs <= 24) {
        toast(`⏰ Скоро дедлайн: «${t.title}»`, 'info');
      } else if (deadline < now) {
        toast(`🚨 Просрочено: «${t.title}»`, 'error');
      }
    });
  } catch {}
}

// ── Keyboard shortcuts ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    document.getElementById('sidebar').classList.remove('mobile-open');
  }
});

// ── Bootstrap ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hide');
    initApp();
  }, 1000);
});
