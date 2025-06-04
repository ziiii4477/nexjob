// 根据环境确定API基础URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'  // 本地开发环境
    : 'https://nexjob-backend.onrender.com';  // 生产环境

// 替换所有API调用中的localhost:3001为正确的API URL
document.addEventListener('DOMContentLoaded', function() {
    // 拦截所有fetch请求
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // 替换URL中的localhost:3001
        if (typeof url === 'string' && url.includes('localhost:3001')) {
            url = url.replace('http://localhost:3001', API_BASE_URL);
        }
        return originalFetch.call(this, url, options);
    };
    
    console.log('API配置已加载，基础URL:', API_BASE_URL);
});

// 导出API基础URL供其他模块使用
window.API_BASE_URL = API_BASE_URL; 