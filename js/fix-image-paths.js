// 图片路径修复工具
(function() {
    console.log('图片路径修复工具已初始化');
    
    // 立即执行函数，确保尽早运行
    function fixImagePaths() {
        console.log('开始执行图片路径修复');
        
        // 获取API基础URL
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
        console.log('API基础URL:', apiBaseUrl);
        
        // 检查是否在Netlify环境
        const isNetlify = window.location.hostname.includes('netlify.app');
        console.log('当前环境:', isNetlify ? 'Netlify生产环境' : '本地开发环境');
        console.log('当前主机名:', window.location.hostname);
        console.log('当前URL:', window.location.href);
        
        // 查找所有图片元素
        const allImages = document.querySelectorAll('img');
        console.log(`开始修复 ${allImages.length} 张图片的路径`);
        
        allImages.forEach((img, index) => {
            const originalSrc = img.getAttribute('src');
            if (!originalSrc) {
                console.log(`图片 #${index + 1} 没有src属性`);
                return;
            }
            
            console.log(`处理图片 #${index + 1}:`, {
                originalSrc,
                classList: Array.from(img.classList),
                parentElement: img.parentElement ? img.parentElement.tagName : 'none'
            });
            
            // 如果是上传目录的图片，修复路径
            if (originalSrc.includes('/uploads/') || originalSrc.includes('uploads/')) {
                // 在Netlify环境中
                if (isNetlify) {
                    // 提取文件名
                    const filename = originalSrc.split('/').pop();
                    // 使用images目录
                    const newSrc = `${window.location.origin}/images/${filename}`;
                    
                    console.log(`修复Netlify环境图片 #${index + 1}:`, {
                        from: originalSrc,
                        to: newSrc,
                        filename: filename
                    });
                    
                    // 设置新路径
                    img.setAttribute('src', newSrc);
                    
                    // 添加数据属性用于调试
                    img.setAttribute('data-original-src', originalSrc);
                    img.setAttribute('data-modified-src', newSrc);
                } else {
                    // 本地环境
                    // 确保路径格式正确
                    const cleanPath = originalSrc.startsWith('/') ? originalSrc : '/' + originalSrc;
                    const newSrc = apiBaseUrl + cleanPath;
                    
                    console.log(`修复本地环境图片 #${index + 1}:`, {
                        from: originalSrc,
                        to: newSrc,
                        cleanPath: cleanPath
                    });
                    
                    // 设置新路径
                    img.setAttribute('src', newSrc);
                    
                    // 添加数据属性用于调试
                    img.setAttribute('data-original-src', originalSrc);
                    img.setAttribute('data-modified-src', newSrc);
                }
                
                // 添加加载失败处理
                img.onerror = function() {
                    console.error(`图片加载失败:`, {
                        src: this.src,
                        originalSrc: this.getAttribute('data-original-src'),
                        modifiedSrc: this.getAttribute('data-modified-src'),
                        classList: Array.from(this.classList)
                    });
                    
                    // 尝试使用默认图片
                    this.onerror = null;
                    if (img.classList.contains('avatar') || img.classList.contains('rounded-circle')) {
                        this.src = './images/user logo.jpg';
                        console.log('使用默认头像图片');
                    } else {
                        this.src = './images/empty-box.svg';
                        console.log('使用默认占位图片');
                    }
                };
                
                // 添加加载成功处理
                img.onload = function() {
                    console.log(`图片加载成功:`, {
                        src: this.src,
                        originalSrc: this.getAttribute('data-original-src'),
                        modifiedSrc: this.getAttribute('data-modified-src'),
                        width: this.naturalWidth,
                        height: this.naturalHeight
                    });
                };
            }
        });
    }

    // 在DOM内容加载完成后立即执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded事件触发，执行修复');
            fixImagePaths();
        });
    } else {
        // 如果DOM已经加载完成，立即执行
        console.log('DOM已加载完成，立即执行修复');
        fixImagePaths();
    }

    // 在页面完全加载后再次执行，确保处理动态加载的图片
    window.addEventListener('load', function() {
        console.log('页面完全加载完成，延迟执行修复');
        setTimeout(() => {
            console.log('执行延迟修复');
            fixImagePaths();
        }, 500);
    });

    // 创建一个MutationObserver来监视DOM变化，处理动态添加的图片
    const observer = new MutationObserver(function(mutations) {
        let hasNewImages = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeName === 'IMG') {
                        hasNewImages = true;
                        console.log('检测到新添加的图片元素:', node);
                    } else if (node.querySelectorAll) {
                        const images = node.querySelectorAll('img');
                        if (images.length > 0) {
                            hasNewImages = true;
                            console.log('检测到新添加的DOM中包含图片:', images.length);
                        }
                    }
                });
            }
        });
        
        if (hasNewImages) {
            console.log('检测到新图片，重新执行路径修复');
            fixImagePaths();
        }
    });

    // 开始观察整个文档的变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log('MutationObserver已启动');
})(); 