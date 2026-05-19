// ── Tasks ────────────────────────────────────────────────────────────

let allTasks    = [];
let taskFilter  = 'all';

async function loadTasks() {
  try {
    allTasks = await apiFetch('/tasks');
    renderTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function filterTasks(filter, btn) {
  taskFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById('tasks-list');
  const filtered = taskFilter === 'all' ? allTasks : allTasks.filter(t => t.status === taskFilter);

  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<p style="color:var(--text3);padding:20px 0">Заданий нет</p>';
    return;
  }

  filtered.forEach(task => {
    const deadline = new Date(task.deadline);
    const now      = new Date();
    const diffDays = Math.ceil((deadline - now) / 86400000);
    let dlClass = 'ok', dlText = '';

    if (task.status === 'done') {
      dlText = '✓ Выполнено';
    } else if (task.status === 'overdue' || deadline < now) {
      dlClass = 'overdue'; dlText = '⚠ Просрочено';
    } else if (diffDays <= 2) {
      dlClass = 'warn'; dlText = `⏳ Осталось ${diffDays} дн.`;
    } else {
      dlText = `📅 ${deadline.toLocaleDateString('ru')}`;
    }

    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
      <div class="task-check${task.status === 'done' ? ' done' : ''}"
           onclick="toggleTask('${task._id}', '${task.status}')"></div>
      <div class="task-body">
        <div class="task-title" style="${task.status === 'done' ? 'text-decoration:line-through;color:var(--text3)' : ''}">${escHtml(task.title)}</div>
        <div class="task-meta">${task.subject || ''} ${task.description ? '· ' + task.description.slice(0,50) : ''}</div>
      </div>
      <div class="task-deadline ${dlClass}">${dlText}</div>
      <span class="priority-badge priority-${task.priority}">${{low:'Низкий',medium:'Средний',high:'Высокий'}[task.priority]}</span>
      <button class="btn btn-sm btn-danger" onclick="deleteTask('${task._id}')">🗑</button>
    `;
    list.appendChild(item);
  });
}

function openTaskModal() {
  document.getElementById('task-title').value   = '';
  document.getElementById('task-subject').value = '';
  document.getElementById('task-desc').value    = '';
  document.getElementById('task-deadline').value = '';
  document.getElementById('task-priority').value = 'medium';
  openModal('modal-task');
}

async function saveTask() {
  const title    = document.getElementById('task-title').value.trim();
  const subject  = document.getElementById('task-subject').value.trim();
  const description = document.getElementById('task-desc').value.trim();
  const deadline = document.getElementById('task-deadline').value;
  const priority = document.getElementById('task-priority').value;

  if (!title || !deadline) return toast('Укажите название и дедлайн', 'error');

  try {
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, subject, description, deadline, priority })
    });
    closeModal('modal-task');
    toast('Задание добавлено', 'success');
    loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function toggleTask(id, status) {
  const newStatus = status === 'done' ? 'pending' : 'done';
  try {
    await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
    loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('Удалить задание?')) return;
  try {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    toast('Удалено');
    loadTasks();
  } catch (err) {
    toast(err.message, 'error');
  }
}
