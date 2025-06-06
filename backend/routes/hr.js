const express = require('express');
const router = express.Router();
const HRUser = require('../models/HRUser');
const { protect } = require('../middleware/auth');

// 获取当前HR用户信息
router.get('/me', protect, async (req, res) => {
  try {
    const user = await HRUser.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// HR 登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 检查用户是否存在
    const user = await HRUser.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 生成 token
    const token = user.getSignedJwtToken();

    // 发送响应
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ message: '服务器错误' });
  }
});

// HR 注册
router.post('/register', async (req, res) => {
  const {
    name, email, password, phone,
    companyName, companyPosition, companySize, companyAddress,
    businessLicense, avatar
  } = req.body;

  if (await HRUser.findOne({ email })) {
    return res.status(400).json({ message: '邮箱已被注册' });
  }

  const user = await HRUser.create({
    name,
    email,
    password,
    phone,
    company: {
      name: companyName,
      position: companyPosition,
      size: companySize,
      address: companyAddress
    },
    businessLicense,
    avatar
  });

  res.json({
    message: '注册成功',
    user
  });
});

module.exports = router; 