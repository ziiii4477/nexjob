const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, '请输入标题']
    },
    content: {
        type: String,
        required: [true, '请输入内容']
    },
    author: {
        type: mongoose.Schema.ObjectId,
        refPath: 'authorType',
        required: true
    },
    authorType: {
        type: String,
        enum: ['JobSeeker', 'HRUser'],
        required: true
    },
    category: {
        type: String,
        enum: ['internship', 'job', 'academic', 'other'],
        default: 'other',
        required: true
    },
    quickApply: {
        type: Boolean,
        default: false
    },
    aiInterview: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String
    }],
    likes: [{
        type: mongoose.Schema.ObjectId,
    }],
    comments: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Comment'
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    images: [{ 
        type: String,
        required: true
    }],
    favorites: [{
        type: mongoose.Schema.ObjectId,
    }],
    views: {
        type: Number,
        default: 0
    }
});

// 更新时间
postSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Post', postSchema); 