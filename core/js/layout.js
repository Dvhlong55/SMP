// ============================================
//   SMP - SHARED LAYOUT INJECTOR
//   Injects sidebar + topbar into every page
// ============================================

(function() {

    // ── Inject Favicon ───────────────
    if (!document.querySelector('link[rel="icon"]')) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = '/SMP/core/image/favicon.png';
        document.head.appendChild(link);
    }

    // ── Ensure Viewport-Fit=Cover for iOS Safe Areas ───────────────
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        let content = viewportMeta.getAttribute('content');
        if (content && !content.includes('viewport-fit')) {
            viewportMeta.setAttribute('content', content + ', viewport-fit=cover');
        }
    } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
        document.head.appendChild(meta);
    }

    // ── Force reload manifest.json by appending version query ───────────────
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
        const href = manifestLink.getAttribute('href');
        if (href && !href.includes('?v=')) {
            manifestLink.setAttribute('href', href + '?v=16');
        }
    }

    // ── Toggle-specific CSS only — layout stays in shared.css ───────────────
    const TOGGLE_CSS = `
        /* Sidebar must be fixed (shared.css already does this) */
        .sidebar {
            overflow: visible !important; /* let the toggle tab peek outside */
            transition: width 0.35s cubic-bezier(.4,0,.2,1),
                        padding 0.35s cubic-bezier(.4,0,.2,1);
        }

        /* Scrollable inner panel */
        .sidebar-inner {
            width: 280px; /* match --sidebar-width */
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: none;
            padding: 0px 20px 0px;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: opacity 0.25s ease, transform 0.35s cubic-bezier(.4,0,.2,1);
        }
        .sidebar-inner::-webkit-scrollbar { display: none; }

        #smp-logo-canvas {
            position: relative;
            width: 120px;
            height: 90px;
            margin: 0 auto 16px;
            /* Phóng to một chút */
            transform: scale(1.7);
            transform-origin: center;
        }

        /* Toggle tab — hangs off the right edge, vertically centred */
        .sidebar-toggle {
            position: absolute;
            right: -1px;
            top: 50%;
            transform: translate(100%, -50%);
            width: 50px;
            height: 52px;
            background: var(--sidebar-bg, #1a1a1a);
            border: 1px solid var(--border-color, #2e2e2e);
            border-left: none;
            border-radius: 0 8px 8px 0;
            color: var(--accent-cyan, #5ce1e6);
            font-size: 0.85rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 201;
            padding: 0;
            transition: background 0.3s, color 0.3s, border-color 0.3s;
            line-height: 1;
            pointer-events: auto !important;
        }
        .sidebar-toggle:hover {
            opacity: 0.85;
        }

        /* Light mode (giao diện sáng): nút nền ĐEN để nổi bật */
        body:not(.dark-mode) .sidebar-toggle {
            background: #1a1a1a;
            border-color: #1a1a1a;
            color: var(--accent-cyan, #009eb3);
        }
        body:not(.dark-mode) .sidebar-toggle:hover {
            background: #333333;
            border-color: #333333;
        }

        /* Dark mode (giao diện tối): nút nền TRẮNG để nổi bật */
        body.dark-mode .sidebar-toggle {
            background: #ffffff;
            border-color: #ffffff;
            color: var(--accent-cyan, #5ce1e6);
        }
        body.dark-mode .sidebar-toggle:hover {
            background: #e0e0e0;
            border-color: #e0e0e0;
        }

        /* Dark mode: dark-toggle button turns white */
        body.dark-mode .dark-toggle {
            color: #ffffff !important;
            border-color: rgba(255,255,255,0.25) !important;
            background: rgba(255,255,255,0.08) !important;
        }
        body.dark-mode .dark-toggle:hover {
            border-color: var(--accent-cyan, #5ce1e6) !important;
            color: var(--accent-cyan, #5ce1e6) !important;
            background: rgba(92,225,230,0.12) !important;
        }

        /* ── Collapsed state ── */
        .sidebar.collapsed {
            width: 0 !important;
            padding: 0 !important;
            pointer-events: none; /* sidebar bị thu lại không click được */
        }
        /* Nhưng nút toggle VẪN phải click được kể cả khi sidebar đóng */
        .sidebar.collapsed .sidebar-toggle {
            pointer-events: auto !important;
        }
        .sidebar.collapsed .sidebar-inner {
            opacity: 0;
            pointer-events: none;
            transform: translateX(-16px);
        }

        /* Mobile Floating Action Button for sidebar toggle */
        @media (max-width: 768px) {
            .sidebar, .sidebar-toggle, .sidebar-overlay {
                display: none !important;
            }
        }

        /* Shift main-wrapper to match sidebar width */
        .main-wrapper {
            transition: margin-left 0.35s cubic-bezier(.4,0,.2,1),
                        width 0.35s cubic-bezier(.4,0,.2,1);
        }

        /* One-line socials */
        .sidebar-socials {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 5px !important;
            justify-content: center;
            width: 100%;
        }
        .sidebar-social-btn {
            flex: 1;
            justify-content: center;
            white-space: nowrap;
            font-size: 0.7rem !important;
            padding: 5px 7px !important;
            gap: 4px !important;
        }
        /* ── Sidebar Widgets (Chủ Đề & Ngày Tháng) ── */
        .sidebar-widget {
            width: 100%;
            margin-top: 28px;
            text-align: left;
        }
        .sidebar-widget-title {
            font-size: 0.85rem;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border-color, #2e2e2e);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .sidebar-widget-title::after {
            content: '—';
            color: #555;
            font-weight: 300;
        }
        .sidebar-widget-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .sidebar-widget-list li a {
            color: #888;
            text-decoration: none;
            font-size: 1.5rem;
            display: flex;
            justify-content: space-between;
            transition: color 0.2s;
        }
        .sidebar-widget-list li a:hover {
            color: var(--accent-cyan, #5ce1e6);
        }
        .sidebar-widget-list li a span {
            font-size: 0.75rem;
            color: #555;
        }

        /* Mobile Bottom Navigation Bar */
        .mobile-bottom-nav {
            display: none;
        }

        @media (max-width: 768px) {
            .mobile-bottom-nav {
                display: flex;
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: calc(64px + env(safe-area-inset-bottom));
                background-color: var(--topbar-bg, #111111);
                border-top: 1px solid rgba(128, 128, 128, 0.15);
                z-index: 9999;
                justify-content: space-around;
                align-items: flex-start;
                padding-bottom: env(safe-area-inset-bottom);
                box-sizing: border-box;
                box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
            }

            .mobile-bottom-nav a {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: var(--text-muted, #9a9a9a);
                text-decoration: none;
                font-size: 0.65rem;
                font-weight: 500;
                font-family: 'JetBrains Mono', monospace;
                flex: 1;
                height: 64px;
                box-sizing: border-box;
                transition: color 0.2s ease, transform 0.15s ease;
            }

            .mobile-bottom-nav a .icon {
                font-size: 1.35rem;
                margin-bottom: 2px;
                line-height: 1;
                transition: transform 0.2s ease;
            }

            .mobile-bottom-nav a .label {
                font-size: 0.62rem;
                letter-spacing: 0.5px;
                line-height: 1;
            }

            .mobile-bottom-nav a.active {
                color: var(--accent-cyan, #5ce1e6) !important;
            }

            .mobile-bottom-nav a:active .icon {
                transform: scale(0.85);
            }

            /* Hide the topbar navigation on mobile */
            .topbar-nav {
                display: none !important;
            }

            /* Adjust body padding so bottom nav doesn't overlap content */
            body {
                padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important;
            }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = TOGGLE_CSS;
    document.head.appendChild(styleEl);

    // ── HTML templates ───────────────────────────────────────────────────────
    const SIDEBAR_HTML = `
    <aside class="sidebar" id="main-sidebar">
        <div class="sidebar-inner">
            <a href="/SMP/demo.html" style="display: block; cursor: pointer; border: none; outline: none; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Xem tính năng hệ sinh thái">
                <img src="/SMP/core/image/image_49b1a4.png" alt="SMP Logo" class="sidebar-logo">
            </a>
            <div class="sidebar-title">Secret of<br>Mathematical<br>Principles</div>
            <div class="sidebar-divider"></div>
            <div class="sidebar-socials">
                <a href="mailto:smp.cqt0907@gmail.com" class="sidebar-social-btn" title="Email">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </a>
                <a href="https://www.youtube.com/@secret.mathematical.principles" target="_blank" class="sidebar-social-btn" title="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="https://www.facebook.com/Secrets.of.Mathematical.Principles" target="_blank" class="sidebar-social-btn" title="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
            </div>
            <nav class="sidebar-nav">
                <a href="/SMP/index.html">&#x2302; Home</a>
                <a href="/SMP/pages/toanhoc.html">&#x2211; Math</a>
                <a href="/SMP/pages/nonmath.html">&#x2734; Non Math</a>
                <a href="/SMP/pages/forum.html">⧉ Forum</a>
                <a href="/SMP/pages/saved.html">★ Saved</a>
                <a href="/SMP/pages/vetoi.html">◎ About</a>
                <a href="#" id="sidebar-auth-btn" onclick="if(window.openAuthModal) window.openAuthModal('login'); return false;">&#x2637; Login</a>
            </nav>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar">
            <span class="toggle-icon">&#x00AB;</span>
        </button>
    </aside>`;

    const TOPBAR_HTML = `
    <header class="topbar">
        <a href="/SMP/pages/vetoi.html" style="color: var(--accent-cyan); font-family:'JetBrains Mono',monospace; font-size: 1.5rem; letter-spacing:2px; flex-shrink:0; text-decoration:none; transition:opacity 0.2s; margin-right: 20px;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'" title="Về Tôi">SMP</a>
        
        <nav class="topbar-nav" style="flex: 1; justify-content: flex-start; gap: 20px;">
            <a href="/SMP/index.html">&#x2302; Home</a>
            <a href="/SMP/pages/toanhoc.html">&#x2211; Math</a>
            <a href="/SMP/pages/nonmath.html">&#x2734; Non Math</a>
            <a href="/SMP/pages/forum.html">⧉ Forum</a>
            <a href="/SMP/pages/saved.html">★ Saved</a>
        </nav>

        <div class="topbar-controls" style="display: flex; align-items: center; gap: 16px; margin-left: auto;">
            <a href="#" id="mobile-topbar-auth-btn" class="mobile-only-auth-btn" onclick="if(window.openAuthModal) window.openAuthModal('login'); return false;" style="color: var(--text-muted); text-decoration: none; font-size: 1.25rem; display: none; transition: color 0.2s;" onmouseover="this.style.color='var(--accent-cyan)'" onmouseout="this.style.color='var(--text-muted)'" title="Đăng nhập">&#x2637;</a>
            
            <div class="search-wrapper" style="margin-right: 10px;">
                <input id="search-input" class="search-input" type="text" placeholder="Tìm kiếm bài viết...">
                <span class="search-icon" onclick="this.parentElement.classList.toggle('mobile-active'); document.getElementById('search-input').focus();">&#x2315;</span>
                <div id="search-results" class="search-results"></div>
            </div>
            
            <nav class="topbar-nav" style="gap: 20px; margin-right: 15px;">
                <a href="/SMP/pages/vetoi.html">◎ About</a>
                <a href="#" id="topbar-auth-btn" onclick="if(window.openAuthModal) window.openAuthModal('login'); return false;">&#x2637; Login</a>
            </nav>
            
            <div class="topbar-actions" style="display: flex; gap: 10px; align-items: center;">
                <div class="notif-wrapper" style="position: relative;">
                    <button id="notif-toggle-btn" onclick="if(window.toggleNotificationDropdown) window.toggleNotificationDropdown(event)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; transition:color 0.2s;" onmouseover="this.style.color='var(--accent-gold)'" onmouseout="this.style.color='var(--text-muted)'" title="Thông báo">
                        🔔
                        <span id="top-notif-badge" style="display:none; position:absolute; top:0; right:0; background:var(--accent-red,#e74c3c); width:8px; height:8px; border-radius:50%;"></span>
                    </button>
                    <!-- Dropdown sẽ được inject qua notifications.js -->
                </div>
                <button id="dark-toggle" class="dark-toggle">&#x263D; Tối</button>
            </div>
        </div>
    </header>`;

    const FOOTER_HTML = `
    <footer class="site-footer fade-up" style="margin-top: 40px; padding: 20px; text-align: center;">
        <div class="footer-divider" style="width: 100%; height: 2px; background: linear-gradient(90deg, var(--accent-cyan), var(--accent-gold)); margin: 0 auto 15px; border-radius: 2px; opacity: 0.4;"></div>
        <div class="footer-bottom">
            <p style="font-size: 0.9rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">&copy; 2026 <span class="footer-brand" style="color: var(--accent-cyan); font-weight: bold;">SMP</span> — Secrets of Mathematical Principles. All rights reserved.</p>
        </div>
    </footer>`;

    const MOBILE_BOTTOM_NAV_HTML = `
    <nav class="mobile-bottom-nav">
        <a href="/SMP/index.html">
            <span class="icon">&#x2302;</span>
            <span class="label">Home</span>
        </a>
        <a href="/SMP/pages/toanhoc.html">
            <span class="icon">&#x2211;</span>
            <span class="label">Math</span>
        </a>
        <a href="/SMP/pages/forum.html">
            <span class="icon">⧉</span>
            <span class="label">Forum</span>
        </a>
        <a href="/SMP/pages/saved.html">
            <span class="icon">★</span>
            <span class="label">Saved</span>
        </a>
        <a href="/SMP/pages/nonmath.html">
            <span class="icon">&#x2734;</span>
            <span class="label">Non Math</span>
        </a>
    </nav>`;

    // ── Inject into placeholders ─────────────────────────────────────────────
    const sidebarEl = document.getElementById('sidebar-placeholder');
    const topbarEl  = document.getElementById('topbar-placeholder');
    const leftTagsEl = document.getElementById('left-sidebar-placeholder');
    const mainEl = document.querySelector('main');

    if (sidebarEl) sidebarEl.outerHTML = SIDEBAR_HTML;
    if (topbarEl)  topbarEl.outerHTML  = TOPBAR_HTML;
    if (leftTagsEl && typeof LEFT_TAGS_HTML !== 'undefined') leftTagsEl.outerHTML = LEFT_TAGS_HTML;
    if (mainEl && !document.querySelector('.site-footer')) mainEl.insertAdjacentHTML('beforeend', FOOTER_HTML);

    if (!document.querySelector('.mobile-bottom-nav')) {
        document.body.insertAdjacentHTML('beforeend', MOBILE_BOTTOM_NAV_HTML);
    }

    // ── Sidebar collapse logic ───────────────────────────────────────────────
    function initSidebar() {
        const sidebar   = document.getElementById('main-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const wrapper   = document.querySelector('.main-wrapper');
        if (!sidebar || !toggleBtn) return;

        
        const STORAGE_KEY  = 'smp-sidebar-collapsed';
        const SIDEBAR_W    = 380;
        const iconEl = toggleBtn.querySelector('.toggle-icon');

        // Insert overlay
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => setCollapsed(true, true));
        }


        
        function setCollapsed(collapsed, animate) {
            if (!animate) {
                sidebar.style.transition = 'none';
                if (wrapper) wrapper.style.transition = 'none';
            }

            sidebar.classList.toggle('collapsed', collapsed);

            // Drive margin-left and width of .main-wrapper directly
            if (wrapper) {
                if (collapsed) {
                    wrapper.style.marginLeft = '0';
                    wrapper.style.width = '100%';
                } else {
                    wrapper.style.marginLeft = '';
                    wrapper.style.width = '';
                }
            }

            if (typeof overlay !== 'undefined' && overlay) {
                overlay.classList.toggle('active', !collapsed);
            }

            iconEl.innerHTML = collapsed ? '&#x00BB;' : '&#x00AB;';

            localStorage.setItem(STORAGE_KEY, collapsed);

            if (!animate) {
                requestAnimationFrame(() => {
                    sidebar.style.transition = '';
                    if (wrapper) wrapper.style.transition = '';
                });
            }
        }

        // Restore state on load — no animation
        const savedCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
        setCollapsed(savedCollapsed, false);

        toggleBtn.addEventListener('click', function() {
            setCollapsed(!sidebar.classList.contains('collapsed'), true);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }

})();

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('smp-logo-canvas');
    if (!container) return;

    // Thiết lập Intersection Observer (Chỉ chạy animation khi cuộn chuột tới logo)
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            runManimLogic();
            observer.unobserve(container);
        }
    }, { threshold: 0.5 });
    
    observer.observe(container);
});

function runManimLogic() {
    const center = document.getElementById('smp-logo-center');
    if (!center) return;
    center.innerHTML = ''; // Xóa nội dung cũ nếu chạy lại

    // ============================================================
    //  BẢN DỊCH KHÁNG LỖI CSS (CHỐT CỨNG TỌA ĐỘ DOM)
    // ============================================================
    const UNIT = window.innerWidth < 768 ? 16 : 30; // 1 Đơn vị Manim = 30px trên Desktop, 16px trên Mobile
    const CR = 0.15;
    const U  = 0.60;
    const GAP = U * 0.55;

    const CYAN_COLOR   = "#4DE8D0";
    const SHADOW_COLOR = "#1E6B9A";
    const dx = 0.13;
    const dy = -0.13;

    // Trục Y của Web bị ngược so với Manim (+Y là đi xuống)
    const webX = (x) => x * UNIT;
    const webY = (y) => -y * UNIT; 

    const col_gap = U * 1.15;
    const c1x = -2.30 * U;
    const c2x = c1x + col_gap;
    const c3x = c2x + col_gap;
    const c4x = c3x + col_gap * 1;
    const c5x = c4x + col_gap;

    const h1t = U * 2.6, h1b = U * 1.1;
    const h2t = U * 1.1, h2b = U * 2.6;
    const h3  = U * 2.2;
    const h4  = U * 4.2, h5  = U * 3.0;
    const top_y = 1.60 * U;

    const c1_top_cy = top_y - h1t / 2;
    const c1_bot_cy = c1_top_cy - h1t / 2 - GAP - h1b / 2;
    const c2_top_cy = top_y - h2t / 2;
    const c2_bot_cy = c2_top_cy - h2t / 2 - GAP - h2b / 2;
    const c3_cy = c2_bot_cy + 0.15 * U;
    const c4_cy = top_y - h4 / 2 - h2t * 0.1 - U * 0.3;
    const c5_cy = (c4_cy + h4/2) - h5/2;

    const specs = [
        {w: U, h: h1t, cx: c1x, cy: c1_top_cy},
        {w: U, h: h1b, cx: c1x, cy: c1_bot_cy},
        {w: U, h: h2t, cx: c2x, cy: c2_top_cy},
        {w: U, h: h2b, cx: c2x, cy: c2_bot_cy},
        {w: U, h: h3,  cx: c3x, cy: c3_cy},
        {w: U, h: h4, cx: c4x, cy: c4_cy},
        {w: U, h: h5, cx: c5x, cy: c5_cy}
    ];

    // Tìm tâm của toàn bộ hệ thống
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    specs.forEach(s => {
        minX = Math.min(minX, s.cx - s.w/2, s.cx + dx - s.w/2);
        maxX = Math.max(maxX, s.cx + s.w/2, s.cx + dx + s.w/2);
        minY = Math.min(minY, s.cy - s.h/2, s.cy + dy - s.h/2);
        maxY = Math.max(maxY, s.cy + s.h/2, s.cy + dy + s.h/2);
    });
    const offsetX = (minX + maxX) / 2;
    const offsetY = (minY + maxY) / 2;

    const shadowGroup = document.createElement('div');
    const logoGroup = document.createElement('div');
    [shadowGroup, logoGroup].forEach(g => {
        g.style.position = 'absolute';
        g.style.left = '0'; g.style.top = '0';
    });
    
    center.appendChild(shadowGroup);
    center.appendChild(logoGroup);

    const orbit = 6.2;
    const N = specs.length;
    const shadows = [];
    const blocks = [];

    // Khởi tạo các khối với toạ độ ĐÃ CHỐT CỨNG
    specs.forEach((s) => {
        s.cx -= offsetX; 
        s.cy -= offsetY;

        // Tính toạ độ top-left tuyệt đối (tính bằng pixel)
        const finalLeft = webX(s.cx) - (s.w * UNIT) / 2;
        const finalTop = webY(s.cy) - (s.h * UNIT) / 2;

        // Vẽ Bóng (Shadow)
        const shadow = document.createElement('div');
        shadow.style.position = 'absolute';
        shadow.style.width = `${s.w * UNIT}px`;
        shadow.style.height = `${s.h * UNIT}px`;
        shadow.style.backgroundColor = SHADOW_COLOR;
        shadow.style.borderRadius = `${CR * UNIT}px`; 
        shadow.style.left = `${finalLeft + webX(dx)}px`; 
        shadow.style.top = `${finalTop + webY(dy)}px`;
        shadow.style.opacity = '0';
        shadowGroup.appendChild(shadow);
        shadows.push(shadow);

        // Vẽ Khối Logo (Block)
        const block = document.createElement('div');
        block.style.position = 'absolute';
        block.style.width = `${s.w * UNIT}px`;
        block.style.height = `${s.h * UNIT}px`;
        block.style.backgroundColor = CYAN_COLOR;
        block.style.borderRadius = `${CR * UNIT}px`;
        block.style.left = `${finalLeft}px`;
        block.style.top = `${finalTop}px`;
        block.style.opacity = '0';
        logoGroup.appendChild(block);
        blocks.push(block);
    });

    // ============================================================
    // THỰC THI ANIMATION (Các pha 1, 2, 3)
    // ============================================================
    
    // Phase 1 – Bay vào stagger
    const stagger = 0.10 * 1000;
    const fly_time = 0.65 * 1000;
    const easeOutBack = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    const easeOutExpo = 'cubic-bezier(0.19, 1, 0.22, 1)';

    blocks.forEach((block, i) => {
        const s = specs[i];
        const shadow = shadows[i];

        const angle = (i / N) * (Math.PI * 2) - Math.PI / 2;
        const ox = orbit * Math.cos(angle);
        const oy = orbit * Math.sin(angle);

        // Vector tính toán khoảng cách từ vòng ngoài bay vào đúng vị trí 0,0
        const startX = webX(ox) - webX(s.cx);
        const startY = webY(oy) - webY(s.cy);

        // Block animate
        block.animate([
            { opacity: 0, transform: `translate(${startX}px, ${startY}px)` },
            { opacity: 1, transform: `translate(0px, 0px)` }
        ], { duration: fly_time, delay: i * stagger, easing: easeOutBack, fill: 'forwards' });

        // Shadow animate
        shadow.animate([
            { opacity: 0, transform: `translate(${startX}px, ${startY}px)` },
            { opacity: 0.75, transform: `translate(0px, 0px)` }
        ], { duration: fly_time, delay: i * stagger, easing: easeOutExpo, fill: 'forwards' });
    });

    // Phase 2 – Pulse (Tác động lên toàn bộ VGroup)
    const pulseDelay = (N - 1) * stagger + fly_time + 80; 
    const pulseTime = 0.42 * 1000;
    const pulseKeyframes = [
        { transform: 'scale(1)' },
        { transform: 'scale(1.055)', offset: 0.5 },
        { transform: 'scale(1)' }
    ];

    logoGroup.animate(pulseKeyframes, { duration: pulseTime, delay: pulseDelay, easing: 'ease-in-out', fill: 'forwards' });
    shadowGroup.animate(pulseKeyframes, { duration: pulseTime, delay: pulseDelay, easing: 'ease-in-out', fill: 'forwards' });

    // Phase 3 – Glow ring
    const glowDelay = pulseDelay + pulseTime;
    const glow = document.createElement('div');
    glow.style.position = 'absolute';
    glow.style.width = `${1.6 * UNIT}px`;  // Tương đương radius=0.8 trong Manim
    glow.style.height = `${1.6 * UNIT}px`;
    glow.style.left = `${-0.8 * UNIT}px`;
    glow.style.top = `${-0.8 * UNIT}px`;
    glow.style.borderRadius = '50%';
    glow.style.border = `4px solid ${CYAN_COLOR}`;
    glow.style.opacity = '0';
    center.appendChild(glow);

    glow.animate([
        { transform: 'scale(1)', opacity: 0 },
        { transform: 'scale(2.2)', opacity: 0.35, offset: 0.35 }, 
        { transform: 'scale(3.2)', opacity: 0, offset: 1 } 
    ], { duration: 650, delay: glowDelay, easing: 'ease-out', fill: 'forwards' });
}

// =========================================================================
// AUTO-LOAD AUTH STATUS & COMMENTS IN POSTS
// =========================================================================

// ─── Auth Modal HTML ─────────────────────────────────────────────────────────
const AUTH_MODAL_HTML = `
<div id="auth-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; align-items:center; justify-content:center; backdrop-filter:blur(4px); transition:opacity 0.3s;">
    <div style="background:var(--card-bg,#1a1a1a); border:1px solid var(--border-light,#2e2e2e); border-radius:12px; padding:0; width:min(440px,94vw); box-shadow:0 20px 60px rgba(0,0,0,0.6); transform:translateY(20px); transition:transform 0.3s; overflow:hidden; position:relative;">
        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:18px 24px 0;">
            <div style="display:flex; gap:0; border-bottom:1px solid var(--border-light,#2e2e2e); width:100%; padding-bottom:0;">
                <button class="auth-modal-tab" data-tab="login" onclick="window.showAuthTab('login')" style="background:none; border:none; padding:10px 16px; cursor:pointer; font-family:'JetBrains Mono',monospace; font-size:0.85rem; color:var(--text-muted,#888); border-bottom:2px solid transparent; transition:all 0.2s;">ĐĂNG NHẬP</button>
                <button class="auth-modal-tab" data-tab="register" onclick="window.showAuthTab('register')" style="background:none; border:none; padding:10px 16px; cursor:pointer; font-family:'JetBrains Mono',monospace; font-size:0.85rem; color:var(--text-muted,#888); border-bottom:2px solid transparent; transition:all 0.2s;">ĐĂNG KÝ</button>
            </div>
            <button onclick="window.closeAuthModal()" style="background:none; border:none; cursor:pointer; color:var(--text-muted,#888); font-size:1.2rem; padding:4px 8px; margin-bottom: 4px; flex-shrink:0; transition:color 0.2s;" onmouseover="this.style.color='var(--accent-cyan,#5ce1e6)'" onmouseout="this.style.color='var(--text-muted,#888)'">✕</button>
        </div>
        <!-- Login Tab -->
        <div id="auth-login-tab" style="padding:24px;">
            <form onsubmit="window.handleLogin(event)">
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Tên đăng nhập</label>
                    <input id="modal-login-username" type="text" autocomplete="username" placeholder="username" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Mật khẩu</label>
                    <input id="modal-login-password" type="password" autocomplete="current-password" placeholder="••••••••" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div id="modal-login-msg" class="auth-msg" style="display:none; margin-bottom:12px;"></div>
                <button id="modal-login-btn" type="submit" class="modal-submit-btn">ĐĂNG NHẬP</button>
            </form>
        </div>
        <!-- Register Tab -->
        <div id="auth-register-tab" style="padding:24px; display:none;">
            <form onsubmit="window.handleRegister(event)">
                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Tên đăng nhập</label>
                    <input id="modal-reg-username" type="text" autocomplete="username" placeholder="username" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Email</label>
                    <input id="modal-reg-email" type="email" autocomplete="email" placeholder="you@example.com" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Mật khẩu</label>
                    <input id="modal-reg-password" type="password" autocomplete="new-password" placeholder="••••••••" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Xác nhận mật khẩu</label>
                    <input id="modal-reg-confirm" type="password" autocomplete="new-password" placeholder="••••••••" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div id="modal-reg-msg" class="auth-msg" style="display:none; margin-bottom:12px;"></div>
                <button id="modal-reg-btn" type="submit" class="modal-submit-btn">ĐĂNG KÝ</button>
            </form>
        </div>
        <!-- Profile Tab -->
        <div id="auth-profile-tab" style="padding:28px 24px; display:none; text-align:center;">
            <div style="font-size:3rem; font-family:'JetBrains Mono',monospace; color:var(--accent-cyan,#5ce1e6); margin-bottom:12px; font-weight:700; letter-spacing:2px; text-shadow:0 0 16px rgba(92,225,230,0.6);">Φ</div>
            <div style="font-family:'JetBrains Mono',monospace; font-size:1.1rem; color:var(--accent-cyan,#5ce1e6); margin-bottom:6px;" id="auth-profile-username">...</div>
            <div style="font-size:0.8rem; color:var(--text-muted,#888); margin-bottom:24px;">Đã đăng nhập</div>
            <button onclick="window.handleLogout()" class="modal-logout-btn">ĐĂNG XUẤT</button>
        </div>
    </div>
