const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');

// 获取用户所有简历
exports.getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ jobseeker: req.user.id });
        console.log('查询到的简历数据:', resumes);
        res.json({ success: true, resumes });
    } catch (error) {
        console.error('获取简历列表失败:', error);
        res.status(500).json({ success: false, error: '获取简历列表失败' });
    }
};

// 上传简历
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '请选择要上传的文件' });
        }

        const resume = new Resume({
            jobseeker: req.user.id,
            filename: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            language: req.body.language || 'zh',
            uploadDate: new Date()
        });

        await resume.save();
        res.json({ success: true, resume });
    } catch (error) {
        console.error('上传简历失败:', error);
        res.status(500).json({ success: false, error: '上传简历失败' });
    }
};

// 下载简历
exports.downloadResume = async (req, res) => {
    try {
        console.log('下载简历请求参数:', req.params);
        const resume = await Resume.findOne({ _id: req.params.id, jobseeker: req.user.id });
        console.log('查询到的简历:', resume);
        
        if (!resume) {
            console.log('简历不存在');
            return res.status(404).json({ success: false, error: '简历不存在' });
        }

        // 检查文件是否存在
        console.log('简历文件路径:', resume.path);
        if (!fs.existsSync(resume.path)) {
            console.log('文件不存在');
            return res.status(404).json({ success: false, error: '文件不存在' });
        }

        console.log('准备下载文件');
        res.download(resume.path, resume.filename);
    } catch (error) {
        console.error('下载简历失败，详细错误:', error);
        res.status(500).json({ success: false, error: '下载简历失败: ' + error.message });
    }
};

// 删除简历
exports.deleteResume = async (req, res) => {
    try {
        console.log('删除简历请求参数:', req.params);
        const resume = await Resume.findOne({ _id: req.params.id, jobseeker: req.user.id });
        console.log('查询到的简历:', resume);
        
        if (!resume) {
            console.log('简历不存在');
            return res.status(404).json({ success: false, error: '简历不存在' });
        }

        // 检查文件是否存在，如果存在则删除
        console.log('简历文件路径:', resume.path);
        if (fs.existsSync(resume.path)) {
            console.log('文件存在，准备删除');
            fs.unlinkSync(resume.path);
            console.log('文件删除成功');
        } else {
            console.log('文件不存在，跳过删除');
        }

        // 删除数据库记录
        console.log('准备删除数据库记录');
        const result = await Resume.findByIdAndDelete(resume._id);
        console.log('数据库删除结果:', result);

        res.json({ success: true });
    } catch (error) {
        console.error('删除简历失败，详细错误:', error);
        res.status(500).json({ success: false, error: '删除简历失败: ' + error.message });
    }
}; 