// 根据当前环境确定 API 基础 URL
function getApiBaseUrl() {
    // 检查当前是否在 Netlify 部署环境
    if (window.location.hostname.includes('netlify.app')) {
        return 'https://nexjob.onrender.com';
    }
    // 本地开发环境
    return 'http://localhost:3001';
}

const API_BASE_URL = getApiBaseUrl();

// API 路径
const API_PATHS = {
    HR_LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    HR_REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
    JOBSEEKER_LOGIN: `${API_BASE_URL}/api/v1/jobseeker/login`,
    JOBSEEKER_REGISTER: `${API_BASE_URL}/api/v1/jobseeker/register`,
    RESUMES: `${API_BASE_URL}/api/v1/resumes`,
    JOBS: `${API_BASE_URL}/api/v1/jobs`,
    APPLICATIONS: `${API_BASE_URL}/api/v1/applications`,
    COMMUNITY: `${API_BASE_URL}/api/v1/community-posts`,
    USERS: `${API_BASE_URL}/api/v1/users`
};

console.log('API配置脚本已注入'); 