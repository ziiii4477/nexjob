const mongoose = require('mongoose');
const Comment = require('./models/Comment');

mongoose.connect('mongodb://localhost:27017/nexjob')
  .then(() => {
    console.log('数据库连接成功');
    console.log('评论模型结构:');
    console.log(JSON.stringify(Comment.schema.paths, null, 2));
    
    // 检查是否有评论记录
    return Comment.find().limit(5);
  })
  .then(comments => {
    console.log('找到评论数量:', comments.length);
    if (comments.length > 0) {
      console.log('评论示例:', JSON.stringify(comments[0], null, 2));
    }
  })
  .catch(err => {
    console.error('操作失败:', err);
  })
  .finally(() => {
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  }); 