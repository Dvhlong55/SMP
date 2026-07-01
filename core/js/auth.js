// ==========================================
// SMP AUTH MODULE — Modal-based (v2)
// ==========================================

const API_BASE_URL = 'https://smp-backend-kcwn.onrender.com';

// ─── Session Expiration Handler ──────────────────────────────────────────────
window.handleExpiredSession = function(errUrl) {
    localStorage.removeItem('smp_access_token');
    localStorage.removeItem('smp_username');
    if (window.applyAuthUI) {
        window.applyAuthUI(null);
    }
    
    // Show toast
    const toast = document.getElementById('auth-toast');
    if (toast) {
        let msg = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        if (errUrl) msg += ` (Lỗi tại: ${errUrl})`;
        toast.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' + msg;
        toast.style.display = 'block';
        toast.style.background = 'rgba(231,76,60,0.95)';
        setTimeout(() => { toast.style.display = 'none'; toast.style.background = ''; }, 5000);
    }

    // Automatically open the login modal
    if (window.openAuthModal) {
        window.openAuthModal('login');
    }
};

// ─── Global Fetch Interceptor for 401/403 ─────────────────────────────────────
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        let urlStr = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
        let options = args[1] || {};

        if (urlStr && options && options.headers) {
            let hasAuth = false;
            if (options.headers instanceof Headers) hasAuth = options.headers.has('Authorization');
            else if (Array.isArray(options.headers)) hasAuth = options.headers.some(h => h[0].toLowerCase() === 'authorization');
            else hasAuth = Object.keys(options.headers).some(k => k.toLowerCase() === 'authorization');

            if (hasAuth && (!options.method || options.method.toUpperCase() === 'GET')) {
                const separator = urlStr.includes('?') ? '&' : '?';
                urlStr += `${separator}_cb=${Date.now()}`;
                
                if (typeof args[0] === 'string') args[0] = urlStr;
                else if (args[0] instanceof Request) args[0] = new Request(urlStr, args[0]);
                else if (args[0] instanceof URL) args[0] = new URL(urlStr);
                
                options.cache = 'no-store';
                args[1] = options;
            }
        }

        const res = await originalFetch(...args);
        
        // Bỏ qua interceptor đối với request đăng nhập/đăng ký
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
        if (url && (url.includes('/api/auth/login') || url.includes('/api/auth/register'))) {
            return res;
        }

        if (res.status === 401 || (res.status === 403 && (!url || !url.includes('/api/admin/')))) {
            // Check if we are currently logged in to avoid intercepting non-logged-in requests
            if (localStorage.getItem('smp_access_token')) {
                const debugUrl = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);
                console.warn('Session expired (401/403). Logging out...', debugUrl);
                window.handleExpiredSession(debugUrl);
            }
        }
        return res;
    } catch (err) {
        throw err;
    }
};

// ─── Open/Close Modal ────────────────────────────────────────────────────────
window.openAuthModal = function(mode) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show'));
    showAuthTab(mode || 'login');
};

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
};

window.showAuthTab = function(tab) {
    const loginEl = document.getElementById('auth-login-tab');
    const registerEl = document.getElementById('auth-register-tab');
    const profileEl = document.getElementById('auth-profile-tab');
    const forgotEl = document.getElementById('auth-forgot-tab');
    const resetEl = document.getElementById('auth-reset-tab');
    const tabs = document.querySelectorAll('.auth-modal-tab');

    [loginEl, registerEl, profileEl, forgotEl, resetEl].forEach(el => el && (el.style.display = 'none'));
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login' && loginEl) {
        loginEl.style.display = 'block';
        document.querySelector('.auth-modal-tab[data-tab="login"]')?.classList.add('active');
    } else if (tab === 'register' && registerEl) {
        registerEl.style.display = 'block';
        document.querySelector('.auth-modal-tab[data-tab="register"]')?.classList.add('active');
    } else if (tab === 'profile' && profileEl) {
        profileEl.style.display = 'block';
    } else if (tab === 'forgot' && forgotEl) {
        forgotEl.style.display = 'block';
    } else if (tab === 'reset' && resetEl) {
        resetEl.style.display = 'block';
    }
};

