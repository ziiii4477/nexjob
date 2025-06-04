const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const HRUser = require('../models/HRUser');
const {
    register,
    login,
    logout,
    getMe,
    updateDetails,
    updatePassword,
    activateAccount,
    verifyEmail
} = require('../controllers/auth');
const { uploadSingle } = require('../utils/fileUpload');

router.post('/register', uploadSingle('businessLicense'), register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/verify/:token', verifyEmail);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/activate', protect, authorize('admin'), activateAccount);

// 修改：允许用户查看自己的状态
router.get('/check-status/:email', protect, async (req, res) => {
    try {
        // 只允许用户查看自己的状态
        if (req.user.email !== req.params.email && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: '无权查看其他用户的状态'
            });
        }

        const user = await HRUser.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        res.status(200).json({
            success: true,
            data: {
                email: user.email,
                status: user.status,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router; 