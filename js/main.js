// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 导航栏滚动效果优化
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const navbarHeight = navbar.offsetHeight;
        
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            // 添加/移除透明背景
            if (currentScroll > navbarHeight) {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.05)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.8)';
                navbar.style.boxShadow = 'none';
            }
            
            if (currentScroll <= 0) {
                navbar.classList.remove('scroll-up');
                return;
            }
            
            if (currentScroll > lastScroll && !navbar.classList.contains('scroll-down')) {
                // 向下滚动
                navbar.classList.remove('scroll-up');
                navbar.classList.add('scroll-down');
            } else if (currentScroll < lastScroll && navbar.classList.contains('scroll-down')) {
                // 向上滚动
                navbar.classList.remove('scroll-down');
                navbar.classList.add('scroll-up');
            }
            lastScroll = currentScroll;
        });
    }

    // 导航链接点击效果
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 添加点击波纹效果
            const ripple = document.createElement('div');
            ripple.className = 'nav-link-ripple';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 1000);
        });
    });

    // 搜索框焦点效果优化
    const searchInputs = document.querySelectorAll('.search-box input, .search-box-large input');
    searchInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
            this.parentElement.style.transform = 'translateY(0)';
            this.parentElement.style.boxShadow = 'none';
        });
    });

    // 语言切换功能
    const languageBtn = document.querySelector('.language-switch button');
    if (languageBtn) {
        languageBtn.addEventListener('click', function() {
            const currentPath = window.location.pathname;
            let targetPath;
            
            // 判断当前是否在英文页面
            const isEnglish = currentPath.includes('/en/');
            
            if (isEnglish) {
                // 从英文切换到中文
                if (currentPath.includes('/en/pages/')) {
                    // 英文版子页面
                    targetPath = currentPath.replace('/en/pages/', '/pages/');
                } else {
                    // 英文版首页
                    targetPath = currentPath.replace('/en/', '/');
                }
            } else {
                // 从中文切换到英文
                if (currentPath.includes('/pages/')) {
                    // 中文版子页面
                    targetPath = currentPath.replace('/pages/', '/en/pages/');
                } else if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
                    // 中文版首页
                    targetPath = currentPath.replace('index.html', 'en/index.html').replace(/\/$/, '/en/index.html');
                }
            }
            
            // 执行页面跳转
            if (targetPath) {
                window.location.href = targetPath;
            }
        });
    }

    // 移动端菜单关闭
    const navbarLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const menuToggle = document.getElementById('navbarNav');
    if (menuToggle) {
        const bsCollapse = new bootstrap.Collapse(menuToggle, {toggle: false});
        
        navbarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    bsCollapse.hide();
                }
            });
        });
    }

    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 添加页面加载动画
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.6s ease-out';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });

    elements.forEach(element => observer.observe(element));

    // 初始化页面特定功能
    initializePageSpecificFeatures();

    // 如果当前是社区页面，初始化社区功能
    if (document.getElementById('post-masonry')) {
        initializeCommunityPage();
    }

    // 处理发帖表单
    const postModal = document.getElementById('postModal');
    if (postModal) {
        // 当模态框显示时检查用户类型
        postModal.addEventListener('show.bs.modal', function () {
            // 获取当前用户信息
            fetch('/api/auth/me')
                .then(response => response.json())
                .then(data => {
                    const hrOnlyOptions = document.querySelector('.hr-only-options');
                    if (data.role === 'HRUser') {
                        hrOnlyOptions.style.display = 'block';
                    } else {
                        hrOnlyOptions.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error('获取用户信息失败:', error);
                    hrOnlyOptions.style.display = 'none';
                });
        });

        // 处理发帖表单提交
        const postForm = document.getElementById('postForm');
        postForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('post-title').value);
            formData.append('content', document.querySelector('textarea').value);
            formData.append('category', document.getElementById('post-category').value);
            
            // 添加 HR 特有选项
            const quickApply = document.getElementById('quickApply');
            const aiInterview = document.getElementById('aiInterview');
            if (quickApply) {
                formData.append('quickApply', quickApply.checked);
            }
            if (aiInterview) {
                formData.append('aiInterview', aiInterview.checked);
            }

            // 处理图片上传
            const imageFiles = document.querySelector('input[type="file"]').files;
            for (let i = 0; i < imageFiles.length; i++) {
                formData.append('images', imageFiles[i]);
            }

            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    // 关闭模态框并刷新帖子列表
                    const modal = bootstrap.Modal.getInstance(postModal);
                    modal.hide();
                    loadPosts(); // 重新加载帖子列表
                } else {
                    const error = await response.json();
                    alert(error.message || '发布失败，请重试');
                }
            } catch (error) {
                console.error('发布帖子失败:', error);
                alert('发布失败，请重试');
            }
        });
    }

    // 简历复筛部分
    if (document.querySelector('#resume-review')) {
        // 加载待复筛简历列表
        async function loadReviewResumes() {
            try {
                const response = await fetch('/api/v1/applications?status=pending_review', {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    const resumeReviewList = document.getElementById('resumeReviewList');
                    resumeReviewList.innerHTML = ''; // 清空现有内容
                    
                    if (data.data.length === 0) {
                        resumeReviewList.innerHTML = '<div class="alert alert-info">暂无待复筛的简历</div>';
                        return;
                    }
                    
                    data.data.forEach(application => {
                        const card = createResumeReviewCard(application);
                        resumeReviewList.appendChild(card);
                    });
                }
            } catch (error) {
                console.error('加载待复筛简历失败:', error);
                const resumeReviewList = document.getElementById('resumeReviewList');
                resumeReviewList.innerHTML = '<div class="alert alert-danger">加载简历失败，请刷新页面重试</div>';
            }
        }

        // 创建简历复筛卡片
        function createResumeReviewCard(application) {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="mb-1">${application.applicant.name}</h5>
                            <p class="text-muted mb-2">应聘：${application.job ? application.job.title : application.post.title}</p>
                            <div class="mb-2">
                                <span class="badge bg-warning">待复筛</span>
                                ${application.aiInterview ? '<span class="badge bg-success">已完成AI面试</span>' : ''}
                            </div>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <button class="btn btn-success btn-sm me-2" onclick="updateResumeStatus('${application._id}', 'suitable')">
                                <i class="fas fa-check me-1"></i>通过
                            </button>
                            <button class="btn btn-danger btn-sm me-2" onclick="updateResumeStatus('${application._id}', 'unsuitable')">
                                <i class="fas fa-times me-1"></i>不通过
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="viewResumeDetail('${application._id}')">
                                <i class="fas fa-eye me-1"></i>查看
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return card;
        }

        // 更新简历状态
        async function updateResumeStatus(applicationId, status) {
            try {
                // 映射前端状态到后端状态
                const statusMap = {
                    'suitable': 'interview',
                    'unsuitable': 'rejected',
                    'uncertain': 'pending_review',
                    'pending': 'pending'
                };
                
                const dbStatus = statusMap[status] || status;
                
                const response = await fetch(`/api/v1/applications/${applicationId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: dbStatus }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                if (data.success) {
                    // 重新加载简历列表
                    loadReviewResumes();
                } else {
                    alert('更新状态失败：' + (data.message || '未知错误'));
                }
            } catch (error) {
                console.error('更新简历状态失败:', error);
                alert('更新状态失败，请重试');
            }
        }

        // 查看简历详情
        async function viewResumeDetail(applicationId) {
            try {
                const response = await fetch(`/api/v1/applications/${applicationId}`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (data.success) {
                    const modal = new bootstrap.Modal(document.getElementById('resumeModal'));
                    const resumeContent = document.getElementById('resumeContent');
                    
                    // 填充简历内容
                    resumeContent.innerHTML = `
                        <div class="mb-4">
                            <h5>基本信息</h5>
                            <p><strong>姓名：</strong>${data.data.applicant.name}</p>
                            <p><strong>邮箱：</strong>${data.data.applicant.email}</p>
                            <p><strong>电话：</strong>${data.data.applicant.phone || '未提供'}</p>
                        </div>
                        <div class="mb-4">
                            <h5>应聘信息</h5>
                            <p><strong>应聘职位：</strong>${data.data.job ? data.data.job.title : data.data.post.title}</p>
                            <p><strong>投递时间：</strong>${new Date(data.data.createdAt).toLocaleString()}</p>
                            <p><strong>当前状态：</strong>${data.data.status}</p>
                        </div>
                        ${data.data.aiInterview ? `
                            <div class="mb-4">
                                <h5>AI面试结果</h5>
                                <pre class="bg-light p-3 rounded">${data.data.aiInterview}</pre>
                            </div>
                        ` : ''}
                    `;
                    
                    // 更新模态框按钮的applicationId
                    const modalFooter = document.querySelector('#resumeModal .modal-footer');
                    modalFooter.innerHTML = `
                        <div class="btn-group me-auto">
                            <button class="btn btn-success" onclick="updateResumeStatus('${applicationId}', 'suitable')">通过</button>
                            <button class="btn btn-danger" onclick="updateResumeStatus('${applicationId}', 'unsuitable')">不通过</button>
                        </div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                    `;
                    
                    modal.show();
                }
            } catch (error) {
                console.error('获取简历详情失败:', error);
                alert('获取简历详情失败，请重试');
            }
        }

        // 初始化加载简历列表
        loadReviewResumes();

        // 筛选条件变化时重新加载
        document.getElementById('jobFilterReview').addEventListener('change', loadReviewResumes);
        document.getElementById('aiInterviewFilter').addEventListener('change', loadReviewResumes);
        
        // 搜索功能
        document.getElementById('candidateSearch').addEventListener('input', debounce(loadReviewResumes, 500));
    }
});

// 页面特定功能初始化
function initializePageSpecificFeatures() {
    // 聊天功能（仅在AI助手页面）
    const chatElements = {
        sendButton: document.getElementById('sendButton'),
        userInput: document.getElementById('userInput'),
        uploadResumeBtn: document.getElementById('uploadResumeBtn')
    };

    if (chatElements.sendButton && chatElements.userInput) {
        // 事件监听器
        chatElements.sendButton.addEventListener('click', sendMessage);
        chatElements.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    if (chatElements.uploadResumeBtn) {
        // 上传简历按钮点击事件
        chatElements.uploadResumeBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.doc,.docx';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const formData = new FormData();
                    formData.append('resume', file);
                    
                    try {
                        const response = await fetch('/api/upload-resume', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                            addMessage('简历上传成功！我会根据您的简历为您推荐更匹配的职位。', 'ai');
                        } else {
                            addMessage('简历上传失败，请稍后重试。', 'ai');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        addMessage('简历上传失败，请稍后重试。', 'ai');
                    }
                }
            };
            input.click();
        });
    }
}

// 消息发送功能
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    if (!userInput || !userInput.value.trim()) return;

    const message = userInput.value.trim();
    userInput.value = '';
    
    // 添加用户消息
    addMessage(message, 'user');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        if (data.success) {
            addMessage(data.reply, 'ai');
        } else {
            throw new Error(data.error || '发送失败');
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('抱歉，发生了错误，请稍后重试。', 'ai');
    }
}

// 添加消息到聊天界面
function addMessage(content, type) {
    const chatContainer = document.querySelector('.chat-messages');
    if (!chatContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    if (type === 'ai') {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <img src="../images/ai-avatar.png" alt="AI">
            </div>
            <div class="message-content">
                <div class="message-text">${content}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${content}</div>
            </div>
        `;
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageDiv;
}

// 职位搜索页面功能
if (document.querySelector('.search-filter-section')) {
    // 视图切换功能
    const viewButtons = document.querySelectorAll('.view-options .btn');
    const jobList = document.querySelector('.job-list');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            if (this.dataset.view === 'grid') {
                jobList.classList.add('grid-view');
            } else {
                jobList.classList.remove('grid-view');
            }
        });
    });

    // 筛选条件变化监听
    const filterInputs = document.querySelectorAll('.filter-sidebar input, .filter-sidebar select');
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            // TODO: 实现筛选逻辑
            console.log('Filter changed:', this.name, this.value);
        });
    });

    // 薪资范围输入验证
    const salaryInputs = document.querySelectorAll('.filter-section .input-group input');
    salaryInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value < 0) {
                this.value = 0;
            }
        });
    });

    // 收藏按钮功能
    const bookmarkButtons = document.querySelectorAll('.job-actions .btn-outline-primary');
    bookmarkButtons.forEach(button => {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.classList.add('active');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.classList.remove('active');
            }
            // TODO: 实现收藏逻辑
        });
    });

    // 排序功能
    const sortSelect = document.querySelector('.sort-options select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            // TODO: 实现排序逻辑
            console.log('Sort changed:', this.value);
        });
    }
}

