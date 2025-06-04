require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { uploadSingle } = require('./utils/fileUpload');
const path = require('path');

const app = express();

// 启用CORS
app.use(cors());

// 提供静态文件服务
app.use('/', express.static(path.join(__dirname)));

// 测试路由
app.post('/api/test/upload', uploadSingle('testFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: '请选择要上传的文件'
        });
    }

    res.status(200).json({
        success: true,
        data: {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        }
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误：', err);
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || '服务器错误'
    });
});

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`
测试服务器运行在端口 ${PORT}

您可以通过以下方式测试文件上传：

1. 使用浏览器访问测试页面：
http://localhost:${PORT}/test-upload.html

2. 使用curl命令：
curl -X POST -F "testFile=@测试文件路径" http://localhost:${PORT}/api/test/upload

3. 使用Postman：
- 发送POST请求到：http://localhost:${PORT}/api/test/upload
- 在body中使用form-data，键名为"testFile"
    `);
}); 