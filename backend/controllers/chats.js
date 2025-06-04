const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    获取用户的所有聊天
// @route   GET /api/v1/chats
// @access  Private
exports.getChats = asyncHandler(async (req, res, next) => {
    const chats = await Chat.find({
        participants: { $in: [req.user.id] }
    })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort('-updatedAt');

    res.status(200).json({
        success: true,
        data: chats
    });
});

// @desc    创建新的聊天
// @route   POST /api/v1/chats
// @access  Private
exports.createChat = asyncHandler(async (req, res, next) => {
    const { participantId } = req.body;

    // 检查是否已存在聊天
    let chat = await Chat.findOne({
        participants: {
            $all: [req.user.id, participantId]
        }
    });

    if (chat) {
        return res.status(200).json({
            success: true,
            data: chat
        });
    }

    // 创建新聊天
    chat = await Chat.create({
        participants: [req.user.id, participantId]
    });

    res.status(201).json({
        success: true,
        data: chat
    });
});

// @desc    获取特定聊天的消息
// @route   GET /api/v1/chats/:chatId/messages
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
        return next(new ErrorResponse('聊天不存在', 404));
    }

    // 验证用户是否为聊天参与者
    if (!chat.participants.includes(req.user.id)) {
        return next(new ErrorResponse('未授权访问此聊天', 401));
    }

    const messages = await Message.find({ chat: req.params.chatId })
        .populate('sender', 'name email')
        .sort('createdAt');

    res.status(200).json({
        success: true,
        data: messages
    });
});

// @desc    发送消息
// @route   POST /api/v1/chats/:chatId/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
    const { content } = req.body;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);

    if (!chat) {
        return next(new ErrorResponse('聊天不存在', 404));
    }

    // 验证用户是否为聊天参与者
    if (!chat.participants.includes(req.user.id)) {
        return next(new ErrorResponse('未授权访问此聊天', 401));
    }

    const message = await Message.create({
        chat: chatId,
        sender: req.user.id,
        content
    });

    // 填充发送者信息
    await message.populate('sender', 'name email');

    res.status(201).json({
        success: true,
        data: message
    });
});

// @desc    标记消息为已读
// @route   PUT /api/v1/chats/:chatId/messages/read
// @access  Private
exports.markMessagesAsRead = asyncHandler(async (req, res, next) => {
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);

    if (!chat) {
        return next(new ErrorResponse('聊天不存在', 404));
    }

    // 验证用户是否为聊天参与者
    if (!chat.participants.includes(req.user.id)) {
        return next(new ErrorResponse('未授权访问此聊天', 401));
    }

    // 将所有未读消息标记为已读
    await Message.updateMany(
        {
            chat: chatId,
            sender: { $ne: req.user.id },
            read: false
        },
        {
            read: true
        }
    );

    res.status(200).json({
        success: true,
        message: '消息已标记为已读'
    });
}); 