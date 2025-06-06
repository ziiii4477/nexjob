// 社区页面功能
window.currentUserId = null;

// 渲染帖子卡片
function renderPostCards(posts, containerId) {
    let html = '';
    if (!posts || posts.length === 0) {
        html = '<div class="text-center text-muted my-5">暂无内容</div>';
    } else {
        posts.forEach(function(post) {
            let postImage = '../images/default-post.jpg';
            
            if (post.images && post.images.length > 0) {
                postImage = post.images[0];
            } else if (post.image) {
                postImage = post.image;
            }
            
            const deleteButton = containerId === '#my-posts-list' ? 
                `<button type="button" class="btn btn-sm delete-post" data-id="${post._id}" style="position:absolute; top:5px; right:5px;">
                    <i class="fas fa-trash-alt delete-post-icon" data-id="${post._id}"></i>
                </button>` : '';
            
            html += `
                <div class="masonry-grid-item">
                    <div class="card post-card" data-id="${post._id}" style="cursor:pointer;">
                        <div style="position:relative;margin:0;padding:0;">
                            <img src="${postImage}" class="card-img-top" alt="帖子图片" />
                            <span class="view-count">
                                <i class="far fa-eye"></i> ${post.views || 0}
                            </span>
                            ${deleteButton}
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${post.title}</h6>
                            <div class="d-flex align-items-center">
                                <img src="${post.author?.avatar ? '/images/avatars/' + post.author.avatar : '../images/user logo.jpg'}" 
                                     class="rounded-circle me-1 clickable-user" 
                                     data-user-id="${post.author?._id}"
                                     style="cursor:pointer;" />
                                <span class="clickable-user text-truncate" data-user-id="${post.author?._id}" style="font-size:0.65rem;cursor:pointer;max-width:96px;">
                                    ${post.author?.nickname || post.author?.name || '匿名'}
                                    ${isHRUser(post.author?.userType) ? '<span class="badge bg-primary ms-1" style="font-size:0.6rem;">HR</span>' : ''}
                                </span>
                            </div>
                            <div class="d-flex justify-content-between text-muted small">
                                <span class="like-btn" data-liked="${post.likes?.includes(window.currentUserId)}" data-id="${post._id}">
                                    <i class="far fa-heart${post.likes?.includes(window.currentUserId) ? ' text-danger fas' : ''}"></i> ${post.likes?.length || 0}
                                </span>
                                <span class="comments-count-card" data-id="${post._id}">
                                    <i class="far fa-comment"></i> ${post.totalCommentsCount || 0}
                                </span>
                                <span class="favorite-btn" data-favorited="${post.favorites?.includes(window.currentUserId)}" data-id="${post._id}">
                                    <i class="far fa-star${post.favorites?.includes(window.currentUserId) ? ' text-warning fas' : ''}"></i> ${post.favorites?.length || 0}
                                </span>
                                <span class="share-btn" data-id="${post._id}" data-title="${post.title}">
                                    <i class="fas fa-share-alt"></i> 分享
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    const $container = $(containerId);
    $container.html(html);
}

// 初始化Masonry网格
function initMasonryForGrid($container) {
    if ($container && $container.length) {
        $container.masonry({
            itemSelector: '.masonry-grid-item',
            columnWidth: '.masonry-grid-item',
            percentPosition: true
        });
    }
}

// 加载帖子列表
async function loadPosts() {
    console.log('开始加载帖子列表...');
    try {
        // 获取当前用户信息
        const userInfo = getCurrentUserInfo();
        window.currentUserId = userInfo.userId;
        
        // 使用API_BASE_URL加载帖子
        const response = await fetch(`${API_BASE_URL}/api/v1/community-posts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        console.log('帖子数据:', data);
        
        if (data.success && data.data) {
            renderPostCards(data.data, '#post-masonry');
            
            // 初始化Masonry布局
            setTimeout(function() {
                const $grid = $('#post-masonry');
                initMasonryForGrid($grid);
                
                // 图片加载完成后重新布局
                if (typeof $.fn.imagesLoaded === 'function') {
                    $grid.imagesLoaded().progress(function() {
                        console.log('图片加载中，重新布局');
                        if ($grid.data('masonry')) {
                            $grid.masonry('layout');
                        }
                    });
                }
            }, 300);
        } else {
            $('#post-masonry').html('<div class="text-center text-muted my-5">暂无内容</div>');
            console.warn('加载帖子失败:', data);
        }
    } catch (error) {
        console.error('加载帖子出错:', error);
        $('#post-masonry').html('<div class="text-center text-danger my-5">加载失败，请刷新页面重试</div>');
    }
}

// 获取当前用户ID和类型
function getCurrentUserInfo() {
    const token = localStorage.getItem('token');
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {}
    const userType = localStorage.getItem('userType');
    let userId = null;
    if (user && user._id) {
        userId = user._id;
    } else if (user && user.id) {
        userId = user.id;
    }
    return { token, userType, userId, user };
}

// 应用筛选器
function applyFilters() {
    const searchTerm = $('#search-input').val().trim().toLowerCase();
    const activeFilters = $('.filter-btn.active').map(function() {
        return $(this).data('filter');
    }).get();
    
    console.log('应用筛选:', { searchTerm, activeFilters });
    
    // 构建API请求URL
    let url = `${API_BASE_URL}/api/v1/community-posts`;
    const queryParams = [];
    
    if (searchTerm) {
        queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
    }
    
    if (activeFilters && activeFilters.length > 0) {
        queryParams.push(`categories=${encodeURIComponent(activeFilters.join(','))}`);
    }
    
    if (queryParams.length > 0) {
        url += '?' + queryParams.join('&');
    }
    
    // 显示清除搜索按钮
    $('#clear-search').show();
    
    // 发送API请求
    $.ajax({
        url: url,
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        xhrFields: { withCredentials: true },
        success: function(res) {
            if (res.success) {
                renderPostCards(res.data, '#post-masonry');
                
                // 初始化Masonry布局
                setTimeout(function() {
                    const $grid = $('#post-masonry');
                    initMasonryForGrid($grid);
                }, 300);
            } else {
                $('#post-masonry').html('<div class="text-center text-muted my-5">未找到匹配的内容</div>');
            }
        },
        error: function(xhr) {
            console.error('筛选帖子失败:', xhr);
            $('#post-masonry').html('<div class="text-center text-danger my-5">加载失败，请重试</div>');
        }
    });
}

// 页面初始化
$(document).ready(function() {
    // 筛选按钮点击事件
    $('.filter-btn').on('click', function() {
        $(this).toggleClass('active');
        applyFilters();
    });
    
    // 加载帖子
    loadPosts();
}); 