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

    // 测试代码：查询一个有点赞和收藏的帖子
    setTimeout(async () => {
      try {
        // 查找任意一个帖子
        const post = await Post.findOne({}).lean();
        if (!post) {
          console.log('没有找到帖子');
          return;
        }
        
        console.log('============ 测试帖子数据格式 ============');
        console.log('帖子ID:', post._id);
        console.log('点赞数组:', post.likes);
        console.log('点赞类型:', post.likes.length > 0 ? typeof post.likes[0] : 'N/A');
        console.log('点赞ID示例:', post.likes.length > 0 ? post.likes[0].toString() : 'N/A');
        console.log('收藏数组:', post.favorites);
        console.log('收藏类型:', post.favorites.length > 0 ? typeof post.favorites[0] : 'N/A');
        console.log('收藏ID示例:', post.favorites.length > 0 ? post.favorites[0].toString() : 'N/A');
        console.log('帖子作者:', post.author);
        console.log('作者类型:', typeof post.author);
        console.log('作者ID示例:', post.author.toString());
        console.log('==========================================');
      } catch (error) {
        console.error('测试查询失败:', error);
      }
    }, 2000);

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

// 中间件
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// CORS配置
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin === 'https://aesthetic-cheesecake-0dcd44.netlify.app') {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', '86400'); // 24 hours
        res.header('Vary', 'Origin');
    }
    
    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});

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