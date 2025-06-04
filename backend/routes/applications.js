const express = require('express');
const {
    createApplication,
    getApplications,
    getMyApplications,
    getApplication,
    updateApplicationStatus,
    quickApply,
    checkApplied,
    updateAllStatus,
    markForReview,
    sendInterviewInvitation,
    updateInterviewStatus,
    getInterviewCandidates,
    exportResumes
} = require('../controllers/applications');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

// 更新所有uncertain和viewed状态的简历为pending_review状态
router.get('/update-all-status', protect, authorize('hr'), updateAllStatus);

// 获取待面试的候选人列表
router.get('/interviews', protect, authorize('hr'), getInterviewCandidates);

// 批量导出简历
router.post('/export-resumes', protect, authorize('hr'), exportResumes);

// 用户路由
router.route('/my')
    .get(protect, getMyApplications);

// 一键投递路由
router.route('/quick-apply/:postId')
    .post(protect, authorize('jobseeker'), quickApply);

// 检查是否已投递路由
router.route('/check-applied/:postId')
    .get(protect, authorize('jobseeker'), checkApplied);

// HR用户路由 - 获取所有投递的简历
router.route('/')
    .get(protect, authorize('hr'), getApplications)
    .post(protect, authorize('user'), createApplication);

router.route('/:id')
    .get(protect, getApplication)
    .put(protect, authorize('hr'), updateApplicationStatus);

// 将简历标记为待复筛
router.route('/:id/mark-for-review')
    .put(protect, authorize('hr'), markForReview);

// 面试邀请相关路由
router.route('/:id/interview-invitation')
    .post(protect, authorize('hr'), sendInterviewInvitation);

// 更新面试状态
router.route('/:id/interview-status')
    .put(protect, authorize('hr'), updateInterviewStatus);

module.exports = router; 