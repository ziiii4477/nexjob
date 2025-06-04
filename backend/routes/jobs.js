const express = require('express');
const {
    getJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    getJobStatistics,
    getMyJobs,
    toggleFavorite
} = require('../controllers/jobs');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// 基础路由
router.route('/')
    .get(getJobs)  // 获取职位列表/搜索
    .post(protect, authorize('hr'), createJob);  // 创建职位

// HR用户路由
router.get('/statistics', protect, authorize('hr'), getJobStatistics);
router.get('/my', protect, authorize('hr'), getMyJobs);

// 收藏职位路由
router.post('/:id/favorite', protect, authorize('jobseeker'), toggleFavorite);

// 包含简历路由
const resumeRouter = require('./resume');
router.use('/:jobId/resumes', resumeRouter);

// 包含申请路由
const applicationRouter = require('./applications');
router.use('/:jobId/applications', applicationRouter);

// 特定职位路由 - 放在最后
router.route('/:id')
    .get(getJob)
    .put(protect, authorize('hr'), updateJob)
    .delete(protect, authorize('hr'), deleteJob);

module.exports = router; 