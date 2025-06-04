const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1/auth';

// 测试数据
const testUser = {
    name: '测试HR',
    email: 'test@example.com',
    password: '123456',
    phone: '12345678901',
    company: {
        name: '测试公司',
        position: 'HR经理',
        size: '100-499人',
        address: '瑞典斯德哥尔摩'
    },
    businessLicense: 'test-license.jpg'
};

// 测试注册
async function testRegister() {
    try {
        console.log('测试注册API...');
        console.log('发送数据:', JSON.stringify(testUser, null, 2));
        
        const response = await axios.post(`${API_URL}/register`, testUser);
        console.log('注册成功：', response.data);
        return response.data.token;
    } catch (error) {
        console.error('注册失败：');
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            console.error('请求发送失败:', error.message);
        } else {
            console.error('错误:', error.message);
        }
        return null;
    }
}

// 测试登录
async function testLogin() {
    try {
        console.log('测试登录API...');
        console.log('发送数据:', {
            email: testUser.email,
            password: testUser.password
        });
        
        const response = await axios.post(`${API_URL}/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('登录成功：', response.data);
        return response.data.token;
    } catch (error) {
        console.error('登录失败：');
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            console.error('请求发送失败:', error.message);
        } else {
            console.error('错误:', error.message);
        }
        return null;
    }
}

// 测试获取用户信息
async function testGetMe(token) {
    try {
        console.log('测试获取用户信息API...');
        console.log('使用Token:', token);
        
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('获取用户信息成功：', response.data);
    } catch (error) {
        console.error('获取用户信息失败：');
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        } else if (error.request) {
            console.error('请求发送失败:', error.message);
        } else {
            console.error('错误:', error.message);
        }
    }
}

// 运行测试
async function runTests() {
    console.log('开始API测试...\n');
    console.log('API地址:', API_URL);
    console.log('');

    // 测试注册
    const registerToken = await testRegister();
    console.log('\n');

    // 测试登录
    const loginToken = await testLogin();
    console.log('\n');

    // 测试获取用户信息
    if (loginToken) {
        await testGetMe(loginToken);
    }

    console.log('\nAPI测试完成');
}

runTests(); 