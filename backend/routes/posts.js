const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadToFirebase } = require('../utils/firebaseStorage');
const Notification = require('../models/Notification');
const PostViewLog = require('../models/PostViewLog');
const mongoose = require('mongoose');

// 配置 multer 为内存存储
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 9);

// 获取所有帖子（需登录）
router.get('/', protect, async (req, res) => {
    try {
        const posts = await Post.find()
            .sort('-createdAt')
            .lean(); // 使用 lean() 以便添加自定义字段

        // 为每个帖子填充作者信息和计算评论数
        for (let post of posts) {
            try {
                // 根据authorType选择正确的模型填充作者信息
                if (post.authorType === 'HRUser') {
                    const author = await mongoose.model('HRUser').findById(post.author).select('name avatar').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'hr'
                        };
                    } else {
                        post.author = { name: '未知用户', userType: 'hr' };
                    }
                } else {
                    const author = await mongoose.model('JobSeeker').findById(post.author).select('nickname name avatar').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'jobseeker'
                        };
                    } else {
                        post.author = { name: '未知用户', userType: 'jobseeker' };
                    }
                }

                // 计算评论数
                const commentCount = await Comment.countDocuments({ post: post._id });
                post.totalCommentsCount = commentCount;
            } catch (authorError) {
                console.error('获取作者信息失败:', authorError);
                post.author = { name: '未知用户' };
                post.totalCommentsCount = 0;
            }
        }

        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('获取帖子列表失败:', error);
        res.status(500).json({ success: false, message: '获取帖子列表失败' });
    }
});

// 创建帖子（需登录）
router.post('/', protect, async (req, res) => {
    upload(req, res, async function(err) {
        try {
            if (err) {
                console.error('文件上传错误:', err);
                return res.status(400).json({ 
                    success: false, 
                    message: err.code === 'LIMIT_FILE_SIZE' ? '文件大小不能超过5MB' : '文件上传失败'
                });
            }
            
            // 检查是否上传了图片
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: '请至少上传一张图片' });
            }
            
            // 上传图片到 Firebase Storage
            const imageUrls = await Promise.all(
                req.files.map(file => 
                    uploadToFirebase(file.buffer, file.originalname, 'community-posts')
                )
            );
            
            const { title, content, category, tags } = req.body;
            
            // 验证必填字段
            if (!title || !content) {
                return res.status(400).json({ success: false, message: '标题和内容不能为空' });
            }
            
            // 获取用户类型
            const authorType = req.user.role === 'hr' ? 'HRUser' : 'JobSeeker';
            
            // 创建帖子
            const post = await Post.create({
                title,
                content,
                author: req.user._id,
                authorType,
                category: category || 'other',
                tags: tags ? JSON.parse(tags) : [],
                images: imageUrls
            });

            res.status(201).json({
                success: true,
                data: post
            });
        } catch (error) {
            console.error('创建帖子失败:', error);
            res.status(500).json({ success: false, message: '创建帖子失败' });
        }
    });
});

// 点赞帖子
router.post('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });
        
        const userId = req.user._id;
        const userRole = req.user.role;
        const userType = req.user.constructor.modelName;
        
        console.log('[like] 用户点赞帖子:', {
            postId: req.params.id,
            userId: userId.toString(),
            userObjectId: new mongoose.Types.ObjectId(userId).toString(),
            userRole: userRole,
            userType: userType,
            isHR: userRole === 'hr',
            authMethod: req.authMethod || '未知' // 记录授权方法
        });
        
        // 确保使用ObjectId类型比较
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // 检查是否已经点赞 - 使用字符串比较更可靠
        const alreadyLiked = post.likes.some(id => id.toString() === userObjectId.toString());
        
        if (!alreadyLiked) {
            // 确保使用ObjectId类型
            post.likes.push(userObjectId);
            await post.save();
            console.log('[like] 点赞成功添加, 当前点赞列表:', post.likes.map(id => id.toString()));
            
            // 生成通知
            if (post.author.toString() !== userId.toString()) {
                await Notification.create({
                    user: post.author,
                    type: 'like',
                    post: post._id,
                    fromUser: userId
                });
                console.log('[like] 通知已创建');
            }
        } else {
            console.log('[like] 用户已经点赞过该帖子');
        }
        
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('[like] 点赞失败:', error);
        res.status(500).json({ success: false, message: '点赞操作失败', error: error.message });
    }
});

