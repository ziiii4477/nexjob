const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JobSeekerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '请输入姓名'],
        trim: true
    },
    email: {
        type: String,
        required: [true, '请输入邮箱'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            '请输入有效的邮箱地址'
        ]
    },
    password: {
        type: String,
        required: [true, '请输入密码'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        default: 'jobseeker'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    avatar: {
        type: String,
        default: 'avatar1.svg'
    },
    phone: {
        type: String,
        trim: true
    },
    emailSubscription: {
        type: Boolean,
        default: false
    },
    followers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker'
    }],
    following: [{
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker'
    }]
}, {
    timestamps: true,
    collection: 'jobseekers'
});

// 创建索引
JobSeekerSchema.index({ email: 1 });
JobSeekerSchema.index({ status: 1 });

// 加密密码
JobSeekerSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 生成JWT Token
JobSeekerSchema.methods.getSignedJwtToken = function() {
    const secret = process.env.JWT_SECRET || 'nexjob_default_secret_key_2024';
    return jwt.sign({ id: this._id }, secret, {
        expiresIn: process.env.JWT_EXPIRE || '30d'
    });
};

// 比较密码
JobSeekerSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// 确保模型只被定义一次
module.exports = mongoose.models.JobSeeker || mongoose.model('JobSeeker', JobSeekerSchema); 