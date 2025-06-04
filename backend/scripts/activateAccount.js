require('dotenv').config();
const mongoose = require('mongoose');
const HRUser = require('../models/HRUser');
const sendEmail = require('../utils/sendEmail');

const activateAccount = async (email) => {
    try {
        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        // 查找并更新用户
        const user = await HRUser.findOne({ email });
        if (!user) {
            console.log('用户不存在');
            process.exit(1);
        }

        user.status = 'active';
        await user.save();
        console.log('账号已激活');

        // 发送激活邮件
        try {
            await sendEmail({
                email: user.email,
                subject: 'NexJob HR账号已激活',
                message: `尊敬的${user.name}，您的HR账号已经审核通过并激活。现在您可以登录系统发布职位和管理简历了。`
            });
            console.log('激活邮件已发送');
        } catch (err) {
            console.log('激活邮件发送失败:', err);
        }

        process.exit(0);
    } catch (error) {
        console.error('激活失败:', error);
        process.exit(1);
    }
};

// 执行激活
activateAccount('mazihengmuc@163.com'); 