document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('smp_access_token');
    const username = localStorage.getItem('smp_username');
    
    // Redirect if not logged in
    if (!token) {
        const path = window.location.pathname.includes('/SMP/') ? '/SMP/home.html' : '/home.html';
        window.location.href = path;
        return;
    }
    
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    // Helper format YYYY-MM
    function formatYearMonth(dateInput) {
        const d = dateInput ? new Date(dateInput) : new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
    }

    // 1. Fetch user profile data (points, username, theme, createdAt)
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me?_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        if (res.ok) {
            const user = await res.json();
            
            // Set Avatar initial & Username & Submeta
            const userInitial = (user.username || 'S').charAt(0).toUpperCase();
            const avatarEl = document.getElementById('profile-avatar');
            if (avatarEl) avatarEl.textContent = userInitial;

            const nameEl = document.getElementById('profile-username');
            if (nameEl) nameEl.textContent = user.username;

            const submetaEl = document.getElementById('profile-submeta');
            if (submetaEl) {
                const joinStr = formatYearMonth(user.createdAt);
                submetaEl.textContent = `@${user.username.toLowerCase()} · tham gia ${joinStr}`;
            }

            const inputNewName = document.getElementById('new-username');
            if (inputNewName) inputNewName.value = user.username;

            // Stat: Points
            const pointsVal = user.points || 0;
            const pointsEl = document.getElementById('stat-points');
            if (pointsEl) pointsEl.textContent = pointsVal;

            const pointsHintEl = document.getElementById('stat-points-hint');
            if (pointsHintEl) {
                pointsHintEl.textContent = pointsVal > 0 ? `${pointsVal} điểm tích lũy` : 'Giải bài đầu tiên';
            }
            
            // Sync Dark Mode switch
            const darkSwitch = document.getElementById('profile-dark-switch');
            const isDark = document.body.classList.contains('dark-mode') || 
                           document.documentElement.classList.contains('dark-mode') || 
                           localStorage.getItem('smp-dark-mode') === 'true';
            
            if (darkSwitch) {
                darkSwitch.checked = isDark;
            }

            const localTheme = localStorage.getItem('smp-dark-mode');
            if (localTheme === null && user.theme_preference) {
                if (window.DarkMode) {
                    if (user.theme_preference === 'dark') window.DarkMode.enable(true);
                    else window.DarkMode.disable(true);
                }
                if (darkSwitch) darkSwitch.checked = (user.theme_preference === 'dark');
            } else if (localTheme !== null && user.theme_preference !== (isDark ? 'dark' : 'light')) {
                updateThemePreference(isDark ? 'dark' : 'light');
            }
        }
    } catch (e) {
        console.error("Failed to load user data", e);
    }
    
    // 2. Fetch Activity for Heatmap & Streak Stats
    try {
        const res = await fetch(`${API_BASE_URL}/api/activity/`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-cache'
        });
        if (res.ok) {
            const activities = await res.json();
            renderHeatmap(activities);
            calculateAndRenderStreaks(activities);
        } else {
            renderHeatmap([]);
            calculateAndRenderStreaks([]);
        }
    } catch (e) {
        console.error("Failed to load activity", e);
        renderHeatmap([]);
        calculateAndRenderStreaks([]);
    }
    
    // Check admin access
    if (username && username.toUpperCase() === 'SMP') {
        checkAdminAccess(token, API_BASE_URL);
    }

    // Click outside to close admin inspector modal
    const inspectorModal = document.getElementById('admin-inspector-modal');
    if (inspectorModal) {
        inspectorModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeUserInspector();
            }
        });
    }

    // Click outside to close streak guide modal
    const streakModal = document.getElementById('streak-guide-modal');
    if (streakModal) {
        streakModal.addEventListener('click', function(e) {
            if (e.target === this) {
                window.toggleStreakGuide();
            }
        });
    }
});

