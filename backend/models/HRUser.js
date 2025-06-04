const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const hrUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '请输入姓名'],
        trim: true
    },
    email: {
        type: String,
        required: [true, '请输入邮箱'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '请输入有效的邮箱地址']
    },
    password: {
        type: String,
        required: [true, '请输入密码'],
        minlength: [8, '密码至少8位'],
        select: false
    },
    phone: {
        type: String,
        required: [true, '请输入手机号'],
        match: [/^(\+\d{1,3}[\s-]?)?\d{5,}$/, '请输入有效的手机号码']
    },
    company: {
        name: {
            type: String,
            required: [true, '请输入公司名称'],
            trim: true
        },
        position: {
            type: String,
            required: [true, '请输入职位'],
            trim: true
        },
        size: {
            type: String,
            required: [true, '请选择公司规模'],
            enum: ['1-50', '51-200', '201-500', '501-1000', '1000+']
        },
        address: {
            type: String,
            required: [true, '请输入公司地址'],
            trim: true
        }
    },
    businessLicense: {
        type: String,
        required: [true, '请上传营业执照']
    },
    role: {
        type: String,
        enum: ['hr'],
        default: 'hr'
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected'],
        default: 'active'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: {
        type: String,
        default: 'avatar1.svg'
    },
}, {
    timestamps: true
});

// 密码加密中间件
hrUserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 验证密码方法
hrUserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// 生成JWT token方法
hrUserSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { id: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// 生成验证token方法
hrUserSchema.methods.generateVerificationToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.verificationToken = token;
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时有效期
    return token;
};

// 生成重置密码token方法
hrUserSchema.methods.generatePasswordResetToken = function() {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = token;
    this.resetPasswordExpires = Date.now() + 1 * 60 * 60 * 1000; // 1小时有效期
    return token;
};

const HRUser = mongoose.model('HRUser', hrUserSchema);

module.exports = HRUser; 