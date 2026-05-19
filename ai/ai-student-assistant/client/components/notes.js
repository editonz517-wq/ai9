// ── Notes ────────────────────────────────────────────────────────────

let editNoteId  = null;
let currentNote = null;
let allNotes    = [];

async function loadNotes() {
  try {
    allNotes = await apiFetch('/notes');
    renderNotes(allNotes);
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderNotes(notes) {
  const grid = document.getElementById('notes-grid');
  grid.innerHTML = '';
  if (!notes.length) {
    grid.innerHTML = '<p style="color:var(--text3);grid-column:1/-1">Конспектов пока нет. Создайте первый!</p>';
    return;
  }
  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-title">${escHtml(note.title)}</div>
      <div class="card-meta">${note.subject || '—'} · ${new Date(note.createdAt).toLocaleDateString('ru')}</div>
      <div class="card-body">${escHtml(note.content)}</div>
      <div class="card-actions">
        <button class="btn btn-sm btn-ghost" onclick="viewNote('${note._id}')">👁 Открыть</button>
        <button class="btn btn-sm btn-ghost" onclick="openNoteModal('${note._id}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteNote('${note._id}')">🗑</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function searchNotes() {
  const q = document.getElementById('notes-search').value.toLowerCase();
  renderNotes(allNotes.filter(n =>
    n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  ));
}

function openNoteModal(id = null) {
  editNoteId = id;
  document.getElementById('note-modal-title').textContent = id ? 'Редактировать' : 'Новый конспект';
  if (id) {
    const note = allNotes.find(n => n._id === id);
    if (note) {
      document.getElementById('note-title').value   = note.title;
      document.getElementById('note-subject').value = note.subject || '';
      document.getElementById('note-content').value = note.content;
    }
  } else {
    document.getElementById('note-title').value   = '';
    document.getElementById('note-subject').value = '';
    document.getElementById('note-content').value = '';
  }
  openModal('modal-note');
}

async function saveNote() {
  const title   = document.getElementById('note-title').value.trim();
  const subject = document.getElementById('note-subject').value.trim();
  const content = document.getElementById('note-content').value.trim();

  if (!title || !content) return toast('Заполните название и содержание', 'error');

  try {
    if (editNoteId) {
      await apiFetch(`/notes/${editNoteId}`, { method: 'PUT', body: JSON.stringify({ title, subject, content }) });
      toast('Конспект обновлён', 'success');
    } else {
      await apiFetch('/notes', { method: 'POST', body: JSON.stringify({ title, subject, content }) });
      toast('Конспект создан', 'success');
    }
    closeModal('modal-note');
    loadNotes();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteNote(id) {
  if (!confirm('Удалить конспект?')) return;
  try {
    await apiFetch(`/notes/${id}`, { method: 'DELETE' });
    toast('Удалено', 'success');
    loadNotes();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function viewNote(id) {
  const note = allNotes.find(n => n._id === id);
  if (!note) return;
  currentNote = note;
  document.getElementById('note-view-title').textContent = note.title;
  document.getElementById('note-view-content').innerHTML = formatMessage(note.content);
  openModal('modal-note-view');
}

function exportNoteAsTxt() {
  if (!currentNote) return;
  const blob = new Blob([currentNote.title + '\n\n' + currentNote.content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = currentNote.title.replace(/\s+/g, '_') + '.txt';
  a.click();
}

function openGenerateNoteModal() {
  document.getElementById('gen-topic').value = '';
  openModal('modal-gen-note');
}

async function generateNote() {
  const topic = document.getElementById('gen-topic').value.trim();
  const type  = document.getElementById('gen-type').value;
  if (!topic) return toast('Укажите тему', 'error');

  const btn = document.getElementById('gen-note-btn');
  btn.textContent = '⏳ Генерирую...';
  btn.disabled = true;

  try {
    const note = await apiFetch('/notes/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, type })
    });
    closeModal('modal-gen-note');
    toast('Конспект создан!', 'success');
    loadNotes();
    viewNote(note._id);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    btn.textContent = '✨ Генерировать';
    btn.disabled = false;
  }
}
