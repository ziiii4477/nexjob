const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: function() {
            return !this.post; // 如果没有post字段，则job字段必填
        },
        default: null
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: function() {
            return !this.job; // 如果没有job字段，则post字段必填
        },
        default: null
    },
    applicant: {
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    resume: {
        type: mongoose.Schema.ObjectId,
        ref: 'Resume',
        required: true
    },
    status: {
        type: String,
        enum: ['suitable', 'unsuitable', 'uncertain', 'pending_review', 'viewed', 'unread'],
        default: 'unread'
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },
    coverLetter: {
        type: String,
        maxlength: [1000, '求职信不能超过1000个字符']
    },
    fromCommunity: {
        type: Boolean,
        default: false
    },
    hrUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'HRUser',
        required: function() {
            return this.fromCommunity; // 如果是社区投递，则HR用户ID必填
        }
    },
    // 面试相关字段
    interviewStatus: {
        type: String,
        enum: ['pending', 'invited', 'scheduled', 'completed', 'rejected', 'cancelled'],
        default: 'pending'
    },
    interviewInvitation: {
        sentAt: Date,
        message: String,
        location: String,
        interviewType: {
            type: String,
            enum: ['onsite', 'online', 'phone'],
            default: 'onsite'
        },
        proposedTime: [Date],
        confirmedTime: Date,
        meetingLink: String
    },
    interviewFeedback: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        notes: String,
        strengths: [String],
        weaknesses: [String],
        recommendation: {
            type: String,
            enum: ['hire', 'reject', 'consider']
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 防止重复申请 - 修改索引定义
// 移除旧的索引
// ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true, sparse: true });
// ApplicationSchema.index({ post: 1, applicant: 1 }, { unique: true, sparse: true });

// 添加复合索引，确保只有当job不为null时才检查唯一性
ApplicationSchema.index({ 
    job: 1, 
    applicant: 1 
}, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { job: { $ne: null } }
});

// 添加复合索引，确保只有当post不为null时才检查唯一性
ApplicationSchema.index({ 
    post: 1, 
    applicant: 1 
}, { 
    unique: true,
    partialFilterExpression: { post: { $ne: null } }
});

// 更新时间
ApplicationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (this.isModified('status')) {
        this.statusUpdatedAt = Date.now();
    }
    next();
});

// 更新状态时自动更新statusUpdatedAt
ApplicationSchema.pre('findOneAndUpdate', function(next) {
    if (this._update.status) {
        this._update.statusUpdatedAt = new Date();
    }
    this._update.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Application', ApplicationSchema); 