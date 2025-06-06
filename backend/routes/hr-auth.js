const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMe } = require('../controllers/hr-auth');

// 获取当前登录的HR用户信息
router.get('/me', protect, (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
}, getMe);

module.exports = router; 