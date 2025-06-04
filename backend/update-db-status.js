const mongoose = require('mongoose');
require('dotenv').config();

// 默认JWT密钥
const DEFAULT_MONGODB_URI = 'mongodb+srv://nexjob:nexjob2024@cluster0.ykiutqy.mongodb.net/nexjob?retryWrites=true&w=majority';

// 获取MongoDB URI
const getMongoURI = () => {
    return process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
};

// 连接数据库
mongoose.connect(getMongoURI(), {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB连接成功');
    updateApplicationStatus();
}).catch(err => {
    console.error('MongoDB连接失败:', err);
    process.exit(1);
});

// 定义Application模型
const ApplicationSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.ObjectId,
        ref: 'Job',
        required: function() {
            return !this.post;
        },
        default: null
    },
    post: {
        type: mongoose.Schema.ObjectId,
        ref: 'Post',
        required: function() {
            return !this.job;
        },
        default: null
    },
    applicant: {
        type: mongoose.Schema.ObjectId,
        ref: 'JobSeeker',
        required: true
    },
    resume: {
        type: mongoose.Schema.ObjectId,
        ref: 'Resume',
        required: true
    },
    status: {
        type: String,
        enum: ['suitable', 'unsuitable', 'uncertain', 'pending_review', 'viewed'],
        default: 'uncertain'
    },
    statusUpdatedAt: {
        type: Date,
        default: Date.now
    },
    coverLetter: {
        type: String,
        maxlength: [1000, '求职信不能超过1000个字符']
    },
    fromCommunity: {
        type: Boolean,
        default: false
    },
    hrUser: {
        type: mongoose.Schema.ObjectId,
        ref: 'HRUser'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Application = mongoose.model('Application', ApplicationSchema);

// 更新应用状态
async function updateApplicationStatus() {
    try {
        console.log('开始更新应用状态...');
        
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
            console.log(`成功更新 ${uncertainApplications.length} 个uncertain应用的状态`);
        } else {
            console.log('没有找到需要更新的uncertain应用');
        }
        
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
            console.log(`成功更新 ${viewedApplications.length} 个viewed应用的状态`);
        } else {
            console.log('没有找到需要更新的viewed应用');
        }
        
        // 查找所有状态为pending的应用
        const pendingApplications = await Application.find({ status: 'pending' });
        console.log(`找到 ${pendingApplications.length} 个状态为pending的应用`);
        
        // 更新为pending_review状态
        if (pendingApplications.length > 0) {
            for (const app of pendingApplications) {
                app.status = 'pending_review';
                app.statusUpdatedAt = new Date();
                await app.save();
                console.log(`已更新应用ID: ${app._id}, 新状态: pending_review`);
            }
            console.log(`成功更新 ${pendingApplications.length} 个pending应用的状态`);
        } else {
            console.log('没有找到需要更新的pending应用');
        }
        
        // 断开数据库连接
        mongoose.disconnect();
        console.log('数据库连接已断开');
    } catch (error) {
        console.error('更新应用状态失败:', error);
        mongoose.disconnect();
        process.exit(1);
    }
} 