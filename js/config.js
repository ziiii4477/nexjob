const config = {
    // 开发环境API地址
    development: {
        apiUrl: 'http://localhost:5000'
    },
    // 生产环境API地址
    production: {
        apiUrl: 'https://nexjob-backend.onrender.com' // 替换为您从Render获得的实际URL
    }
};

const environment = window.location.hostname === 'localhost' ? 'development' : 'production';
export const API_URL = config[environment].apiUrl; 