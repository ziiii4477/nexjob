// 获取职位ID
const jobId = new URLSearchParams(window.location.search).get('id');

// 检查收藏状态
async function checkFavoriteStatus() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:3001/api/v1/jobseeker/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('获取用户信息失败');

        const data = await response.json();
        const isFavorited = data.data.favoriteJobs.includes(jobId);
        updateFavoriteButton(isFavorited);
    } catch (error) {
        console.error('检查收藏状态失败:', error);
    }
}

// 更新收藏按钮状态
function updateFavoriteButton(isFavorited) {
    const favoriteBtn = document.getElementById('favoriteBtn');
    const favoriteIcon = favoriteBtn.querySelector('i');
    const favoriteText = favoriteBtn.querySelector('span');

    if (isFavorited) {
        favoriteIcon.classList.remove('far');
        favoriteIcon.classList.add('fas');
        favoriteText.textContent = '已收藏';
        favoriteBtn.classList.add('favorited');
    } else {
        favoriteIcon.classList.remove('fas');
        favoriteIcon.classList.add('far');
        favoriteText.textContent = '收藏';
        favoriteBtn.classList.remove('favorited');
    }
}

// 切换收藏状态
async function toggleFavorite() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/pages/login.html';
            return;
        }

        const response = await fetch(`http://localhost:3001/api/v1/jobs/${jobId}/favorite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('操作失败');

        const data = await response.json();
        updateFavoriteButton(data.data.isFavorited);
    } catch (error) {
        console.error('切换收藏状态失败:', error);
        alert('操作失败，请稍后重试');
    }
}

// 页面加载时检查收藏状态
document.addEventListener('DOMContentLoaded', () => {
    checkFavoriteStatus();
});

// 添加收藏按钮点击事件
document.getElementById('favoriteBtn').addEventListener('click', toggleFavorite); 