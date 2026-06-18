document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('smp_access_token');
    const username = localStorage.getItem('smp_username');
    
    // Redirect if not logged in
    if (!token) {
        const path = window.location.pathname.includes('/SMP/') ? '/SMP/index.html' : '/index.html';
        window.location.href = path;
        return;
    }
    
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    // 1. Fetch user profile data (points, streak, theme)
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me?_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('stat-points').textContent = user.points || 0;
            
            // Set theme toggle button
            const themeToggleBtn = document.getElementById('profile-dark-toggle');
            if (themeToggleBtn) {
                const theme = user.theme_preference || 'dark';
                if (window.DarkMode) {
                    if (theme === 'dark') {
                        window.DarkMode.enable(false);
                        themeToggleBtn.textContent = '☀ Chuyển chế độ sáng';
                    } else {
                        window.DarkMode.disable(false);
                        themeToggleBtn.textContent = '☽ Chuyển chế độ tối';
                    }
                }
            }
        }
    } catch (e) {
        console.error("Failed to load user data", e);
    }
    
    // 2. Fetch Activity for Heatmap
    try {
        const res = await fetch(`${API_BASE_URL}/api/activity`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-cache'
        });
        if (res.ok) {
            const activities = await res.json();
            renderHeatmap(activities);
            calculateStreak(activities);
        } else {
            renderHeatmap([]);
        }
    } catch (e) {
        console.error("Failed to load activity", e);
        renderHeatmap([]);
    }
});

function getPast365Days() {
    const dates = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        // Format YYYY-MM-DD
        const dateStr = d.toISOString().split('T')[0];
        dates.push(dateStr);
    }
    return dates;
}

function renderHeatmap(activities) {
    const heatmap = document.getElementById('activity-heatmap');
    if (!heatmap) return;
    
    heatmap.innerHTML = '';
    
    // Create dictionary for fast lookup
    const actDict = {};
    activities.forEach(a => {
        actDict[a.date] = a.solve_count;
    });
    
    const dates = getPast365Days();
    
    dates.forEach(date => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        
        const count = actDict[date] || 0;
        let level = 0;
        if (count >= 5) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;
        
        cell.setAttribute('data-level', level);
        cell.setAttribute('title', `${date}: ${count} bài`);
        
        heatmap.appendChild(cell);
    });
}

function calculateStreak(activities) {
    // Basic streak calculation from today backwards
    const todayStr = new Date().toISOString().split('T')[0];
    const actDict = {};
    activities.forEach(a => { actDict[a.date] = a.solve_count; });
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        if ((actDict[dateStr] || 0) > 0) {
            streak++;
        } else if (i === 0) {
            // It's ok if today is 0, we check yesterday
            continue;
        } else {
            break;
        }
    }
    
    document.getElementById('stat-streak').textContent = streak;
}

window.toggleProfileTheme = async function() {
    if (window.DarkMode) {
        window.DarkMode.toggle();
        const isDark = document.body.classList.contains('dark-mode');
        const themeToggleBtn = document.getElementById('profile-dark-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.textContent = isDark ? '☀ Chuyển chế độ sáng' : '☽ Chuyển chế độ tối';
        }
        await updateThemePreference(isDark ? 'dark' : 'light');
    }
};

async function updateThemePreference(theme) {
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    if (!token) return;
    
    try {
        await fetch(`${API_BASE_URL}/api/activity/settings/theme`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme })
        });
    } catch (e) {
        console.error("Failed to update theme remotely", e);
    }
}

async function handleUpdateUsername(e) {
    e.preventDefault();
    const token = localStorage.getItem('smp_access_token');
    const input = document.getElementById('new-username');
    const btn = document.getElementById('btn-username');
    const msg = document.getElementById('msg-username');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    btn.disabled = true;
    msg.style.display = 'none';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/activity/settings/username`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_username: input.value })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail || "Đổi tên thất bại.");
        
        msg.textContent = data.message;
        msg.className = 'msg success';
        msg.style.display = 'block';
        
        localStorage.setItem('smp_username', data.new_username);
        document.getElementById('profile-username').textContent = data.new_username;
        if (window.applyAuthUI) window.applyAuthUI(data.new_username);
        
    } catch (err) {
        msg.textContent = err.message;
        msg.className = 'msg error';
        msg.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}

async function handleUpdatePassword(e) {
    e.preventDefault();
    const token = localStorage.getItem('smp_access_token');
    const oldP = document.getElementById('old-password').value;
    const newP = document.getElementById('new-password').value;
    const btn = document.getElementById('btn-password');
    const msg = document.getElementById('msg-password');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    btn.disabled = true;
    msg.style.display = 'none';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/activity/settings/password`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ old_password: oldP, new_password: newP })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail || "Đổi mật khẩu thất bại.");
        
        msg.textContent = data.message;
        msg.className = 'msg success';
        msg.style.display = 'block';
        
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        
    } catch (err) {
        msg.textContent = err.message;
        msg.className = 'msg error';
        msg.style.display = 'block';
    } finally {
        btn.disabled = false;
    }
}
