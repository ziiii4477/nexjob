const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // 记录错误信息
    console.error('错误详情:', {
        name: err.name,
        code: err.code,
        message: err.message,
        stack: err.stack,
        keyValue: err.keyValue
    });

    // Mongoose 错误处理
    if (err.name === 'CastError') {
        const message = '资源不存在';
        error = new ErrorResponse(message, 404);
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ErrorResponse(message, 400);
    }

    // Mongoose 重复键错误
    if (err.code === 11000) {
        // 获取重复键的字段名
        const field = Object.keys(err.keyValue)[0];
        let message;
        
        // 根据不同字段返回不同的错误信息
        switch(field) {
            case 'email':
                message = '该邮箱已被注册';
                break;
            case 'job':
                message = `您已经投递过该职位(ID: ${err.keyValue.job})`;
                break;
            case 'post':
                message = `您已经投递过该帖子(ID: ${err.keyValue.post})`;
                break;
            default:
                message = `${field} 字段重复`;
        }
        
        error = new ErrorResponse(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || '服务器错误'
    });
};

module.exports = errorHandler; 