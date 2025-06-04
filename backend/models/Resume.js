const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    jobseeker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    language: {
        type: String,
        enum: ['zh', 'en'],
        required: true
    },
    path: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

// 更新时间
resumeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Resume', resumeSchema); 