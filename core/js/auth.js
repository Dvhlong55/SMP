// --- CONFIGURATION ---
const API_BASE_URL = 'https://smp-backend-kcwn.onrender.com';

function toggleAuthMode(mode) {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    if (loginContainer && registerContainer) {
        if (mode === 'login') {
            loginContainer.style.display = 'block';
            registerContainer.style.display = 'none';
        } else {
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        }
    }
}

// Helper to show messages
function showMessage(elementId, text, isError = true) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerText = text;
    el.style.display = 'block';
    if (isError) {
        el.className = 'message-box message-error';
    } else {
        el.className = 'message-box message-success';
    }
    // Auto hide after 5 seconds
    setTimeout(() => {
        el.style.display = 'none';
    }, 5000);
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();
    const usernameEl = document.getElementById('register-username');
    const emailEl = document.getElementById('register-email');
    const passwordEl = document.getElementById('register-password');
    const confirmPasswordEl = document.getElementById('register-confirm-password');
    
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const confirmPassword = confirmPasswordEl.value;
    
    if (password !== confirmPassword) {
        showMessage('register-error', 'Mật khẩu xác nhận không khớp.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
        
        showMessage('register-success', 'Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản của bạn.', false);
        usernameEl.value = '';
        emailEl.value = '';
        passwordEl.value = '';
        confirmPasswordEl.value = '';
        
        // Auto switch to login after 5s (give user time to read email activation prompt)
        setTimeout(() => {
            toggleAuthMode('login');
            // Auto fill username
            const loginUserEl = document.getElementById('login-username');
            if (loginUserEl) loginUserEl.value = username;
        }, 5000);
        
        
    } catch (err) {
        showMessage('register-error', err.message);
    }
}

// Login handler
async function handleLogin(event) {
    event.preventDefault();
    const usernameEl = document.getElementById('login-username');
    const passwordEl = document.getElementById('login-password');
    
    const username = usernameEl.value.trim();
    const password = passwordEl.value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Sai tài khoản hoặc mật khẩu.');
        }
        
        // Save token to localStorage
        localStorage.setItem('smp_access_token', data.access_token);
        localStorage.setItem('smp_username', username);
        
        showMessage('login-success', 'Đăng nhập thành công!', false);
        
        setTimeout(() => {
            // Reload to apply auth state
            window.location.reload();
        }, 1000);
        
    } catch (err) {
        showMessage('login-error', err.message);
    }
}

// Logout handler
function handleLogout() {
    localStorage.removeItem('smp_access_token');
    localStorage.removeItem('smp_username');
    window.location.reload();
}

// Check current user status (run on page load)
async function checkAuthStatus() {
    const token = localStorage.getItem('smp_access_token');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const userContainer = document.getElementById('user-container');
    const userDisplayName = document.getElementById('user-display-name');
    
    if (!token) {
        // Not logged in
        if (loginContainer) loginContainer.style.display = 'block';
        if (registerContainer) registerContainer.style.display = 'none';
        if (userContainer) userContainer.style.display = 'none';
        return null;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            // Token expired or invalid
            throw new Error('Unauthorized');
        }
        
        const user = await response.json();
        
        // Logged in
        if (loginContainer) loginContainer.style.display = 'none';
        if (registerContainer) registerContainer.style.display = 'none';
        if (userContainer) userContainer.style.display = 'block';
        if (userDisplayName) userDisplayName.innerText = user.username;
        
        // Keep name updated in localStorage
        localStorage.setItem('smp_username', user.username);
        return user;
    } catch (e) {
        // Clear invalid tokens
        localStorage.removeItem('smp_access_token');
        localStorage.removeItem('smp_username');
        if (loginContainer) loginContainer.style.display = 'block';
        if (registerContainer) registerContainer.style.display = 'none';
        if (userContainer) userContainer.style.display = 'none';
        return null;
    }
}

// Run auth check on DOMContentLoaded if we are on the auth page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('login-form')) {
        checkAuthStatus();
    }
});
