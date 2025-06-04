const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'JobSeeker', required: true }, // 评论者
    text: { type: String, required: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true }, // 父评论ID
    replies: [{ type: Schema.Types.ObjectId, ref: 'Comment' }], // 回复此评论的评论ID列表
    depth: { type: Number, default: 0 }, // 评论深度，0为顶层评论
    createdAt: { type: Date, default: Date.now },
    // --- Future extensions ---
    // likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],             // Comment likes
});

module.exports = mongoose.model('Comment', CommentSchema); 