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
                            <h6 class="card-title" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5;">${post.title}</h6>
                            <div class="d-flex align-items-center">
                                <img src="${post.author?.avatar ? '/images/avatars/' + post.author.avatar : '../images/user logo.jpg'}" 
                                     class="rounded-circle me-1 clickable-user" 
                                     data-user-id="${post.author?._id}"
                                     style="cursor:pointer;" />
                                <span class="clickable-user text-truncate" onclick="window.location.href='pages/user-profile.html?id=' + $(this).data('user-id')" data-user-id="${post.author?._id}" style="font-size:0.65rem;cursor:pointer;max-width:96px;">
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
    addHRFeatures();
}

// 初始化Masonry网格
function initMasonryForGrid($container) {
    if ($container && $container.length) {
        // 先销毁可能存在的masonry实例
        if ($container.data('masonry')) {
            $container.masonry('destroy');
        }
        
        // 重新初始化masonry
        $container.masonry({
            itemSelector: '.masonry-grid-item',
            columnWidth: '.masonry-grid-item',
            percentPosition: true,
            horizontalOrder: true,
            transitionDuration: '0.3s'
        });
        
        // 确保所有图片加载后重新布局
        if (typeof $.fn.imagesLoaded === 'function') {
            $container.imagesLoaded().progress(function() {
                console.log('图片加载中，重新布局');
                $container.masonry('layout');
            }).done(function() {
                console.log('所有图片加载完成，最终布局');
                $container.masonry('layout');
            });
        }
    }
}

