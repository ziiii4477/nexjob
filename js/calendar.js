// 日历功能
document.addEventListener('DOMContentLoaded', function() {
    const calendarDays = document.querySelector('.calendar-days');
    if (!calendarDays) return;

    // 获取当前日期
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // 获取当月第一天是星期几
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    // 获取当月天数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 生成日历HTML
    let calendarHTML = '';

    // 添加上个月的剩余日期
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarHTML += `<div class="calendar-day prev-month">${prevMonthDays - i}</div>`;
    }

    // 添加当月日期
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        const hasEvent = i === 15 || i === 20 || i === 25; // 这些日期有活动
        const dayClass = `calendar-day ${isToday ? 'today' : ''} ${hasEvent ? 'has-event' : ''}`;
        calendarHTML += `<div class="${dayClass}">${i}</div>`;
    }

    // 添加下个月的开始日期
    const remainingDays = 42 - (firstDay + daysInMonth); // 保持6行
    for (let i = 1; i <= remainingDays; i++) {
        calendarHTML += `<div class="calendar-day next-month">${i}</div>`;
    }

    calendarDays.innerHTML = calendarHTML;
}); 