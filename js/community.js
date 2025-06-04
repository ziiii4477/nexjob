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
        // 如果是在Netlify环境中
        if (window.location.hostname.includes('netlify.app')) {
            // 从uploads路径提取文件名
            const filename = imagePath.split('/').pop();
            // 使用images目录
            return `${window.location.origin}/images/${filename}`;
        }
        
        // 本地开发环境
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        return apiBaseUrl + cleanPath;
    }
    
    // 其他情况，返回原始路径
    return imagePath;
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
        // 如果是在Netlify环境中
        if (window.location.hostname.includes('netlify.app')) {
            // 从uploads路径提取文件名
            const filename = avatarPath.split('/').pop();
            // 使用images目录
            return `${window.location.origin}/images/${filename}`;
        }
        
        // 本地开发环境
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        const cleanPath = avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath;
        return apiBaseUrl + cleanPath;
    }
    
    // 检查是否是相对路径的头像
    if (!avatarPath.startsWith('/')) {
        return `/images/avatars/${avatarPath}`;
    }
    
    // 其他情况，返回原始路径
    return avatarPath;
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