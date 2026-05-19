// ── Chat ────────────────────────────────────────────────────────────

let currentChatId = null;
let fileContext   = null;
let isRecording   = false;
let recognition   = null;

// ── Send message ──────────────────────────────────────────────────────
async function sendMessage() {
  const input   = document.getElementById('chat-input');
  const content = input.value.trim();
  if (!content) return;

  input.value = '';
  input.style.height = 'auto';
  appendMessage('user', content);
  showTyping();

  try {
    const body = { content, chatId: currentChatId };
    if (fileContext) body.fileContext = fileContext;

    const data = await apiFetch('/chat/send', {
      method: 'POST',
      body: JSON.stringify(body)
    });

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
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

// ── Markdown renderer ─────────────────────────────────────────────────
function formatMessage(text) {
  // Code blocks with language
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang || 'code';
    return `<div class="code-block">
      <div class="code-header"><span class="code-lang">${l}</span>
        <button class="copy-btn" onclick="copyCode(this)">📋 Копировать</button>
      </div>
      <pre><code>${escHtml(code.trim())}</code></pre>
    </div>`;
  });
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Headers
  text = text.replace(/^### (.*$)/gm, '<h4>$1</h4>');
  text = text.replace(/^## (.*$)/gm,  '<h3>$1</h3>');
  text = text.replace(/^# (.*$)/gm,   '<h2>$1</h2>');
  // Bullet lists
  text = text.replace(/^\* (.*$)/gm,  '<li>$1</li>');
  text = text.replace(/^- (.*$)/gm,   '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Numbered lists
  text = text.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  // Line breaks
  text = text.replace(/\n\n/g, '</p><p>');
  text = text.replace(/\n/g, '<br>');
  return `<p>${text}</p>`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function copyCode(btn) {
  const code = btn.closest('.code-block').querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✅ Скопировано';
    setTimeout(() => btn.textContent = '📋 Копировать', 2000);
  });
}

// ── Render message ────────────────────────────────────────────────────
function appendMessage(role, content) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const time = new Date().toLocaleTimeString('ru', { hour:'2-digit', minute:'2-digit' });
  const avatar = role === 'assistant' ? '🤖' : '👤';

  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">
      <div class="msg-bubble">${formatMessage(content)}</div>
      <div class="msg-time">${time}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message assistant'; div.id = 'typing-msg';
  div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-content">
      <div class="msg-bubble">
        <div class="typing-indicator"><span></span><span></span><span></span></div>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function removeTyping() {
  const el = document.getElementById('typing-msg');
  if (el) el.remove();
}

// ── Chat list ─────────────────────────────────────────────────────────
async function loadChatList() {
  try {
    const chats = await apiFetch('/chat/history');
    const list  = document.getElementById('chat-list');
    list.innerHTML = '';

    if (!chats.length) {
      list.innerHTML = '<p style="padding:12px;color:var(--text3);font-size:.8rem">Чатов пока нет</p>';
      return;
    }

    chats.forEach(c => {
      const div = document.createElement('div');
      div.className = `chat-item${c._id === currentChatId ? ' active' : ''}`;
      div.innerHTML = `
        <div class="chat-item-title">${escHtml(c.lastMessage.slice(0,38))}...</div>
        <div class="chat-item-date">${new Date(c.lastDate).toLocaleDateString('ru')}</div>
      `;
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
    document.getElementById('chat-title').textContent =
      msgs[0]?.content.slice(0, 40) || 'Чат';
    loadChatList();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function newChat() {
  currentChatId = null;
  document.getElementById('messages').innerHTML = '';
  document.getElementById('chat-title').textContent = 'Новый чат';
  clearFileContext();
  document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
}

async function deleteChatCurrent() {
  if (!currentChatId) return;
  if (!confirm('Удалить этот чат?')) return;
  try {
    await apiFetch(`/chat/${currentChatId}`, { method: 'DELETE' });
    newChat();
    loadChatList();
    toast('Чат удалён');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Drag & Drop file upload ───────────────────────────────────────────
function initDragDrop() {
  const area = document.getElementById('messages');
  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('drag-over');
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
  const allowed = ['application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowed.includes(file.type)) {
    return toast('Поддерживаются только PDF, DOCX, TXT', 'error');
  }

  toast('Загружаю файл...', 'info');
  const fd = new FormData();
  fd.append('file', file);

  try {
    const data = await apiUpload('/files/upload', fd);
    fileContext = data.extractedText;
    document.getElementById('file-preview-bar').style.display = 'flex';
    document.getElementById('file-preview-name').textContent = `📄 ${file.name}`;
    toast('Файл загружен и проанализирован!', 'success');
    if (data.summary) {
      appendMessage('assistant', `**Файл проанализирован!** 📄\n\n${data.summary}`);
    }
  } catch (err) {
    toast(err.message, 'error');
  }
}

function clearFileContext() {
  fileContext = null;
  document.getElementById('file-preview-bar').style.display = 'none';
}

// ── Save chat as note ─────────────────────────────────────────────────
async function saveAsNote() {
  const msgs = document.querySelectorAll('#messages .msg-bubble');
  if (!msgs.length) return toast('Нет сообщений для сохранения', 'error');
  const content = Array.from(msgs).map(m => m.innerText).join('\n\n---\n\n');
  try {
    await apiFetch('/notes', {
      method: 'POST',
      body: JSON.stringify({
        title: `Чат от ${new Date().toLocaleDateString('ru')}`,
        content,
        source: 'chat'
      })
    });
    toast('Сохранено как конспект!', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ── Voice input ───────────────────────────────────────────────────────
function toggleVoice() {
  const btn = document.getElementById('mic-btn');
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return toast('Голосовой ввод не поддерживается вашим браузером', 'error');
  }
  if (isRecording) {
    recognition?.stop();
    isRecording = false;
    btn.classList.remove('recording');
    btn.textContent = '🎤';
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'ru-RU';
  recognition.interimResults = false;
  recognition.onresult = e => {
    document.getElementById('chat-input').value = e.results[0][0].transcript;
    isRecording = false;
    btn.classList.remove('recording');
    btn.textContent = '🎤';
  };
  recognition.onerror = () => {
    isRecording = false;
    btn.classList.remove('recording');
    btn.textContent = '🎤';
    toast('Ошибка распознавания речи', 'error');
  };
  recognition.start();
  isRecording = true;
  btn.classList.add('recording');
  btn.textContent = '⏹';
}
