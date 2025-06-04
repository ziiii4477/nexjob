const Post = require('../models/Post');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    获取所有帖子
// @route   GET /api/hr/posts
// @access  Private
exports.getPosts = asyncHandler(async (req, res, next) => {
    const posts = await Post.find({ author: req.user.id })
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: posts.length,
        data: posts
    });
});

// @desc    获取单个帖子
// @route   GET /api/hr/posts/:id
// @access  Private
exports.getPost = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse(`帖子ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户是帖子作者
    if (post.author.toString() !== req.user.id) {
        return next(new ErrorResponse('未授权访问此帖子', 401));
    }

    res.status(200).json({
        success: true,
        data: post
    });
});

// @desc    创建帖子
// @route   POST /api/hr/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
    // 添加作者到请求体
    req.body.author = req.user.id;
    req.body.authorType = req.user.role;

    // 只有 HR 用户可以设置 quickApply 和 aiInterview
    if (req.user.role !== 'HRUser') {
        req.body.quickApply = false;
        req.body.aiInterview = false;
    } else {
        // 将字符串"true"/"false"转换为布尔值
        req.body.quickApply = String(req.body.quickApply).toLowerCase() === 'true';
        req.body.aiInterview = String(req.body.aiInterview).toLowerCase() === 'true';
    }

    const post = await Post.create(req.body);

    res.status(201).json({
        success: true,
        data: post
    });
});

// @desc    更新帖子
// @route   PUT /api/hr/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
    let post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse(`帖子ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户是帖子作者
    if (post.author.toString() !== req.user.id) {
        return next(new ErrorResponse('未授权修改此帖子', 401));
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: post
    });
});

// @desc    删除帖子
// @route   DELETE /api/hr/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse(`帖子ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户是帖子作者
    if (post.author.toString() !== req.user.id) {
        return next(new ErrorResponse('未授权删除此帖子', 401));
    }

    await post.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    更新帖子状态
// @route   PUT /api/hr/posts/:id/status
// @access  Private
exports.updatePostStatus = asyncHandler(async (req, res, next) => {
    const { status } = req.body;

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
        return next(new ErrorResponse('请提供有效的状态', 400));
    }

    let post = await Post.findById(req.params.id);

    if (!post) {
        return next(new ErrorResponse(`帖子ID ${req.params.id} 不存在`, 404));
    }

    // 确保用户是帖子作者
    if (post.author.toString() !== req.user.id) {
        return next(new ErrorResponse('未授权修改此帖子状态', 401));
    }

    post = await Post.findByIdAndUpdate(
        req.params.id,
        { status },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        data: post
    });
}); 