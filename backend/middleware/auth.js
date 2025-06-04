const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const HRUser = require('../models/HRUser');
const JobSeeker = require('../models/JobSeeker');

// 默认JWT密钥
const DEFAULT_JWT_SECRET = 'nexjob_default_secret_key_2024';

// 获取JWT密钥
const getJwtSecret = () => {
    return process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
};

// 可选认证
exports.optionalProtect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // 从header中获取token
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
        // 从cookie中获取token
        token = req.cookies.token;
    }

    // 如果没有token，继续但不设置用户
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        // 验证token
        const decoded = jwt.verify(token, getJwtSecret());
        
        // 尝试从两个集合中找到用户
        req.user = await HRUser.findById(decoded.id);
        
        if (!req.user) {
            req.user = await JobSeeker.findById(decoded.id);
        }
        
        if (req.user && req.user.status !== 'active') {
            req.user = null;
        }
    } catch (err) {
        console.error('Token验证失败:', err);
        req.user = null;
    }

    next();
});

// 保护路由
exports.protect = asyncHandler(async (req, res, next) => {
    let token;
    let authMethod = 'none';

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // 从header中获取token
        token = req.headers.authorization.split(' ')[1];
        authMethod = 'header';
        console.log('从header获取到token:', token ? '存在' : '不存在');
    } else if (req.cookies.token) {
        // 从cookie中获取token
        token = req.cookies.token;
        authMethod = 'cookie';
        console.log('从cookie获取到token:', token ? '存在' : '不存在');
    } else if (req.query && req.query.token) {
        // 从URL查询参数中获取token
        token = req.query.token;
        authMethod = 'query';
        console.log('从URL查询参数获取到token:', token ? '存在' : '不存在');
    }

    // 确保token存在
    if (!token) {
        console.log('未找到token');
        return next(new ErrorResponse('请先登录', 401));
    }

    try {
        // 验证token
        const decoded = jwt.verify(token, getJwtSecret());
        console.log('token解码成功:', decoded);

        // 尝试从HR用户集合中找到用户
        let user = await HRUser.findById(decoded.id);
        console.log('HR用户查询结果:', user ? '找到用户' : '未找到用户');

        // 如果在HR用户集合中找不到，尝试在求职者集合中查找
        if (!user) {
            user = await JobSeeker.findById(decoded.id);
            console.log('求职者查询结果:', user ? '找到用户' : '未找到用户');
        }

        if (!user) {
            console.log('用户不存在');
            return next(new ErrorResponse('用户不存在', 401));
        }

        if (user.status !== 'active') {
            console.log('账号未激活');
            return next(new ErrorResponse('账号未激活', 401));
        }

        // 设置用户信息到请求对象
        req.user = user;
        req.authMethod = authMethod; // 记录认证方法
        console.log('认证成功，用户类型:', user.constructor.modelName, '认证方式:', authMethod);
        next();
    } catch (err) {
        console.error('token验证失败:', err);
        return next(new ErrorResponse('认证失败: ' + err.message, 401));
    }
});

// 授权访问
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // 检查用户是否存在
        if (!req.user) {
            return next(new ErrorResponse('无权限访问', 403));
        }

        // 获取用户类型（modelName）和角色
        const userType = req.user.constructor.modelName.toLowerCase();
        const userRole = req.user.role;

        // 检查是否有权限（支持both role和modelName的检查）
        const hasPermission = roles.some(role => {
            const lowerRole = role.toLowerCase();
            return lowerRole === userRole || lowerRole === userType;
        });

        if (!hasPermission) {
            return next(new ErrorResponse('无权限访问', 403));
        }

        next();
    };
}; 