// 加载帖子列表
async function loadPosts() {
    console.log('[社区页面] 开始加载帖子列表...');
    try {
        // 获取当前用户信息
        const userInfo = getCurrentUserInfo();
        window.currentUserId = userInfo.userId;
        console.log('[社区页面] 设置当前用户ID:', window.currentUserId);
        
        const token = localStorage.getItem('token');
        console.log('[社区页面] 准备发送请求，使用token:', token?.substring(0, 20) + '...');
        
        // 使用API_BASE_URL加载帖子
        const response = await fetch(`${API_BASE_URL}/api/v1/community-posts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            mode: 'cors'
        });
        
        console.log('[社区页面] 帖子列表响应状态:', response.status, response.statusText);
        const data = await response.json();
        console.log('[社区页面] 帖子列表响应数据:', data);
        
        if (data.success && data.data) {
            console.log('[社区页面] 成功获取帖子列表，数量:', data.data.length);
            renderPostCards(data.data, '#post-masonry');
            
            // 初始化Masonry布局
            setTimeout(function() {
                console.log('[社区页面] 开始初始化Masonry布局');
                const $grid = $('#post-masonry');
                initMasonryForGrid($grid);
                
                // 确保所有图片加载完成后重新布局
                $grid.imagesLoaded().done(function() {
                    console.log('[社区页面] 所有图片加载完成，重新布局');
                    $grid.masonry('layout');
                });
            }, 300);
        } else {
            $('#post-masonry').html('<div class="text-center text-muted my-5">暂无内容</div>');
            console.warn('[社区页面] 加载帖子失败:', data);
        }
    } catch (error) {
        console.error('[社区页面] 加载帖子出错:', error);
        $('#post-masonry').html('<div class="text-center text-danger my-5">加载失败，请刷新页面重试</div>');
    }
}

// 获取当前用户ID和类型
function getCurrentUserInfo() {
    const token = localStorage.getItem('token');
    console.log('[社区页面] 从localStorage获取到token:', token ? token.substring(0, 20) + '...' : 'null');
    
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        console.log('[社区页面] 从localStorage获取到user字符串:', userStr);
        user = JSON.parse(userStr);
        console.log('[社区页面] 解析后的user对象:', user);
    } catch (e) {
        console.error('[社区页面] 解析user对象失败:', e);
    }
    
    const userType = localStorage.getItem('userType');
    console.log('[社区页面] 从localStorage获取到userType:', userType);
    
    let userId = null;
    
    // 首先尝试从user对象获取ID
    if (user && user._id) {
        userId = user._id;
        console.log('[社区页面] 从user._id获取到userId:', userId);
    } else if (user && user.id) {
        userId = user.id;
        console.log('[社区页面] 从user.id获取到userId:', userId);
    }
    
    // 如果user对象中没有ID，尝试从token中解析
    if (!userId && token) {
        try {
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            userId = tokenData.id;
            console.log('[社区页面] 从token解析出userId:', userId);
        } catch (e) {
            console.error('[社区页面] 解析token失败:', e);
        }
    }
    
    console.log('[社区页面] 最终获取到的用户信息:', { token: token?.substring(0, 20) + '...', userType, userId });
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
    // 获取当前用户信息
    const userInfo = getCurrentUserInfo();
    window.currentUserId = userInfo.userId;

    // 筛选按钮点击事件
    $('.filter-btn').on('click', function() {
        $(this).toggleClass('active');
        applyFilters();
    });
    
    // 加载帖子
    loadPosts();

    // 左侧栏按钮点击事件
    $('#tab-recommend').on('click', function() {
        $('#recommend-section').show();
        $('#message-section').hide();
        $('#my-posts-section').hide();
        $('#recommend-search-container').show();
        $('#recommend-filter-container').show();
        loadPosts(); // 重新加载推荐内容
    });

    $('#tab-message').on('click', function() {
        $('#recommend-section').hide();
        $('#message-section').show();
        $('#my-posts-section').hide();
        $('#recommend-search-container').hide();
        $('#recommend-filter-container').hide();
        // 加载消息内容
        loadMessages();
    });

    $('#tab-my-posts').on('click', function() {
        $('#recommend-section').hide();
        $('#message-section').hide();
        $('#my-posts-section').show();
        $('#recommend-search-container').hide();
        $('#recommend-filter-container').hide();
        // 加载"我的"内容
        loadMyProfile();
        window.newLoadMyPosts();
    });

    // 发布按钮点击事件
    $('#open-post-modal').on('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('postModal'));
        modal.show();
    });

    // 帖子卡片点击事件
    $(document).on('click', '.post-card', function(e) {
        // 如果点击的是操作按钮，不触发帖子详情
        if ($(e.target).closest('.like-btn, .favorite-btn, .share-btn, .delete-post, .delete-post-icon').length) {
            return;
        }
        
        const postId = $(this).data('id');
        showPostDetail(postId);
    });

    // 点赞按钮点击事件
    $(document).on('click', '.like-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const postId = $(this).data('id');
        const isLiked = $(this).data('liked');
        toggleLike(postId, this);
    });

    // 收藏按钮点击事件
    $(document).on('click', '.favorite-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const postId = $(this).data('id');
        const isFavorited = $(this).data('favorited');
        toggleFavorite(postId, this);
    });

    // 分享按钮点击事件
    $(document).on('click', '.share-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const postId = $(this).data('id');
        const title = $(this).data('title');
        sharePost(postId, title);
    });

    // 删除按钮点击事件
    $(document).on('click', '.delete-post, .delete-post-icon', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const postId = $(this).data('id');
        deletePost(postId);
    });

    // 提交评论事件
    $('#submit-comment-btn').on('click', function() {
        const postId = $(this).data('post-id');
        const commentText = $('#new-comment-text').val().trim();
        
        if (!commentText) {
            Swal.fire({
                icon: 'warning',
                title: '请输入评论内容',
                showConfirmButton: false,
                timer: 1500
            });
            return;
        }
        
        $.ajax({
            url: `${API_BASE_URL}/api/v1/community-posts/${postId}/comments`,
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ text: commentText }),
            xhrFields: { withCredentials: true },
            success: function(res) {
                if (res.success) {
                    // 清空输入框
                    $('#new-comment-text').val('');
                    // 重新加载评论
                    loadAndRenderComments(postId);
                    // 显示成功提示
                    Swal.fire({
                        icon: 'success',
                        title: '评论成功',
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            },
            error: function(xhr) {
                console.error('发表评论失败:', xhr);
                Swal.fire({
                    icon: 'error',
                    title: '评论失败',
                    text: '发表评论失败，请稍后重试'
                });
            }
        });
    });

    // 监听图片加载完成事件
    $(document).on('load', '.post-card img.card-img-top', function() {
        const $grid = $(this).closest('.masonry-grid');
        if ($grid.data('masonry')) {
            $grid.masonry('layout');
        }
    });

    // 加载用户资料
    loadUserProfile();

    addHRFeatures();

    // 在打开发布帖子模态框时检查用户身份
    $('#createPostModal').on('show.bs.modal', function() {
        const userInfo = getCurrentUserInfo();
        if (isHRUser(userInfo.userType)) {
            $('.hr-only-options').show();
        } else {
            $('.hr-only-options').hide();
        }
    });
});

// 显示帖子详情
function showPostDetail(postId) {
    $.ajax({
        url: `${API_BASE_URL}/api/v1/community-posts/${postId}`,
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        xhrFields: { withCredentials: true },
        success: function(res) {
            if (res.success && res.data) {
                const post = res.data;
                
                // 设置帖子详情
                $('#detail-author-avatar').attr('src', post.author?.avatar ? 
                    `/images/avatars/${post.author.avatar}` : '../images/user logo.jpg');
                $('#detail-author-name').text(post.author?.nickname || post.author?.name || '匿名');
                $('#detail-title').text(post.title);
                $('#detail-content').text(post.content || '');
                
                // 设置统计信息
                $('#detail-stats').html(`
                    <span><i class="far fa-heart"></i> ${post.likes?.length || 0}</span>
                    <span><i class="far fa-comment"></i> ${post.totalCommentsCount || 0}</span>
                    <span><i class="far fa-star"></i> ${post.favorites?.length || 0}</span>
                `);
                
                // 处理图片
                const imageBox = $('#detail-image-box');
                const thumbnails = $('#detail-image-thumbnails');
                imageBox.empty();
                thumbnails.empty();
                
                if (post.images && post.images.length > 0) {
                    // 显示第一张图片
                    imageBox.html(`<img src="${post.images[0]}" class="img-fluid" alt="帖子图片">`);
                    
                    // 显示缩略图
                    post.images.forEach((img, index) => {
                        thumbnails.append(`
                            <img src="${img}" class="thumbnail${index === 0 ? ' active' : ''}" 
                                 onclick="switchDetailImage('${img}')" alt="缩略图">
                        `);
                    });
                }
                
                // 设置评论按钮的帖子ID
                $('#submit-comment-btn').data('post-id', postId);
                
                // 加载评论
                loadAndRenderComments(postId);
                
                // 显示模态框
                const modal = new bootstrap.Modal(document.getElementById('postDetailModal'));
                modal.show();
            }
        },
        error: function(xhr) {
            console.error('加载帖子详情失败:', xhr);
            Swal.fire({
                icon: 'error',
                title: '加载失败',
                text: '无法加载帖子详情，请稍后重试'
            });
        }
    });
}

// 切换帖子详情图片
window.switchDetailImage = function(imgSrc) {
    $('#detail-image-box img').attr('src', imgSrc);
    $('#detail-image-thumbnails img').removeClass('active');
    $(`#detail-image-thumbnails img[src="${imgSrc}"]`).addClass('active');
};

// 点赞功能
function toggleLike(postId, btnElement) {
    console.log('[社区页面] 开始处理点赞，postId:', postId);
    const token = localStorage.getItem('token');
    console.log('[社区页面] 点赞请求使用token:', token?.substring(0, 20) + '...');
    
    $.ajax({
        url: `${API_BASE_URL}/api/v1/community-posts/${postId}/like`,
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        xhrFields: { 
            withCredentials: true,
            cors: true
        },
        success: function(res) {
            console.log('[社区页面] 点赞响应:', res);
            if (res.success) {
                const $btn = $(btnElement);
                const $icon = $btn.find('i');
                const $count = $btn.contents().last();
                const currentCount = parseInt($count.text()) || 0;
                
                if ($icon.hasClass('fas')) {
                    console.log('[社区页面] 取消点赞');
                    $icon.removeClass('fas text-danger').addClass('far');
                    $count.text(` ${currentCount - 1}`);
                    $btn.data('liked', false);
                } else {
                    console.log('[社区页面] 添加点赞');
                    $icon.removeClass('far').addClass('fas text-danger');
                    $count.text(` ${currentCount + 1}`);
                    $btn.data('liked', true);
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('[社区页面] 点赞请求失败:', { status, error, response: xhr.responseText });
        }
    });
}

// 收藏功能
function toggleFavorite(postId, btnElement) {
    console.log('[社区页面] 开始处理收藏，postId:', postId);
    const token = localStorage.getItem('token');
    console.log('[社区页面] 收藏请求使用token:', token?.substring(0, 20) + '...');
    
    $.ajax({
        url: `${API_BASE_URL}/api/v1/community-posts/${postId}/favorite`,
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        xhrFields: { 
            withCredentials: true,
            cors: true
        },
        success: function(res) {
            console.log('[社区页面] 收藏响应:', res);
            if (res.success) {
                const $btn = $(btnElement);
                const $icon = $btn.find('i');
                const $count = $btn.contents().last();
                const currentCount = parseInt($count.text()) || 0;
                
                if ($icon.hasClass('fas')) {
                    // 取消收藏
                    console.log('[社区页面] 取消收藏');
                    $icon.removeClass('fas text-warning').addClass('far');
                    $count.text(` ${currentCount - 1}`);
                    $btn.data('favorited', false);
                } else {
                    // 收藏
                    console.log('[社区页面] 添加收藏');
                    $icon.removeClass('far').addClass('fas text-warning');
                    $count.text(` ${currentCount + 1}`);
                    $btn.data('favorited', true);
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('[社区页面] 收藏请求失败:', { status, error, response: xhr.responseText });
        }
    });
}

// 分享功能
function sharePost(postId, title) {
    // 构建分享链接
    const shareUrl = `${window.location.origin}/pages/community.html?post=${postId}`;
    
    // 创建临时输入框
    const tempInput = document.createElement('input');
    tempInput.value = shareUrl;
    document.body.appendChild(tempInput);
    
    // 选择并复制链接
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // 显示提示
    Swal.fire({
        icon: 'success',
        title: '链接已复制',
        text: '帖子链接已复制到剪贴板',
        showConfirmButton: false,
        timer: 1500
    });
}

// 删除帖子
function deletePost(postId) {
    Swal.fire({
        title: '确认删除',
        text: '确定要删除这个帖子吗？此操作不可撤销。',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonColor: '#dc3545'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${API_BASE_URL}/api/v1/community-posts/${postId}`,
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                xhrFields: { withCredentials: true },
                success: function(res) {
                    if (res.success) {
                        // 从页面移除帖子
                        $(`.post-card[data-id="${postId}"]`).closest('.masonry-grid-item').remove();
                        
                        // 重新布局
                        const $grid = $('#post-masonry');
                        if ($grid.data('masonry')) {
                            $grid.masonry('layout');
                        }
                        
                        Swal.fire({
                            icon: 'success',
                            title: '删除成功',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    }
                },
                error: function(xhr) {
                    console.error('删除帖子失败:', xhr);
                    Swal.fire({
                        icon: 'error',
                        title: '删除失败',
                        text: '无法删除帖子，请稍后重试'
                    });
                }
            });
        }
    });
}

// 加载消息
function loadMessages() {
    console.log('开始加载通知...');
    $.ajax({
        url: `${API_BASE_URL}/api/v1/community-posts/notifications/list`,
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        xhrFields: { withCredentials: true },
        success: function(res) {
            console.log('通知加载成功:', res);
            if (res.success && res.data) {
                // 处理不同类型的通知
                const comments = res.data.filter(n => n.type === 'comment');
                const likes = res.data.filter(n => n.type === 'like');
                const follows = res.data.filter(n => n.type === 'follow');
                
                // 渲染评论通知
                renderNotifications(comments, '#tab-comment');
                renderNotifications(likes, '#tab-like');
                renderNotifications(follows, '#tab-follow');
            } else {
                $('#tab-comment').html('<div class="text-center text-muted my-3">暂无内容</div>');
                $('#tab-like').html('<div class="text-center text-muted my-3">暂无内容</div>');
                $('#tab-follow').html('<div class="text-center text-muted my-3">暂无内容</div>');
            }
        },
        error: function(xhr) {
            console.error('加载通知失败:', xhr);
            $('#tab-comment').html('<div class="text-center text-danger my-3">加载失败</div>');
            $('#tab-like').html('<div class="text-center text-danger my-3">加载失败</div>');
            $('#tab-follow').html('<div class="text-center text-danger my-3">加载失败</div>');
        }
    });
}

// 渲染通知
function renderNotifications(notifications, containerId) {
    const container = $(containerId);
    if (!notifications || notifications.length === 0) {
        container.html('<div class="text-center text-muted my-3">暂无内容</div>');
        return;
    }
    
    let html = '';
    notifications.forEach(notification => {
        const date = new Date(notification.createdAt).toLocaleString('zh-CN');
        html += `
            <div class="notification-item p-3 border-bottom">
                <div class="d-flex align-items-start">
                    <img src="${notification.from?.avatar || '../images/user logo.jpg'}" 
                         class="rounded-circle me-2" width="40" height="40">
                    <div>
                        <p class="mb-1">
                            <strong>${notification.from?.nickname || '匿名用户'}</strong>
                            ${getNotificationAction(notification.type)}
                            <a href="#" onclick="showPostDetail('${notification.post?._id}')">${notification.post?.title || '帖子'}</a>
                        </p>
                        <small class="text-muted">${date}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.html(html);
}

// 获取通知动作文本
function getNotificationAction(type) {
    switch (type) {
        case 'comment':
            return '评论了你的';
        case 'like':
            return '点赞了你的';
        case 'follow':
            return '关注了你';
        default:
            return '与你互动';
    }
}

// 加载用户资料
async function loadUserProfile() {
    const userInfo = getCurrentUserInfo();
    if (!userInfo.userId) return;

    try {
        // HR用户用 /hr/me，普通用户用 /users/:id/profile
        const apiPath = userInfo.userType === 'hr' ? 
            `${API_BASE_URL}/api/v1/hr/me` : 
            `${API_BASE_URL}/api/v1/users/${userInfo.userId}/profile`;

        const response = await fetch(apiPath, {
            headers: {
                'Authorization': `Bearer ${userInfo.token}`,
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
            const profile = data.data;
            $('#profile-avatar').attr('src', profile.avatar ? `/images/avatars/${profile.avatar}` : '../images/user logo.jpg');
            $('#profile-nickname').text(profile.nickname || profile.name || '用户');
            $('#profile-followers').text(profile.followersCount || 0);
            $('#profile-following').text(profile.followingCount || 0);
        }
    } catch (error) {
        console.error('加载用户资料失败:', error);
    }
}

// 检查是否为HR用户
function isHRUser(userType) {
    return userType === 'hr';
}

// 添加HR特定的发布功能
function addHRFeatures() {
    const userInfo = getCurrentUserInfo();
    if (isHRUser(userInfo.userType)) {
        // 显示HR特有选项
        $('.hr-only-options').show();
        
        // 添加一键投递按钮
        $('.post-card').each(function() {
            const $card = $(this);
            if (!$card.find('.quick-apply-btn').length) {
                $card.find('.card-body').append(`
                    <button class="btn btn-sm btn-outline-primary quick-apply-btn mt-2">
                        <i class="fas fa-paper-plane"></i> 一键投递
                    </button>
                `);
            }
        });
    } else {
        // 非HR用户隐藏HR特有选项
        $('.hr-only-options').hide();
    }
}

function renderComments(comments, containerId) {
    let html = '';
    comments.forEach(comment => {
        const userInfo = getCurrentUserInfo();
        // 修复：同时检查author和user字段，支持HR和JobSeeker用户类型
        const author = comment.author || comment.user || {};
        const authorName = author.nickname || author.name || '匿名用户';
        // 修复：检查HR用户类型
        const isHR = author.userType === 'hr' || author.userType === 'HRUser';
        
        html += `
            <div class="comment-item mb-3">
                <div class="d-flex">
                    <img src="${author.avatar || '../images/user logo.jpg'}" class="rounded-circle me-2" width="32" height="32">
                    <div>
                        <div class="d-flex align-items-center">
                            <strong class="me-2">${authorName}</strong>
                            ${isHR ? '<span class="badge bg-primary">HR</span>' : ''}
                        </div>
                        <p class="mb-1">${comment.content || comment.text || ''}</p>
                        <small class="text-muted">${new Date(comment.createdAt).toLocaleString('zh-CN')}</small>
                    </div>
                </div>
            </div>
        `;
    });
    
    $(containerId).html(html);
}

// 加载我的个人资料
function loadMyProfile() {
    const userInfo = getCurrentUserInfo();
    if (!userInfo.userId) return;

    // 显示个人资料卡片
    $('#my-profile-card').show();

    // HR用户用 /hr/me，普通用户用 /users/:id/profile
    const apiPath = userInfo.userType === 'hr' ? 
        `${API_BASE_URL}/api/v1/hr/me` : 
        `${API_BASE_URL}/api/v1/users/${userInfo.userId}/profile`;

    // 加载用户资料
    $.ajax({
        url: apiPath,
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${userInfo.token}`
        },
        xhrFields: { withCredentials: true },
        success: function(res) {
            console.log('加载个人资料成功:', res);
            if (res.success && res.data) {
                const profile = res.data;
                // 更新头像 - 修复路径处理
                const avatarPath = profile.avatar ? 
                    (profile.avatar.startsWith('http') ? profile.avatar : '/images/avatars/' + profile.avatar) 
                    : '../images/user logo.jpg';
                $('#my-avatar').attr('src', avatarPath);
                
                // 更新用户名 - 支持 HR 和求职者的不同字段
                $('#my-username').text(profile.nickname || profile.name || '用户');
                
                // 更新关注数和粉丝数 - 确保使用正确的属性名
                $('#my-following').text(profile.followingCount || 0);
                $('#my-follower').text(profile.followerCount || 0);
            }
        },
        error: function(xhr) {
            console.error('加载个人资料失败:', xhr);
            // 显示错误信息
            $('#my-avatar').attr('src', '../images/user logo.jpg');
            $('#my-username').text('加载失败');
        }
    });
} 