// ============================================
// TAB NAVIGATION
// ============================================
window.switchMainTab = function(tab) {
    const tabBtns = document.querySelectorAll('.prof-tab-btn[data-tab]');
    tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const overviewSec = document.getElementById('tab-sec-overview');
    const settingsSec = document.getElementById('tab-sec-settings');
    const adminSec = document.getElementById('admin-dashboard-section');

    if (overviewSec) overviewSec.style.display = 'none';
    if (settingsSec) settingsSec.style.display = 'none';
    if (adminSec) adminSec.style.display = 'none';

    if (tab === 'overview' && overviewSec) {
        overviewSec.style.display = 'block';
    } else if (tab === 'settings' && settingsSec) {
        settingsSec.style.display = 'block';
    } else if (tab === 'admin' && adminSec) {
        adminSec.style.display = 'block';
        loadAdminDashboard();
    }
};

window.switchProfileTab = function(tab) {
    if (tab === 'user') window.switchMainTab('overview');
    else window.switchMainTab(tab);
};

// ============================================
// HEATMAP & STREAK LOGIC
// ============================================
function formatDateYMD(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function renderHeatmap(activities) {
    const heatmap = document.getElementById('activity-heatmap');
    if (!heatmap) return;
    heatmap.innerHTML = '';
    
    // Map dates to counts
    const actDict = {};
    activities.forEach(a => {
        actDict[a.date] = a.solve_count;
    });
    
    // 52 weeks * 7 days = 364 cells aligned to Monday..Sunday
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // Mon=0, Sun=6
    
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + (6 - currentDayOfWeek)); // Sunday of current week
    
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (52 * 7 - 1)); // Monday 51 weeks before
    
    const tooltip = document.getElementById('prof-heatmap-tooltip');
    
    function positionTooltip(e) {
        if (!tooltip) return;
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY - 12}px`;
    }

    for (let i = 0; i < 364; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateStr = formatDateYMD(d);
        const count = actDict[dateStr] || 0;
        
        let level = 0;
        if (count >= 5) level = 4;
        else if (count >= 3) level = 3;
        else if (count >= 2) level = 2;
        else if (count >= 1) level = 1;
        
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.setAttribute('data-level', level);
        cell.setAttribute('data-date', dateStr);
        cell.setAttribute('data-count', count);
        
        if (tooltip) {
            cell.addEventListener('mouseenter', (e) => {
                const countText = count > 0 ? `${count} bài` : '0 bài';
                tooltip.textContent = `${dateStr} · ${countText}`;
                tooltip.style.display = 'block';
                positionTooltip(e);
            });
            cell.addEventListener('mousemove', (e) => {
                positionTooltip(e);
            });
            cell.addEventListener('mouseleave', () => {
                tooltip.style.display = 'none';
            });
        }
        
        heatmap.appendChild(cell);
    }
}

function calculateAndRenderStreaks(activities) {
    const actDict = {};
    let totalSolved = 0;
    activities.forEach(a => {
        actDict[a.date] = a.solve_count;
        totalSolved += (a.solve_count || 0);
    });

    const now = new Date();
    const todayStr = formatDateYMD(now);
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatDateYMD(yesterday);

    // 1. Current streak calculation
    let currentStreak = 0;
    let checkDate = null;
    if ((actDict[todayStr] || 0) > 0) {
        checkDate = new Date(now);
    } else if ((actDict[yesterdayStr] || 0) > 0) {
        checkDate = yesterday;
    }

    if (checkDate) {
        for (let i = 0; i < 365; i++) {
            const d = new Date(checkDate);
            d.setDate(checkDate.getDate() - i);
            const dateStr = formatDateYMD(d);
            if ((actDict[dateStr] || 0) > 0) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // 2. Max streak calculation in past 365 days
    let maxStreak = 0;
    let tempStreak = 0;
    for (let i = 364; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = formatDateYMD(d);
        if ((actDict[dateStr] || 0) > 0) {
            tempStreak++;
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
    }

    // 3. Render into DOM
    const summaryEl = document.getElementById('heatmap-summary');
    if (summaryEl) summaryEl.textContent = `${totalSolved} bài trong 12 tháng qua`;

    const streakEl = document.getElementById('stat-streak');
    if (streakEl) streakEl.textContent = currentStreak;

    const streakHintEl = document.getElementById('stat-streak-hint');
    if (streakHintEl) streakHintEl.textContent = `Kỷ lục: ${maxStreak} ngày`;

    const solvedEl = document.getElementById('stat-solved');
    if (solvedEl) solvedEl.textContent = totalSolved;

    const solvedHintEl = document.getElementById('stat-solved-hint');
    if (solvedHintEl) solvedHintEl.textContent = totalSolved > 0 ? 'Đã hoàn thành' : 'Chưa có bài nào';

    const maxStreakEl = document.getElementById('stat-max-streak');
    if (maxStreakEl) maxStreakEl.textContent = maxStreak;

    const maxStreakHintEl = document.getElementById('stat-max-streak-hint');
    if (maxStreakHintEl) {
        maxStreakHintEl.textContent = maxStreak > 0 ? (maxStreak >= 7 ? 'Phong độ xuất sắc' : 'Duy trì phong độ') : 'Chưa xếp hạng';
    }
}

// ============================================
// STREAK GUIDE MODAL
// ============================================
window.toggleStreakGuide = function() {
    const modal = document.getElementById('streak-guide-modal');
    if (!modal) return;
    const isShowing = modal.style.display === 'flex';
    if (isShowing) {
        modal.style.opacity = '0';
        if (modal.children[0]) modal.children[0].style.transform = 'translateY(20px)';
        setTimeout(() => { modal.style.display = 'none'; }, 200);
    } else {
        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            if (modal.children[0]) modal.children[0].style.transform = 'translateY(0)';
        });
    }
};

// ============================================
// SETTINGS: THEME, USERNAME, PASSWORD, DELETE
// ============================================
window.toggleProfileThemeSwitch = function(checkbox) {
    const isDark = checkbox.checked;
    if (window.DarkMode) {
        if (isDark) {
            window.DarkMode.enable();
        } else {
            window.DarkMode.disable();
        }
    } else {
        if (isDark) {
            document.documentElement.classList.add('dark-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('smp-dark-mode', 'true');
        } else {
            document.documentElement.classList.remove('dark-mode');
            document.body.classList.remove('dark-mode');
            localStorage.setItem('smp-dark-mode', 'false');
        }
    }
    updateThemePreference(isDark ? 'dark' : 'light');
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
    
    if (!input || !token) return;
    btn.disabled = true;
    msg.style.display = 'none';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/activity/settings/username`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_username: input.value.trim() })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.detail || "Đổi tên thất bại.");
        
        msg.textContent = data.message || "Cập nhật tên thành công!";
        msg.className = 'msg success';
        msg.style.display = 'block';
        
        localStorage.setItem('smp_username', data.new_username);
        
        const usernameEl = document.getElementById('profile-username');
        if (usernameEl) usernameEl.textContent = data.new_username;

        const avatarEl = document.getElementById('profile-avatar');
        if (avatarEl) avatarEl.textContent = data.new_username.charAt(0).toUpperCase();

        const submetaEl = document.getElementById('profile-submeta');
        if (submetaEl) {
            const currentSubmeta = submetaEl.textContent;
            const joinPart = currentSubmeta.includes('·') ? currentSubmeta.split('·')[1].trim() : 'tham gia 2026-03';
            submetaEl.textContent = `@${data.new_username.toLowerCase()} · ${joinPart}`;
        }
        
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
        
        msg.textContent = data.message || "Đổi mật khẩu thành công!";
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

