const Job = require('../models/Job');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const JobSeeker = require('../models/JobSeeker');

// @desc    创建新职位
// @route   POST /api/v1/jobs
// @access  Private/HR
exports.createJob = asyncHandler(async (req, res, next) => {
    // 添加发布者ID
    req.body.postedBy = req.user.id;

    const job = await Job.create(req.body);

    res.status(201).json({
        success: true,
        data: job
    });
});

// @desc    获取所有职位
// @route   GET /api/v1/jobs
// @access  Public
exports.getJobs = async (req, res) => {
    try {
        console.log('Received search request with query:', req.query);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 构建查询条件
        const query = { status: 'active' };

        // 关键词搜索
        if (req.query.keyword && req.query.keyword.trim() !== '') {
            const keyword = req.query.keyword.trim();
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        // 地点筛选
        if (req.query.location && req.query.location !== '所有地点') {
            query.location = { $regex: req.query.location, $options: 'i' };
        }

        // 工作类型筛选
        if (req.query.type) {
            const types = req.query.type.split(',').filter(type => type.trim());
            if (types.length > 0) {
                query.type = { $in: types };
            }
        }

        // 经验要求筛选
        if (req.query.experience && req.query.experience !== '所有级别') {
            query.experience = req.query.experience;
        }

        // 薪资范围筛选
        if (req.query.minSalary || req.query.maxSalary) {
            query.salaryRange = {};
            if (req.query.minSalary) {
                query['salaryRange.min'] = { $gte: parseInt(req.query.minSalary) };
            }
            if (req.query.maxSalary) {
                query['salaryRange.max'] = { $lte: parseInt(req.query.maxSalary) };
            }
        }

        console.log('Final query:', JSON.stringify(query, null, 2));

        try {
            // 获取总数
            const total = await Job.countDocuments(query);
            console.log('Total matching jobs:', total);

            // 执行查询
            const jobs = await Job.find(query)
                .populate('postedBy', 'name company')
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean();

            console.log(`Found ${jobs.length} jobs for page ${page}`);

            // 处理职位数据
            const processedJobs = jobs.map(job => ({
                _id: job._id,
                title: job.title,
                type: job.type,
                location: job.location,
                salary: `${job.salaryRange.min}-${job.salaryRange.max}`,
                experience: job.experience,
                description: job.description,
                requirements: job.requirements,
                company: job.postedBy ? {
                    name: job.postedBy.company ? job.postedBy.company.name : '未知公司',
                    logo: job.postedBy.company ? job.postedBy.company.logo : null
                } : {
                    name: '未知公司',
                    logo: null
                },
                createdAt: job.createdAt,
                updatedAt: job.updatedAt
            }));

            res.status(200).json({
                success: true,
                total,
                data: processedJobs,
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                hasMore: total > (skip + jobs.length)
            });
        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            throw new Error('数据库操作失败');
        }

    } catch (error) {
        console.error('获取职位列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取职位列表失败',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    获取HR的所有职位
// @route   GET /api/v1/jobs/my
// @access  Private/HR
exports.getMyJobs = asyncHandler(async (req, res, next) => {
    const jobs = await Job.find({ postedBy: req.user.id })
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
    });
});

// @desc    获取单个职位
// @route   GET /api/v1/jobs/:id
// @access  Public
exports.getJob = asyncHandler(async (req, res, next) => {
    const job = await Job.findById(req.params.id)
        .populate('postedBy', 'name company');

    if (!job) {
        return next(new ErrorResponse(`职位ID ${req.params.id} 不存在`, 404));
    }

    res.status(200).json({
        success: true,
        data: job
    });
});

// @desc    更新职位
// @route   PUT /api/v1/jobs/:id
// @access  Private/HR
exports.updateJob = asyncHandler(async (req, res, next) => {
    let job = await Job.findById(req.params.id);

    if (!job) {
        return next(new ErrorResponse(`职位ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户是职位发布者
    if (job.postedBy.toString() !== req.user.id) {
        return next(new ErrorResponse('未经授权的操作', 401));
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: job
    });
});

// @desc    删除职位
// @route   DELETE /api/v1/jobs/:id
// @access  Private/HR
exports.deleteJob = asyncHandler(async (req, res, next) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        return next(new ErrorResponse(`职位ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户是职位发布者
    if (job.postedBy.toString() !== req.user.id) {
        return next(new ErrorResponse('未经授权的操作', 401));
    }

    await job.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    获取HR的职位统计信息
// @route   GET /api/v1/jobs/statistics
// @access  Private/HR
exports.getJobStatistics = asyncHandler(async (req, res, next) => {
    const totalJobs = await Job.countDocuments({ postedBy: req.user.id });
    const activeJobs = await Job.countDocuments({ 
        postedBy: req.user.id,
        status: 'active'
    });
    
    // TODO: 实现申请统计
    const totalApplications = 0;

    res.status(200).json({
        success: true,
        data: {
            totalJobs,
            activeJobs,
            totalApplications
        }
    });
});

// @desc    收藏/取消收藏职位
// @route   POST /api/v1/jobs/:id/favorite
// @access  Private/User
exports.toggleFavorite = asyncHandler(async (req, res, next) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
        return next(new ErrorResponse(`职位ID ${req.params.id} 不存在`, 404));
    }

    // 检查用户是否已经收藏了这个职位
    const user = await JobSeeker.findById(req.user.id);
    const isFavorited = user.favoriteJobs.includes(job._id);

    if (isFavorited) {
        // 取消收藏
        user.favoriteJobs = user.favoriteJobs.filter(
            jobId => jobId.toString() !== job._id.toString()
        );
    } else {
        // 添加收藏
        user.favoriteJobs.push(job._id);
    }

    await user.save();

    res.status(200).json({
        success: true,
        isFavorited: !isFavorited
    });
}); 