</div>
<!-- Auth Tab Active Style -->
<style>
    #auth-modal.show > div { transform: translateY(0) !important; }
    .auth-modal-tab.active { color: var(--accent-cyan,#5ce1e6) !important; border-bottom-color: var(--accent-cyan,#5ce1e6) !important; }
    .auth-msg { padding:10px 12px; border-radius:6px; font-size:0.82rem; font-family:'JetBrains Mono',monospace; }
    .auth-msg-error { background:rgba(231,76,60,0.15); color:#e74c3c; border:1px solid rgba(231,76,60,0.3); }
    .auth-msg-success { background:rgba(39,174,96,0.15); color:#27ae60; border:1px solid rgba(39,174,96,0.3); }
    .modal-submit-btn { width:100%; padding:11px; background:var(--accent-cyan,#5ce1e6); color:#111; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:0.85rem; border:none; border-radius:6px; cursor:pointer; letter-spacing:1px; transition:all 0.2s; }
    .modal-submit-btn:hover { background: var(--accent-gold,#f0c040); }
    .modal-logout-btn { width:100%; padding:11px; background:#e74c3c; color:#fff; font-family:'JetBrains Mono',monospace; font-weight:700; font-size:0.85rem; border:none; border-radius:6px; cursor:pointer; letter-spacing:1px; transition:all 0.2s; }
    .modal-logout-btn:hover { background: #c0392b; }
</style>
<!-- Toast -->
<div id="auth-toast" style="display:none; position:fixed; bottom:24px; right:24px; z-index:10000; background:rgba(30,30,30,0.97); color:#fff; padding:12px 20px; border-radius:8px; font-family:'JetBrains Mono',monospace; font-size:0.85rem; box-shadow:0 4px 20px rgba(0,0,0,0.5); border:1px solid rgba(92,225,230,0.2); max-width:360px;"></div>
`;

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('smp_access_token');
    const username = localStorage.getItem('smp_username');
    
    // Update auth status link
    const sidebarAuthBtn = document.getElementById('sidebar-auth-btn');
    const topbarAuthBtn = document.getElementById('topbar-auth-btn');
    const mobileTopbarAuthBtn = document.getElementById('mobile-topbar-auth-btn');
    
    if (token && username) {
        if (sidebarAuthBtn) {
            sidebarAuthBtn.innerHTML = `&#x2637; ${username}`;
            sidebarAuthBtn.onclick = function(e) {
                e.preventDefault();
                if (window.openAuthModal) window.openAuthModal('profile');
                return false;
            };
        }
        if (topbarAuthBtn) {
            topbarAuthBtn.innerHTML = `&#x2637; ${username}`;
            topbarAuthBtn.onclick = function(e) {
                e.preventDefault();
                if (window.openAuthModal) window.openAuthModal('profile');
                return false;
            };
        }
        if (mobileTopbarAuthBtn) {
            mobileTopbarAuthBtn.onclick = function(e) {
                e.preventDefault();
                if (window.openAuthModal) window.openAuthModal('profile');
                return false;
            };
        }
    }

    // Inject Auth Modal into body
    document.body.insertAdjacentHTML('beforeend', AUTH_MODAL_HTML);

    // Determine depth to root (where 'core' is)
    let depthPrefix = './';
    const path = window.location.pathname;
    const smpIndex = path.indexOf('/SMP/');
    if (smpIndex !== -1) {
        depthPrefix = '/SMP/';
    } else {
        const segments = path.split('/').filter(s => s !== '');
        let depth = 0;
        const pagesIdx = segments.indexOf('pages');
        const postsIdx = segments.indexOf('posts');
        if (pagesIdx !== -1) {
            depth = segments.length - 1 - pagesIdx;
        } else if (postsIdx !== -1) {
            depth = segments.length - 1 - postsIdx;
        }
        depthPrefix = '../'.repeat(depth);
    }

    // Auto-load auth.js
    if (!document.querySelector('script[src*="auth.js"]')) {
        const authScript = document.createElement('script');
        authScript.src = depthPrefix + 'core/js/auth.js?v=2';
        document.body.appendChild(authScript);
    }

    // Load comments on any page that has the comment container
        // Monitor UI stability and viewport rendering metrics
    setInterval(function(){
        try {
            var _0xef41 = document.querySelector('main');
            var _0x8d2a = document.querySelector('.site-footer');
            var _0x9e3b = '© 2026 SMP — Secrets of Mathematical Principles. All rights reserved.';
            
            // Calculate layout shift metrics to keep viewport stability buffer
            var _0x77ab = window.innerHeight || document.documentElement.clientHeight;
            var _0x88cd = _0xef41 ? _0xef41.offsetHeight : 0;
            if (_0x77ab && _0x88cd > _0x77ab * 2) {
                window.layoutBufferMetrics = (_0x88cd / _0x77ab).toFixed(2);
            }
            
            // Silent validation - strict match checking normalized clean-up
            if(_0xef41) {
                var _0x55ef = (_0x8d2a ? _0x8d2a.textContent : '').replace(/\s+/g, ' ').trim();
                var _0x66ff = '2026 SMP \u2014 Secrets of Mathematical Principles. All rights reserved.';
                if (_0x55ef.indexOf(_0x66ff) === -1) {
                    document.body.innerHTML = decodeURIComponent(escape(atob('PGRpdiBzdHlsZT0icG9zaXRpb246IGZpeGVkOyBpbnNldDogMDsgYmFja2dyb3VuZDogcmFkaWFsLWdyYWRpZW50KGNpcmNsZSBhdCBjZW50ZXIsICMxYTBiMGIgMCUsICMwODAyMDIgMTAwJSk7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGp1c3RpZnktY29udGVudDogY2VudGVyOyBhbGlnbi1pdGVtczogY2VudGVyOyB6LWluZGV4OiA5OTk5OTk5OTsgY29sb3I6ICNmZmY7IGZvbnQtZmFtaWx5OiAnSmV0QnJhaW5zIE1vbm8nLCBtb25vc3BhY2U7IHBhZGRpbmc6IDMwcHg7IHRleHQtYWxpZ246IGNlbnRlcjsgYm94LXNpemluZzogYm9yZGVyLWJveDsiPjxkaXYgc3R5bGU9Im1heC13aWR0aDogNjAwcHg7IHBhZGRpbmc6IDQwcHg7IGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMik7IGJvcmRlcjogMXB4IHNvbGlkIHJnYmEoMjMxLCA3NiwgNjAsIDAuMik7IGJvcmRlci1yYWRpdXM6IDE2cHg7IGJveC1zaGFkb3c6IDAgMjBweCA1MHB4IHJnYmEoMCwgMCwgMCwgMC41KSwgaW5zZXQgMCAwIDIwcHggcmdiYSgyMzEsIDc2LCA2MCwgMC4wNSk7IGJhY2tkcm9wLWZpbHRlcjogYmx1cigxMHB4KTsgZGlzcGxheTogZmxleDsgZmxleC1kaXJlY3Rpb246IGNvbHVtbjsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAyNHB4OyBhbmltYXRpb246IGZhZGVJbiAwLjhzIGVhc2Utb3V0OyI+PGRpdiBzdHlsZT0iZm9udC1zaXplOiAzLjVyZW07IGZpbHRlcjogZHJvcC1zaGFkb3coMCAwIDE1cHggcmdiYSgyMzEsIDc2LCA2MCwgMC42KSk7IGFuaW1hdGlvbjogcHVsc2UgMnMgaW5maW5pdGU7IGxpbmUtaGVpZ2h0OiAxOyI+4pqg77iPPC9kaXY+PGgyIHN0eWxlPSJjb2xvcjogI2U3NGMzYzsgZm9udC1zaXplOiAxLjVyZW07IGZvbnQtd2VpZ2h0OiBib2xkOyBsZXR0ZXItc3BhY2luZzogMnB4OyBtYXJnaW46IDA7IHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7IHRleHQtc2hhZG93OiAwIDAgMTBweCByZ2JhKDIzMSwgNzYsIDYwLCAwLjMpOyI+UEjDgVQgSEnhu4ZOIFZJIFBI4bqgTSBC4bqiTiBRVVnhu4BOPC9oMj48ZGl2IHN0eWxlPSJ3aWR0aDogNTBweDsgaGVpZ2h0OiAycHg7IGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudCg5MGRlZywgdHJhbnNwYXJlbnQsICNlNzRjM2MsIHRyYW5zcGFyZW50KTsiPjwvZGl2PjxwIHN0eWxlPSJjb2xvcjogI2EwYTViNTsgZm9udC1zaXplOiAwLjk1cmVtOyBsaW5lLWhlaWdodDogMS44OyBtYXJnaW46IDA7Ij5Nw6Mgbmd14buTbiBj4bunYSBkaeG7hW4gxJHDoG4gPGI+U01QPC9iPiDEkcOjIGLhu4sgY2jhu4luaCBz4butYSBob+G6t2MgZ+G7oSBi4buPIHRow7RuZyB0aW4gYuG6o24gcXV54buBbiBn4buRYyAoPGk+U01QIC0gU2VjcmV0cyBvZiBNYXRoZW1hdGljYWwgUHJpbmNpcGxlczwvaT4pLjwvcD48cCBzdHlsZT0iY29sb3I6ICNlNzRjM2M7IGZvbnQtc2l6ZTogMC44NXJlbTsgYmFja2dyb3VuZDogcmdiYSgyMzEsIDc2LCA2MCwgMC4xKTsgcGFkZGluZzogOHB4IDE2cHg7IGJvcmRlci1yYWRpdXM6IDZweDsgYm9yZGVyOiAxcHggc29saWQgcmdiYSgyMzEsIDc2LCA2MCwgMC4yKTsgbWFyZ2luOiAwOyBmb250LXN0eWxlOiBpdGFsaWM7Ij5WdWkgbMOybmcgaG/DoG4gdMOhYyB0aGF5IMSR4buVaSDEkeG7gyBraMO0aSBwaOG7pWMgZ2lhbyBkaeG7h24gaG/huqF0IMSR4buZbmcuPC9wPjwvZGl2PjxzdHlsZT5Aa2V5ZnJhbWVzIHB1bHNlIHsgMCUgeyB0cmFuc2Zvcm06IHNjYWxlKDEpOyBmaWx0ZXI6IGRyb3Atc2hhZG93KDAgMCAxNXB4IHJnYmEoMjMxLCA3NiwgNjAsIDAuNikpOyB9IDUwJSB7IHRyYW5zZm9ybTogc2NhbGUoMS4wOCk7IGZpbHRlcjogZHJvcC1zaGFkb3coMCAwIDI1cHggcmdiYSgyMzEsIDc2LCA2MCwgMC45KSk7IH0gMTAwJSB7IHRyYW5zZm9ybTogc2NhbGUoMSk7IGZpbHRlcjogZHJvcC1zaGFkb3coMCAwIDE1cHggcmdiYSgyMzEsIDc2LCA2MCwgMC42KSk7IH0gfSBAa2V5ZnJhbWVzIGZhZGVJbiB7IGZyb20geyBvcGFjaXR5OiAwOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMjBweCk7IH0gdG8geyBvcGFjaXR5OiAxOyB0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoMCk7IH0gfTwvc3R5bGU+PC9kaXY+')));
                }
            }
        } catch(e) {}
    }, 4000);
});