// 职位详情页面功能
if (document.querySelector('.job-detail-header')) {
    // 收藏按钮功能
    const bookmarkBtn = document.querySelector('.job-actions-sidebar .btn-outline-primary');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (icon.classList.contains('far')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                this.classList.add('active');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                this.classList.remove('active');
            }
            // TODO: 实现收藏逻辑
        });
    }

    // 申请按钮功能
    const applyBtn = document.querySelector('.job-actions-sidebar .btn-primary');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            // TODO: 实现申请逻辑
            console.log('Apply button clicked');
        });
    }

    // 分享按钮功能
    const shareBtn = document.querySelector('.job-actions-sidebar .btn-outline-secondary');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // TODO: 实现分享逻辑
            console.log('Share button clicked');
        });
    }

    // 相似职位点击效果
    const similarJobs = document.querySelectorAll('.similar-job-item');
    similarJobs.forEach(job => {
        job.addEventListener('click', function() {
            // TODO: 实现跳转到相似职位详情页
            console.log('Similar job clicked');
        });
    });

    // 平滑滚动到内容区域
    const contentLinks = document.querySelectorAll('a[href^="#content-"]');
    contentLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 社区页面功能
function initializeCommunityPage() {
    const postMasonry = document.getElementById('post-masonry');
    const postDetailModal = new bootstrap.Modal(document.getElementById('postDetailModal'));
    
    // 加载帖子列表
    async function loadPosts() {
        try {
            const response = await fetch('/api/v1/community-posts', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (data.success && postMasonry) {
                postMasonry.innerHTML = ''; // 清空现有内容
                
                data.data.forEach(post => {
                    const postCard = createPostCard(post);
                    postMasonry.appendChild(postCard);
                });
            }
        } catch (error) {
            console.error('加载帖子失败:', error);
        }
    }

    // 创建帖子卡片
    function createPostCard(post) {
        const card = document.createElement('div');
        card.className = 'col-lg-4 col-md-6 mb-4';
        card.innerHTML = `
            <div class="card h-100 shadow-sm hover-shadow" style="cursor: pointer;">
                <img src="${post.image || '../images/default-post.jpg'}" class="card-img-top" alt="${post.title}" style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h5 class="card-title">${post.title}</h5>
                    <div class="d-flex align-items-center mb-2">
                        <img src="/images/avatars/${post.author?.avatar || 'avatar1.svg'}" class="rounded-circle me-2" width="32" height="32" style="object-fit: cover;">
                        <span class="text-muted">${post.author?.nickname || post.author?.name || '匿名用户'}</span>
                    </div>
                    <div class="d-flex justify-content-between text-muted">
                        <span><i class="far fa-heart me-1"></i>${post.likes || 0}</span>
                        <span><i class="far fa-comment me-1"></i>${post.comments?.length || 0}</span>
                        <span><i class="far fa-eye me-1"></i>${post.views || 0}</span>
                    </div>
                </div>
            </div>
        `;

        // 点击卡片显示详情
        card.addEventListener('click', () => showPostDetail(post));
        return card;
    }

    // 显示帖子详情
    function showPostDetail(post) {
        const detailModal = document.getElementById('postDetailModal');
        if (!detailModal) return;

        // 设置帖子内容
        document.getElementById('detail-title').textContent = post.title;
        document.getElementById('detail-content').textContent = post.content;
        document.getElementById('detail-author-name').textContent = post.author.name || 'Unknown';
        
        // 设置作者头像
        const authorAvatar = document.getElementById('detail-author-avatar');
        if (post.author.avatar) {
            authorAvatar.src = post.author.avatar;
        } else {
            authorAvatar.src = '../images/user logo.jpg';
        }

        // 处理一键投递按钮显示
        const quickApplySection = document.getElementById('quick-apply-section');
        if (post.authorType === 'HRUser' && post.quickApply) {
            quickApplySection.style.display = 'block';
            
            // 添加一键投递点击事件
            const quickApplyBtn = document.getElementById('quick-apply-btn');
            quickApplyBtn.onclick = async function() {
                try {
                    // 获取用户简历列表
                    const response = await fetch('/api/resumes/my');
                    const data = await response.json();
                    
                    if (!data.success) {
                        throw new Error(data.message || '获取简历失败');
                    }

                    if (data.data.length === 0) {
                        alert('请先上传简历后再投递');
                        return;
                    }

                    // 如果有多份简历，弹出选择框
                    let resumeId;
                    if (data.data.length > 1) {
                        const resumeSelect = document.createElement('select');
                        resumeSelect.className = 'form-select mb-3';
                        data.data.forEach(resume => {
                            const option = document.createElement('option');
                            option.value = resume._id;
                            option.textContent = resume.title;
                            resumeSelect.appendChild(option);
                        });

                        const result = await Swal.fire({
                            title: '选择要投递的简历',
                            html: resumeSelect.outerHTML,
                            showCancelButton: true,
                            confirmButtonText: '确认投递',
                            cancelButtonText: '取消'
                        });

                        if (!result.isConfirmed) return;
                        resumeId = document.querySelector('.swal2-content select').value;
                    } else {
                        resumeId = data.data[0]._id;
                    }

                    // 发送投递请求
                    const applyResponse = await fetch('/api/applications', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            postId: post._id,
                            resumeId: resumeId
                        })
                    });

                    const applyData = await applyResponse.json();
                    if (applyData.success) {
                        alert('投递成功！');
                        quickApplyBtn.disabled = true;
                        quickApplyBtn.textContent = '已投递';
                    } else {
                        throw new Error(applyData.message || '投递失败');
                    }
                } catch (error) {
                    console.error('投递失败:', error);
                    alert(error.message || '投递失败，请重试');
                }
            };
        } else {
            quickApplySection.style.display = 'none';
        }

        // 显示帖子统计信息
        const statsDiv = document.getElementById('detail-stats');
        statsDiv.innerHTML = `
            <span><i class="far fa-heart"></i> ${post.likes ? post.likes.length : 0}</span>
            <span><i class="far fa-comment"></i> ${post.comments ? post.comments.length : 0}</span>
            <span><i class="far fa-eye"></i> ${post.views || 0}</span>
        `;

        // 加载评论
        loadComments(post._id);

        // 显示模态框
        const modal = new bootstrap.Modal(detailModal);
        modal.show();
    }

    // 发帖功能
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('post-title').value);
            formData.append('content', postForm.querySelector('textarea').value);
            formData.append('category', document.getElementById('post-category').value || 'other');
            
            const imageInput = postForm.querySelector('input[type="file"]');
            if (imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }
            
            try {
                const response = await fetch('/api/v1/community-posts', {
                    method: 'POST',
                    body: formData,
                    credentials: 'include'
                });
                
                const data = await response.json();
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('postModal')).hide();
                    postForm.reset();
                    loadPosts(); // 重新加载帖子列表
                } else {
                    alert('发布失败: ' + (data.message || '未知错误'));
                }
            } catch (error) {
                console.error('发布帖子失败:', error);
                alert('发布失败，请检查网络连接或重试');
            }
        });
    }

    // 初始化加载帖子
    if (postMasonry) {
        loadPosts();
    }
}