window.handleDeleteAccount = async function() {
    const confirmed = confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa tài khoản này không?\n\nHành động này không thể hoàn tác. Mọi điểm thưởng, chuỗi ngày và thông tin cá nhân sẽ bị xóa vĩnh viễn.");
    if (!confirmed) return;
    
    const doubleConfirm = prompt("Vui lòng nhập 'XÓA' để xác nhận xóa tài khoản:");
    if (doubleConfirm !== 'XÓA') {
        alert("Thao tác đã được hủy.");
        return;
    }
    
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert("Tài khoản của bạn đã được xóa thành công.");
            if (window.handleLogout) {
                window.handleLogout();
            } else {
                localStorage.removeItem('smp_access_token');
                localStorage.removeItem('smp_username');
                window.location.href = '/home.html';
            }
        } else {
            const data = await res.json().catch(() => ({}));
            alert("Không thể xóa tài khoản: " + (data.detail || "Vui lòng liên hệ quản trị viên."));
        }
    } catch (err) {
        console.error("Delete account error:", err);
        alert("Lỗi kết nối khi gửi yêu cầu xóa tài khoản.");
    }
};

// ============================================
// ADMIN DASHBOARD LOGIC
// ============================================
let allAdminUsers = [];
let currentInspectorUserId = null;

