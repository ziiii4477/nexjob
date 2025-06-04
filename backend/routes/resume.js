const express = require('express');
const router = express.Router();
const { getResumes, uploadResume, downloadResume, deleteResume, viewResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

// 获取简历列表
router.get('/', protect, getResumes);

// 上传简历
router.post('/upload', protect, uploadResume);

// 下载简历
router.get('/:id/download', protect, downloadResume);

// 预览简历
router.get('/:id/view', protect, viewResume);

// 删除简历
router.delete('/:id', protect, deleteResume);

module.exports = router; 