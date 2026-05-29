// ── Chat ─────────────────────────────────────────────────────────────

let currentChatId = null;
let fileContext   = null;
let isRecording   = false;
let recognition   = null;

async function sendMessage() {
  const input   = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content) return;
  input.value = '';
  input.style.height = 'auto';
  document.querySelector('.chat-welcome')?.remove();
  appendMessage('user', content);
  showTyping();
  try {
    const body = { content, chatId: currentChatId };
    if (fileContext) body.fileContext = fileContext;
    const data = await apiFetch('/chat/send', { method: 'POST', body: JSON.stringify(body) });
    currentChatId = data.chatId;
    removeTyping();
    appendMessage('assistant', data.message.content);
    loadChatList();
  } catch (err) {
    removeTyping();
    toast(err.message, 'error');
  }
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

// ── Markdown renderer ─────────────────────────────────────────────────
function formatMessage(text) {
  // Code blocks
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang || 'code';
    return `<div class="code-block"><div class="code-header"><span class="code-lang">${l}</span><button class="copy-btn" onclick="copyCode(this)">Копировать</button></div><pre><code>${escHtml(code.trim())}</code></pre></div>`;
  });
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Headers
  text = text.replace(/^### (.*$)/gm, '<h4 style="margin:10px 0 4px;font-size:.85rem;font-weight:700">$1</h4>');
  text = text.replace(/^## (.*$)/gm,  '<h3 style="margin:12px 0 5px;font-size:.9rem;font-weight:700">$1</h3>');
  text = text.replace(/^# (.*$)/gm,   '<h2 style="margin:14px 0 6px;font-size:.95rem;font-weight:700">$1</h2>');
  // Bullet lists — wrap consecutive li in ul
  text = text.replace(/((?:^[*\-] .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[*\-] /, '')}</li>`).join('');
    return `<ul style="padding-left:18px;margin:6px 0">${items}</ul>`;
  });
  // Numbered lists
  text = text.replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol style="padding-left:18px;margin:6px 0">${items}</ol>`;
  });
  // Paragraphs
  text = text.split('\n\n').map(p => p.trim() ? `<p style="margin:0 0 8px">${p.replace(/\n/g,'<br>')}</p>` : '').join('');
  return text || '<p></p>';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function copyCode(btn) {
  const code = btn.closest('.code-block').querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = 'Скопировано ✓';
    setTimeout(() => btn.textContent = 'Копировать', 2000);
  });
}

// ── Render message ────────────────────────────────────────────────────
function appendMessage(role, content) {
  const container = document.getElementById('messages');
  const time = new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' });
  const div = document.createElement('div');
  div.className = `message ${role}`;

  if (role === 'assistant') {
    div.innerHTML = `
      <div class="msg-avatar-ai">AI</div>
      <div class="msg-content">
        <div class="msg-bubble">${formatMessage(content)}</div>
        <div class="msg-time">${time}</div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="msg-content">
        <div class="msg-bubble">${escHtml(content).replace(/\n/g,'<br>')}</div>
        <div class="msg-time">${time}</div>
      </div>`;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message assistant'; div.id = 'typing-msg';
  div.innerHTML = `
    <div class="msg-avatar-ai">AI</div>
    <div class="msg-content">
      <div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function removeTyping() { document.getElementById('typing-msg')?.remove(); }

// ── Chat list ─────────────────────────────────────────────────────────
async function loadChatList() {
  try {
    const chats = await apiFetch('/chat/history');
    const list  = document.getElementById('chat-list');
    list.innerHTML = '';
    if (!chats.length) {
      list.innerHTML = '<p style="padding:12px 10px;color:var(--text3);font-size:.76rem">Чатов пока нет</p>';
      return;
    }
    chats.forEach(c => {
      const div = document.createElement('div');
      div.className = `chat-item${c._id === currentChatId ? ' active' : ''}`;
      // Strip markdown from preview
      const preview = c.lastMessage.replace(/[#*`]/g,'').slice(0,40);
      div.innerHTML = `
        <div class="chat-item-title">${escHtml(preview)}...</div>
        <div class="chat-item-date">${new Date(c.lastDate).toLocaleDateString('ru')}</div>`;
      div.onclick = () => openChat(c._id);
      list.appendChild(div);
    });
  } catch {}
}

