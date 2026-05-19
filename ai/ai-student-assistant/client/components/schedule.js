// ── Schedule ─────────────────────────────────────────────────────────

let allEvents = [];

async function loadSchedule() {
  try {
    allEvents = await apiFetch('/schedule');
    renderSchedule();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function renderSchedule() {
  const container = document.getElementById('schedule-week');
  container.innerHTML = '';

  if (!allEvents.length) {
    container.innerHTML = '<p style="color:var(--text3)">Расписание пусто. Добавьте первое занятие!</p>';
    return;
  }

  const typeLabels = { lecture:'Лекция', lab:'Лаб. работа', exam:'Экзамен', consultation:'Консультация', other:'Другое' };

  const sorted = [...allEvents].sort((a,b) => new Date(a.startTime) - new Date(b.startTime));

  sorted.forEach(ev => {
    const start = new Date(ev.startTime);
    const end   = new Date(ev.endTime);
    const div   = document.createElement('div');
    div.className = 'schedule-event';
    div.style.borderLeftColor = ev.color || 'var(--violet)';
    div.innerHTML = `
      <div class="schedule-event-time">
        ${start.toLocaleDateString('ru', { weekday:'short', day:'numeric', month:'short' })}<br>
        ${start.toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'})} – ${end.toLocaleTimeString('ru', {hour:'2-digit',minute:'2-digit'})}
      </div>
      <div class="schedule-event-body">
        <div class="schedule-event-title">${escHtml(ev.title)}</div>
        <div class="schedule-event-meta">
          ${ev.subject ? ev.subject + ' · ' : ''}
          ${ev.teacher ? ev.teacher + ' · ' : ''}
          ${ev.room || ''}
        </div>
      </div>
      <span class="event-type-badge">${typeLabels[ev.type] || ev.type}</span>
      <button class="btn btn-sm btn-danger" onclick="deleteEvent('${ev._id}')">🗑</button>
    `;
    container.appendChild(div);
  });
}

function openScheduleModal() {
  ['sc-title','sc-subject','sc-teacher','sc-room','sc-start','sc-end'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('sc-type').value   = 'lecture';
  document.getElementById('sc-repeat').value = 'none';
  openModal('modal-schedule');
}

async function saveScheduleEvent() {
  const title     = document.getElementById('sc-title').value.trim();
  const type      = document.getElementById('sc-type').value;
  const subject   = document.getElementById('sc-subject').value.trim();
  const teacher   = document.getElementById('sc-teacher').value.trim();
  const room      = document.getElementById('sc-room').value.trim();
  const startTime = document.getElementById('sc-start').value;
  const endTime   = document.getElementById('sc-end').value;
  const repeat    = document.getElementById('sc-repeat').value;

  if (!title || !startTime || !endTime) return toast('Заполните обязательные поля', 'error');

  // Colors by type
  const colors = { lecture:'#7c5cfc', lab:'#4da6ff', exam:'#ff4757', consultation:'#2ed573', other:'#ffa502' };

  try {
    await apiFetch('/schedule', {
      method: 'POST',
      body: JSON.stringify({ title, type, subject, teacher, room, startTime, endTime, repeat, color: colors[type] })
    });
    closeModal('modal-schedule');
    toast('Событие добавлено', 'success');
    loadSchedule();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteEvent(id) {
  if (!confirm('Удалить событие?')) return;
  try {
    await apiFetch(`/schedule/${id}`, { method: 'DELETE' });
    toast('Удалено');
    loadSchedule();
  } catch (err) {
    toast(err.message, 'error');
  }
}
