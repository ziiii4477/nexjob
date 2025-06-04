// 处理图片URL的函数
function getImageUrl(imagePath) {
    if (!imagePath) {
        return './images/empty-box.svg';
    }
    
    // 如果是完整URL或数据URI，直接返回
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // 处理后端上传的图片路径
    if (imagePath.startsWith('/uploads/') || imagePath.includes('uploads/')) {
        // 获取当前API基础URL
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        // 确保路径格式正确
        const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        return apiBaseUrl + cleanPath;
    }
    
    // 移除开头的斜杠（如果有）
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // 判断当前环境
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const basePath = isLocalhost ? '..' : '.';
    
    // 如果已经包含 images 目录，使用相对于当前环境的路径
    if (cleanPath.startsWith('images/')) {
        return `${basePath}/${cleanPath}`;
    }
    
    // 否则添加 images 目录
    return `${basePath}/images/${cleanPath}`;
}

// 处理用户头像URL的函数
function getAvatarUrl(avatarPath) {
    if (!avatarPath) {
        return './images/user logo.jpg';
    }
    
    // 如果是完整URL或数据URI，直接返回
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
        return avatarPath;
    }
    
    // 处理后端上传的头像路径
    if (avatarPath.startsWith('/uploads/') || avatarPath.includes('uploads/')) {
        // 获取当前API基础URL
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        // 确保路径格式正确
        const cleanPath = avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath;
        return apiBaseUrl + cleanPath;
    }
    
    // 移除开头的斜杠（如果有）
    const cleanPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
    
    // 判断当前环境
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const basePath = isLocalhost ? '..' : '.';
    
    // 如果已经包含 images/avatars 目录，使用相对于当前环境的路径
    if (cleanPath.startsWith('images/avatars/')) {
        return `${basePath}/${cleanPath}`;
    }
    
    // 否则添加 images/avatars 目录
    return `${basePath}/images/avatars/${cleanPath}`;
}

// 渲染帖子的函数
function renderPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'masonry-grid-item';
    
    // 处理帖子图片
    let imageUrl;
    if (post.images && post.images.length > 0) {
        // 优先使用images数组中的第一张图片
        imageUrl = getImageUrl(post.images[0]);
    } else if (post.image) {
        // 兼容旧数据格式
        imageUrl = getImageUrl(post.image);
    } else {
        // 无图片时使用默认图片
        imageUrl = './images/empty-box.svg';
    }
    
    const avatarUrl = getAvatarUrl(post.author?.avatar);
    
    console.log('渲染帖子图片:', post.title, '→', imageUrl);
    
    postElement.innerHTML = `
        <div class="post-card card">
            <img src="${imageUrl}" 
                 class="card-img-top" 
                 alt="${post.title || '帖子图片'}"
                 onerror="this.onerror=null; this.src='./images/empty-box.svg';">
            <div class="card-body">
                <h5 class="card-title">${post.title || '无标题'}</h5>
                <div class="post-meta">
                    <div class="user-info">
                        <img src="${avatarUrl}" 
                             class="avatar" 
                             alt="用户头像"
                             onerror="this.onerror=null; this.src='./images/user logo.jpg';">
                        <span>${post.author?.name || '匿名用户'}</span>
                    </div>
                    <div class="post-stats">
                        <span><i class="far fa-heart"></i> ${post.likes?.length || 0}</span>
                        <span><i class="far fa-star"></i> ${post.favorites?.length || 0}</span>
                        <span><i class="far fa-comment"></i> ${post.comments?.length || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return postElement;
}

// 初始化社区页面
document.addEventListener('DOMContentLoaded', () => {
    console.log('社区页面初始化');
    const postsContainer = document.querySelector('.masonry-grid');
    if (!postsContainer) {
        console.warn('找不到帖子容器元素');
        return;
    }

    // 模拟一些测试数据
    const testPosts = [
        {
            title: '测试帖子1',
            image: 'event1.jpg',
            author: {
                name: '测试用户1',
                avatar: 'user logo.jpg'
            },
            likes: [1, 2, 3],
            favorites: [1],
            comments: [1, 2]
        },
        {
            title: '测试帖子2',
            image: 'event2.jpg',
            author: {
                name: '测试用户2',
                avatar: 'user logo.jpg'
            },
            likes: [1],
            favorites: [],
            comments: [1]
        }
    ];

    console.log('准备渲染测试帖子，数量:', testPosts.length);
    
    // 渲染测试帖子
    testPosts.forEach(post => {
        const postElement = renderPost(post);
        postsContainer.appendChild(postElement);
    });
    
    console.log('测试帖子渲染完成');
}); 