document.addEventListener('DOMContentLoaded', function () {
    // 1. Get configurations from meta tags
    const postIdMeta = document.querySelector('meta[name="post-id"]');
    const catNameMeta = document.querySelector('meta[name="category-name"]');
    const catUrlMeta = document.querySelector('meta[name="category-url"]');
    const subNameMeta = document.querySelector('meta[name="subcategory-name"]');
    const subFilterMeta = document.querySelector('meta[name="subcategory-filter"]');
    
    const postId = postIdMeta ? postIdMeta.getAttribute('content') : document.title.replace(/[^a-zA-Z0-9]/g, '');
    const catName = catNameMeta ? catNameMeta.getAttribute('content') : 'HOME';
    const catUrl = catUrlMeta ? catUrlMeta.getAttribute('content') : '/SMP/index.html';
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
    if (!document.querySelector('link[href="/SMP/core/css/shared.css?v=4"]')) {
        const linkShared = document.createElement('link');
        linkShared.rel = 'stylesheet';
        linkShared.href = '/SMP/core/css/shared.css?v=4';
        head.appendChild(linkShared);
    }
    if (!document.querySelector('link[href="/SMP/core/css/post.css?v=4"]')) {
        const linkPost = document.createElement('link');
        linkPost.rel = 'stylesheet';
        linkPost.href = '/SMP/core/css/post.css?v=4';
        head.appendChild(linkPost);
    }
    
    // Cấu hình MathJax
    if (!window.MathJax) {
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']]
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
    <div id="sidebar-placeholder"></div>

    <div class="main-wrapper">
        <div id="topbar-placeholder"></div>

        <main>
            <div class="main-content-layout">

                <aside class="tags-comment-sidebar">
                    <div id="left-sidebar-placeholder"></div>
                </aside>

                <div class="main-articles-body">

                    <a href="javascript:history.back()" class="exam-back-btn fade-up">&#8592; Quay Lại</a>

                    <div class="exam-meta fade-up">
                        <span class="exam-tag">${breadcrumbHtml}</span>
                    </div>

                    <div class="exam-paper-wrapper fade-up">
                        <div class="exam-paper">
                            ${contentHtml}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Thảo Luận & Góp Ý (Giscus) -->
            <div class="giscus-section-outer fade-up" style="max-width: 900px; margin: 48px auto; padding: 48px 24px 0 24px; border-top: 1px solid var(--border-light);">
                <h2 style="font-family: 'Playfair Display', serif; font-size: 1.6rem; margin-bottom: 24px; color: var(--text-main);">Thảo Luận &amp; Góp Ý</h2>
                <div id="giscus-container"></div>
            </div>

            <div class="stats-strip fade-up">
                <div class="stat-item"><div class="stat-number">$\\Sigma$</div><div class="stat-label">Bài Viết</div></div>
                <div class="stat-item"><div class="stat-number">$\\Phi$</div><div class="stat-label">Chủ Đề</div></div>
                <div class="stat-item"><div class="stat-number">2026</div><div class="stat-label">Năm Hoạt Động</div></div>
                <div class="stat-item"><div class="stat-number">$\\infty$</div><div class="stat-label">Đam Mê</div></div>
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
        "/SMP/core/js/sidebar-data.js?v=4",
        "/SMP/core/js/layout.js?v=4",
        "/SMP/core/js/shared.js?v=4"
    ];

    function loadScriptSequentially(index) {
        if (index >= scriptsToLoad.length) {
            document.body.style.display = '';
            if (typeof Comments !== 'undefined') {
                Comments.init(postId);
            }
            return;
        }
        const script = document.createElement('script');
        script.src = scriptsToLoad[index];
        script.onload = () => loadScriptSequentially(index + 1);
        document.body.appendChild(script);
    }
    
    loadScriptSequentially(0);
});
