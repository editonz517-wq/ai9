const { v4: uuidv4 } = require('uuid');
const Message = require('../models/Message');
const User    = require('../models/User');
const { askAI } = require('../services/aiService');

// POST /api/chat/send
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content, fileContext } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim())
      return res.status(400).json({ message: 'Сообщение не может быть пустым' });

    const activeChatId = chatId || uuidv4();

    // Save user message
    await Message.create({ user: userId, chatId: activeChatId, role: 'user', content });

    // Load conversation history (last 20 messages)
    const history = await Message.find({ user: userId, chatId: activeChatId })
      .sort({ createdAt: 1 })
      .limit(20)
      .select('role content');

    const messages = history.map(m => ({ role: m.role, content: m.content }));

    // AI memory context
    const user = await User.findById(userId).select('aiMemory name');
    let systemExtra = `Имя студента: ${user.name}.`;
    if (user.aiMemory?.subjects?.length)
      systemExtra += ` Его предметы: ${user.aiMemory.subjects.join(', ')}.`;
    if (user.aiMemory?.lastTopics?.length)
      systemExtra += ` Последние темы: ${user.aiMemory.lastTopics.slice(-3).join(', ')}.`;
    if (fileContext)
      systemExtra += `\n\nКонтекст загруженного файла:\n${fileContext.slice(0, 4000)}`;

    const aiText = await askAI(messages, systemExtra);

    // Save AI message
    const aiMessage = await Message.create({
      user: userId, chatId: activeChatId, role: 'assistant', content: aiText
    });

    // Update user stats & AI memory
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.totalMessages': 2 },
      $push: {
        'aiMemory.lastTopics': {
          $each: [content.slice(0, 60)],
          $slice: -10
        }
      }
    });

    res.json({ chatId: activeChatId, message: aiMessage });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/history — list of chat sessions
exports.getChatList = async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Message.aggregate([
      { $match: { user: userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$chatId',
          lastMessage: { $first: '$content' },
          lastDate:    { $first: '$createdAt' },
          count:       { $sum: 1 }
        }
      },
      { $sort: { lastDate: -1 } },
      { $limit: 50 }
    ]);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/:chatId — messages in one chat
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await Message.find({ user: req.user._id, chatId })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/chat/:chatId
exports.deleteChat = async (req, res) => {
  try {
    await Message.deleteMany({ user: req.user._id, chatId: req.params.chatId });
    res.json({ message: 'Чат удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
