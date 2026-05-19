// ── Files ────────────────────────────────────────────────────────────

async function loadFiles() {
  try {
    const files = await apiFetch('/files');
    const grid  = document.getElementById('files-grid');
    grid.innerHTML = '';

    if (!files.length) {
      grid.innerHTML = '<p style="color:var(--text3);grid-column:1/-1">Файлов нет. Загрузите PDF, DOCX или TXT</p>';
      return;
    }

    files.forEach(f => {
      const size = f.size < 1024*1024
        ? (f.size/1024).toFixed(1) + ' КБ'
        : (f.size/1024/1024).toFixed(1) + ' МБ';

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">📄 ${escHtml(f.originalName)}</div>
        <div class="card-meta">${size} · ${new Date(f.createdAt).toLocaleDateString('ru')}</div>
        ${f.summary ? `<div class="card-body">${escHtml(f.summary.slice(0,150))}...</div>` : ''}
        <div class="card-actions">
          ${f.summary ? `<button class="btn btn-sm btn-ghost" onclick="showSummary('${f._id}')">📋 Конспект</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="sendToChat('${f._id}')">💬 В чат</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFileById('${f._id}')">🗑</button>
        </div>
      `;
      grid.appendChild(card);
    });

    // Store for quick access
    window._filesCache = files;
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function uploadFileSection(input) {
  const file = input.files[0];
  if (!file) return;
  toast('Загружаю...', 'info');

  const fd = new FormData();
  fd.append('file', file);

  try {
    await apiUpload('/files/upload', fd);
    toast('Файл загружен и проанализирован!', 'success');
    loadFiles();
  } catch (err) {
    toast(err.message, 'error');
  }
  input.value = '';
}

async function deleteFileById(id) {
  if (!confirm('Удалить файл?')) return;
  try {
    await apiFetch(`/files/${id}`, { method: 'DELETE' });
    toast('Файл удалён');
    loadFiles();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function showSummary(id) {
  const file = (window._filesCache || []).find(f => f._id === id);
  if (!file || !file.summary) return;
  currentNote = { title: file.originalName, content: file.summary };
  document.getElementById('note-view-title').textContent = 'Конспект: ' + file.originalName;
  document.getElementById('note-view-content').innerHTML = formatMessage(file.summary);
  openModal('modal-note-view');
}

function sendToChat(id) {
  const file = (window._filesCache || []).find(f => f._id === id);
  if (!file) return;
  fileContext = file.extractedText;
  document.getElementById('file-preview-bar').style.display = 'flex';
  document.getElementById('file-preview-name').textContent = `📄 ${file.originalName}`;
  switchSection('chat');
  toast('Файл подключён к чату', 'success');
}
