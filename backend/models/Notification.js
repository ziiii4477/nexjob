const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { // 被通知的人（发帖人）
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'favorite', 'comment', 'mention', 'follow', 'reply', 'comment_like', 'reply_like'],
        required: true
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: true
    },
    comment: {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment'
    },
    fromUser: { // 点赞/收藏/评论的人
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 