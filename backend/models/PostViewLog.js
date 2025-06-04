const mongoose = require('mongoose');

const postViewLogSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker',
        required: false
    },
    ip: {
        type: String,
        required: false
    },
    lastView: {
        type: Date,
        default: Date.now
    }
});

postViewLogSchema.index({ post: 1, user: 1 });
postViewLogSchema.index({ post: 1, ip: 1 });

module.exports = mongoose.model('PostViewLog', postViewLogSchema); 