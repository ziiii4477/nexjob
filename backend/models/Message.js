const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HRUser',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// 更新聊天的最后消息和更新时间
MessageSchema.post('save', async function() {
    await this.model('Chat').findByIdAndUpdate(
        this.chat,
        {
            lastMessage: this._id,
            updatedAt: Date.now()
        }
    );
});

module.exports = mongoose.model('Message', MessageSchema); 