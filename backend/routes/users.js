const express = require('express');
const router = express.Router();
const JobSeeker = require('../models/JobSeeker');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// 获取用户资料
router.get('/:userId/profile', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await JobSeeker.findById(userId)
            .select('name nickname email avatar followers following createdAt');
            
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 计算关注数和粉丝数
        const userData = {
            _id: user._id,
            name: user.name,
            nickname: user.nickname,
            email: user.email,
            avatar: user.avatar,
            followerCount: user.followers ? user.followers.length : 0,
            followingCount: user.following ? user.following.length : 0,
            createdAt: user.createdAt,
            isFollowing: user.followers.some(f => f.toString() === req.user._id.toString()) // 当前用户是否关注了该用户
        };

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('获取用户资料失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户资料失败'
        });
    }
});

// 关注用户
router.post('/:userId/follow', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (userId === currentUserId.toString()) {
            return res.status(400).json({
                success: false,
                message: '不能关注自己'
            });
        }

        const userToFollow = await JobSeeker.findById(userId);
        const currentUser = await JobSeeker.findById(currentUserId);

        if (!userToFollow) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 检查是否已经关注
        if (userToFollow.followers.includes(currentUserId)) {
            return res.status(400).json({
                success: false,
                message: '已经关注了该用户'
            });
        }

        // 添加关注关系
        userToFollow.followers.push(currentUserId);
        currentUser.following.push(userId);

        await userToFollow.save();
        await currentUser.save();

        // 尝试创建通知，但不影响主要的关注操作
        try {
            await Notification.create({
                user: userId, // 被关注的用户
                fromUser: currentUserId, // 关注者
                type: 'follow',
                isRead: false
            });
        } catch (notificationError) {
            console.error('创建关注通知失败:', notificationError);
            // 通知创建失败不影响关注操作的成功
        }

        res.json({
            success: true,
            message: '关注成功',
            data: {
                followerCount: userToFollow.followers.length,
                followingCount: currentUser.following.length
            }
        });
    } catch (error) {
        console.error('关注用户失败:', error);
        res.status(500).json({
            success: false,
            message: '关注失败'
        });
    }
});

// 取消关注用户
router.delete('/:userId/follow', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const userToUnfollow = await JobSeeker.findById(userId);
        const currentUser = await JobSeeker.findById(currentUserId);

        if (!userToUnfollow) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        // 移除关注关系
        userToUnfollow.followers = userToUnfollow.followers.filter(
            id => id.toString() !== currentUserId.toString()
        );
        currentUser.following = currentUser.following.filter(
            id => id.toString() !== userId
        );

        await userToUnfollow.save();
        await currentUser.save();

        res.json({
            success: true,
            message: '取消关注成功',
            data: {
                followerCount: userToUnfollow.followers.length,
                followingCount: currentUser.following.length
            }
        });
    } catch (error) {
        console.error('取消关注失败:', error);
        res.status(500).json({
            success: false,
            message: '取消关注失败'
        });
    }
});

// 获取用户的帖子
router.get('/:userId/posts', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const posts = await Post.find({ author: userId })
            .sort('-createdAt')
            .populate('author', 'name nickname avatar');

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('获取用户帖子失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户帖子失败'
        });
    }
});

// 获取用户的收藏
router.get('/:userId/favorites', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const posts = await Post.find({ favorites: userId })
            .sort('-createdAt')
            .populate('author', 'name nickname avatar');

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('获取用户收藏失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户收藏失败'
        });
    }
});

// 获取用户的点赞
router.get('/:userId/likes', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const posts = await Post.find({ likes: userId })
            .sort('-createdAt')
            .populate('author', 'name nickname avatar');

        res.json({
            success: true,
            data: posts
        });
    } catch (error) {
        console.error('获取用户点赞失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户点赞失败'
        });
    }
});

module.exports = router; 