// 处理图片URL的函数
function getImageUrl(imagePath) {
    console.log('getImageUrl调用:', {
        输入路径: imagePath
    });

    if (!imagePath) {
        console.warn('getImageUrl: 未提供图片路径, 返回本地默认占位图。');
        return './images/empty-box.svg'; // 本地备用
    }

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
        console.log('getImageUrl: 路径已经是完整URL或Data URI:', imagePath);
        return imagePath;
    }
    
    const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
    
    try {
        // 确保 imagePath 是相对路径， new URL 会处理前导/的问题
        const fullUrl = new URL(imagePath, apiBaseUrl).href;
        console.log('getImageUrl处理结果:', {
            原始路径: imagePath,
            API基础URL: apiBaseUrl,
            构造的URL: fullUrl
        });
        return fullUrl;
    } catch (e) {
        console.error('getImageUrl: 构建URL失败', { 
            error: e.message, 
            imagePath: imagePath, 
            apiBaseUrl: apiBaseUrl 
        });
        return './images/empty-box.svg'; // 构建失败时的回退
    }
}

// 处理用户头像URL的函数
function getAvatarUrl(avatarPath) {
    console.log('getAvatarUrl调用:', {
        输入路径: avatarPath
    });

    if (!avatarPath) {
        console.warn('getAvatarUrl: 未提供头像路径, 返回本地默认头像。');
        return './images/user logo.jpg'; // 本地备用
    }

    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://') || avatarPath.startsWith('data:')) {
        console.log('getAvatarUrl: 路径已经是完整URL或Data URI:', avatarPath);
        return avatarPath;
    }

    const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';

    try {
        const fullUrl = new URL(avatarPath, apiBaseUrl).href;
        console.log('getAvatarUrl处理结果:', {
            原始路径: avatarPath,
            API基础URL: apiBaseUrl,
            构造的URL: fullUrl
        });
        return fullUrl;
    } catch (e) {
        console.error('getAvatarUrl: 构建URL失败', {
            error: e.message,
            avatarPath: avatarPath,
            apiBaseUrl: apiBaseUrl
        });
        return './images/user logo.jpg'; // 构建失败时的回退
    }
}

// 渲染帖子的函数
function renderPost(post) {
    console.log('渲染帖子:', {
        id: post._id,
        有图片: !!post.image,
        图片路径: post.image,
        作者: post.author?.name,
        头像路径: post.author?.avatar
    });

    // 帖子图片
    let imageUrl;
    if (post.images && post.images.length > 0) {
        imageUrl = getImageUrl(post.images[0]);
    } else if (post.image) {
        imageUrl = getImageUrl(post.image);
    } else {
        // 帖子无图时，可使用本地备用或CDN备用
        imageUrl = './images/empty-box.svg'; // 优先尝试本地
    }
    const cdnPostFallback = 'https://via.placeholder.com/300x200/cccccc/666666?text=Post+Image';
    const imageHtml = `<img src="${imageUrl}" class="card-img-top post-image" alt="${post.title || '帖子图片'}" onerror="this.onerror=null; this.src='${cdnPostFallback}';">`;

    // 用户头像
    const avatarPath = post.author?.avatar;
    const avatarUrl = getAvatarUrl(avatarPath);
    const cdnAvatarFallback = 'https://via.placeholder.com/150x150/cccccc/666666?text=User';
    const avatarHtml = `<img src="${avatarUrl}" class="avatar rounded-circle" alt="用户头像" onerror="this.onerror=null; this.src='${cdnAvatarFallback}';">`;
    
    // 构建帖子HTML (返回字符串)
    return `
        <div class="card post-card" data-post-id="${post._id}">
            ${imageHtml}
            <div class="card-body">
                <h5 class="card-title">${post.title || '无标题'}</h5>
                <p class="card-text">${post.content || '无内容'}</p>
                <div class="post-footer">
                    <div class="user-info">
                        ${avatarHtml}
                        <span>${post.author?.name || '未知用户'}</span>
                    </div>
                    <div class="post-actions">
                        <button class="btn btn-sm btn-outline-primary like-btn" data-post-id="${post._id}">
                            <i class="fas fa-thumbs-up"></i> ${post.likes?.length || 0}
                        </button>
                        <button class="btn btn-sm btn-outline-secondary comment-btn" data-post-id="${post._id}">
                            <i class="fas fa-comment"></i> ${post.comments?.length || 0}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 渲染帖子卡片的函数 (确保此函数存在且正确)
function renderPostCards(posts, containerId) {
    console.log(`渲染帖子到容器: #${containerId} 帖子数量: ${posts.length}`);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`找不到容器: #${containerId}`);
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 遍历帖子，生成HTML
    let postsHTML = '';
    posts.forEach(post => {
        // renderPost 现在返回 HTML 字符串
        postsHTML += `<div class="masonry-grid-item">${renderPost(post)}</div>`; 
    });
    
    // 将生成的HTML添加到容器中
    container.innerHTML = postsHTML;
    
    // 延迟初始化Masonry，等待图片加载
    setTimeout(() => {
        console.log(`准备初始化Masonry布局: #${containerId}`);
        initMasonryForGrid(containerId); // 确保 initMasonryForGrid 正确处理新内容
    }, 100);
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