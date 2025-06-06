const mongoose = require('mongoose');
const Comment = require('./models/Comment');

mongoose.connect('mongodb://localhost:27017/nexjob')
  .then(() => {
    console.log('数据库连接成功');
    return Comment.deleteMany({});
  })
  .then(result => {
    console.log('已删除所有评论:', result);
  })
  .catch(err => {
    console.error('操作失败:', err);
  })
  .finally(() => {
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  }); 