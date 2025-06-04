const Application = require('../models/Application');
const Job = require('../models/Job');
const Post = require('../models/Post');
const Resume = require('../models/Resume');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    创建申请
// @route   POST /api/v1/jobs/:jobId/applications
// @access  Private/User
exports.createApplication = asyncHandler(async (req, res, next) => {
    // 添加申请者ID和职位ID
    req.body.applicant = req.user.id;
    req.body.job = req.params.jobId;

    // 检查职位是否存在
    const job = await Job.findById(req.params.jobId);
    if (!job) {
        return next(new ErrorResponse(`职位ID ${req.params.jobId} 不存在`, 404));
    }

    // 检查是否已经申请过
    const existingApplication = await Application.findOne({
        job: req.params.jobId,
        applicant: req.user.id
    });

    if (existingApplication) {
        return next(new ErrorResponse('您已经申请过这个职位了', 400));
    }

    const application = await Application.create(req.body);

    res.status(201).json({
        success: true,
        data: application
    });
});

// @desc    获取所有申请（HR用户获取职位的申请）
// @route   GET /api/v1/jobs/:jobId/applications
// @access  Private/HR
exports.getApplications = asyncHandler(async (req, res, next) => {
    const { postId, status, search } = req.query;
    
    // 构建查询条件
    let query = {};

    // 如果指定了帖子ID，直接查询该帖子的申请
    if (postId) {
        query.post = postId;
    }

    // 添加HR权限检查
    const hrConditions = [
        { hrUser: req.user.id }  // 社区投递
    ];

    // 获取HR发布的所有职位ID
    const jobIds = await Job.find({ postedBy: req.user.id }).select('_id');
    if (jobIds.length > 0) {
        hrConditions.push({ job: { $in: jobIds } });  // 职位投递
    }

    // 获取HR发布的所有帖子ID
    const postIds = await Post.find({ author: req.user.id }).select('_id');
    if (postIds.length > 0) {
        hrConditions.push({ post: { $in: postIds } });  // 帖子投递
    }

    // 添加HR权限条件
    query.$or = hrConditions;

    // 添加状态筛选
    if (status) {
        query.status = status;  // 直接使用传入的状态，不再做映射
    }

    // 添加搜索功能
    if (search) {
        // 查找匹配的JobSeeker用户
        const applicantIds = await mongoose.model('JobSeeker').find({
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        }).select('_id');

        if (applicantIds.length > 0) {
            if (!query.$and) query.$and = [];
            query.$and.push({ applicant: { $in: applicantIds } });
        }
    }

    console.log('应用查询条件:', JSON.stringify(query));

    // 查询所有投递给当前HR用户的申请
    const applications = await Application.find(query)
        .populate({
            path: 'applicant',
            select: 'name email phone'
        })
        .populate('resume')
        .populate('job', 'title company location type')
        .populate({
            path: 'post',
            select: 'title content'
        })
        .sort('-statusUpdatedAt -createdAt');  // 首先按状态更新时间排序，然后按创建时间排序

    console.log(`找到 ${applications.length} 条申请记录`);

    res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
    });
});

// @desc    获取用户的所有申请
// @route   GET /api/v1/applications/my
// @access  Private/User
exports.getMyApplications = asyncHandler(async (req, res, next) => {
    const applications = await Application.find({ applicant: req.user.id })
        .populate({
            path: 'job',
            select: 'title company location type'
        })
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
    });
});

