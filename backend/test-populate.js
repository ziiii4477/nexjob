const mongoose = require('mongoose');
const Comment = require('./models/Comment');

// 模拟一个评论对象
const mockComment = {
  userType: 'HRUser',
  replies: []
};

// 测试 populate 函数
async function testPopulate() {
  try {
    console.log('测试 populate 函数');
    
    // 测试 model 函数
    console.log('测试 model 回调函数:');
    const modelFn = comment => comment.userType;
    console.log('对于 HRUser:', modelFn(mockComment));
    
    // 测试 populate 选项
    console.log('测试 populate 选项:');
    const populateOptions = {
      path: 'user',
      select: 'name nickname avatar',
      model: comment => comment.userType
    };
    console.log('Populate 选项:', JSON.stringify(populateOptions, null, 2));
    
    // 测试 mongoose.model 函数
    try {
      console.log('测试 mongoose.model:');
      const HRUserModel = mongoose.model('HRUser');
      console.log('HRUser 模型存在');
    } catch (err) {
      console.error('获取 HRUser 模型失败:', err.message);
    }
    
    try {
      console.log('测试 JobSeeker 模型:');
      const JobSeekerModel = mongoose.model('JobSeeker');
      console.log('JobSeeker 模型存在');
    } catch (err) {
      console.error('获取 JobSeeker 模型失败:', err.message);
    }
  } catch (err) {
    console.error('测试失败:', err);
  }
}

mongoose.connect('mongodb://localhost:27017/nexjob')
  .then(() => {
    console.log('数据库连接成功');
    return testPopulate();
  })
  .catch(err => {
    console.error('操作失败:', err);
  })
  .finally(() => {
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  }); 