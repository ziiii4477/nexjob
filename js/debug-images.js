// 图片加载调试工具
document.addEventListener('DOMContentLoaded', function() {
    console.log('图片调试工具已加载');
    
    // 获取当前环境信息
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const environment = isLocalhost ? '本地开发环境' : '生产环境';
    const baseUrl = window.location.origin;
    const path = window.location.pathname;
    
    console.log('环境信息:', {
        environment,
        baseUrl,
        path,
        fullUrl: window.location.href
    });
    
    // 监控图片加载
    setTimeout(function() {
        const allImages = document.querySelectorAll('img');
        console.log(`页面上共有 ${allImages.length} 张图片`);
        
        allImages.forEach((img, index) => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || '无描述';
            const loaded = img.complete && img.naturalHeight !== 0;
            const dimensions = loaded ? 
                `${img.naturalWidth}x${img.naturalHeight}` : 
                '未加载';
            
            console.log(`图片 ${index + 1}/${allImages.length}:`, {
                src,
                alt,
                loaded,
                dimensions,
                element: img
            });
            
            // 为未加载的图片添加事件监听
            if (!loaded) {
                img.addEventListener('load', function() {
                    console.log(`图片加载成功: ${src}`);
                });
                
                img.addEventListener('error', function() {
                    console.error(`图片加载失败: ${src}`);
                    // 尝试修复相对路径
                    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                        const possiblePaths = [
                            './images/' + src.split('/').pop(),
                            '../images/' + src.split('/').pop(),
                            '/images/' + src.split('/').pop(),
                            src.replace('../', './'),
                            src.replace('./', '../')
                        ];
                        
                        console.log(`尝试其他可能的路径:`, possiblePaths);
                    }
                });
            }
        });
    }, 1000);
}); 