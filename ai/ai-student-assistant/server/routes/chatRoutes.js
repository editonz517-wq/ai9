const express = require('express');
const router  = express.Router();
const { sendMessage, getChatList, getChatMessages, deleteChat } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/send',       sendMessage);
router.get('/history',     getChatList);
router.get('/:chatId',     getChatMessages);
router.delete('/:chatId',  deleteChat);

module.exports = router;