// 取消点赞
router.post('/:id/unlike', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });
        
        const userId = req.user._id;
        const userRole = req.user.role;
        const userType = req.user.constructor.modelName;
        
        console.log('[unlike] 用户取消点赞:', {
            postId: req.params.id,
            userId: userId.toString(),
            userObjectId: new mongoose.Types.ObjectId(userId).toString(),
            userRole: userRole,
            userType: userType,
            isHR: userRole === 'hr'
        });
        
        // 使用字符串比较过滤
        const beforeCount = post.likes.length;
        post.likes = post.likes.filter(id => id.toString() !== userId.toString());
        const afterCount = post.likes.length;
        
        await post.save();
        console.log('[unlike] 点赞已移除, 移除前数量:', beforeCount, '移除后数量:', afterCount);
        
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('[unlike] 取消点赞失败:', error);
        res.status(500).json({ success: false, message: '取消点赞操作失败', error: error.message });
    }
});

// 收藏帖子
router.post('/:id/favorite', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });
        
        const userId = req.user._id;
        const userRole = req.user.role;
        const userType = req.user.constructor.modelName;
        
        console.log('[favorite] 用户收藏帖子:', {
            postId: req.params.id,
            userId: userId.toString(),
            userObjectId: new mongoose.Types.ObjectId(userId).toString(),
            userRole: userRole,
            userType: userType,
            isHR: userRole === 'hr',
            authMethod: req.authMethod || '未知' // 记录授权方法
        });
        
        // 确保使用ObjectId类型比较
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // 检查是否已经收藏 - 使用字符串比较更可靠
        const alreadyFavorited = post.favorites.some(id => id.toString() === userObjectId.toString());
        
        if (!alreadyFavorited) {
            // 确保使用ObjectId类型
            post.favorites.push(userObjectId);
            await post.save();
            console.log('[favorite] 收藏成功添加, 当前收藏列表:', post.favorites.map(id => id.toString()));
            
            // 生成通知
            if (post.author.toString() !== userId.toString()) {
                await Notification.create({
                    user: post.author,
                    type: 'favorite',
                    post: post._id,
                    fromUser: userId
                });
                console.log('[favorite] 通知已创建');
            }
        } else {
            console.log('[favorite] 用户已经收藏过该帖子');
        }
        
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('[favorite] 收藏失败:', error);
        res.status(500).json({ success: false, message: '收藏操作失败', error: error.message });
    }
});

// 取消收藏
router.post('/:id/unfavorite', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });
        
        const userId = req.user._id;
        const userRole = req.user.role;
        const userType = req.user.constructor.modelName;
        
        console.log('[unfavorite] 用户取消收藏:', {
            postId: req.params.id,
            userId: userId.toString(),
            userObjectId: new mongoose.Types.ObjectId(userId).toString(),
            userRole: userRole,
            userType: userType,
            isHR: userRole === 'hr'
        });
        
        // 使用字符串比较过滤
        const beforeCount = post.favorites.length;
        post.favorites = post.favorites.filter(id => id.toString() !== userId.toString());
        const afterCount = post.favorites.length;
        
        await post.save();
        console.log('[unfavorite] 收藏已移除, 移除前数量:', beforeCount, '移除后数量:', afterCount);
        
        res.json({ success: true, data: post });
    } catch (error) {
        console.error('[unfavorite] 取消收藏失败:', error);
        res.status(500).json({ success: false, message: '取消收藏操作失败', error: error.message });
    }
});

// 获取当前用户收到的通知（按时间倒序）
router.get('/notifications/list', protect, async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .populate('fromUser', 'name nickname avatar')
        .populate('post', 'title')
        .sort('-createdAt');
    res.json({ success: true, data: notifications });
});

// 获取未读通知数量
router.get('/notifications/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });
        res.json({ success: true, data: count });
    } catch (error) {
        console.error('获取未读通知数量失败:', error);
        res.status(500).json({ success: false, message: '获取未读通知数量失败' });
    }
});

// 标记所有通知为已读
router.post('/notifications/mark-read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('标记通知为已读失败:', error);
        res.status(500).json({ success: false, message: '标记通知为已读失败' });
    }
});

// 增加真实浏览量，防刷
router.post('/:id/view', async (req, res) => {
    const postId = req.params.id;
    const userId = req.user ? req.user._id : null;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = new Date();
    const THRESHOLD = 60 * 1000; // 60秒内只计一次

    let logQuery = { post: postId };
    if (userId) {
        logQuery.user = userId;
    } else {
        logQuery.ip = ip;
    }
    let log = await PostViewLog.findOne(logQuery);
    let shouldIncrease = false;
    if (!log) {
        shouldIncrease = true;
        log = new PostViewLog({ ...logQuery, lastView: now });
    } else {
        if (now - log.lastView > THRESHOLD) {
            shouldIncrease = true;
            log.lastView = now;
        }
    }
    // 日志输出
    console.log('[VIEW]', {
        postId,
        userId,
        ip,
        now,
        log_lastView: log.lastView,
        shouldIncrease
    });
    if (shouldIncrease) {
        await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
    }
    await log.save();
    const post = await Post.findById(postId);
    console.log('[VIEW_RESULT]', { postId, views: post.views });
    if (!post) return res.status(404).json({ success: false, message: '帖子不存在' });
    res.json({ success: true, views: post.views });
});

