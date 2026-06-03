// ============================================
//   SMP - SHARED LAYOUT INJECTOR
//   Injects sidebar + topbar into every page
// ============================================

(function() {

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
            transition: background 0.2s, color 0.2s;
            line-height: 1;
        }
        .sidebar-toggle:hover {
            background: #223535;
            color: #fff;
        }

        /* ── Collapsed state ── */
        .sidebar.collapsed {
            width: 0 !important;
            padding: 0 !important;
        }
        .sidebar.collapsed .sidebar-inner {
            opacity: 0;
            pointer-events: none;
            transform: translateX(-16px);
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
            font-size: 0.8rem;
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
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = TOGGLE_CSS;
    document.head.appendChild(styleEl);

    // ── HTML templates ───────────────────────────────────────────────────────
    const SIDEBAR_HTML = `
    <aside class="sidebar" id="main-sidebar">
        <div class="sidebar-inner">
            <img src="/image/image_49b1a4.png" alt="SMP Logo" class="sidebar-logo">
            <div class="sidebar-title">Secret of<br>Mathematical<br>Principles</div>
            <div class="sidebar-divider"></div>
            <p class="sidebar-bio">
                Sharing a journey through mathematics and computer science —
                a blog by Long, where ideas, problems, and stories from academic life come to life.
            </p>
            <div class="sidebar-socials">
                <a href="mailto:smp.cqt0907@gmail.com" class="sidebar-social-btn" title="Email">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    Email
                </a>
                <a href="https://www.youtube.com/@secret.mathematical.principles" target="_blank" class="sidebar-social-btn" title="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    YouTube
                </a>
                <a href="https://www.facebook.com/Secrets.of.Mathematical.Principles" target="_blank" class="sidebar-social-btn" title="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                </a>
            </div>
            <nav class="sidebar-nav">
                <a href="index.html">&#x2302; Home page</a>
                <a href="Math/toanhoc.html">&#x2211; Math</a>
                <a href="Non-Math/nonmath.html">&#x2734; Non Math</a>
                <a href="My-Life/cuocsong.html">&#x2726; My Life</a>
                <a href="About-Me/vetoi.html">&#x25CE; About Me</a>
            </nav>
        </div>
        <button class="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar" aria-label="Toggle sidebar">
            <span class="toggle-icon">&#x00AB;</span>
        </button>
    </aside>`;

    const TOPBAR_HTML = `
    <header class="topbar">
        <div style="color:#5ce1e6; font-family:'JetBrains Mono',monospace; font-size:0.8rem; letter-spacing:2px; flex-shrink:0;">SMP</div>
        <div class="search-wrapper">
            <input id="search-input" class="search-input" type="text" placeholder="Tìm kiếm bài viết...">
            <span class="search-icon">&#x2315;</span>
            <div id="search-results" class="search-results"></div>
        </div>
        <div class="topbar-actions">
            <button id="dark-toggle" class="dark-toggle">&#x263D; Tối</button>
        </div>
    </header>`;

    // ── Inject into placeholders ─────────────────────────────────────────────
    const sidebarEl = document.getElementById('sidebar-placeholder');
    const topbarEl  = document.getElementById('topbar-placeholder');
    if (sidebarEl) sidebarEl.outerHTML = SIDEBAR_HTML;
    if (topbarEl)  topbarEl.outerHTML  = TOPBAR_HTML;

    // ── Sidebar collapse logic ───────────────────────────────────────────────
    function initSidebar() {
        const sidebar   = document.getElementById('main-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const wrapper   = document.querySelector('.main-wrapper');
        if (!sidebar || !toggleBtn) return;

        const STORAGE_KEY  = 'smp-sidebar-collapsed';
        const SIDEBAR_W    = 280; // matches --sidebar-width in shared.css
        const iconEl = toggleBtn.querySelector('.toggle-icon');

        function setCollapsed(collapsed, animate) {
            // Temporarily disable transitions to avoid flash on page load
            if (!animate) {
                sidebar.style.transition = 'none';
                if (wrapper) wrapper.style.transition = 'none';
            }

            sidebar.classList.toggle('collapsed', collapsed);

            // Drive margin-left and width of .main-wrapper directly
            if (wrapper) {
                wrapper.style.marginLeft = collapsed ? '0' : SIDEBAR_W + 'px';
                wrapper.style.width = collapsed
                    ? '100%'
                    : 'calc(100% - ' + SIDEBAR_W + 'px)';
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
