const fetch = require('node-fetch');

const SYSTEM_PROMPT = `Ты — AI-помощник для студентов по имени «StudyBot». 
Помогаешь с учёбой: объясняешь темы, пишешь конспекты, генерируешь код, 
решаешь задачи по программированию (Python, JS, C++, SQL), математике, физике, БД.
Отвечай на русском языке, если не попросят иначе.
При генерации кода — используй блоки с подсветкой синтаксиса (markdown).
При создании конспектов — структурируй с заголовками и пунктами.`;

async function askAI(messages, systemExtra = '') {
  const systemContent = systemExtra
    ? `${SYSTEM_PROMPT}\n\n${systemExtra}`
    : SYSTEM_PROMPT;

  const payload = {
    model: process.env.AI_MODEL,
    messages: [
      { role: 'system', content: systemContent },
      ...messages
    ],
    max_tokens: 2000,
    temperature: 0.7
  };

  const res = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'AI Student Assistant'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function summarizeDocument(text, instruction = 'Сделай краткий конспект этого документа') {
  return askAI([
    { role: 'user', content: `${instruction}:\n\n${text.slice(0, 8000)}` }
  ]);
}

async function generateTest(topic, count = 5) {
  return askAI([
    { role: 'user', content: `Создай тест из ${count} вопросов с вариантами ответов по теме: ${topic}` }
  ]);
}

module.exports = { askAI, summarizeDocument, generateTest };
