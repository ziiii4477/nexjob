// 社区页面功能
let currentUserId = null;

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
        currentUserId = userInfo.userId;
        
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