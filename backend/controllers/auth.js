const HRUser = require('../models/HRUser');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const { uploadToFirebase } = require('../utils/firebaseStorage');
const crypto = require('crypto');

// @desc    注册HR用户
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { fullName, email, password, phone, companyName, position, companySize, companyAddress } = req.body;

        // 检查必填字段
        if (!fullName || !email || !password || !phone || !companyName || !position || !companySize || !companyAddress) {
            return res.status(400).json({
                success: false,
                message: '请填写所有必填字段'
            });
        }

        // 检查是否上传了营业执照
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请上传营业执照'
            });
        }

        // 上传营业执照到 Firebase Storage
        const businessLicenseUrl = await uploadToFirebase(
            req.file.buffer,
            req.file.originalname,
            'licenses'
        );

        // 创建用户
        const user = await HRUser.create({
            name: fullName,
            email,
            password,
            phone,
            company: {
                name: companyName,
                position,
                size: companySize,
                address: companyAddress
            },
            businessLicense: businessLicenseUrl
        });

        // 生成验证令牌
        const verificationToken = crypto.randomBytes(20).toString('hex');
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期
        await user.save();

        // 发送验证邮件
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const message = `
            <h1>邮箱验证</h1>
            <p>请点击下面的链接验证您的邮箱：</p>
            <a href="${verifyUrl}" target="_blank">验证邮箱</a>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'NexJob 邮箱验证',
                message
            });

            res.status(201).json({
                success: true,
                message: '注册成功，请查收验证邮件',
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    status: user.status
                }
            });
        } catch (err) {
            console.error('发送验证邮件失败:', err);
            user.verificationToken = undefined;
            user.verificationTokenExpires = undefined;
            await user.save();

            return res.status(500).json({
                success: false,
                message: '发送验证邮件失败，但用户已创建'
            });
        }
    } catch (error) {
        console.error('注册失败:', error);
        return res.status(500).json({
            success: false,
            message: '注册失败: ' + error.message
        });
    }
};

// @desc    HR用户登录
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // 验证邮箱和密码
    if (!email || !password) {
        return next(new ErrorResponse('请提供邮箱和密码', 400));
    }

    // 检查用户
    const user = await HRUser.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('无效的登录信息', 401));
    }

    // 检查密码
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('无效的登录信息', 401));
    }

    // 检查账号状态
    if (user.status !== 'active') {
        return next(new ErrorResponse('您的账号正在审核中', 401));
    }

    // 生成token并发送响应
    const token = user.generateAuthToken();
    console.log('Generated token:', token);
    console.log('User ID:', user._id);

    res.status(200).json({
        success: true,
        token
    });
});

// @desc    获取当前登录用户
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await HRUser.findById(req.user._id);
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    更新用户信息
// @route   PUT /api/hr/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        company: req.body.company,
        businessLicense: req.body.businessLicense,
        avatar: req.body.avatar
    };

    const user = await HRUser.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    更新密码
// @route   PUT /api/hr/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await HRUser.findById(req.user.id).select('+password');

    // 检查当前密码
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('当前密码错误', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// @desc    退出登录
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    激活HR账号
// @route   PUT /api/v1/auth/activate
// @access  Private/Admin
exports.activateAccount = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const user = await HRUser.findOne({ email });

    if (!user) {
        return next(new ErrorResponse('用户不存在', 404));
    }

    user.status = 'active';
    await user.save();

    // 发送激活成功邮件
    try {
        await sendEmail({
            email: user.email,
            subject: 'NexJob HR账号已激活',
            message: `尊敬的${user.name}，您的HR账号已经审核通过并激活。现在您可以登录系统发布职位和管理简历了。`
        });
    } catch (err) {
        console.log('激活邮件发送失败:', err);
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

// 生成token并发送cookie
const sendTokenResponse = (user, statusCode, res) => {
    // 创建token
    const token = user.generateAuthToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
};

// 验证邮箱
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await HRUser.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: '验证链接无效或已过期'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: '邮箱验证成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '验证失败，请稍后重试'
        });
    }
}; 