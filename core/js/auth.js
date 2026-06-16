// ==========================================
// SMP AUTH MODULE — Modal-based (v2)
// ==========================================

const API_BASE_URL = 'https://smp-backend-kcwn.onrender.com';

// ─── Session Expiration Handler ──────────────────────────────────────────────
window.handleExpiredSession = function() {
    localStorage.removeItem('smp_access_token');
    localStorage.removeItem('smp_username');
    if (window.applyAuthUI) {
        window.applyAuthUI(null);
    }
    
    // Show toast
    const toast = document.getElementById('auth-toast');
    if (toast) {
        toast.textContent = '⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
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
        const res = await originalFetch(...args);
        if (res.status === 401 || res.status === 403) {
            // Check if we are currently logged in to avoid intercepting non-logged-in requests
            if (localStorage.getItem('smp_access_token')) {
                console.warn('Session expired (401/403). Logging out...');
                window.handleExpiredSession();
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
    const tabs = document.querySelectorAll('.auth-modal-tab');

    [loginEl, registerEl, profileEl].forEach(el => el && (el.style.display = 'none'));
    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login' && loginEl) {
        loginEl.style.display = 'block';
        document.querySelector('.auth-modal-tab[data-tab="login"]')?.classList.add('active');
    } else if (tab === 'register' && registerEl) {
        registerEl.style.display = 'block';
        document.querySelector('.auth-modal-tab[data-tab="register"]')?.classList.add('active');
    } else if (tab === 'profile' && profileEl) {
        profileEl.style.display = 'block';
    }
};

// ─── Helper: show inline message ─────────────────────────────────────────────
function showMsg(id, text, isError = true) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = text;
    el.style.display = 'block';
    el.className = 'auth-msg ' + (isError ? 'auth-msg-error' : 'auth-msg-success');
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// ─── Update Topbar + Sidebar UI after login/logout ───────────────────────────
window.applyAuthUI = function(username) {
    const sidebarBtn = document.getElementById('sidebar-auth-btn');
    const topbarBtn  = document.getElementById('topbar-auth-btn');
    if (username) {
        const html = `&#x2637; ${username}`;
        if (sidebarBtn) { sidebarBtn.innerHTML = html; sidebarBtn.onclick = function(e){ e.preventDefault(); window.openAuthModal('profile'); }; }
        if (topbarBtn)  { topbarBtn.innerHTML  = html; topbarBtn.onclick  = function(e){ e.preventDefault(); window.openAuthModal('profile'); }; }
        // Fill profile tab
        const nameEl = document.getElementById('auth-profile-username');
        if (nameEl) nameEl.textContent = username;
    } else {
        if (sidebarBtn) { sidebarBtn.innerHTML = '&#x2637; Login'; sidebarBtn.onclick = function(e){ e.preventDefault(); window.openAuthModal('login'); }; }
        if (topbarBtn)  { topbarBtn.innerHTML  = '&#x2637; Login'; topbarBtn.onclick  = function(e){ e.preventDefault(); window.openAuthModal('login'); }; }
    }
};
const applyAuthUI = window.applyAuthUI;

// ─── Login ────────────────────────────────────────────────────────────────────
window.handleLogin = async function(event) {
    event.preventDefault();
    const username = document.getElementById('modal-login-username')?.value.trim();
    const password = document.getElementById('modal-login-password')?.value;
    const btn = document.getElementById('modal-login-btn');
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

        showMsg('modal-login-msg', '✅ Đăng nhập thành công!', false);
        applyAuthUI(username);

        setTimeout(() => window.closeAuthModal(), 800);
    } catch (err) {
        showMsg('modal-login-msg', err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'ĐĂNG NHẬP'; }
    }
};

// ─── Register ─────────────────────────────────────────────────────────────────
window.handleRegister = async function(event) {
    event.preventDefault();
    const username = document.getElementById('modal-reg-username')?.value.trim();
    const email    = document.getElementById('modal-reg-email')?.value.trim();
    const password = document.getElementById('modal-reg-password')?.value;
    const confirm  = document.getElementById('modal-reg-confirm')?.value;
    const btn = document.getElementById('modal-reg-btn');

    if (password !== confirm) { showMsg('modal-reg-msg', 'Mật khẩu xác nhận không khớp.'); return; }

    if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng ký...'; }

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Đăng ký thất bại.');

        showMsg('modal-reg-msg', '✅ Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt.', false);
        setTimeout(() => {
            showAuthTab('login');
            const u = document.getElementById('modal-login-username');
            if (u) u.value = username;
        }, 2500);
    } catch (err) {
        showMsg('modal-reg-msg', err.message);
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
    // Show brief toast
    const toast = document.getElementById('auth-toast');
    if (toast) {
        toast.textContent = '👋 Đã đăng xuất.';
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
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
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
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
        applyAuthUI(user.username);
    } catch (err) {
        // Network error (e.g. Render server offline or sleeping) — keep optimistic session
        console.warn('verifyToken: Network error/Server offline during verification:', err);
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initAuth() {
    verifyToken();

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
