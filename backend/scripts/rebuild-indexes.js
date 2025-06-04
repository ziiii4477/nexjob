const mongoose = require('mongoose');
const Application = require('../models/Application');
require('dotenv').config();

async function rebuildIndexes() {
    try {
        // 连接到数据库
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('已连接到数据库');

        // 删除所有现有索引
        console.log('正在删除现有索引...');
        await Application.collection.dropIndexes();
        console.log('已删除所有索引');

        // 创建新索引
        console.log('正在创建新索引...');
        await Application.syncIndexes();
        console.log('索引重建完成');

        process.exit(0);
    } catch (error) {
        console.error('错误:', error);
        process.exit(1);
    }
}

rebuildIndexes(); 