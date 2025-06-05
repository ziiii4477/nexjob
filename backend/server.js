require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/error');
const { uploadSingle } = require('./utils/fileUpload');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const { mongoURI } = require('./config/db');
const Post = require('./models/Post');

// 导入路由
const auth = require('./routes/auth');
const jobs = require('./routes/jobs');
const chats = require('./routes/chats');
const jobseekerAuth = require('./routes/jobseeker-auth');
const applications = require('./routes/applications');
const resumeRoutes = require('./routes/resume');
const communityPosts = require('./routes/posts');
const usersRoutes = require('./routes/users');
const updateAllStatus = require('./routes/updateAllStatus');
const { protect } = require('./middleware/auth');

const app = express();

// --- START CORS CONFIGURATION ---
// This must be the very first middleware to run.
const allowedOrigins = [
    'https://aesthetic-cheesecake-0dcd44.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser support
};

// 应用CORS到所有路由
app.use(cors(corsOptions));

// 明确处理所有OPTIONS预检请求，确保返回200状态码
app.options('*', cors(corsOptions), (req, res) => {
    res.sendStatus(200);
});
// --- END CORS CONFIGURATION ---


// 连接数据库
const connectDB = async () => {
  try {
    console.log('尝试连接到MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 50,
      retryWrites: true
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
};

// 立即连接数据库
connectDB().then(connected => {
  if (!connected) {
    console.log('无法连接到任何数据库，应用可能无法正常工作');
  }
});

// 其他中间件
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    console.log('请求体:', req.body);
    console.log('请求源:', req.headers.origin);
    next();
});

// 静态文件
app.use(express.static(path.join(__dirname, '../')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, '../images')));

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads/resumes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 添加首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/index-en.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../index-en.html'));
});

// 挂载路由
app.use('/api/v1/auth', auth);
app.use('/api/v1/jobs', jobs);
app.use('/api/v1/chats', chats);
app.use('/api/v1/jobseeker', jobseekerAuth);
app.use('/api/v1/applications/update-all-status', updateAllStatus);
app.use('/api/v1/applications', applications);
app.use('/api/v1/resumes', resumeRoutes);
app.use('/api/v1/community-posts', communityPosts);
app.use('/api/v1/users', usersRoutes);

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log('环境变量：', {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI,
        CLIENT_URL: process.env.CLIENT_URL
    });
});

// 处理未处理的Promise rejection
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // 关闭服务器并退出进程
    server.close(() => process.exit(1));
}); 