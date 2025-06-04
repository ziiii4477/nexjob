// 图片路径修复工具
document.addEventListener('DOMContentLoaded', function() {
    console.log('图片路径修复工具已加载');
    
    // 获取API基础URL
    const apiBaseUrl = window.API_BASE_URL || 'http://localhost:3001';
    console.log('API基础URL:', apiBaseUrl);
    
    // 检查是否在Netlify环境
    const isNetlify = window.location.hostname.includes('netlify.app');
    console.log('当前环境:', isNetlify ? 'Netlify生产环境' : '本地开发环境');
    
    // 延迟执行，确保页面中的图片元素都已加载
    setTimeout(function() {
        // 查找所有图片元素
        const allImages = document.querySelectorAll('img');
        console.log(`开始修复 ${allImages.length} 张图片的路径`);
        
        allImages.forEach((img, index) => {
            const originalSrc = img.getAttribute('src');
            if (!originalSrc) return;
            
            // 如果是上传目录的图片，修复路径
            if (originalSrc.includes('/uploads/') || originalSrc.includes('uploads/')) {
                // 在Netlify环境中
                if (isNetlify) {
                    // 提取文件名
                    const filename = originalSrc.split('/').pop();
                    // 使用images目录
                    const newSrc = `${window.location.origin}/images/${filename}`;
                    
                    console.log(`修复Netlify环境图片 #${index + 1} 路径:`, {
                        from: originalSrc,
                        to: newSrc
                    });
                    
                    // 设置新路径
                    img.setAttribute('src', newSrc);
                } else {
                    // 本地环境
                    // 确保路径格式正确
                    const cleanPath = originalSrc.startsWith('/') ? originalSrc : '/' + originalSrc;
                    const newSrc = apiBaseUrl + cleanPath;
                    
                    console.log(`修复本地环境图片 #${index + 1} 路径:`, {
                        from: originalSrc,
                        to: newSrc
                    });
                    
                    // 设置新路径
                    img.setAttribute('src', newSrc);
                }
                
                // 添加加载失败处理
                img.onerror = function() {
                    console.error(`图片加载失败: ${this.src}`);
                    // 尝试使用默认图片
                    this.onerror = null;
                    if (img.classList.contains('avatar') || img.classList.contains('rounded-circle')) {
                        this.src = './images/user logo.jpg';
                    } else {
                        this.src = './images/empty-box.svg';
                    }
                };
            }
        });
    }, 1500);
}); 