async function checkAdminAccess(token, API_BASE_URL) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const adminTabBtn = document.getElementById('tab-btn-admin');
            if (adminTabBtn) adminTabBtn.style.display = 'inline-block';
        }
    } catch (e) {
        // Not admin or network error
    }
}

async function loadAdminDashboard() {
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const [statsRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (statsRes.ok) {
            const stats = await statsRes.json();
            document.getElementById('admin-stat-users').textContent = stats.total_users;
            document.getElementById('admin-stat-comments').textContent = stats.total_comments;
            document.getElementById('admin-stat-flagged').textContent = stats.flagged_users;
        }
        
        if (usersRes.ok) {
            allAdminUsers = await usersRes.json();
            renderAdminUsers(allAdminUsers);
        }
    } catch (e) {
        console.error("Failed to load admin data", e);
    }
}

window.filterAdminUsers = function(query) {
    const q = query.toLowerCase();
    const filtered = allAdminUsers.filter(u => 
        u.username.toLowerCase().includes(q) || 
        (u.email && u.email.toLowerCase().includes(q))
    );
    renderAdminUsers(filtered);
};

function renderAdminUsers(users) {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    users.forEach(u => {
        const tr = document.createElement('tr');
        
        let statusHtml = '<span class="admin-badge badge-normal">Bình thường</span>';
        if (u.is_suspended) {
            statusHtml = '<span class="admin-badge badge-suspended">Đã khóa</span>';
        } else if (u.flagged) {
            statusHtml = '<span class="admin-badge badge-flagged">Cảnh báo</span>';
        }
        
        const shortId = u.id.substring(u.id.length - 6);
        
        tr.innerHTML = `
            <td style="color: var(--prof-muted); font-family: monospace;">...${shortId}</td>
            <td style="font-weight: bold; color: var(--prof-ink);">${u.username}</td>
            <td>${u.points}</td>
            <td>-</td>
            <td>${statusHtml}</td>
            <td>
                <button class="prof-btn-edit" onclick="openUserInspector('${u.id}')">Kiểm Tra</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openUserInspector = async function(userId) {
    currentInspectorUserId = userId;
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/detail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to load user details");
        const data = await res.json();
        
        const user = data.profile;
        document.getElementById('insp-avatar').textContent = user.username.charAt(0).toUpperCase();
        document.getElementById('insp-username').textContent = user.username;
        document.getElementById('insp-email').textContent = user.email || 'No email';
        document.getElementById('insp-joined').textContent = new Date(user.createdAt).toLocaleDateString('vi-VN');
        document.getElementById('insp-points').textContent = user.points;
        
        // Streak calculation
        let currentStreak = 0;
        if (data.activities && data.activities.length > 0) {
            const actDict = {};
            data.activities.forEach(a => { actDict[a.date] = a.solve_count; });
            const today = new Date();
            for (let i = 0; i < 365; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = formatDateYMD(d);
                if ((actDict[dateStr] || 0) > 0) {
                    currentStreak++;
                } else if (i !== 0) {
                    break;
                }
            }
        }
        document.getElementById('insp-streak').textContent = currentStreak;
        
        const anomaly = document.getElementById('insp-anomaly');
        if (user.flagged) {
            anomaly.style.display = 'block';
            document.getElementById('insp-anomaly-msg').textContent = `Lý do: ${user.flagged_reason || 'Không có'}`;
        } else if (user.is_suspended) {
            anomaly.style.display = 'block';
            document.getElementById('insp-anomaly-msg').textContent = `Tài khoản này đã bị KHÓA.`;
        } else {
            anomaly.style.display = 'none';
        }
        
        document.getElementById('insp-flag-chk').checked = user.flagged;
        document.getElementById('insp-flag-reason-container').style.display = user.flagged ? 'block' : 'none';
        document.getElementById('insp-flag-reason').value = user.flagged_reason || '';
        document.getElementById('insp-suspend-chk').checked = user.is_suspended;
        document.getElementById('insp-adjust-points').value = '';
        
        // Render Heatmap in Inspector
        const heatmap = document.getElementById('insp-heatmap');
        heatmap.innerHTML = '';
        const now = new Date();
        const actDict = {};
        data.activities.forEach(a => { actDict[a.date] = a.solve_count; });
        for (let i = 364; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateStr = formatDateYMD(d);
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            const count = actDict[dateStr] || 0;
            let level = 0;
            if (count >= 5) level = 4;
            else if (count >= 3) level = 3;
            else if (count >= 2) level = 2;
            else if (count >= 1) level = 1;
            cell.setAttribute('data-level', level);
            cell.setAttribute('title', `${dateStr}: ${count} hoạt động`);
            heatmap.appendChild(cell);
        }
        
        // Render comments
        const commentsList = document.getElementById('insp-comments-list');
        commentsList.innerHTML = '';
        if (data.recent_comments && data.recent_comments.length > 0) {
            data.recent_comments.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment-item';
                div.innerHTML = `
                    <div style="font-size: 0.8rem; color: var(--prof-muted); margin-bottom: 4px;">
                        ${new Date(c.createdAt).toLocaleString('vi-VN')}
                    </div>
                    <div style="color: var(--prof-ink); margin-bottom: 4px;">${c.content}</div>
                `;
                commentsList.appendChild(div);
            });
        } else {
            commentsList.innerHTML = '<div style="color: var(--prof-muted); font-size: 0.9rem;">Chưa có bình luận nào.</div>';
        }
        
        document.getElementById('admin-inspector-modal').style.display = 'flex';
        
    } catch (e) {
        console.error("Error opening inspector", e);
        alert("Có lỗi xảy ra khi tải dữ liệu người dùng.");
    }
};

window.closeUserInspector = function() {
    document.getElementById('admin-inspector-modal').style.display = 'none';
    currentInspectorUserId = null;
};

window.submitFlag = async function() {
    if (!currentInspectorUserId) return;
    const isFlagged = document.getElementById('insp-flag-chk').checked;
    const reason = document.getElementById('insp-flag-reason').value;
    
    await adminPostRequest(`/api/admin/users/${currentInspectorUserId}/flag`, {
        flagged: isFlagged,
        reason: reason
    });
};

window.submitSuspend = async function() {
    if (!currentInspectorUserId) return;
    const isSuspended = document.getElementById('insp-suspend-chk').checked;
    
    await adminPostRequest(`/api/admin/users/${currentInspectorUserId}/suspend`, {
        is_suspended: isSuspended
    });
};

window.submitAdjustPoints = async function() {
    if (!currentInspectorUserId) return;
    const pointsDiff = parseInt(document.getElementById('insp-adjust-points').value);
    if (!pointsDiff || isNaN(pointsDiff)) return;
    
    await adminPostRequest(`/api/admin/users/${currentInspectorUserId}/adjust`, {
        points_diff: pointsDiff
    });
};

async function adminPostRequest(endpoint, body) {
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            alert("Thao tác thành công!");
            loadAdminDashboard();
            openUserInspector(currentInspectorUserId);
        } else {
            const d = await res.json();
            alert("Lỗi: " + (d.detail || "Không rõ nguyên nhân."));
        }
    } catch (e) {
        alert("Lỗi kết nối.");
    }
}