// @desc    获取单个申请
// @route   GET /api/v1/applications/:id
// @access  Private
exports.getApplication = asyncHandler(async (req, res, next) => {
    const application = await Application.findById(req.params.id)
        .populate({
            path: 'job',
            select: 'title company location type'
        })
        .populate({
            path: 'applicant',
            select: 'name email phone'
        })
        .populate('resume');

    if (!application) {
        return next(new ErrorResponse(`申请ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户有权限查看申请
    if (
        req.user.role !== 'hr' && 
        application.applicant._id.toString() !== req.user.id
    ) {
        return next(new ErrorResponse('未经授权的操作', 401));
    }

    res.status(200).json({
        success: true,
        data: application
    });
});

// @desc    更新申请状态
// @route   PUT /api/v1/applications/:id
// @access  Private/HR
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
    let application = await Application.findById(req.params.id);

    if (!application) {
        return next(new ErrorResponse(`申请ID ${req.params.id} 不存在`, 404));
    }

    const statusMap = {
        'suitable': 'suitable',
        'unsuitable': 'unsuitable',
        'uncertain': 'uncertain',
        'mark_for_review': 'pending_review'
    };

    const dbStatus = statusMap[req.body.status] || req.body.status;

    // 更新状态
    application.status = dbStatus;

    application = await Application.findByIdAndUpdate(
        req.params.id,
        { status: dbStatus, statusUpdatedAt: new Date() },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: application
    });
});

// @desc    一键投递简历到社区帖子
// @route   POST /api/v1/applications/quick-apply/:postId
// @access  Private/User
exports.quickApply = asyncHandler(async (req, res, next) => {
    const postId = req.params.postId;
    const { resumeId } = req.body;
    
    console.log('一键投递请求:', {
        postId,
        resumeId,
        userId: req.user.id,
        userRole: req.user.role,
        userModel: req.user.constructor.modelName
    });
    
    // 确保用户是求职者
    if (req.user.constructor.modelName !== 'JobSeeker') {
        console.log('用户不是求职者:', req.user.constructor.modelName);
        return next(new ErrorResponse('只有求职者可以投递简历', 403));
    }
    
    // 检查帖子是否存在
    const post = await Post.findById(postId);
    if (!post) {
        console.log('帖子不存在:', postId);
        return next(new ErrorResponse(`帖子ID ${postId} 不存在`, 404));
    }
    
    console.log('找到帖子:', {
        id: post._id,
        title: post.title,
        quickApply: post.quickApply,
        authorType: post.authorType,
        author: post.author
    });
    
    // 检查帖子是否开启了一键投递
    if (!post.quickApply) {
        return next(new ErrorResponse('该帖子未开启一键投递功能', 400));
    }
    
    // 检查帖子作者是否是HR用户
    if (post.authorType !== 'HRUser') {
        return next(new ErrorResponse('只能投递HR用户发布的帖子', 400));
    }

    // 检查简历是否存在且属于当前用户
    const resume = await Resume.findOne({ 
        _id: resumeId,
        jobseeker: req.user.id
    });
    
    if (!resume) {
        console.log('简历不存在或不属于当前用户:', {
            resumeId,
            userId: req.user.id
        });
        return next(new ErrorResponse('简历不存在或不属于当前用户', 400));
    }
    
    console.log('找到简历:', {
        id: resume._id,
        filename: resume.filename,
        language: resume.language
    });
    
    // 检查是否已经投递过该帖子
    const existingApplication = await Application.findOne({
        post: postId,
        applicant: req.user.id
    });
    
    if (existingApplication) {
        console.log('发现重复投递同一帖子:', {
            applicationId: existingApplication._id,
            postId: existingApplication.post,
            applicantId: existingApplication.applicant,
            createdAt: existingApplication.createdAt
        });
        return next(new ErrorResponse(`您已经投递过ID为 ${postId} 的帖子`, 400));
    }
    
    try {
        // 创建申请记录
        const application = await Application.create({
            applicant: req.user.id,
            post: postId,
            resume: resumeId,
            status: 'pending',
            fromCommunity: true,
            hrUser: post.author
        });
        
        console.log('创建申请成功:', {
            id: application._id,
            applicant: application.applicant,
            post: application.post,
            resume: application.resume,
            hrUser: application.hrUser
        });
        
        res.status(201).json({
            success: true,
            message: '简历投递成功',
            data: application
        });
    } catch (err) {
        console.error('创建申请失败:', {
            error: err.message,
            code: err.code,
            name: err.name,
            keyValue: err.keyValue
        });
        
        // 如果是重复键错误
        if (err.code === 11000) {
            // 检查是否是由于job字段为null导致的冲突
            if (err.keyValue && err.keyValue.job === null) {
                // 尝试查找冲突的申请记录
                const conflictApp = await Application.findOne({
                    applicant: req.user.id,
                    job: null
                }).populate('post');
                
                if (conflictApp) {
                    console.log('找到冲突的申请记录:', {
                        id: conflictApp._id,
                        post: conflictApp.post?._id,
                        postTitle: conflictApp.post?.title,
                        createdAt: conflictApp.createdAt
                    });
                    
                    // 删除冲突的记录并重新创建
                    await Application.findByIdAndDelete(conflictApp._id);
                    console.log('已删除冲突的申请记录');
                    
                    // 重新尝试创建
                    const newApplication = await Application.create({
                        applicant: req.user.id,
                        post: postId,
                        resume: resumeId,
                        status: 'pending',
                        fromCommunity: true,
                        hrUser: post.author
                    });
                    
                    console.log('成功创建新申请:', {
                        id: newApplication._id,
                        post: newApplication.post
                    });
                    
                    return res.status(201).json({
                        success: true,
                        message: '简历投递成功',
                        data: newApplication
                    });
                }
            }
            
            return next(new ErrorResponse('您已经投递过相关职位/帖子，请勿重复投递', 400));
        }
        
        return next(err);
    }
});

// @desc    检查用户是否已投递过某个帖子
// @route   GET /api/v1/applications/check-applied/:postId
// @access  Private/User
exports.checkApplied = asyncHandler(async (req, res, next) => {
    const postId = req.params.postId;
    
    // 检查是否已经投递过
    const existingApplication = await Application.findOne({
        post: postId,
        applicant: req.user.id
    });
    
    res.status(200).json({
        success: true,
        applied: existingApplication ? true : false
    });
});

// @desc    更新所有uncertain和viewed状态的简历为pending_review状态
// @route   GET /api/v1/applications/update-all-status
// @access  Public
exports.updateAllStatus = async (req, res, next) => {
    try {
        console.log('收到更新所有状态请求');
        
        // 查找所有状态为viewed的应用
        const viewedApplications = await Application.find({ status: 'viewed' });
        console.log(`找到 ${viewedApplications.length} 个状态为viewed的应用`);
        
        // 更新为pending_review状态
        if (viewedApplications.length > 0) {
            for (const app of viewedApplications) {
                app.status = 'pending_review';
                app.statusUpdatedAt = new Date();
                await app.save();
                console.log(`已更新应用ID: ${app._id}, 新状态: pending_review`);
            }
        }
        
        // 查找所有状态为uncertain的应用
        const uncertainApplications = await Application.find({ status: 'uncertain' });
        console.log(`找到 ${uncertainApplications.length} 个状态为uncertain的应用`);
        
        // 更新为pending_review状态
        if (uncertainApplications.length > 0) {
            for (const app of uncertainApplications) {
                app.status = 'pending_review';
                app.statusUpdatedAt = new Date();
                await app.save();
                console.log(`已更新应用ID: ${app._id}, 新状态: pending_review`);
            }
        }
        
        res.status(200).json({
            success: true,
            message: `已更新 ${viewedApplications.length + uncertainApplications.length} 个应用状态`,
            viewedCount: viewedApplications.length,
            uncertainCount: uncertainApplications.length
        });
    } catch (error) {
        console.error('更新应用状态失败:', error);
        res.status(500).json({
            success: false,
            message: '更新应用状态失败',
            error: error.message
        });
    }
};

// @desc    将简历标记为待复筛
// @route   PUT /api/v1/applications/:id/mark-for-review
// @access  Private/HR
exports.markForReview = asyncHandler(async (req, res, next) => {
    let application = await Application.findById(req.params.id);

    if (!application) {
        return next(new ErrorResponse(`申请ID ${req.params.id} 不存在`, 404));
    }

    // 更新状态为pending_review
    application = await Application.findByIdAndUpdate(
        req.params.id,
        { status: 'pending_review', statusUpdatedAt: new Date() },
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        data: application
    });
});

// @desc    发送面试邀请
// @route   POST /api/v1/applications/:id/interview-invitation
// @access  Private/HR
exports.sendInterviewInvitation = asyncHandler(async (req, res, next) => {
    const { message, location, interviewType, proposedTime, meetingLink } = req.body;
    
    // 查找申请记录
    let application = await Application.findById(req.params.id)
        .populate('applicant', 'name email')
        .populate('post', 'title')
        .populate('job', 'title');
    
    if (!application) {
        return next(new ErrorResponse(`申请ID ${req.params.id} 不存在`, 404));
    }
    
    // 检查是否是合适的候选人
    if (application.status !== 'suitable') {
        return next(new ErrorResponse('只能向状态为"合适"的候选人发送面试邀请', 400));
    }
    
    // 验证提议的面试时间是否有效
    const proposedTimeArray = Array.isArray(proposedTime) ? proposedTime : [proposedTime];
    const validTimes = proposedTimeArray.filter(time => new Date(time) > new Date());
    
    if (validTimes.length === 0) {
        return next(new ErrorResponse('请提供至少一个有效的面试时间', 400));
    }
    
    // 更新申请记录
    application = await Application.findByIdAndUpdate(
        req.params.id,
        {
            interviewStatus: 'invited',
            interviewInvitation: {
                sentAt: new Date(),
                message,
                location,
                interviewType,
                proposedTime: validTimes,
                meetingLink
            }
        },
        { new: true, runValidators: true }
    );
    
    // TODO: 发送邮件通知求职者
    
    res.status(200).json({
        success: true,
        data: application
    });
});

// @desc    更新面试状态
// @route   PUT /api/v1/applications/:id/interview-status
// @access  Private/HR
exports.updateInterviewStatus = asyncHandler(async (req, res, next) => {
    const { interviewStatus, confirmedTime } = req.body;
    
    // 查找申请记录
    let application = await Application.findById(req.params.id);
    
    if (!application) {
        return next(new ErrorResponse(`申请ID ${req.params.id} 不存在`, 404));
    }
    
    // 如果更新为已安排，则需要确认时间
    if (interviewStatus === 'scheduled' && !confirmedTime) {
        return next(new ErrorResponse('请提供确认的面试时间', 400));
    }
    
    // 更新字段
    const updateData = { interviewStatus };
    
    // 如果有确认时间，更新确认时间
    if (confirmedTime) {
        updateData['interviewInvitation.confirmedTime'] = new Date(confirmedTime);
    }
    
    // 更新申请记录
    application = await Application.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
    );
    
    res.status(200).json({
        success: true,
        data: application
    });
});

// @desc    获取待面试的候选人列表
// @route   GET /api/v1/applications/interviews
// @access  Private/HR
exports.getInterviewCandidates = asyncHandler(async (req, res, next) => {
    const { postId, interviewStatus } = req.query;
    
    // 构建查询条件
    const query = {
        status: 'suitable' // 只获取状态为"合适"的候选人
    };
    
    // 添加HR权限检查
    const hrConditions = [
        { hrUser: req.user.id }  // 社区投递
    ];

    // 获取HR发布的所有职位ID
    const jobIds = await Job.find({ postedBy: req.user.id }).select('_id');
    if (jobIds.length > 0) {
        hrConditions.push({ job: { $in: jobIds } });  // 职位投递
    }

    // 获取HR发布的所有帖子ID
    const postIds = await Post.find({ author: req.user.id }).select('_id');
    if (postIds.length > 0) {
        hrConditions.push({ post: { $in: postIds } });  // 帖子投递
    }

    // 添加HR权限条件
    query.$or = hrConditions;
    
    // 如果指定了帖子ID，添加帖子筛选
    if (postId) {
        query.post = postId;
    }
    
    // 如果指定了面试状态，添加面试状态筛选
    if (interviewStatus) {
        query.interviewStatus = interviewStatus;
    }
    
    // 查询符合条件的申请
    const applications = await Application.find(query)
        .populate({
            path: 'applicant',
            select: 'name email phone education experience'
        })
        .populate('resume')
        .populate('job', 'title company location type')
        .populate({
            path: 'post',
            select: 'title content'
        })
        .sort('-statusUpdatedAt');
    
    res.status(200).json({
        success: true,
        count: applications.length,
        data: applications
    });
});

// @desc    批量导出简历
// @route   POST /api/v1/applications/export-resumes
// @access  Private/HR
exports.exportResumes = asyncHandler(async (req, res, next) => {
    const { applicationIds, postId } = req.body;
    
    // 构建查询条件
    let query = {
        status: 'suitable' // 只导出状态为"合适"的候选人简历
    };
    
    // 如果提供了applicationIds，则按ID筛选
    if (applicationIds && applicationIds.length > 0) {
        query._id = { $in: applicationIds };
    }
    
    // 如果提供了postId，则按帖子筛选
    if (postId) {
        query.post = postId;
    }
    
    // 添加HR权限检查
    const hrConditions = [
        { hrUser: req.user.id }  // 社区投递
    ];

    // 获取HR发布的所有职位ID
    const jobIds = await Job.find({ postedBy: req.user.id }).select('_id');
    if (jobIds.length > 0) {
        hrConditions.push({ job: { $in: jobIds } });  // 职位投递
    }

    // 获取HR发布的所有帖子ID
    const postIds = await Post.find({ author: req.user.id }).select('_id');
    if (postIds.length > 0) {
        hrConditions.push({ post: { $in: postIds } });  // 帖子投递
    }

    // 添加HR权限条件
    query.$or = hrConditions;
    
    // 查询符合条件的申请
    const applications = await Application.find(query)
        .populate({
            path: 'applicant',
            select: 'name email phone education experience'
        })
        .populate('resume')
        .populate('job', 'title company location type')
        .populate({
            path: 'post',
            select: 'title content'
        });
    
    if (applications.length === 0) {
        return next(new ErrorResponse('没有找到符合条件的简历', 404));
    }
    
    // TODO: 实现实际的简历导出功能，可能需要生成ZIP文件或其他格式
    // 这里只返回简历信息列表
    
    res.status(200).json({
        success: true,
        count: applications.length,
        data: applications.map(app => ({
            id: app._id,
            applicantName: app.applicant ? app.applicant.name : '未知姓名',
            applicantEmail: app.applicant ? app.applicant.email : '未知邮箱',
            resumeId: app.resume ? app.resume._id : null,
            resumeFilename: app.resume ? app.resume.filename : null,
            position: app.post ? app.post.title : (app.job ? app.job.title : '未知职位'),
            applicationDate: app.createdAt
        }))
    });
});