// 获取我的收藏帖子
router.get('/my-favorites', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.constructor.modelName;
        const userRole = req.user.role;
        
        console.log('[my-favorites] 开始获取收藏 - 详细信息:', {
            userId: userId.toString(),
            userType: userType,
            name: req.user.name || req.user.nickname,
            role: userRole,
            isHR: userRole === 'hr'
        });

        // 确保 userId 是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('[my-favorites] 无效的用户ID:', userId);
            return res.status(400).json({ success: false, message: '无效的用户ID' });
        }

        // 确保使用正确的ObjectId
        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
            console.log('[my-favorites] 成功转换用户ID为ObjectId:', userObjectId.toString());
        } catch (err) {
            console.error('[my-favorites] ObjectId转换失败:', err);
            return res.status(400).json({ success: false, message: '无效的用户ID格式' });
        }
        
        // 直接使用MongoDB查询，使用$in操作符查找包含用户ID的帖子
        const posts = await Post.find({
            'favorites': { $in: [userObjectId] }
        }).sort('-createdAt').lean();
            
        console.log('[my-favorites] 查询结果:', {
            postsFound: posts.length,
            postIds: posts.map(p => p._id),
            userIdToMatch: userObjectId.toString()
        });

        // 为每个帖子填充作者信息
        for (let post of posts) {
            try {
                if (post.authorType === 'HRUser') {
                    const author = await mongoose.model('HRUser').findById(post.author).select('name avatar').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'hr'
                        };
                    } else {
                        post.author = { name: '未知HR', userType: 'hr' };
                    }
                } else {
                    const author = await mongoose.model('JobSeeker').findById(post.author).select('nickname avatar name').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'jobseeker'
                        };
                    } else {
                        post.author = { name: '未知用户', userType: 'jobseeker' };
                    }
                }

                // 计算评论数
                const commentCount = await Comment.countDocuments({ post: post._id });
                post.totalCommentsCount = commentCount;
            } catch (error) {
                console.error('[my-favorites] 处理帖子时出错:', error);
                post.author = { name: '未知用户' };
                post.totalCommentsCount = 0;
            }
        }

        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('[my-favorites] 错误详情:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?._id.toString(),
            userType: req.user?.constructor.modelName
        });
        res.status(500).json({ 
            success: false, 
            message: '获取收藏失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 获取我点赞的帖子
router.get('/my-likes', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.constructor.modelName;
        const userRole = req.user.role;
        
        console.log('[my-likes] 开始获取点赞 - 详细信息:', {
            userId: userId.toString(),
            userType: userType,
            name: req.user.name || req.user.nickname,
            role: userRole,
            isHR: userRole === 'hr'
        });

        // 确保 userId 是有效的 ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('[my-likes] 无效的用户ID:', userId);
            return res.status(400).json({ success: false, message: '无效的用户ID' });
        }

        // 确保使用正确的ObjectId
        let userObjectId;
        try {
            userObjectId = new mongoose.Types.ObjectId(userId);
            console.log('[my-likes] 成功转换用户ID为ObjectId:', userObjectId.toString());
        } catch (err) {
            console.error('[my-likes] ObjectId转换失败:', err);
            return res.status(400).json({ success: false, message: '无效的用户ID格式' });
        }
        
        // 直接使用MongoDB查询，使用$in操作符查找包含用户ID的帖子
        const posts = await Post.find({
            'likes': { $in: [userObjectId] }
        }).sort('-createdAt').lean();
            
        console.log('[my-likes] 查询结果:', {
            postsFound: posts.length,
            postIds: posts.map(p => p._id),
            userIdToMatch: userObjectId.toString()
        });

        // 为每个帖子填充作者信息
        for (let post of posts) {
            try {
                if (post.authorType === 'HRUser') {
                    const author = await mongoose.model('HRUser').findById(post.author).select('name avatar').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'hr'
                        };
                    } else {
                        post.author = { name: '未知HR', userType: 'hr' };
                    }
                } else {
                    const author = await mongoose.model('JobSeeker').findById(post.author).select('nickname avatar name').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'jobseeker'
                        };
                    } else {
                        post.author = { name: '未知用户', userType: 'jobseeker' };
                    }
                }

                // 计算评论数
                const commentCount = await Comment.countDocuments({ post: post._id });
                post.totalCommentsCount = commentCount;
            } catch (error) {
                console.error('[my-likes] 处理帖子时出错:', error);
                post.author = { name: '未知用户' };
                post.totalCommentsCount = 0;
            }
        }

        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('[my-likes] 错误详情:', {
            message: error.message,
            stack: error.stack,
            userId: req.user?._id.toString(),
            userType: req.user?.constructor.modelName
        });
        res.status(500).json({ 
            success: false, 
            message: '获取点赞失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// 获取我的帖子
router.get('/my-posts', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.constructor.modelName;
        
        console.log('[my-posts] 开始获取我的帖子 - 用户信息:', {
            userId: userId,
            userType: userType,
            name: req.user.name || req.user.nickname
        });

        const posts = await Post.find({ author: userId })
            .sort('-createdAt')
            .lean();

        console.log('[my-posts] 找到帖子数量:', posts.length);

        // 根据用户类型选择正确的填充模型
        for (let post of posts) {
            try {
                if (userType === 'HRUser') { // HR用户
                    const author = await mongoose.model('HRUser').findById(userId).select('name avatar').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'hr'
                        };
                    } else {
                        post.author = { name: '未知HR', userType: 'hr' };
                    }
                } else { // JobSeeker用户
                    const author = await mongoose.model('JobSeeker').findById(userId).select('nickname name avatar').lean();
                    if (author) {
                        post.author = {
                            ...author,
                            userType: 'jobseeker'
                        };
                    } else {
                        post.author = { name: '未知用户', userType: 'jobseeker' };
                    }
                }
                
                // 计算评论数
                const commentCount = await Comment.countDocuments({ post: post._id });
                post.totalCommentsCount = commentCount;
            } catch (error) {
                console.error('[my-posts] 处理帖子时出错:', error);
                post.author = { name: '未知用户' };
                post.totalCommentsCount = 0;
            }
        }

        res.json({ success: true, data: posts });
    } catch (error) {
        console.error('[my-posts] 获取我的帖子失败:', error);
        res.status(500).json({ success: false, message: '获取我的帖子失败' });
    }
});

