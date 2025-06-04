const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
    getChats,
    createChat,
    getMessages,
    sendMessage,
    markMessagesAsRead
} = require('../controllers/chats');

router.route('/')
    .get(protect, getChats)
    .post(protect, createChat);

router.route('/:chatId/messages')
    .get(protect, getMessages)
    .post(protect, sendMessage);

router.route('/:chatId/messages/read')
    .put(protect, markMessagesAsRead);

module.exports = router; 