// ─── Helper: show inline message ─────────────────────────────────────────────
function showMsg(id, text, isError = true) {
    const el = document.getElementById(id);
    if (!el) return;
    const icon = isError 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>' 
        : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><polyline points="20 6 9 17 4 12"/></svg>';
    el.innerHTML = icon + text.replace(/^[✅❌]\s*/, '');
    el.style.display = 'block';
    el.className = 'auth-msg ' + (isError ? 'auth-msg-error' : 'auth-msg-success');
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ─── Update Topbar + Sidebar UI after login/logout ───────────────────────────
window.applyAuthUI = function(username) {
    const sidebarBtn = document.getElementById('sidebar-auth-btn');
    const topbarBtn  = document.getElementById('topbar-auth-btn');
    const mobileTopbarBtn = document.getElementById('mobile-topbar-auth-btn');
    if (username) {
        const html = `&#x2637; ${username}`;
        
        const profilePath = window.location.pathname.includes('/SMP/') ? '/SMP/pages/profile.html' : '/pages/profile.html';
        
        if (sidebarBtn) { sidebarBtn.innerHTML = html; sidebarBtn.onclick = function(e){ e.preventDefault(); window.location.href = profilePath; }; }
        if (topbarBtn)  { topbarBtn.innerHTML  = html; topbarBtn.onclick  = function(e){ e.preventDefault(); window.location.href = profilePath; }; }
        if (mobileTopbarBtn) { mobileTopbarBtn.onclick = function(e){ e.preventDefault(); window.location.href = profilePath; }; }
        // Fill profile tab
        const nameEl = document.getElementById('auth-profile-username');
        if (nameEl) nameEl.textContent = username;
    } else {
        if (sidebarBtn) { sidebarBtn.innerHTML = '&#x2637; Login'; sidebarBtn.onclick = function(e){ e.preventDefault(); window.openAuthModal('login'); }; }
        if (topbarBtn)  { topbarBtn.innerHTML  = '&#x2637; Login'; topbarBtn.onclick  = function(e){ e.preventDefault(); window.openAuthModal('login'); }; }
        if (mobileTopbarBtn) { mobileTopbarBtn.onclick = function(e){ e.preventDefault(); window.openAuthModal('login'); }; }
    }
};
const applyAuthUI = window.applyAuthUI;

// ─── Login ────────────────────────────────────────────────────────────────────
window.handleLogin = async function(event) {
    event.preventDefault();
    const form = event.target;
    
    // Find inputs within the submitted form
    const usernameInput = form.querySelector('input[autocomplete="username"]') || form.querySelector('input[id*="username"]');
    const passwordInput = form.querySelector('input[autocomplete="current-password"]') || form.querySelector('input[id*="password"]');
    const btn = form.querySelector('button[type="submit"]');
    
    // Determine which message box to use
    let msgId = form.id === 'login-form' ? 'login-error' : 'modal-login-msg';
    let successMsgId = form.id === 'login-form' ? 'login-success' : 'modal-login-msg';

    const username = usernameInput?.value.trim();
    const password = passwordInput?.value;
    
    if (!username || !password) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng nhập...'; }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Sai tài khoản hoặc mật khẩu.');

        localStorage.setItem('smp_access_token', data.access_token);
        localStorage.setItem('smp_username', username);

        showMsg(successMsgId, '✅ Đăng nhập thành công! Chuyển hướng...', false);
        applyAuthUI(username);

        // Fetch user data to sync theme
        try {
            const meRes = await fetch(`${API_BASE_URL}/api/auth/me?_t=${Date.now()}`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` },
                cache: 'no-store'
            });
            if (meRes.ok) {
                const meData = await meRes.json();
                localStorage.setItem('smp_user_id', meData.id);
                if (meData.theme_preference) {
                    if (window.DarkMode) {
                        if (meData.theme_preference === 'dark') window.DarkMode.enable(true);
                        else window.DarkMode.disable(true);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        setTimeout(() => {
            const profilePath = window.location.pathname.includes('/SMP/') ? '/SMP/pages/profile.html' : '/pages/profile.html';
            window.location.href = profilePath;
        }, 800);
    } catch (err) {
        showMsg(msgId, err.message, true);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'ĐĂNG NHẬP'; }
    }
};

// ─── Register ─────────────────────────────────────────────────────────────────
window.handleRegister = async function(event) {
    event.preventDefault();
    const form = event.target;
    
    const usernameInput = form.querySelector('input[autocomplete="username"]') || form.querySelector('input[id*="username"]');
    const emailInput = form.querySelector('input[autocomplete="email"]') || form.querySelector('input[id*="email"]');
    const passwordInput = form.querySelector('input[autocomplete="new-password"]') || form.querySelector('input[id*="password"]:not([id*="confirm"])');
    const confirmInput = form.querySelectorAll('input[type="password"]')[1] || document.getElementById('modal-reg-confirm');
    const btn = form.querySelector('button[type="submit"]');
    
    let msgId = form.id === 'register-form' ? 'register-error' : 'modal-reg-msg';
    let successMsgId = form.id === 'register-form' ? 'register-success' : 'modal-reg-msg';

    const username = usernameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value;
    const confirm = confirmInput?.value;

    if (password !== confirm) { showMsg(msgId, 'Mật khẩu xác nhận không khớp.', true); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng ký...'; }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Đăng ký thất bại.');

        showMsg(successMsgId, '✅ Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt.', false);
        setTimeout(() => {
            if (form.id === 'register-form') {
                if (typeof toggleAuthMode === 'function') toggleAuthMode('login');
                const u = document.getElementById('login-username');
                if (u) u.value = username;
            } else {
                showAuthTab('login');
                const u = document.getElementById('modal-login-username');
                if (u) u.value = username;
            }
        }, 2500);
    } catch (err) {
        showMsg(msgId, err.message, true);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'ĐĂNG KÝ'; }
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
window.handleLogout = function() {
    localStorage.removeItem('smp_access_token');
    localStorage.removeItem('smp_username');
    applyAuthUI(null);
    window.closeAuthModal();
    // Show brief toast and reload page
    const toast = document.getElementById('auth-toast');
    if (toast) {
        toast.textContent = 'Đã đăng xuất.';
        toast.style.display = 'block';
        setTimeout(() => { 
            toast.style.display = 'none'; 
            window.location.reload();
        }, 1000);
    } else {
        window.location.reload();
    }
};

// ─── Auto Token Verification (on every page load) ────────────────────────────
async function verifyToken() {
    const token = localStorage.getItem('smp_access_token');
    const storedUsername = localStorage.getItem('smp_username');

    if (!token) {
        applyAuthUI(null);
        return;
    }

    // Optimistic: show username immediately, then verify
    applyAuthUI(storedUsername);

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me?_t=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        
        if (res.status === 401 || res.status === 403) {
            // Explicit expired or invalid token
            console.warn('verifyToken: Token expired or invalid status:', res.status);
            window.handleExpiredSession();
            return;
        }

        if (!res.ok) {
            // Other server error (e.g. 500, 502, 503) — keep optimistic session
            console.warn('verifyToken: Server error (not 401/403):', res.status);
            return;
        }

        const user = await res.json();
        localStorage.setItem('smp_username', user.username);
        localStorage.setItem('smp_user_id', user.id);
        applyAuthUI(user.username);
    } catch (err) {
        // Network error (e.g. Render server offline or sleeping) — keep optimistic session
        console.warn('verifyToken: Network error/Server offline during verification:', err);
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initAuth() {
    verifyToken();
    checkRecoveryParams();

    // Close modal when clicking backdrop
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) window.closeAuthModal();
        });
    }

    // ESC key closes modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') window.closeAuthModal();
    });
}

window.handleForgotPassword = async function(event) {
    event.preventDefault();
    const email = document.getElementById('modal-forgot-email').value.trim();
    const btn = document.getElementById('modal-forgot-btn');
    const msg = document.getElementById('modal-forgot-msg');
    
    btn.disabled = true;
    btn.textContent = 'ĐANG XỬ LÝ...';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Có lỗi xảy ra.");
        
        msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><polyline points="20 6 9 17 4 12"/></svg> ' + data.message;
        msg.className = 'auth-msg auth-msg-success';
        msg.style.display = 'block';
        document.getElementById('modal-forgot-email').value = '';
    } catch (err) {
        msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> ' + err.message;
        msg.className = 'auth-msg auth-msg-error';
        msg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'KÍCH HOẠT ĐỔI MẬT KHẨU';
    }
};

window.handleResetPassword = async function(event) {
    event.preventDefault();
    const token = document.getElementById('modal-reset-token').value;
    const password = document.getElementById('modal-reset-password').value;
    const confirm = document.getElementById('modal-reset-confirm').value;
    const btn = document.getElementById('modal-reset-btn');
    const msg = document.getElementById('modal-reset-msg');
    
    if (password !== confirm) {
        msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Mật khẩu xác nhận không khớp.';
        msg.className = 'auth-msg auth-msg-error';
        msg.style.display = 'block';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'ĐANG CẬP NHẬT...';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, new_password: password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Có lỗi xảy ra.");
        
        msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><polyline points="20 6 9 17 4 12"/></svg> ' + data.message;
        msg.className = 'auth-msg auth-msg-success';
        msg.style.display = 'block';
        
        setTimeout(() => {
            window.showAuthTab('login');
            window.openAuthModal('login');
        }, 2000);
    } catch (err) {
        msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> ' + err.message;
        msg.className = 'auth-msg auth-msg-error';
        msg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'ĐỔI MẬT KHẨU';
    }
};

function checkRecoveryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const token = urlParams.get('token');
    
    if (action === 'reset-password' && token) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            window.openAuthModal('reset');
            const tokenInput = document.getElementById('modal-reset-token');
            if (tokenInput) tokenInput.value = token;
        }, 500);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
