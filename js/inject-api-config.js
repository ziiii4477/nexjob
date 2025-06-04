// 此脚本会自动注入到所有页面，负责加载API配置

// 创建script元素
const script = document.createElement('script');
script.src = '/js/api-config.js';
script.async = false; // 确保在其他脚本之前加载
script.type = 'text/javascript';

// 将script元素添加到head中
document.head.insertBefore(script, document.head.firstChild);

console.log('API配置脚本已注入'); 