// 获取单个帖子
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate({
                path: 'author',
                select: 'nickname avatar name',
                model: 'JobSeeker'
            })
            .lean(); // 使用 lean() 以便添加自定义字段
            
        if (!post) {
            return res.status(404).json({ success: false, message: '帖子不存在' });
        }

        // 计算总评论数
        const commentCount = await Comment.countDocuments({ post: post._id });
        post.totalCommentsCount = commentCount; // 包括所有回复

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('获取帖子详情失败:', error);
        res.status(500).json({ success: false, message: '获取帖子详情失败' });
    }
});

// 编辑帖子
router.put('/:id', protect, async (req, res) => {
    upload(req, res, async function(err) {
        try {
            if (err) {
                console.error('文件上传错误:', err);
                return res.status(400).json({ 
                    success: false, 
                    message: err.code === 'LIMIT_FILE_SIZE' ? '文件大小不能超过5MB' : '文件上传失败'
                });
            }

            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ success: false, message: '帖子不存在' });
            }

            // 确保用户是帖子作者
            if (String(post.author) !== String(req.user._id)) {
                return res.status(403).json({ success: false, message: '无权编辑此帖子' });
            }

            // 更新帖子内容
            post.title = req.body.title;
            post.content = req.body.content;
            if (req.body.category) {
                post.category = req.body.category;
            }
            
            // 如果上传了新图片，上传到 Firebase Storage
            if (req.files && req.files.length > 0) {
                const imageUrls = await Promise.all(
                    req.files.map(file => 
                        uploadToFirebase(file.buffer, file.originalname, 'community-posts')
                    )
                );
                post.images = imageUrls;
            }

            await post.save();
            res.json({ success: true, data: post });
        } catch (error) {
            console.error('编辑帖子失败:', error);
            res.status(500).json({ success: false, message: '编辑帖子失败' });
        }
    });
});

// 删除帖子
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: '帖子不存在' });
        }

        // 确保用户是帖子作者
        if (String(post.author) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: '无权删除此帖子' });
        }

        // 删除相关的评论
        await Comment.deleteMany({ post: req.params.id });
        
        // 删除相关的通知
        await Notification.deleteMany({ post: req.params.id });
        
        // 删除帖子
        await Post.findByIdAndDelete(req.params.id);
        
        res.json({ success: true, message: '帖子已删除' });
    } catch (error) {
        console.error('删除帖子失败:', error);
        res.status(500).json({ success: false, message: '删除帖子失败' });
    }
});

