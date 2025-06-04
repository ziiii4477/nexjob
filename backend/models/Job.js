const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, '请输入职位名称']
    },
    type: {
        type: String,
        required: [true, '请选择工作类型'],
        enum: ['全职', '兼职', '实习']
    },
    location: {
        type: String,
        required: [true, '请输入工作地点']
    },
    salaryRange: {
        min: {
            type: Number,
            required: [true, '请输入最低薪资']
        },
        max: {
            type: Number,
            required: [true, '请输入最高薪资']
        }
    },
    experience: {
        type: String,
        required: [true, '请选择经验要求']
    },
    description: {
        type: String,
        required: [true, '请输入职位描述']
    },
    requirements: {
        type: String,
        required: [true, '请输入任职要求']
    },
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    postedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'HRUser',
        required: true
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

// 更新时间
jobSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Job', jobSchema); 