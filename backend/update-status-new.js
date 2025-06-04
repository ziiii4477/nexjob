const axios = require('axios');

async function updateStatus() {
  try {
    console.log('开始请求更新状态...');
    
    const response = await axios.get('http://localhost:3001/api/v1/update-status');
    
    console.log('响应状态码:', response.status);
    console.log('更新状态成功:', response.data);
  } catch (error) {
    console.error('更新状态失败:');
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求已发送但没有收到响应');
      console.error(error.request);
    } else {
      console.error('请求设置时发生错误:', error.message);
    }
    console.error('完整错误信息:', error);
  }
}

updateStatus(); 