// 活动页面功能
if (document.querySelector('.events-header')) {
    // 活动类型筛选
    const eventFilters = document.querySelectorAll('.event-filters .btn');
    eventFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            eventFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            // TODO: 实现活动筛选逻辑
            console.log('Event filter clicked:', this.textContent);
        });
    });

    // 活动报名功能
    const registerButtons = document.querySelectorAll('.event-card .btn-primary');
    registerButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            // TODO: 实现活动报名逻辑
            console.log('Register button clicked');
        });
    });

    // 活动卡片点击效果
    const eventCards = document.querySelectorAll('.event-card');
    eventCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // 如果点击的是按钮，不触发跳转
            if (e.target.closest('button')) {
                return;
            }
            // TODO: 实现活动详情页跳转
            console.log('Event card clicked');
        });
    });

    // 日历功能
    const calendar = document.querySelector('.event-calendar');
    if (calendar) {
        // 日历导航
        const prevBtn = calendar.querySelector('.fa-chevron-left').parentElement;
        const nextBtn = calendar.querySelector('.fa-chevron-right').parentElement;
        const monthTitle = calendar.querySelector('h5');

        let currentDate = new Date();
        let currentMonth = currentDate.getMonth();
        let currentYear = currentDate.getFullYear();

        function updateCalendar() {
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDay = firstDay.getDay();

            const calendarDays = calendar.querySelector('.calendar-days');
            calendarDays.innerHTML = '';

            // 填充空白天数
            for (let i = 0; i < startingDay; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day';
                calendarDays.appendChild(emptyDay);
            }

            // 填充日期
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.createElement('div');
                dayElement.className = 'calendar-day';
                if (day === currentDate.getDate() && currentMonth === currentDate.getMonth() && currentYear === currentDate.getFullYear()) {
                    dayElement.classList.add('today');
                }
                // TODO: 添加活动标记
                dayElement.textContent = day;
                calendarDays.appendChild(dayElement);
            }

            // 更新月份标题
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
            monthTitle.textContent = `${currentYear}年${monthNames[currentMonth]}`;
        }

        prevBtn.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            updateCalendar();
        });

        nextBtn.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            updateCalendar();
        });

        // 初始化日历
        updateCalendar();
    }

    // 活动提醒订阅
    const subscribeForm = document.querySelector('.event-reminder .input-group');
    if (subscribeForm) {
        subscribeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            // TODO: 实现订阅逻辑
            console.log('Subscribe email:', emailInput.value);
            emailInput.value = '';
        });
    }
}

// 关于我们页面功能
if (document.querySelector('.about-header')) {
    // 统计数字动画
    const stats = document.querySelectorAll('.stat-item h3');
    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const value = parseInt(target.textContent);
                animateValue(target, 0, value, 2000);
                observer.unobserve(target);
            }
        });
    }, observerOptions);

    stats.forEach(stat => observer.observe(stat));

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (end - start) + start).toLocaleString() + '+';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // 团队成员卡片悬停效果
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('mouseenter', () => {
            member.style.transform = 'translateY(-10px)';
        });
        member.addEventListener('mouseleave', () => {
            member.style.transform = 'translateY(0)';
        });
    });

    // 联系表单提交
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());
            
            // 这里添加表单提交逻辑
            console.log('表单数据：', data);
            
            // 显示成功消息
            alert('感谢您的留言！我们会尽快回复。');
            contactForm.reset();
        });
    }

    // 社交媒体链接点击效果
    const socialLinks = document.querySelectorAll('.social-links a');
    socialLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const platform = link.querySelector('i').className.split(' ')[2];
            console.log(`点击了${platform}链接`);
            // 这里添加社交媒体链接跳转逻辑
        });
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 