// 辅助函数：递归填充评论的回复
async function populateReplies(comment) {
    if (!comment.replies || comment.replies.length === 0) {
        return comment;
    }

    const populatedReplies = [];
    for (const replyId of comment.replies) {
        const reply = await Comment.findById(replyId)
            .populate('user', 'name nickname avatar')
            .lean(); // 使用 .lean() 获取普通JS对象，便于修改
        if (reply) {
            const populatedReply = await populateReplies(reply); // 递归填充
            populatedReplies.push(populatedReply);
        }
    }
    comment.replies = populatedReplies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // 按创建时间升序排列回复
    return comment;
}

// 获取帖子的评论列表 (支持嵌套)
router.get('/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: '无效的帖子ID格式' });
        }

        const postExists = await Post.findById(postId);
        if (!postExists) {
            return res.status(404).json({ success: false, message: '帖子未找到' });
        }

        // 仅获取顶层评论 (parentId 为 null)
        const topLevelComments = await Comment.find({ post: postId, parentId: null })
            .populate('user', 'name nickname avatar')
            .sort({ createdAt: -1 }) // 顶层评论按最新时间倒序
            .lean(); // 使用 .lean() 获取普通JS对象

        const commentsWithReplies = [];
        for (const comment of topLevelComments) {
            const populatedComment = await populateReplies(comment);
            commentsWithReplies.push(populatedComment);
        }

        res.json({ success: true, data: commentsWithReplies });
    } catch (error) {
        console.error(`获取帖子 ${req.params.postId} 的评论失败:`, error);
        res.status(500).json({ success: false, message: '服务器内部错误，获取评论失败' });
    }
});

// 发表评论
router.post('/:postId/comments', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const { text, parentId } = req.body;
        
        console.log('发表评论/回复请求:', {
            postId,
            text,
            parentId,
            userId: req.user._id
        });
        
        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ success: false, message: '无效的帖子ID格式' });
        }
        if (!text || String(text).trim() === '') {
            return res.status(400).json({ success: false, message: '评论内容不能为空' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: '要评论的帖子未找到' });
        }

        let parentComment = null;
        let depth = 0;
        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                return res.status(400).json({ success: false, message: '无效的父评论ID格式' });
            }
            parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                return res.status(404).json({ success: false, message: '父评论未找到' });
            }
            depth = parentComment.depth + 1;
        }

        const newComment = new Comment({
            text: String(text).trim(),
            post: postId,
            user: req.user._id,
            parentId: parentId || null,
            depth: depth
        });

        await newComment.save();

        console.log('评论保存成功:', {
            commentId: newComment._id,
            postAuthorId: post.author.toString(),
            commentUserId: req.user._id.toString()
        });

        // 创建通知
        if (parentComment) {
            // 保存回复关系
            parentComment.replies.push(newComment._id);
            await parentComment.save();
            
            // 如果是回复评论，只通知被回复的评论作者（排除自己回复自己）
            if (parentComment.user.toString() !== req.user._id.toString()) {
                try {
                    await Notification.create({
                        user: parentComment.user, // 被回复的评论作者
                        fromUser: req.user._id,
                        type: 'reply',
                        post: postId,
                        comment: newComment._id,
                        isRead: false
                    });
                    console.log('创建回复通知成功');
                } catch (notifError) {
                    console.error('创建回复通知失败:', notifError);
                }
            }
        } else {
            // 保存评论到帖子
            post.comments.push(newComment._id);
            await post.save();
            
            // 如果是直接评论帖子，通知帖子作者（排除自己评论自己的帖子）
            if (post.author.toString() !== req.user._id.toString()) {
                try {
                    await Notification.create({
                        user: post.author, // 帖子作者
                        fromUser: req.user._id,
                        type: 'comment',
                        post: postId,
                        comment: newComment._id,
                        isRead: false
                    });
                    console.log('创建评论通知成功');
                } catch (notifError) {
                    console.error('创建评论通知失败:', notifError);
                }
            }
        }
        
        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'name nickname avatar');

        res.status(201).json({ success: true, message: '评论已成功发表', data: populatedComment });
    } catch (error) {
        console.error('发表评论/回复失败 - 详细错误:', {
            error: error.message,
            stack: error.stack,
            postId: req.params.postId,
            userId: req.user ? req.user._id : 'N/A',
            body: req.body
        });
        res.status(500).json({ 
            success: false, 
            message: '服务器内部错误，发表评论/回复失败',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 