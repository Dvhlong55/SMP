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
        const res = await fetch(`${API_BASE_URL}/api/activity/`, {
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
        cell.setAttribute('title', `${date}: ${count} bình luận`);
        
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
            document.getElementById('admin-tab-container').style.display = 'flex';
        }
    } catch (e) {
        // Not admin or network error
    }
}

window.switchProfileTab = function(tab) {
    const userBtn = document.getElementById('tab-btn-user');
    const adminBtn = document.getElementById('tab-btn-admin');
    const classBtn = document.getElementById('tab-btn-class');
    const userSec = document.getElementById('user-profile-section');
    const adminSec = document.getElementById('admin-dashboard-section');
    const classSec = document.getElementById('class-admin-section');

    userBtn.classList.remove('active');
    adminBtn.classList.remove('active');
    if(classBtn) classBtn.classList.remove('active');
    userSec.style.display = 'none';
    adminSec.style.display = 'none';
    if(classSec) classSec.style.display = 'none';

    if (tab === 'user') {
        userBtn.classList.add('active');
        userSec.style.display = 'block';
    } else if (tab === 'admin') {
        adminBtn.classList.add('active');
        adminSec.style.display = 'block';
        loadAdminDashboard();
    } else if (tab === 'class') {
        if(classBtn) classBtn.classList.add('active');
        if(classSec) classSec.style.display = 'block';
        loadClassDashboard();
    }
};

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
    if(!tbody) return;
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
            <td style="color: var(--text-muted); font-family: monospace;">...${shortId}</td>
            <td style="font-weight: bold; color: var(--text-dark);">${u.username}</td>
            <td>${u.points}</td>
            <td>-</td>
            <td>${statusHtml}</td>
            <td>
                <button class="admin-action-btn" onclick="openUserInspector('${u.id}')">Kiểm Tra</button>
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
        
        // Streak config manually calculate
        let currentStreak = 0;
        if(data.activities && data.activities.length > 0) {
           const actDict = {};
           data.activities.forEach(a => { actDict[a.date] = a.solve_count; });
           const today = new Date();
           for (let i = 0; i < 365; i++) {
               const d = new Date(today);
               d.setDate(today.getDate() - i);
               const dateStr = d.toISOString().split('T')[0];
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
        
        // Render Heatmap
        const heatmap = document.getElementById('insp-heatmap');
        heatmap.innerHTML = '';
        const dates = getPast365Days();
        const actDict = {};
        data.activities.forEach(a => { actDict[a.date] = a.solve_count; });
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
            cell.setAttribute('title', `${date}: ${count} hoạt động`);
            heatmap.appendChild(cell);
        });
        
        // Render comments
        const commentsList = document.getElementById('insp-comments-list');
        commentsList.innerHTML = '';
        if (data.recent_comments && data.recent_comments.length > 0) {
            data.recent_comments.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment-item';
                div.innerHTML = `
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">
                        ${new Date(c.createdAt).toLocaleString('vi-VN')}
                    </div>
                    <div style="color: var(--text-dark); margin-bottom: 4px;">${c.content}</div>
                `;
                commentsList.appendChild(div);
            });
        } else {
            commentsList.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">Chưa có bình luận nào.</div>';
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

// ============================================
// CLASS ADMIN LOGIC
// ============================================

let currentClassId = null;
let currentStudents = [];
let allClasses = [];

async function loadClassDashboard() {
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const classRes = await fetch(`${API_BASE_URL}/api/admin/classes`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (classRes.ok) {
            allClasses = await classRes.json();
            renderClassList();
            if (allClasses.length > 0) {
                selectClass(allClasses[0].id);
            }
        }
    } catch (e) {
        console.error("Failed to load class info", e);
    }
}

function renderClassList() {
    const container = document.getElementById('class-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    allClasses.forEach(cls => {
        const btn = document.createElement('button');
        btn.className = `admin-tab-btn ${cls.id === currentClassId ? 'active' : ''}`;
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.padding = '12px 16px';
        btn.style.display = 'block';
        btn.style.marginBottom = '4px';
        btn.textContent = cls.name;
        btn.onclick = () => selectClass(cls.id);
        container.appendChild(btn);
    });
}

