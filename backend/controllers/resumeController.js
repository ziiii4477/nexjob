const Resume = require('../models/Resume');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'));
    }
};

// 创建 multer 实例
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('resume');

// 获取简历列表
exports.getResumes = async (req, res) => {
    try {
        console.log('获取简历列表请求:', {
            userId: req.user.id,
            userType: req.user.role
        });

        // 确保用户是求职者
        if (req.user.role !== 'jobseeker') {
            return res.status(403).json({
                success: false,
                message: '只有求职者可以访问简历'
            });
        }

        // 查询简历
        const resumes = await Resume.find({ jobseeker: req.user.id })
            .sort({ uploadDate: -1 });
            
        console.log('查询到的简历:', {
            count: resumes.length,
            resumes: resumes.map(r => ({
                id: r._id,
                language: r.language,
                filename: r.filename,
                uploadDate: r.uploadDate
            }))
        });

        res.json({
            success: true,
            resumes: resumes
        });
    } catch (error) {
        console.error('获取简历列表失败:', error);
        res.status(500).json({
            success: false,
            message: '获取简历列表失败: ' + error.message
        });
    }
};

// 上传简历
exports.uploadResume = async (req, res) => {
    // 确保用户是求职者
    if (req.user.role !== 'jobseeker') {
        return res.status(403).json({
            success: false,
            message: '只有求职者可以上传简历'
        });
    }

    upload(req, res, async function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '请选择要上传的文件'
            });
        }

        try {
            const resume = new Resume({
                jobseeker: req.user.id,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                language: req.body.language || 'zh',
                path: req.file.path
            });

            await resume.save();

            res.json({
                success: true,
                message: '简历上传成功',
                data: resume
            });
        } catch (error) {
            console.error('保存简历信息失败:', error);
            // 删除已上传的文件
            if (req.file && req.file.path) {
                await fs.promises.unlink(req.file.path).catch(console.error);
            }
            res.status(500).json({
                success: false,
                message: '保存简历信息失败: ' + error.message
            });
        }
    });
};

// 下载简历
exports.downloadResume = async (req, res) => {
    try {
        console.log('下载简历请求:', {
            resumeId: req.params.id,
            userId: req.user.id,
            userRole: req.user.role
        });
        
        // 查找简历，不限制用户
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            console.log('简历不存在:', req.params.id);
            return res.status(404).json({
                success: false,
                error: '简历不存在'
            });
        }
        
        console.log('找到简历:', {
            id: resume._id,
            filename: resume.filename,
            path: resume.path
        });

        // 检查权限：允许HR和简历所有者访问
        if (req.user.role !== 'hr' && resume.jobseeker.toString() !== req.user.id) {
            console.log('权限不足:', {
                userRole: req.user.role,
                resumeOwner: resume.jobseeker.toString()
            });
            return res.status(403).json({
                success: false,
                error: '无权访问此简历'
            });
        }

        // 检查文件是否存在
        if (!fs.existsSync(resume.path)) {
            console.log('文件不存在:', resume.path);
            
            // 尝试修复路径 - 检查是否是相对路径问题
            const absolutePath = path.join(__dirname, '..', resume.path);
            const alternativePath = path.join(__dirname, '../uploads/resumes', resume.filename);
            
            console.log('尝试替代路径:', {
                absolutePath,
                alternativePath
            });
            
            // 检查替代路径
            if (fs.existsSync(absolutePath)) {
                console.log('使用绝对路径成功:', absolutePath);
                resume.path = absolutePath;
            } else if (fs.existsSync(alternativePath)) {
                console.log('使用替代路径成功:', alternativePath);
                resume.path = alternativePath;
            } else {
                return res.status(404).json({
                    success: false,
                    error: '简历文件不存在'
                });
            }
        }

        console.log('开始下载文件:', resume.path);
        res.download(resume.path, resume.originalName || resume.filename);
    } catch (error) {
        console.error('下载简历失败:', error);
        res.status(500).json({
            success: false,
            error: '下载简历失败: ' + error.message
        });
    }
};

// 删除简历
exports.deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            jobseeker: req.user.id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                error: '简历不存在'
            });
        }

        // 删除文件
        if (fs.existsSync(resume.path)) {
            await fs.promises.unlink(resume.path);
        }

        // 删除数据库记录
        await Resume.findByIdAndDelete(resume._id);

        res.json({
            success: true,
            message: '简历删除成功'
        });
    } catch (error) {
        console.error('删除简历失败:', error);
        res.status(500).json({
            success: false,
            error: '删除简历失败: ' + error.message
        });
    }
};

// 预览简历
exports.viewResume = async (req, res) => {
    try {
        console.log('简历预览请求:', {
            resumeId: req.params.id,
            userId: req.user.id,
            userRole: req.user.role
        });
        
        const resume = await Resume.findById(req.params.id);

        if (!resume) {
            console.log('简历不存在:', req.params.id);
            return res.status(404).json({
                success: false,
                error: '简历不存在'
            });
        }
        
        console.log('找到简历:', {
            id: resume._id,
            filename: resume.filename,
            path: resume.path,
            mimeType: resume.mimeType
        });

        // 检查权限：允许HR和简历所有者访问
        if (req.user.role !== 'hr' && resume.jobseeker.toString() !== req.user.id) {
            console.log('权限不足:', {
                userRole: req.user.role,
                resumeOwner: resume.jobseeker.toString()
            });
            return res.status(403).json({
                success: false,
                error: '无权访问此简历'
            });
        }

        // 检查文件是否存在
        if (!fs.existsSync(resume.path)) {
            console.log('文件不存在:', resume.path);
            
            // 尝试修复路径 - 检查是否是相对路径问题
            const absolutePath = path.join(__dirname, '..', resume.path);
            const alternativePath = path.join(__dirname, '../uploads/resumes', resume.filename);
            
            console.log('尝试替代路径:', {
                absolutePath,
                alternativePath
            });
            
            // 检查替代路径
            if (fs.existsSync(absolutePath)) {
                console.log('使用绝对路径成功:', absolutePath);
                resume.path = absolutePath;
            } else if (fs.existsSync(alternativePath)) {
                console.log('使用替代路径成功:', alternativePath);
                resume.path = alternativePath;
            } else {
                return res.status(404).json({
                    success: false,
                    error: '简历文件不存在'
                });
            }
        }

        // 设置正确的Content-Type
        res.setHeader('Content-Type', resume.mimeType);
        // 设置Content-Disposition为inline以支持预览
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(resume.originalName)}"`);
        
        console.log('开始发送文件:', resume.path);
        
        // 创建文件流并发送
        const fileStream = fs.createReadStream(resume.path);
        fileStream.on('error', (err) => {
            console.error('文件流错误:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    error: '读取文件失败: ' + err.message
                });
            }
        });
        
        fileStream.pipe(res);
    } catch (error) {
        console.error('预览简历失败:', error);
        res.status(500).json({
            success: false,
            error: '预览简历失败: ' + error.message
        });
    }
};

module.exports = exports; 