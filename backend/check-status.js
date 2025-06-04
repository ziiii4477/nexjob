const mongoose = require('mongoose');
require('dotenv').config();

// 默认MongoDB URI
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
    checkApplicationStatus();
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

// 检查应用状态
async function checkApplicationStatus() {
    try {
        console.log('开始检查应用状态...');
        
        // 查询各状态的应用数量
        const suitable = await Application.countDocuments({ status: 'suitable' });
        const unsuitable = await Application.countDocuments({ status: 'unsuitable' });
        const uncertain = await Application.countDocuments({ status: 'uncertain' });
        const pending_review = await Application.countDocuments({ status: 'pending_review' });
        const viewed = await Application.countDocuments({ status: 'viewed' });
        const pending = await Application.countDocuments({ status: 'pending' });
        const total = await Application.countDocuments();
        
        // 获取所有应用的状态
        const allApplications = await Application.find().select('_id status');
        
        console.log('应用状态统计:');
        console.log(`- suitable: ${suitable}`);
        console.log(`- unsuitable: ${unsuitable}`);
        console.log(`- uncertain: ${uncertain}`);
        console.log(`- pending_review: ${pending_review}`);
        console.log(`- viewed: ${viewed}`);
        console.log(`- pending: ${pending}`);
        console.log(`- 总计: ${total}`);
        
        console.log('\n所有应用的状态:');
        for (const app of allApplications) {
            console.log(`- ID: ${app._id}, 状态: ${app.status}`);
        }
        
        // 断开数据库连接
        mongoose.disconnect();
        console.log('\n数据库连接已断开');
    } catch (error) {
        console.error('检查应用状态失败:', error);
        mongoose.disconnect();
        process.exit(1);
    }
} 