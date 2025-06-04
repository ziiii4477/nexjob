const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, '请输入姓名']
    },
    email: {
        type: String,
        required: [true, '请输入邮箱'],
        unique: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
    },
    password: {
        type: String,
        required: [true, '请输入密码'],
        minlength: [8, '密码至少8位'],
        select: false
    },
    phone: {
        type: String,
        required: [true, '请输入联系电话']
    },
    companyName: {
        type: String,
        required: [true, '请输入公司名称']
    },
    position: {
        type: String,
        required: [true, '请输入职位']
    },
    companySize: {
        type: String,
        required: [true, '请选择公司规模']
    },
    companyAddress: {
        type: String,
        required: [true, '请输入公司地址']
    },
    businessLicense: {
        type: String,
        required: [true, '请上传营业执照']
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 加密密码
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// 生成JWT Token
userSchema.methods.getSignedToken = function() {
    return jwt.sign(
        { id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

module.exports = mongoose.model('User', userSchema); 