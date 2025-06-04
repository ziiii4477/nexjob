const express = require('express');
const router = express.Router();

// 更新所有uncertain和viewed状态的简历为pending_review状态
router.get('/', async (req, res) => {
    try {
        console.log('收到更新状态请求');
        const Application = require('../models/Application');
        
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
});

module.exports = router; 