async function openChat(chatId) {
  currentChatId = chatId;
  document.getElementById('messages').innerHTML = '';
  document.getElementById('chat-title').textContent = 'Загрузка...';
  try {
    const msgs = await apiFetch(`/chat/${chatId}`);
    msgs.forEach(m => appendMessage(m.role, m.content));
    const preview = msgs[0]?.content.replace(/[#*`]/g,'').slice(0,40) || 'Чат';
    document.getElementById('chat-title').textContent = preview;
    loadChatList();
  } catch (err) { toast(err.message, 'error'); }
}

function newChat() {
  currentChatId = null;
  document.getElementById('messages').innerHTML = '';
  document.getElementById('chat-title').textContent = 'Новый чат';
  clearFileContext();
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
  // Show welcome
  const container = document.getElementById('messages');
  container.innerHTML = `
    <div class="chat-welcome">
      <div class="welcome-mark">A</div>
      <h3>Чем могу помочь?</h3>
      <p>Задай вопрос по учёбе, загрузи документ или попроси написать код</p>
      <div class="quick-prompts">
        <button onclick="quickPrompt('Объясни что такое SQL JOIN с примерами')">SQL JOIN</button>
        <button onclick="quickPrompt('Напиши функцию сортировки на Python')">Python код</button>
        <button onclick="quickPrompt('Объясни теорему Пифагора простыми словами')">Математика</button>
        <button onclick="quickPrompt('Создай шпаргалку по HTTP методам')">HTTP шпаргалка</button>
        <button onclick="quickPrompt('Как работает рекурсия? Объясни с примером')">Рекурсия</button>
      </div>
    </div>`;
}

async function deleteChatCurrent() {
  if (!currentChatId) return;
  if (!confirm('Удалить этот чат?')) return;
  try {
    await apiFetch(`/chat/${currentChatId}`, { method: 'DELETE' });
    newChat(); loadChatList(); toast('Чат удалён');
  } catch (err) { toast(err.message, 'error'); }
}

// ── File upload ───────────────────────────────────────────────────────
function initDragDrop() {
  const area = document.getElementById('messages');
  area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', e => {
    e.preventDefault(); area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFileUpload(file);
  });
}

async function handleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  await processFileUpload(file);
  input.value = '';
}

async function processFileUpload(file) {
  const allowed = ['application/pdf','text/plain','application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type)) return toast('Поддерживаются PDF, DOCX, TXT', 'error');
  toast('Загружаю файл...', 'info');
  const fd = new FormData();
  fd.append('file', file);
  try {
    const data = await apiUpload('/files/upload', fd);
    fileContext = data.extractedText;
    document.getElementById('file-preview-bar').style.display = 'flex';
    document.getElementById('file-preview-name').textContent = file.name;
    toast('Файл загружен!', 'success');
    if (data.summary) appendMessage('assistant', `**Файл проанализирован**\n\n${data.summary}`);
  } catch (err) { toast(err.message, 'error'); }
}

function clearFileContext() {
  fileContext = null;
  document.getElementById('file-preview-bar').style.display = 'none';
}

async function saveAsNote() {
  const msgs = document.querySelectorAll('#messages .msg-bubble');
  if (!msgs.length) return toast('Нет сообщений', 'error');
  const content = Array.from(msgs).map(m => m.innerText).join('\n\n---\n\n');
  try {
    await apiFetch('/notes', { method:'POST', body: JSON.stringify({
      title: `Чат от ${new Date().toLocaleDateString('ru')}`, content, source:'chat'
    })});
    toast('Сохранено как конспект!', 'success');
  } catch (err) { toast(err.message, 'error'); }
}

function toggleVoice() {
  const btn = document.getElementById('mic-btn');
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window))
    return toast('Голосовой ввод не поддерживается', 'error');
  if (isRecording) {
    recognition?.stop(); isRecording = false;
    btn.classList.remove('recording'); btn.textContent = '◎'; return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR(); recognition.lang = 'ru-RU'; recognition.interimResults = false;
  recognition.onresult = e => {
    document.getElementById('chat-input').value = e.results[0][0].transcript;
    isRecording = false; btn.classList.remove('recording'); btn.textContent = '◎';
  };
  recognition.onerror = () => { isRecording = false; btn.classList.remove('recording'); btn.textContent = '◎'; };
  recognition.start(); isRecording = true; btn.classList.add('recording'); btn.textContent = '■';
}
