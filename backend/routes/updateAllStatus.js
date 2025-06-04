const express = require('express');
const router = express.Router();
const { updateAllStatus } = require('../controllers/applications');
const { protect, authorize } = require('../middleware/auth');

// 更新所有uncertain和viewed状态的简历为pending_review状态
router.get('/', protect, authorize('hr'), updateAllStatus);

module.exports = router; 