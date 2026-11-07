// Áp dụng ngay lập tức trước khi parse/render để triệt tiêu chớp nháy trắng & giật sidebar
if (localStorage.getItem('smp-dark-mode') === 'true') {
    document.documentElement.classList.add('dark-mode');
}
if (localStorage.getItem('smp-sidebar-collapsed') === 'true') {
    document.documentElement.classList.add('sidebar-collapsed');
}

document.addEventListener('DOMContentLoaded', function () {
    // 1. Get configurations from meta tags
    const postIdMeta = document.querySelector('meta[name="post-id"]');
    const catNameMeta = document.querySelector('meta[name="category-name"]');
    const catUrlMeta = document.querySelector('meta[name="category-url"]');
    const subNameMeta = document.querySelector('meta[name="subcategory-name"]');
    const subFilterMeta = document.querySelector('meta[name="subcategory-filter"]');
    
    const postId = postIdMeta ? postIdMeta.getAttribute('content') : document.title.replace(/[^a-zA-Z0-9]/g, '');
    const catName = catNameMeta ? catNameMeta.getAttribute('content') : 'HOME';
    const catUrl = catUrlMeta ? catUrlMeta.getAttribute('content') : '/home.html';
    const subName = subNameMeta ? subNameMeta.getAttribute('content') : '';
    const subFilter = subFilterMeta ? subFilterMeta.getAttribute('content') : '';

    // Lấy tiêu đề bài viết từ thẻ title (hoặc cắt chuỗi nếu có "SMP — ")
    let postTitle = document.title;
    if (postTitle.startsWith('SMP — ')) postTitle = postTitle.replace('SMP — ', '');
    if (postTitle.startsWith('SMP - ')) postTitle = postTitle.replace('SMP - ', '');

    // 2. Lấy nội dung HTML của người dùng
    let contentContainer = document.getElementById('smp-post-content');
    let contentHtml = '';
    
    if (contentContainer) {
        contentHtml = contentContainer.innerHTML;
        contentContainer.remove();
    } else {
        // Fallback: nếu không có div bao bọc, lấy toàn bộ nội dung body ngoại trừ các script
        contentHtml = document.body.innerHTML;
    }

    // 3. Clear body and build the full layout
    document.body.innerHTML = '';
    document.body.style.display = 'none'; // Giấu đi chờ render xong
    
    // Thêm các CSS cần thiết nếu chưa có trong thẻ head
    const head = document.head;
    
    // Determine depth to root (where 'core' is)
    let depthPrefix = './';
    const path = window.location.pathname;
    const segments = path.split('/').filter(s => s !== '');
    let depth = 0;
    const pagesIdx = segments.indexOf('pages');
    const postsIdx = segments.indexOf('posts');
    const toolsIdx = segments.indexOf('tools');
    const challengesIdx = segments.indexOf('challenges');
    if (pagesIdx !== -1) {
        depth = segments.length - 1 - pagesIdx;
    } else if (postsIdx !== -1) {
        depth = segments.length - 1 - postsIdx;
    } else if (toolsIdx !== -1) {
        depth = segments.length - 1 - toolsIdx;
    } else if (challengesIdx !== -1) {
        depth = segments.length - 1 - challengesIdx;
    }
    if (depth > 0) {
        depthPrefix = '../'.repeat(depth);
    } else if (segments.length === 0 || segments[segments.length - 1].endsWith('.html') === false) {
        depthPrefix = './';
    } else {
        depthPrefix = './';
    }

    if (!document.querySelector('link[href*="shared.css"]')) {
        const linkShared = document.createElement('link');
        linkShared.rel = 'stylesheet';
        linkShared.href = depthPrefix + 'core/css/shared.css?v=99';
        head.appendChild(linkShared);
    }
    if (!document.querySelector('link[href*="post.css"]')) {
        const linkPost = document.createElement('link');
        linkPost.rel = 'stylesheet';
        linkPost.href = depthPrefix + 'core/css/post.css?v=36';
        head.appendChild(linkPost);
    }
    if (contentHtml.includes('solution-mailbox') && !document.querySelector('link[href*="mailbox.css"]')) {
        const linkMailbox = document.createElement('link');
        linkMailbox.rel = 'stylesheet';
        linkMailbox.href = depthPrefix + 'core/css/mailbox.css';
        head.appendChild(linkMailbox);
    }
    
    // Cấu hình MathJax
    if (!window.MathJax) {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
            },
            chtml: {
                scale: 1,
                matchFontHeight: false
            },
            options: {
                enableMenu: false
            }
        };
        const scriptMathJax = document.createElement('script');
        scriptMathJax.async = true;
        scriptMathJax.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
        head.appendChild(scriptMathJax);
    }

    // 4. Dựng Breadcrumb HTML
    let breadcrumbHtml = `<a href="${catUrl}" style="color: inherit; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${catName}</a>`;
    if (subName) {
        breadcrumbHtml += ` &nbsp;&gt;&nbsp; <a href="${catUrl}?filter=${subFilter}" style="color: inherit; text-decoration: none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${subName}</a>`;
    }
    breadcrumbHtml += ` &nbsp;&gt;&nbsp; ${postTitle}`;

    // 5. Build the wrapper HTML
    const FULL_LAYOUT = `
    <button id="exit-focus-btn" onclick="toggleFocusMode()" title="Thoát chế độ tập trung" aria-label="Thoát tập trung">
        Thoát tập trung ✕
    </button>

    <div id="sidebar-placeholder"></div>

    <div class="main-wrapper">
        <div id="topbar-placeholder"></div>

        <main>
            <div class="main-content-layout">

                <aside class="tags-comment-sidebar">
                    <div id="left-sidebar-placeholder"></div>
                </aside>

                <div class="main-articles-body">

                    <div class="exam-meta fade-up" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <span class="exam-tag">${breadcrumbHtml}</span>
                        <div style="display: inline-flex; align-items: center; gap: 12px;">
                            <span id="post-view-count" title="Lượt xem" style="font-size: 0.82rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; display: inline-flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-top: -1px;"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>--</span>
                            <button id="focus-mode-btn"
                                onclick="toggleFocusMode()"
                                title="Chế độ đọc tập trung"
                                aria-label="Đọc tập trung">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            </button>
                            <button id="save-post-btn"
                                onclick="(function(btn){ if(window.toggleSavePost){ const postId = decodeURIComponent(window.location.pathname.split('/').pop().replace('.html','')); const title = document.title.replace(' - SMP','').trim(); toggleSavePost(postId, title, window.location.href, btn); } else { alert('Vui lòng đăng nhập để lưu bài viết!'); } })(this)"
                                title="Lưu bài viết"
                                aria-label="Lưu bài viết">
                                &#x2606;
                            </button>
                        </div>
                    </div>

                    <div class="exam-paper fade-up">
                        ${contentHtml}
                    </div>
                </div>
            </div>



            <div class="giscus-section-outer fade-up" style="max-width: 900px; margin: 48px auto; padding: 48px 24px 0 24px; border-top: 1px solid var(--border-light);">
                <div id="smp-comments-container"></div>
            </div>


                
            <footer class="site-footer fade-up">
                <div class="footer-divider"></div>
                <div class="footer-bottom">
                    <p>&copy; 2026 <span class="footer-brand">SMP</span> — Secrets of Mathematical Principles. All rights reserved.</p>
                </div>
            </footer>
        </main>
    </div>
    `;

    document.body.innerHTML = FULL_LAYOUT;
    
    // 6. Nhúng các script giao diện theo thứ tự tuần tự để tránh race condition
    const scriptsToLoad = [
        depthPrefix + "core/js/sidebar-data.js?v=99",
        depthPrefix + "core/js/layout.js?v=100",
        depthPrefix + "core/js/shared.js?v=52",
        depthPrefix + "core/js/saved.js?v=35",
        depthPrefix + "core/js/comment.js?v=35"
    ];

    window.toggleFocusMode = function() {
        const isFocus = document.body.classList.toggle('focus-mode');
        localStorage.setItem('smp-focus-mode', isFocus ? 'true' : 'false');
        const exitBtn = document.getElementById('exit-focus-btn');
        if (exitBtn) {
            exitBtn.classList.remove('focus-btn-hidden');
        }
    };

    // Check local storage for focus mode
    if (localStorage.getItem('smp-focus-mode') === 'true') {
        document.body.classList.add('focus-mode');
        setTimeout(() => {
            const exitBtn = document.getElementById('exit-focus-btn');
            if (exitBtn) exitBtn.classList.remove('focus-btn-hidden');
        }, 50);
    }

    function loadScriptSequentially(index) {
        if (index >= scriptsToLoad.length) {
            document.body.style.display = '';
            if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
                window.MathJax.typesetPromise().catch(function(e) { console.warn('MathJax:', e); });
            }
            return;
        }
        const script = document.createElement('script');
        script.src = scriptsToLoad[index];
        script.onload = () => loadScriptSequentially(index + 1);
        script.onerror = () => {
            console.warn('Failed to load:', scriptsToLoad[index]);
            loadScriptSequentially(index + 1);
        };
        document.body.appendChild(script);
    }
    
    loadScriptSequentially(0);
});

