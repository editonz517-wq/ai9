// ── Profile ──────────────────────────────────────────────────────────

async function loadProfile() {
  try {
    const [user, stats] = await Promise.all([
      apiFetch('/auth/me'),
      apiFetch('/user/stats')
    ]);

    // Sidebar
    const avatarSrc = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c5cfc&color=fff&size=64`;
    document.getElementById('sidebar-avatar').src = avatarSrc;
    document.getElementById('sidebar-name').textContent  = user.name;
    document.getElementById('sidebar-group').textContent = user.group || user.faculty || '';

    // Profile page
    document.getElementById('profile-avatar').src = avatarSrc;
    document.getElementById('profile-name').textContent  = user.name;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-group').textContent =
      [user.group, user.faculty].filter(Boolean).join(' · ') || '—';

    // Form pre-fill
    document.getElementById('pf-name').value    = user.name || '';
    document.getElementById('pf-group').value   = user.group || '';
    document.getElementById('pf-faculty').value = user.faculty || '';
    document.getElementById('pf-subjects').value = (user.aiMemory?.subjects || []).join(', ');

    // Stats
    document.getElementById('stat-msgs').textContent  = stats.messages || 0;
    document.getElementById('stat-notes').textContent = stats.notes    || 0;
    document.getElementById('stat-tasks').textContent = stats.tasks    || 0;
    document.getElementById('stat-files').textContent = stats.files    || 0;

    // Admin link
    if (user.role === 'admin') {
      document.getElementById('admin-link').style.display = 'flex';
    }

    // Cache
    localStorage.setItem('user', JSON.stringify(user));
  } catch {}
}

async function saveProfile() {
  const name     = document.getElementById('pf-name').value.trim();
  const group    = document.getElementById('pf-group').value.trim();
  const faculty  = document.getElementById('pf-faculty').value.trim();
  const subjects = document.getElementById('pf-subjects').value.trim();

  const fd = new FormData();
  if (name)    fd.append('name', name);
  if (group)   fd.append('group', group);
  if (faculty) fd.append('faculty', faculty);
  if (subjects) fd.append('subjects', subjects);

  // Avatar file if chosen
  const avatarInput = document.getElementById('avatar-input');
  if (avatarInput.files[0]) fd.append('avatar', avatarInput.files[0]);

  try {
    await apiUpload('/user/profile', fd);
    toast('Профиль обновлён', 'success');
    loadProfile();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function uploadAvatar(input) {
  // Just preview — actual upload on saveProfile
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('profile-avatar').src = e.target.result;
    document.getElementById('sidebar-avatar').src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function changePassword() {
  const oldPw = document.getElementById('pw-old').value;
  const newPw = document.getElementById('pw-new').value;
  if (!oldPw || !newPw) return toast('Введите оба пароля', 'error');
  if (newPw.length < 6) return toast('Новый пароль минимум 6 символов', 'error');

  try {
    await apiFetch('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
    });
    toast('Пароль изменён', 'success');
    document.getElementById('pw-old').value = '';
    document.getElementById('pw-new').value = '';
  } catch (err) {
    toast(err.message, 'error');
  }
}
