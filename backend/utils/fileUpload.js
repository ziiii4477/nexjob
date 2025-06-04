const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('./errorResponse');

// 配置存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        
        // 根据字段名确定上传目录
        switch (file.fieldname) {
            case 'businessLicense':
                uploadDir = path.join(__dirname, '../uploads/licenses');
                break;
            case 'resume':
                uploadDir = path.join(__dirname, '../uploads/resumes');
                break;
            default:
                uploadDir = path.join(__dirname, '../uploads/others');
        }

        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 根据字段名设置允许的文件类型
    let allowedTypes;
    
    switch (file.fieldname) {
        case 'businessLicense':
            allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf'
            ];
            break;
        case 'resume':
            allowedTypes = [
                'application/pdf'
            ];
            break;
        default:
            allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];
    }

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

// 创建multer实例
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制5MB
    }
});

// 处理单个文件上传的中间件
exports.uploadSingle = (fieldName) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.single(fieldName);
        
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ErrorResponse('文件大小超出限制（最大5MB）', 400));
                }
                return next(new ErrorResponse(`文件上传错误: ${err.message}`, 400));
            } else if (err) {
                return next(new ErrorResponse(err.message, 400));
            }
            next();
        });
    };
};

// 处理多个文件上传的中间件
exports.uploadMultiple = (fieldName, maxCount) => {
    return (req, res, next) => {
        const uploadMiddleware = upload.array(fieldName, maxCount);

        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new ErrorResponse('文件大小超出限制（最大5MB）', 400));
                } else if (err.code === 'LIMIT_FILE_COUNT') {
                    return next(new ErrorResponse('文件数量超出限制', 400));
                }
                return next(new ErrorResponse(`文件上传错误: ${err.message}`, 400));
            } else if (err) {
                return next(new ErrorResponse(err.message, 400));
            }
            next();
        });
    };
}; 