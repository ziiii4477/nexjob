const HRUser = require('../models/HRUser');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    获取当前登录的HR用户信息
// @route   GET /api/v1/hr/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    const hr = await HRUser.findById(req.user.id);
    if (!hr) {
        return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.status(200).json({
        success: true,
        data: {
            _id: hr._id,
            id: hr._id,
            avatar: hr.avatar,
            name: hr.name,
            email: hr.email,
            company: hr.company,
            phone: hr.phone,
            status: hr.status,
            isVerified: hr.isVerified,
            role: hr.role
        }
    });
}); 