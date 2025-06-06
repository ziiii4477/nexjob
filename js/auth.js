// 全局认证管理脚本

// 检查登录状态
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        // 注释掉自动跳转到登录页面的代码
        // if (!window.location.pathname.includes('login.html')) {
        //     window.location.href = 'pages/login.html';
        // }
        return false;
    }
    return true;
}

// 获取当前用户信息
async function getCurrentUser() {
    try {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        
        if (!token) {
            return null;
        }
        
        // 根据用户类型选择正确的API端点
        const apiEndpoint = userType === 'hr' 
            ? `${API_BASE_URL}/api/v1/hr/me`
            : `${API_BASE_URL}/api/v1/jobseeker/me`;
        
        console.log('使用API端点:', apiEndpoint); // 调试信息
        
        const response = await fetch(apiEndpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // 添加凭证支持
        });

        if (!response.ok) {
            console.error('API请求失败:', response.status); // 调试信息
            // 如果token无效，清除它
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userType');
            }
            return null;
        }

        const data = await response.json();
        console.log('API响应数据:', data); // 调试信息
        
        if (data.success) {
            return data.data;
        }
        return null;
    } catch (error) {
        console.error('获取用户信息出错:', error);
        return null;
    }
}

// 更新导航栏用户状态
async function updateNavbarUserStatus() {
    const user = await getCurrentUser();
    const authButtons = document.querySelector('.auth-buttons');
    
    if (user) {
        // 判断当前页面是否在 pages 目录下
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const profilePath = isInPagesDir ? 'profile.html' : 'pages/profile.html';
        const loginPath = isInPagesDir ? 'login.html' : 'pages/login.html';
        
        // 用户已登录，显示用户名和下拉菜单
        authButtons.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-primary" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    ${user.name || '用户'}
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="${profilePath}">个人中心</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn">退出登录</a></li>
                </ul>
            </div>
        `;
        
        // 添加退出登录事件
        document.getElementById('logoutBtn').addEventListener('click', function(e) {
            e.preventDefault();
            // 清除localStorage中的token
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            
            // 刷新当前页面或返回首页
            if (window.location.pathname.includes('/pages/')) {
                // 如果在子页面，返回首页
                window.location.href = '../index.html';
            } else {
                // 如果已经在首页，刷新页面
                window.location.reload();
            }
        });
    } else {
        // 判断当前页面是否在 pages 目录下
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDir ? 'login.html' : 'pages/login.html';
        
        // 用户未登录，显示单个登录/注册按钮
        authButtons.innerHTML = `
            <a href="${loginPath}" class="btn btn-primary">登录/注册</a>
        `;
    }
}

// 页面加载时检查登录状态并更新导航栏
document.addEventListener('DOMContentLoaded', function() {
    // 如果不是登录页面，则检查登录状态但不自动跳转
    if (!window.location.pathname.includes('login.html') && 
        !window.location.pathname.includes('register.html')) {
        checkAuthStatus();
    }
    
    // 更新导航栏用户状态
    updateNavbarUserStatus();
}); 