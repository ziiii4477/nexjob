// 更新简历状态脚本
const mongoose = require('mongoose');
const Application = require('./backend/models/Application');

// 连接数据库
async function connectDB() {
    try {
        console.log('尝试连接到MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://your_atlas_uri', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 30000
        });
        console.log('MongoDB Atlas连接成功');
        return true;
    } catch (err) {
        console.log('MongoDB Atlas连接错误:', err);
        console.log('尝试连接本地MongoDB...');
        try {
            await mongoose.connect('mongodb://localhost:27017/nexjob', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000
            });
            console.log('本地MongoDB连接成功');
            return true;
        } catch (localErr) {
            console.log('本地MongoDB连接错误:', localErr);
            console.log('所有数据库连接尝试失败');
            return false;
        }
    }
}

async function updateApplications() {
    try {
        // 先连接数据库
        const connected = await connectDB();
        if (!connected) {
            console.error('无法连接到数据库，脚本终止');
            process.exit(1);
        }
        
        console.log('开始更新应用状态...');
        
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
            console.log('所有viewed应用状态已更新完成');
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
            console.log('所有uncertain应用状态已更新完成');
        }
        
        console.log('脚本执行完成');
        process.exit(0);
    } catch (error) {
        console.error('更新应用状态失败:', error);
        process.exit(1);
    }
}

updateApplications(); 