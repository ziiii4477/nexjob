import { API_URL } from './config.js';

// API请求辅助函数
export async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };
    
    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    return fetch(url, fetchOptions);
}

// 常用API端点
export const API = {
    // 认证相关
    auth: {
        login: (data) => apiRequest('/api/v1/auth/login', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        register: (data) => apiRequest('/api/v1/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        me: () => apiRequest('/api/v1/auth/me'),
        logout: () => apiRequest('/api/v1/auth/logout', { method: 'POST' }),
        updateDetails: (data) => apiRequest('/api/v1/auth/updatedetails', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },
    
    // 求职者相关
    jobseeker: {
        register: (data) => apiRequest('/api/v1/jobseeker/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        me: () => apiRequest('/api/v1/jobseeker/me'),
        updateDetails: (data) => apiRequest('/api/v1/jobseeker/updatedetails', {
            method: 'PUT',
            body: JSON.stringify(data)
        })
    },
    
    // 应用相关
    applications: {
        getMyApplications: () => apiRequest('/api/v1/applications/my'),
        getApplication: (id) => apiRequest(`/api/v1/applications/${id}`),
        updateStatus: (id, data) => apiRequest(`/api/v1/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        sendInterviewInvitation: (id, data) => apiRequest(`/api/v1/applications/${id}/interview-invitation`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        exportResumes: () => apiRequest('/api/v1/applications/export-resumes')
    },
    
    // 简历相关
    resumes: {
        getAll: () => apiRequest('/api/v1/resumes'),
        upload: (formData) => apiRequest('/api/v1/resumes/upload', {
            method: 'POST',
            body: formData,
            headers: {} // 让浏览器自动设置Content-Type为multipart/form-data
        }),
        download: (id) => apiRequest(`/api/v1/resumes/${id}/download`),
        delete: (id) => apiRequest(`/api/v1/resumes/${id}`, {
            method: 'DELETE'
        })
    },
    
    // LinkedIn相关
    linkedin: {
        getStatus: () => apiRequest('/api/v1/linkedin/status'),
        getAuthUrl: () => apiRequest('/api/v1/linkedin/auth-url'),
        import: () => apiRequest('/api/v1/linkedin/import', { method: 'POST' }),
        disconnect: () => apiRequest('/api/v1/linkedin/disconnect', { method: 'POST' })
    },
    
    // 社区帖子
    communityPosts: {
        getAll: () => apiRequest('/api/v1/community-posts'),
        getMyPosts: () => apiRequest('/api/v1/community-posts/my-posts'),
        create: (data) => apiRequest('/api/v1/community-posts', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        update: (id, data) => apiRequest(`/api/v1/community-posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        delete: (id) => apiRequest(`/api/v1/community-posts/${id}`, {
            method: 'DELETE'
        })
    },
    
    // 职位相关
    jobs: {
        favorite: (jobId) => apiRequest(`/api/v1/jobs/${jobId}/favorite`, {
            method: 'POST'
        })
    }
}; 