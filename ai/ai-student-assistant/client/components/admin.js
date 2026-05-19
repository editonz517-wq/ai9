// ── Admin Panel ──────────────────────────────────────────────────────

async function loadAdmin() {
  try {
    const [stats, users] = await Promise.all([
      apiFetch('/user/admin/stats'),
      apiFetch('/user/admin/users')
    ]);

    // Stats
    const sg = document.getElementById('admin-stats-grid');
    sg.innerHTML = [
      ['👥 Пользователей', stats.users],
      ['💬 Сообщений', stats.messages],
      ['📝 Конспектов', stats.notes],
      ['✅ Заданий', stats.tasks],
      ['📁 Файлов', stats.files]
    ].map(([label, val]) => `
      <div class="stat-card">
        <div class="stat-num">${val}</div>
        <div class="stat-lbl">${label}</div>
      </div>
    `).join('');

    // Users table
    const table = document.getElementById('admin-users-table');
    table.innerHTML = users.map(u => `
      <div class="admin-user-row">
        <img src="${u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=7c5cfc&color=fff&size=32`}"
             style="width:32px;height:32px;border-radius:50%;object-fit:cover"/>
        <span class="user-name">${escHtml(u.name)}</span>
        <span class="user-email">${escHtml(u.email)}</span>
        <span class="user-role role-${u.role}">${u.role}</span>
        <span style="color:var(--text3);font-size:.8rem">${u.group || ''}</span>
        <span style="color:var(--text3);font-size:.8rem">${new Date(u.createdAt).toLocaleDateString('ru')}</span>
        ${u.role !== 'admin' ? `<button class="btn btn-sm btn-danger" onclick="adminDeleteUser('${u._id}')">Удалить</button>` : ''}
      </div>
    `).join('');
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function adminDeleteUser(id) {
  if (!confirm('Удалить пользователя и все его данные?')) return;
  try {
    await apiFetch(`/user/admin/users/${id}`, { method: 'DELETE' });
    toast('Пользователь удалён', 'success');
    loadAdmin();
  } catch (err) {
    toast(err.message, 'error');
  }
}