async function selectClass(classId) {
    currentClassId = classId;
    renderClassList(); // Update active state
    
    const cls = allClasses.find(c => c.id === classId);
    if (cls) {
        const title = document.getElementById('class-title-display');
        if (title) title.textContent = `Danh sách: ${cls.name}`;
    }
    
    await fetchStudents();
}

window.promptCreateClass = async function() {
    const name = prompt("Nhập tên lớp học mới:");
    if (!name || name.trim() === "") return;
    
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name.trim() })
        });
        if (res.ok) {
            loadClassDashboard();
        }
    } catch (e) {
        alert("Lỗi khi tạo lớp");
    }
};

async function fetchStudents() {
    if (!currentClassId) return;
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/${currentClassId}/students`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            currentStudents = await res.json();
            renderClassTable();
        }
    } catch (e) {
        console.error("Failed to fetch students", e);
    }
}

function calculateTotalFee(fee_records) {
    let tong = 0;
    ['6', '7', '8'].forEach(m => {
        let val = (fee_records[m] || '').toLowerCase();
        if (val.includes('đã đóng')) tong += 800;
        else if (val.includes('nợ')) {
            const match = val.match(/\d+/);
            if (match) {
                tong += (800 - parseInt(match[0]));
            }
        } else if (val.includes('800')) {
            tong += 800;
        }
    });
    return tong;
}

function renderClassTable() {
    const tbody = document.getElementById('class-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (currentStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có học viên nào</td></tr>';
        return;
    }
    
    currentStudents.forEach(st => {
        const tong = calculateTotalFee(st.fee_records || {});
        
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => window.openStudentModal(st.id);
        
        // Thêm hover effect
        tr.onmouseover = () => { tr.style.backgroundColor = 'rgba(255,255,255,0.05)'; };
        tr.onmouseout = () => { tr.style.backgroundColor = 'transparent'; };
        
        tr.innerHTML = `
            <td style="font-weight: bold; color: var(--text-dark);">${st.full_name}</td>
            <td style="text-align: right; font-weight: bold; color: var(--accent-cyan);">${tong}k</td>
        `;
        tbody.appendChild(tr);
    });
}

window.addNewStudentRow = async function() {
    if (!currentClassId) return;
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    const newStudent = {
        full_name: "Tên Học Viên Mới",
        birth_year: 2010,
        phone: "",
        email: ""
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/${currentClassId}/students`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStudent)
        });
        if (res.ok) {
            await fetchStudents(); // reload
        }
    } catch(e) {}
};

window.openStudentModal = function(studentId) {
    const st = currentStudents.find(x => x.id === studentId);
    if (!st) return;
    
    document.getElementById('modal-student-id').value = st.id;
    document.getElementById('modal-full-name').value = st.full_name || '';
    document.getElementById('modal-birth-year').value = st.birth_year || '';
    document.getElementById('modal-phone').value = st.phone || '';
    document.getElementById('modal-email').value = st.email || '';
    
    const fr = st.fee_records || {};
    document.getElementById('modal-fee-6').value = fr['6'] || '';
    document.getElementById('modal-fee-7').value = fr['7'] || '';
    document.getElementById('modal-fee-8').value = fr['8'] || '';
    
    const modal = document.getElementById('student-detail-modal');
    modal.style.display = 'flex';
    void modal.offsetWidth; // trigger reflow
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'translateY(0)';
};

window.closeStudentModal = function() {
    const modal = document.getElementById('student-detail-modal');
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'translateY(20px)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
};

window.saveStudentFromModal = async function(e) {
    e.preventDefault();
    
    const studentId = document.getElementById('modal-student-id').value;
    if (!studentId) return;
    
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    const payload = {
        full_name: document.getElementById('modal-full-name').value.trim(),
        birth_year: parseInt(document.getElementById('modal-birth-year').value) || 0,
        phone: document.getElementById('modal-phone').value.trim(),
        email: document.getElementById('modal-email').value.trim(),
        fee_records: {
            '6': document.getElementById('modal-fee-6').value.trim(),
            '7': document.getElementById('modal-fee-7').value.trim(),
            '8': document.getElementById('modal-fee-8').value.trim()
        }
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/students/${studentId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            closeStudentModal();
            fetchStudents(); // Refresh UI
        } else {
            alert("Lỗi khi lưu thông tin");
        }
    } catch(err) {
        alert("Lỗi kết nối");
    }
};
