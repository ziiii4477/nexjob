// 处理图片URL的函数
function getImageUrl(imagePath) {
    console.log('getImageUrl调用:', {
        输入路径: imagePath,
        环境: window.location.hostname.includes('netlify.app') ? 'Netlify' : '本地',
        主机名: window.location.hostname
    });

    if (!imagePath) {
        console.warn('getImageUrl: 未提供图片路径');
        return './images/empty-box.svg';
    }
    
    // 如果是完整URL或数据URI，直接返回
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
        return imagePath;
    }
    
    // 检查是否在Netlify环境
    if (window.location.hostname.includes('netlify.app')) {
        // 提取文件名
        const filename = imagePath.split('/').pop();
        const newPath = `/images/${filename}`;
        console.log('getImageUrl Netlify环境处理:', {
            原始路径: imagePath,
            文件名: filename,
            新路径: newPath
        });
        return newPath;
    } else {
        // 本地环境
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
        const fullUrl = apiBaseUrl + cleanPath;
        console.log('getImageUrl本地环境处理:', {
            原始路径: imagePath,
            清理后路径: cleanPath,
            完整URL: fullUrl
        });
        return fullUrl;
    }
}

// 处理用户头像URL的函数
function getAvatarUrl(avatarPath) {
    console.log('getAvatarUrl调用:', {
        输入路径: avatarPath,
        环境: window.location.hostname.includes('netlify.app') ? 'Netlify' : '本地',
        主机名: window.location.hostname
    });

    if (!avatarPath) {
        console.warn('getAvatarUrl: 未提供头像路径');
        return './images/user logo.jpg';
    }
    
    // 如果是完整URL或数据URI，直接返回
    if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
        return avatarPath;
    }
    
    // 检查是否在Netlify环境
    if (window.location.hostname.includes('netlify.app')) {
        // 提取文件名
        const filename = avatarPath.split('/').pop();
        const newPath = `/images/${filename}`;
        console.log('getAvatarUrl Netlify环境处理:', {
            原始路径: avatarPath,
            文件名: filename,
            新路径: newPath
        });
        return newPath;
    } else {
        // 本地环境
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        const cleanPath = avatarPath.startsWith('/') ? avatarPath : '/' + avatarPath;
        const fullUrl = apiBaseUrl + cleanPath;
        console.log('getAvatarUrl本地环境处理:', {
            原始路径: avatarPath,
            清理后路径: cleanPath,
            完整URL: fullUrl
        });
        return fullUrl;
    }
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