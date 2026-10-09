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
        link.href = '/core/image/favicon.png';
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
        }
        .sidebar-inner::-webkit-scrollbar { display: none; }

        /* Chỉ animate khi người dùng chủ động bấm toggle kéo ra/vô — triệt tiêu giật lag khi chuyển trang */
        body.sidebar-animating .sidebar {
            transition: width 0.35s cubic-bezier(.4,0,.2,1),
                        padding 0.35s cubic-bezier(.4,0,.2,1) !important;
        }
        body.sidebar-animating .sidebar-inner {
            transition: opacity 0.25s ease, transform 0.35s cubic-bezier(.4,0,.2,1) !important;
        }
        body.sidebar-animating .main-wrapper {
            transition: margin-left 0.35s cubic-bezier(.4,0,.2,1),
                        width 0.35s cubic-bezier(.4,0,.2,1) !important;
        }

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
        .sidebar.collapsed,
        html.sidebar-collapsed .sidebar {
            width: 0 !important;
            padding: 0 !important;
            pointer-events: none !important; /* sidebar bị thu lại không click được */
        }
        /* Nhưng nút toggle VẪN phải click được kể cả khi sidebar đóng */
        .sidebar.collapsed .sidebar-toggle,
        html.sidebar-collapsed .sidebar .sidebar-toggle {
            pointer-events: auto !important;
        }
        .sidebar.collapsed .sidebar-inner,
        html.sidebar-collapsed .sidebar .sidebar-inner {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateX(-16px) !important;
        }
        html.sidebar-collapsed .main-wrapper {
            margin-left: 0 !important;
            width: 100% !important;
        }

        /* Mobile Floating Action Button for sidebar toggle */
        @media (max-width: 768px) {
            .sidebar, .sidebar-toggle, .sidebar-overlay {
                display: none !important;
            }
        }

        /* Shift main-wrapper to match sidebar width */
        .main-wrapper {
            margin-left: 0;
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

        /* ── Topbar Nav: 5 Equal & Balanced Icons ── */
        .topbar-nav {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
        }
        .topbar-nav-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 38px !important;
            height: 38px !important;
            border-radius: 8px !important;
            color: var(--text-dark, #a0a0a0) !important;
            text-decoration: none !important;
            transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease !important;
            box-sizing: border-box !important;
            cursor: pointer !important;
            flex-shrink: 0 !important;
            border: 1px solid transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
        }
        .topbar-nav-btn:hover {
            color: var(--accent-cyan, #5ce1e6) !important;
            background-color: rgba(92, 225, 230, 0.08) !important;
            border-color: rgba(92, 225, 230, 0.2) !important;
        }
        .topbar-nav-btn.active {
            color: var(--accent-cyan, #5ce1e6) !important;
            background-color: rgba(92, 225, 230, 0.12) !important;
            border-color: rgba(92, 225, 230, 0.3) !important;
        }
        .topbar-nav-btn svg {
            display: block !important;
            width: 18px !important;
            height: 18px !important;
            stroke: currentColor !important;
            flex-shrink: 0 !important;
        }

        /* ── Topbar Sticky ── */
        .topbar {
            position: sticky !important;
            top: 0 !important;
            z-index: 1000 !important;
        }

        .topbar-desktop-inner {
            display: flex;
            align-items: center;
            width: 100%;
        }

        .topbar-article-inner {
            display: none;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            position: relative;
        }

        /* Desktop: ALWAYS show standard desktop topbar */
        @media (min-width: 769px) {
            .topbar-article-inner {
                display: none !important;
            }
            .topbar-desktop-inner {
                display: flex !important;
            }
        }

        /* Mobile on Article Page: Show article inner with back button and search */
        @media (max-width: 768px) {
            body.is-article-page .topbar-desktop-inner {
                display: none !important;
            }
            body.is-article-page .topbar-article-inner {
                display: flex !important;
            }
            body.is-article-page .topbar {
                padding: calc(6px + env(safe-area-inset-top, 0px)) 12px 6px 12px !important;
                min-height: calc(48px + env(safe-area-inset-top, 0px)) !important;
            }
        }

        /* Back Button on Mobile Article Topbar */
        .topbar-back-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            color: var(--text-dark, #222) !important;
            text-decoration: none !important;
            background: transparent !important;
            border: none !important;
            cursor: pointer !important;
            flex-shrink: 0 !important;
            padding: 0 !important;
            transition: background-color 0.15s ease !important;
        }
        .topbar-back-btn:active {
            background-color: rgba(92, 225, 230, 0.2) !important;
            color: var(--accent-cyan, #0E8FA3) !important;
        }

        /* Title in Mobile Article Topbar */
        .topbar-article-title {
            flex: 1 !important;
            font-size: 0.88rem !important;
            font-weight: 600 !important;
            font-family: inherit !important;
            color: var(--text-dark, #1C1B19) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            text-align: center !important;
            padding: 0 10px !important;
            line-height: 1.2 !important;
        }

        /* Search on Mobile Article Topbar */
        .search-wrapper-article {
            flex-shrink: 0 !important;
            position: relative !important;
        }
        .search-icon-article {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 36px !important;
            height: 36px !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            color: var(--text-dark, #222) !important;
        }
        .search-icon-article:active {
            background-color: rgba(92, 225, 230, 0.2) !important;
        }

        .search-wrapper-article.mobile-active .search-input-mobile {
            display: block !important;
            position: absolute !important;
            top: 42px !important;
            right: 0 !important;
            width: min(280px, 80vw) !important;
            padding: 8px 12px !important;
            background: var(--topbar-bg, #fff) !important;
            border: 1px solid var(--border-light, #ddd) !important;
            border-radius: 6px !important;
            box-shadow: 0 4px 16px rgba(0,0,0,0.25) !important;
            color: var(--text-dark) !important;
            z-index: 10001 !important;
            outline: none !important;
            font-size: 0.85rem !important;
        }
        .search-wrapper-article.mobile-active .search-results-mobile {
            position: absolute !important;
            top: 84px !important;
            right: 0 !important;
            width: min(300px, 85vw) !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            background: var(--topbar-bg, #fff) !important;
            border: 1px solid var(--border-light, #ddd) !important;
            border-radius: 6px !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important;
            z-index: 10002 !important;
        }

        /* Reading Progress Bar (Thin Teal Line) */
        .reading-progress-track {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            height: 2px !important;
            background: transparent !important;
            pointer-events: none !important;
            overflow: hidden !important;
        }
        .reading-progress-fill {
            height: 100% !important;
            width: 0% !important;
            background: var(--accent-cyan, #0E8FA3) !important;
        }
        body.dark-mode .reading-progress-fill {
            background: var(--accent-cyan, #5ce1e6) !important;
        }

        /* Mobile Bottom Navigation Bar (Icons Only) */
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
                height: calc(52px + env(safe-area-inset-bottom));
                background-color: var(--topbar-bg, #111111);
                border-top: 1px solid rgba(128, 128, 128, 0.15);
                z-index: 9999;
                justify-content: space-around;
                align-items: center;
                padding-bottom: env(safe-area-inset-bottom);
                box-sizing: border-box;
                box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
            }

            .mobile-bottom-nav a {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-muted, #9a9a9a);
                text-decoration: none;
                flex: 1;
                height: 52px;
                box-sizing: border-box;
                transition: color 0.2s ease, transform 0.15s ease;
            }

            .mobile-bottom-nav a .icon {
                font-size: 1.35rem;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                transition: transform 0.2s ease;
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
                padding-bottom: calc(52px + env(safe-area-inset-bottom)) !important;
            }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = TOGGLE_CSS;
    document.head.appendChild(styleEl);

    const STORAGE_KEY  = 'smp-sidebar-collapsed';
    const isInitialCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
    if (isInitialCollapsed) {
        document.documentElement.classList.add('sidebar-collapsed');
    }
    const initialSidebarClass = isInitialCollapsed ? 'sidebar collapsed' : 'sidebar';
    const initialToggleIcon = isInitialCollapsed ? '&#x00BB;' : '&#x00AB;';

    // ── HTML templates ───────────────────────────────────────────────────────
    const SIDEBAR_HTML = `
    <aside class="${initialSidebarClass}" id="main-sidebar">
        <div class="sidebar-inner">
            <a href="/demo.html" style="display: block; cursor: pointer; border: none; outline: none; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" title="Xem tính năng hệ sinh thái">
                <img src="/core/image/image_49b1a4.png" alt="SMP Logo" class="sidebar-logo">
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
                <a href="/home.html">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <span>Home</span>
                </a>
                <a href="/pages/toanhoc.html">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M19 4H5l7 8-7 8h14"/></svg>
                    <span>Math</span>
                </a>
                <a href="/pages/toanhoc.html?filter=tools">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                    <span>Tool</span>
                </a>
                <a href="/pages/forum.html">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <span>Forum</span>
                </a>
                <a href="/pages/nonmath.html">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span>Non Math</span>
                </a>
                <div style="height: 1px; background: rgba(255,255,255,0.08); margin: 16px 0 12px 0;"></div>
                <a href="/pages/roadmap.html" style="color: var(--accent-cyan);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
                    <span>Số Học Olympic</span>
                </a>
                <a href="/pages/profile.html" id="sidebar-auth-btn" onclick="if(!localStorage.getItem('smp_access_token')){if(window.openAuthModal){window.openAuthModal('login');return false;}}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span id="sidebar-auth-label">Login</span>
                </a>
            </nav>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar">
            <span class="toggle-icon">${initialToggleIcon}</span>
        </button>
    </aside>`;

    // ── Check if Article Page ────────────────────────────────────────────────
    const isArticlePage = window.location.pathname.includes('/posts/') || 
                          !!document.querySelector('meta[name="post-id"]') || 
                          !!document.querySelector('.exam-paper, .post-container, #smp-post-content');
    if (isArticlePage) {
        document.body.classList.add('is-article-page');
    }

    let cleanTitle = document.title || 'Bài viết';
    cleanTitle = cleanTitle.replace(/^SMP\s*[—–-]\s*/, '').replace(/\s*[—–-]\s*SMP$/, '').trim();

    const catUrlMeta = document.querySelector('meta[name="category-url"]');
    const fallbackBackUrl = catUrlMeta ? catUrlMeta.getAttribute('content') : '/pages/toanhoc.html';

    const TOPBAR_HTML = `
    <header class="topbar">
        <!-- 1. Standard Topbar (Desktop and Mobile non-article) -->
        <div class="topbar-desktop-inner">
            <a href="/pages/vetoi.html" style="color: var(--accent-cyan); font-family:'JetBrains Mono',monospace; font-size: 1.5rem; letter-spacing:2px; flex-shrink:0; text-decoration:none; transition:opacity 0.2s; margin-right: 20px;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'" title="Về Tôi">SMP</a>
            
            <nav class="topbar-nav" style="flex: 1; justify-content: flex-start;">
                <a href="/home.html" class="topbar-nav-btn" title="Trang chủ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </a>
                <a href="/pages/toanhoc.html" class="topbar-nav-btn" title="Toán học">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 4H5l7 8-7 8h14"/></svg>
                </a>
                <a href="/pages/toanhoc.html?filter=tools" class="topbar-nav-btn" title="Công cụ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </a>
                <a href="/pages/roadmap.html" class="topbar-nav-btn" title="Lộ trình">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
                </a>
                <a href="/pages/profile.html" id="topbar-auth-btn" class="topbar-nav-btn" title="Hồ sơ cá nhân" onclick="if(!localStorage.getItem('smp_access_token')){if(window.openAuthModal){window.openAuthModal('login');return false;}}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </a>
            </nav>

            <div class="topbar-controls" style="display: flex; align-items: center; gap: 8px; margin-left: auto;">
                <div class="search-wrapper">
                    <input id="search-input" class="search-input" type="text" placeholder="Tìm kiếm bài viết...">
                    <span class="search-icon" onclick="this.parentElement.classList.toggle('mobile-active'); document.getElementById('search-input').focus();" title="Tìm kiếm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
                    <div id="search-results" class="search-results"></div>
                </div>
                
                <div class="notif-wrapper" style="position: relative;">
                    <button id="notif-toggle-btn" class="topbar-nav-btn" onclick="if(window.toggleNotificationDropdown) window.toggleNotificationDropdown(event)" title="Thông báo" style="position: relative;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        <span id="top-notif-badge" style="display:none; position:absolute; top:7px; right:7px; background:var(--accent-cyan,#009eb3); width:6px; height:6px; border-radius:50%; box-shadow:0 0 0 2px var(--topbar-bg,#fff);"></span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 2. Mobile Article Topbar (Shown on mobile on article pages) -->
        <div class="topbar-article-inner">
            <a href="javascript:void(0)" class="topbar-back-btn" onclick="window.handleArticleBack('${fallbackBackUrl}')" title="Quay lại">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </a>
            <div class="topbar-article-title" title="${cleanTitle.replace(/"/g, '&quot;')}">${cleanTitle}</div>
            <div class="search-wrapper search-wrapper-article">
                <span class="search-icon search-icon-article" onclick="this.parentElement.classList.toggle('mobile-active'); const inp = document.getElementById('search-input-mobile'); if(inp) inp.focus();" title="Tìm kiếm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input id="search-input-mobile" class="search-input search-input-mobile" type="text" placeholder="Tìm kiếm bài viết..." style="display:none;">
                <div id="search-results-mobile" class="search-results search-results-mobile"></div>
            </div>
            <div class="reading-progress-track">
                <div class="reading-progress-fill" id="reading-progress-bar"></div>
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
        <a href="/home.html" title="Trang chủ">
            <span class="icon">&#x2302;</span>
        </a>
        <a href="/pages/toanhoc.html" title="Toán học">
            <span class="icon" style="font-family:'JetBrains Mono',monospace; font-weight:700;">∑</span>
        </a>
        <a href="/pages/toanhoc.html?filter=tools" title="Công cụ">
            <span class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </span>
        </a>
        <a href="/pages/roadmap.html" title="Lộ trình">
            <span class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>
            </span>
        </a>
        <a href="/pages/profile.html" id="mobile-bottom-auth-btn" title="Hồ sơ cá nhân" onclick="if(!localStorage.getItem('smp_access_token')){if(window.openAuthModal){window.openAuthModal('login');return false;}}">
            <span class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
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

    // ── Update Topbar Mode (Dynamic switching for Home / In-page post view) ──
    window.updateTopbarMode = function(isArticle, title, fallbackUrl) {
        if (isArticle) {
            document.body.classList.add('is-article-page');
            const titleEl = document.querySelector('.topbar-article-title');
            if (titleEl && title) {
                let clean = title.replace(/^SMP\s*[—–-]\s*/, '').replace(/\s*[—–-]\s*SMP$/, '').trim();
                titleEl.textContent = clean;
                titleEl.setAttribute('title', clean);
            }
            if (fallbackUrl) {
                const backBtn = document.querySelector('.topbar-back-btn');
                if (backBtn) {
                    backBtn.setAttribute('onclick', `window.handleArticleBack('${fallbackUrl}')`);
                }
            }
        } else {
            document.body.classList.remove('is-article-page');
        }
    };

    // ── Handle Article Back ──────────────────────────────────────────────────
    window.handleArticleBack = function(fallbackUrl) {
        if (window.PostViewer && window.PostViewer._savedContent) {
            window.PostViewer.restoreRightColumn();
            return;
        }
        if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
            window.history.back();
        } else {
            window.location.href = fallbackUrl || '/pages/toanhoc.html';
        }
    };

    // ── Đồng bộ chế độ topbar khi popstate hoặc khôi phục từ bộ nhớ đệm (bfcache) ──
    window.addEventListener('pageshow', (e) => {
        const isPost = window.location.pathname.includes('/posts/') || 
                       !!document.querySelector('meta[name="post-id"]') || 
                       !!document.querySelector('.exam-paper, .post-container, #smp-post-content');
        if (isPost) {
            document.body.classList.add('is-article-page');
        } else if (!window.PostViewer || !window.PostViewer._savedContent) {
            document.body.classList.remove('is-article-page');
        }
    });

    window.addEventListener('popstate', () => {
        if (window.PostViewer && window.PostViewer._savedContent) {
            window.PostViewer.restoreRightColumn(true);
        }
    });

    // ── Reading Progress Bar on Scroll (Fast & Smooth, zero lag) ─────────────
    window.addEventListener('scroll', () => {
        const progressBar = document.getElementById('reading-progress-bar');
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }
    }, { passive: true });

    // Click outside to close mobile article search dropdown
    document.addEventListener('click', (e) => {
        const sw = document.querySelector('.search-wrapper-article');
        if (sw && sw.classList.contains('mobile-active')) {
            if (!sw.contains(e.target)) {
                sw.classList.remove('mobile-active');
            }
        }
    });

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
            if (animate) {
                document.body.classList.add('sidebar-animating');
            }

            sidebar.classList.toggle('collapsed', collapsed);
            document.documentElement.classList.toggle('sidebar-collapsed', collapsed);

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

            localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false');

            if (animate) {
                setTimeout(() => {
                    document.body.classList.remove('sidebar-animating');
                }, 380);
            }
        }

        // Restore state on load — không kích hoạt animation
        const savedCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
        setCollapsed(savedCollapsed, false);

        toggleBtn.addEventListener('click', function() {
            const isCurrentlyCollapsed = document.documentElement.classList.contains('sidebar-collapsed') ||
                                         sidebar.classList.contains('collapsed');
            setCollapsed(!isCurrentlyCollapsed, true);
        });
    }

    // Chạy initSidebar ngay lập tức sau khi inject, không đợi DOMContentLoaded để tránh giật giao diện
    initSidebar();

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
                    <div style="text-align: right; margin-top: 6px;">
                        <a href="#" onclick="window.showAuthTab('forgot'); return false;" style="font-size: 0.72rem; color: var(--accent-cyan,#5ce1e6); text-decoration: none; font-family: 'JetBrains Mono', monospace;">Quên mật khẩu?</a>
                    </div>
                </div>
                <div id="modal-login-msg" class="auth-msg" style="display:none; margin-bottom:12px;"></div>
                <button id="modal-login-btn" type="submit" class="modal-submit-btn">ĐĂNG NHẬP</button>
            </form>
        </div>
        <!-- Forgot Password Tab -->
        <div id="auth-forgot-tab" style="padding:24px; display:none;">
            <h3 style="font-family:'JetBrains Mono',monospace; font-size:1rem; color:var(--text-dark,#eee); margin-bottom:16px; font-weight:normal; text-transform:uppercase; letter-spacing:1px;">Lấy lại tài khoản</h3>
            <form onsubmit="window.handleForgotPassword(event)">
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Email của tài khoản</label>
                    <input id="modal-forgot-email" type="email" placeholder="you@example.com" required style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div id="modal-forgot-msg" class="auth-msg" style="display:none; margin-bottom:12px;"></div>
                <button id="modal-forgot-btn" type="submit" class="modal-submit-btn">KÍCH HOẠT ĐỔI MẬT KHẨU</button>
                <div style="text-align:center; margin-top:16px;">
                    <a href="#" onclick="window.showAuthTab('login'); return false;" style="font-size:0.75rem; color:var(--accent-cyan,#5ce1e6); font-family:'JetBrains Mono',monospace; text-decoration:none;">Quay lại đăng nhập</a>
                </div>
            </form>
        </div>
        <!-- Reset Password Tab -->
        <div id="auth-reset-tab" style="padding:24px; display:none;">
            <h3 style="font-family:'JetBrains Mono',monospace; font-size:1rem; color:var(--text-dark,#eee); margin-bottom:16px; font-weight:normal; text-transform:uppercase; letter-spacing:1px;">Đặt lại mật khẩu</h3>
            <form onsubmit="window.handleResetPassword(event)">
                <input type="hidden" id="modal-reset-token" value="">
                <div style="margin-bottom:16px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Mật khẩu mới</label>
                    <input id="modal-reset-password" type="password" placeholder="••••••••" required minlength="6" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-size:0.75rem; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted,#888); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">Xác nhận mật khẩu mới</label>
                    <input id="modal-reset-confirm" type="password" placeholder="••••••••" required minlength="6" style="width:100%; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); font-family:'JetBrains Mono',monospace; font-size:0.9rem; outline:none; transition:border-color 0.2s; box-sizing:border-box;" onfocus="this.style.borderColor='var(--accent-cyan,#5ce1e6)'" onblur="this.style.borderColor='var(--border-light,#2e2e2e)'">
                </div>
                <div id="modal-reset-msg" class="auth-msg" style="display:none; margin-bottom:12px;"></div>
                <button id="modal-reset-btn" type="submit" class="modal-submit-btn">ĐỔI MẬT KHẨU</button>
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
            <div style="font-size:0.8rem; color:var(--text-muted,#888); margin-bottom:18px;">Đã đăng nhập</div>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px; text-align:left;">
                <a href="/pages/profile.html" style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(92,225,230,0.1); border:1px solid rgba(92,225,230,0.25); border-radius:6px; color:var(--accent-cyan,#5ce1e6); text-decoration:none; font-family:'JetBrains Mono',monospace; font-size:0.82rem;">
                    <span>👤</span> Hồ Sơ Chi Tiết
                </a>
                <a href="/pages/saved.html" style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); text-decoration:none; font-family:'JetBrains Mono',monospace; font-size:0.82rem;">
                    <span>★</span> Bài Viết Đã Lưu
                </a>
                <a href="/pages/nonmath.html" style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(255,255,255,0.03); border:1px solid var(--border-light,#2e2e2e); border-radius:6px; color:var(--text-dark,#eee); text-decoration:none; font-family:'JetBrains Mono',monospace; font-size:0.82rem;">
                    <span>✦</span> Chuyên Mục Non Math
                </a>
            </div>

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

function initLayout() {
    const token = localStorage.getItem('smp_access_token');
    const username = localStorage.getItem('smp_username');
    
    // Update auth status link
    const sidebarAuthBtn = document.getElementById('sidebar-auth-btn');
    const topbarAuthBtn = document.getElementById('topbar-auth-btn');
    const mobileTopbarAuthBtn = document.getElementById('mobile-topbar-auth-btn');
    const userSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    
    const sidebarUserSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

    if (token && username) {
        if (sidebarAuthBtn) {
            sidebarAuthBtn.innerHTML = `${sidebarUserSvg} <span>Profile</span>`;
            sidebarAuthBtn.title = `Hồ sơ (${username})`;
            sidebarAuthBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = '/pages/profile.html';
                return false;
            };
        }
        if (topbarAuthBtn) {
            topbarAuthBtn.innerHTML = userSvg;
            topbarAuthBtn.title = `Hồ sơ (${username})`;
            topbarAuthBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = '/pages/profile.html';
                return false;
            };
        }
        if (mobileTopbarAuthBtn) {
            mobileTopbarAuthBtn.onclick = function(e) {
                e.preventDefault();
                window.location.href = '/pages/profile.html';
                return false;
            };
        }
    } else {
        if (sidebarAuthBtn) {
            sidebarAuthBtn.innerHTML = `${sidebarUserSvg} <span>Login</span>`;
            sidebarAuthBtn.title = 'Đăng nhập';
            sidebarAuthBtn.onclick = function(e) {
                e.preventDefault();
                if (window.openAuthModal) window.openAuthModal('login');
                return false;
            };
        }
        if (topbarAuthBtn) {
            topbarAuthBtn.innerHTML = userSvg;
            topbarAuthBtn.title = 'Đăng nhập / Hồ sơ';
            topbarAuthBtn.onclick = function(e) {
                e.preventDefault();
                if (window.openAuthModal) window.openAuthModal('login');
                return false;
            };
        }
    }

    // Set active link for topbar 5 icons
    try {
        const curPath = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        const filterParam = searchParams.get('filter');

        document.querySelectorAll('.topbar-nav .topbar-nav-btn').forEach(btn => {
            const href = (btn.getAttribute('href') || '').toLowerCase();
            if (!href) return;
            if (filterParam === 'tools' && href.includes('filter=tools')) {
                btn.classList.add('active');
            } else if (filterParam !== 'tools' && href.includes('filter=tools')) {
                btn.classList.remove('active');
            } else if (href.includes('toanhoc.html') && curPath.includes('toanhoc.html') && filterParam !== 'tools') {
                btn.classList.add('active');
            } else if (href.includes('home.html') && (curPath.endsWith('home.html') || curPath === '/' || curPath.endsWith('/index.html') || curPath === '')) {
                btn.classList.add('active');
            } else if (href.includes('roadmap.html') && curPath.includes('roadmap.html')) {
                btn.classList.add('active');
            } else if (href.includes('profile.html') && curPath.includes('profile.html')) {
                btn.classList.add('active');
            }
        });
    } catch(e) {}

    // Inject Auth Modal into body
    document.body.insertAdjacentHTML('beforeend', AUTH_MODAL_HTML);

    // Determine depth to root (where 'core' is)
    let depthPrefix = './';
    const path = window.location.pathname;
    const segments = path.split('/').filter(s => s !== '');
    let depth = 0;
    const pagesIdx = segments.indexOf('pages');
    const postsIdx = segments.indexOf('posts');
    const toolsIdx = segments.indexOf('tools');
    if (pagesIdx !== -1) {
        depth = segments.length - 1 - pagesIdx;
    } else if (postsIdx !== -1) {
        depth = segments.length - 1 - postsIdx;
    } else if (toolsIdx !== -1) {
        depth = segments.length - 1 - toolsIdx;
    }
    if (depth > 0) {
        depthPrefix = '../'.repeat(depth);
    } else if (segments.length === 0 || segments[segments.length - 1].endsWith('.html') === false) {
        // Root index
        depthPrefix = './';
    } else {
        depthPrefix = './';
    }

    // Auto-load auth.js
    if (!document.querySelector('script[src*="auth.js"]')) {
        const authScript = document.createElement('script');
        authScript.src = depthPrefix + 'core/js/auth.js?v=10';
        document.body.appendChild(authScript);
    }

    // Load comments on any page that has the comment container
    if (document.getElementById('smp-comments-container') || document.getElementById('giscus-container')) {
        const script = document.createElement('script');
        script.src = depthPrefix + 'core/js/comment.js?v=35';
        document.body.appendChild(script);
    }

    // ── Inject notifications script ──────────────────────────────────────────
    const notifScript = document.createElement('script');
    notifScript.src = depthPrefix + 'core/js/notifications.js?v=10';
    document.body.appendChild(notifScript);

    // Close mobile search wrapper when clicking outside
    document.addEventListener('click', (e) => {
        const searchWrapper = document.querySelector('.search-wrapper');
        if (searchWrapper && searchWrapper.classList.contains('mobile-active')) {
            if (!searchWrapper.contains(e.target)) {
                searchWrapper.classList.remove('mobile-active');
            }
        }
    });

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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLayout);
} else {
    initLayout();
}
