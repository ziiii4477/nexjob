require('dotenv').config();
const nodemailer = require('nodemailer');

const sendTestEmail = async () => {
    try {
        // 创建邮件传输器
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false, // true用于465端口，false用于其他端口
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        console.log('正在连接到SMTP服务器...');

        // 验证连接配置
        await transporter.verify();
        console.log('SMTP连接成功！');

        // 发送测试邮件
        console.log('正在发送测试邮件...');
        const info = await transporter.sendMail({
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: process.env.SMTP_EMAIL, // 发送给自己进行测试
            subject: 'NexJob邮件服务测试',
            text: '如果您收到这封邮件，说明NexJob的邮件服务配置成功！',
            html: `
                <h1>NexJob邮件服务测试</h1>
                <p>如果您收到这封邮件，说明NexJob的邮件服务配置成功！</p>
                <p>系统信息：</p>
                <ul>
                    <li>时间：${new Date().toLocaleString()}</li>
                    <li>环境：${process.env.NODE_ENV || 'development'}</li>
                </ul>
            `
        });

        console.log('邮件发送成功！');
        console.log('预览URL: %s', nodemailer.getTestMessageUrl(info));
        
        process.exit(0);
    } catch (error) {
        console.error('错误：', error);
        process.exit(1);
    }
};

sendTestEmail(); 