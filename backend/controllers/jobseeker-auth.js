const JobSeeker = require('../models/JobSeeker');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const mongoose = require('mongoose');

// @desc    注册求职者
// @route   POST /api/v1/jobseeker/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // 创建用户
    const jobseeker = await JobSeeker.create({
        name,
        email,
        password
    });

    sendTokenResponse(jobseeker, 201, res);
});

// @desc    求职者登录
// @route   POST /api/v1/jobseeker/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    try {
        console.log('收到登录请求:', req.body);
        const { email, password } = req.body;

        // 验证邮箱和密码是否存在
        if (!email || !password) {
            return next(new ErrorResponse('请提供邮箱和密码', 400));
        }

        // 检查数据库连接状态
        if (!mongoose.connection || mongoose.connection.readyState !== 1) {
            console.error('数据库未连接，当前状态:', mongoose.connection ? mongoose.connection.readyState : '无连接');
            // 尝试重新连接
            try {
                await mongoose.connect(process.env.MONGODB_URI);
                console.log('数据库重新连接成功');
            } catch (error) {
                console.error('数据库重新连接失败:', error);
                return next(new ErrorResponse('数据库连接失败', 500));
            }
        }

        console.log('开始查询用户...');
        // 检查用户
        const jobseeker = await JobSeeker.findOne({ email }).select('+password');
        console.log('用户查询结果:', jobseeker ? '找到用户' : '未找到用户');

        if (!jobseeker) {
            return next(new ErrorResponse('无效的登录信息', 401));
        }

        // 检查密码
        console.log('开始验证密码...');
        const isMatch = await jobseeker.comparePassword(password);
        console.log('密码验证结果:', isMatch ? '密码正确' : '密码错误');

        if (!isMatch) {
            return next(new ErrorResponse('无效的登录信息', 401));
        }

        sendTokenResponse(jobseeker, 200, res);
    } catch (error) {
        console.error('登录错误:', error);
        next(error);
    }
});

// @desc    获取当前登录的求职者信息
// @route   GET /api/v1/jobseeker/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const jobseeker = await JobSeeker.findById(req.user.id);
    if (!jobseeker) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.status(200).json({
        success: true,
        data: {
            _id: jobseeker._id,
            id: jobseeker._id,
            avatar: jobseeker.avatar,
            nickname: jobseeker.nickname || jobseeker.name,
            name: jobseeker.name,
            email: jobseeker.email,
            followingCount: jobseeker.following ? jobseeker.following.length : 0,
            followerCount: jobseeker.followers ? jobseeker.followers.length : 0
        }
    });
});

// @desc    更新求职者信息
// @route   PUT /api/v1/user/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        avatar: req.body.avatar
    };
    const user = await JobSeeker.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });
    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    更新密码
// @route   PUT /api/v1/user/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await JobSeeker.findById(req.user.id).select('+password');

    // 检查当前密码
    if (!(await user.comparePassword(req.body.currentPassword))) {
        return next(new ErrorResponse('当前密码不正确', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

// 生成token并发送响应
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
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