// ============================================
//   SMP WEBSITE - SHARED JAVASCRIPT
//   Secret of Mathematical Principles
// ============================================

// === DARK MODE ===
const DarkMode = {
    init() {
        const saved = localStorage.getItem('smp-dark-mode');
        if (saved === 'true') this.enable(false);
        this.bindToggle();
    },
    enable(save = true) {
        document.body.classList.add('dark-mode');
        if (save) localStorage.setItem('smp-dark-mode', 'true');
        this.updateBtn('☀ Sáng');
    },
    disable(save = true) {
        document.body.classList.remove('dark-mode');
        if (save) localStorage.setItem('smp-dark-mode', 'false');
        this.updateBtn('☽ Tối');
    },
    toggle() {
        if (document.body.classList.contains('dark-mode')) this.disable();
        else this.enable();
    },
    updateBtn(text) {
        const btn = document.getElementById('dark-toggle');
        if (btn) btn.textContent = text;
    },
    bindToggle() {
        const btn = document.getElementById('dark-toggle');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
            this.updateBtn(document.body.classList.contains('dark-mode') ? '☀ Sáng' : '☽ Tối');
        }
    }
};

// === ALL POSTS DATABASE ===
const ALL_POSTS = [
    {
        title: '[HSGS] Đề thi thử lần 2 môn Toán (Chuyên) năm 2026',
        date: 'March 08, 2026',
        url: 'https://smp0907.blogspot.com/2026/03/hsgs-e-thi-thu-lan-2-mon-toan-chuyen.html',
        tags: ['Chuyên Toán', 'Đề Thi'],
        page: '/Math/toanhoc.html'
    },
    {
        title: '[HSGS] Số Học trong đề thi thử (Toán điều kiện) năm 2026 (Đợt 2)',
        date: 'March 07, 2026',
        url: 'https://smp0907.blogspot.com/2026/03/hsgs-bai-toan-so-hoc-trong-e-thi-thu.html',
        tags: ['Số Học', 'Đề Thi'],
        page: '/Math/toanhoc.html'
    },
    {
        title: '[HSGS] Đề thi thử lần 2 môn Toán (Chung) năm 2026',
        date: 'March 07, 2026',
        url: 'https://smp0907.blogspot.com/2026/03/hsgs-e-thi-thu-lan-2-mon-toan-chung-nam.html',
        tags: ['Đề Thi'],
        page: '/Math/toanhoc.html'
    },
    {
        title: 'HCMUS Olympic Team Selection Test (Algebra)',
        date: 'March 07, 2026',
        url: 'https://smp0907.blogspot.com/2026/03/hcmus-olympic-team-selection-test.html',
        tags: ['Math Olympiad', 'Algebra'],
        page: '/Math/toanhoc.html'
    },
    {
        title: 'On a Counting Problem, From HCMUS TST',
        date: 'March 07, 2026',
        url: 'https://smp0907.blogspot.com/2026/03/on-counting-problem-from-student.html',
        tags: ['Combinatorics', 'TST'],
        page: '/Math/toanhoc.html'
    },
    {
        title: 'Về Một Bài Phương Trình Hàm',
        date: 'March 07, 2026',
        url: 'https://smp0907.blogspot.com/2026/03/ve-mot-bai-phuong-trinh-ham.html',
        tags: ['Giải Tích', 'Math'],
        page: '/Math/toanhoc.html'
    },
    {
        title: 'A Number Theory Problem from the Poland TST',
        date: 'March 07, 2026',
        url: '/Math/polandNumber.html',
        tags: ['Number Theory', 'TST'],
        page: '/Math/toanhoc.html'
    },
    {
        title: '[Đồng Nai] Đề tuyển sinh lớp 10 môn Toán (chuyên) năm 2025',
        date: 'February 23, 2026',
        url: '/Math/dongnai-2025.html',
        tags: ['Chuyên Toán', 'Đề Thi'],
        page: '/Math/toanhoc.html'
    },
    {
        title: 'Khóa học Số học Olympic 2026',
        date: 'April 19, 2026',
        url: 'https://smp0907.blogspot.com/2026/04/khoa-hoc-so-hoc-olympic-2026.html',
        tags: ['Tài Liệu', 'Number Theory'],
        page: '/Non%20Math/tailieu.html'
    }
];

// === LIVE SEARCH ===
const LiveSearch = {
    init() {
        const input = document.getElementById('search-input');
        const dropdown = document.getElementById('search-results');
        if (!input || !dropdown) return;

        input.addEventListener('input', () => {
            const q = input.value.trim().toLowerCase();
            if (q.length < 2) { dropdown.classList.remove('show'); return; }

            const hits = ALL_POSTS.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            );

            if (hits.length === 0) {
                dropdown.innerHTML = '<div class="search-no-results">Không tìm thấy bài viết phù hợp</div>';
            } else {
                dropdown.innerHTML = hits.slice(0, 6).map(p => {
                    const isExternal = p.url.startsWith('http');
                    return `
                        <a class="search-result-item" href="${p.url}" ${isExternal ? 'target="_blank"' : ''}>
                            <div class="search-result-title">${p.title}</div>
                            <div class="search-result-date">${p.date} · ${p.tags.join(', ')}</div>
                        </a>
                    `;
                }).join('');
            }
            dropdown.classList.add('show');
        });

        document.addEventListener('click', e => {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        input.addEventListener('keydown', e => {
            if (e.key === 'Escape') dropdown.classList.remove('show');
        });
    }
};

// === COMMENT SYSTEM (localStorage) ===
const Comments = {
    getKey(pageId) { return `smp-comments-${pageId}`; },

    load(pageId) {
        try {
            return JSON.parse(localStorage.getItem(this.getKey(pageId))) || [];
        } catch { return []; }
    },

    save(pageId, comments) {
        localStorage.setItem(this.getKey(pageId), JSON.stringify(comments));
    },

    render(pageId) {
        const list = document.getElementById('comment-list');
        if (!list) return;
        const comments = this.load(pageId);
        if (comments.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem; text-align:center; padding: 20px 0;">Chưa có bình luận nào. Hãy là người đầu tiên!</p>';
            return;
        }
        list.innerHTML = comments.map(c => `
            <div class="comment-item fade-up">
                <div class="comment-meta">
                    <span class="comment-author">${this.escape(c.name)}</span>
                    <span class="comment-date">${c.date}</span>
                </div>
                <div class="comment-text">${this.escape(c.text)}</div>
            </div>
        `).join('');
    },

    submit(pageId) {
        const name = document.getElementById('comment-name')?.value?.trim();
        const text = document.getElementById('comment-text-input')?.value?.trim();
        if (!name || !text) { alert('Vui lòng điền đầy đủ tên và nội dung!'); return; }

        const comments = this.load(pageId);
        comments.unshift({
            name,
            text,
            date: new Date().toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
        });
        this.save(pageId, comments);
        this.render(pageId);

        document.getElementById('comment-name').value = '';
        document.getElementById('comment-text-input').value = '';
    },

    escape(str) {
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },

    init(pageId) {
        if (document.getElementById('comment-list')) {
            this.render(pageId);
        }
        const btn = document.getElementById('comment-submit');
        if (btn) {
            btn.addEventListener('click', () => this.submit(pageId));
        }
    }
};

// === HIGHLIGHT ACTIVE NAV LINK ===
function setActiveNav() {
    let current = window.location.pathname;
    // Normalise trailing slash to /index.html
    if (current === '/' || current === '') current = '/index.html';
    document.querySelectorAll('.sidebar-nav a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === current);
    });
}

// === NEW FEATURE: POST VIEWER & CONTENT SWAP (CỘT TRÁI CỐ ĐỊNH) ===
const PostViewer = {
    _currentUrl: null,
    _savedContent: null,

    init() {
        // 1. Tạo Khung Màn Hình Nhỏ (Tự bọc CSS xịn để không bao giờ vỡ form)
        if (!document.getElementById('post-viewer-modal')) {
            const modalHTML = `
            <style>
                /* CSS độc lập cho Modal để luôn căn giữa và hiển thị đẹp */
                .smp-modal-overlay {
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 99999; opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
                }
                .smp-modal-overlay.show { opacity: 1; pointer-events: auto; }
                .smp-modal-content {
                    position: relative; width: 92%; max-width: 1050px; max-height: 88vh;
                    background: var(--body-bg, #0b1111); border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    display: flex; flex-direction: column; overflow: hidden;
                    transform: translateY(20px); transition: transform 0.25s ease;
                }
                .smp-modal-overlay.show .smp-modal-content { transform: translateY(0); }
                .smp-modal-body { flex: 1; overflow-y: auto; padding: 50px 40px 30px; }
            </style>
            
            <div id="post-viewer-modal" class="smp-modal-overlay">
                <div class="smp-modal-content">
                    
                    <div style="position: absolute; top: 16px; right: 20px; display: flex; gap: 12px; z-index: 100000;">
                        <button id="modal-open-new" title="Đọc trực tiếp tại cột phải" style="width: 34px; height: 34px; border-radius: 6px; border: 1px solid rgba(92,225,230,0.3); background: rgba(92,225,230,0.1); color: #5ce1e6; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                        </button>
                        <button id="modal-close" title="Đóng" style="width: 34px; height: 34px; border-radius: 6px; border: none; background: rgb(255, 60, 0); color: var(--text-main, #fff); cursor: pointer; font-size: 16px; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
                    </div>

                    <div id="modal-body" class="smp-modal-body"></div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        const modal = document.getElementById('post-viewer-modal');

        // Hành động: Nút X tắt màn hình nhỏ
        document.getElementById('modal-close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => { document.getElementById('modal-body').innerHTML = ''; }, 250);
            this._currentUrl = null;
        });

        // HÀNH ĐỘNG QUAN TRỌNG: Bấm nút ô vuông mũi tên
        document.getElementById('modal-open-new').addEventListener('click', () => {
            if (this._currentUrl) {
                const targetUrl = this._currentUrl;
                
                // Tắt màn hình nhỏ mượt mà
                modal.classList.remove('show');
                setTimeout(() => { document.getElementById('modal-body').innerHTML = ''; }, 250);
                this._currentUrl = null;

                // Chọn chính xác cột phải thật (Không bao giờ nhầm với màn hình nhỏ)
                const rightCol = document.querySelector('.main-content-layout .main-articles-body');
                if (rightCol) {
                    this.loadIntoRightColumn(targetUrl, rightCol);
                } else {
                    window.location.href = targetUrl;
                }
            }
        });

        // 2. Lắng nghe click link bài viết ngoài trang chủ
        document.addEventListener('click', async (e) => {
            // Xử lý khi ấn nút "Quay lại" bên trong bài viết
            const backBtn = e.target.closest('.exam-back-btn, .back-to-list-btn');
            if (backBtn) {
                if (this._savedContent) {
                    e.preventDefault();
                    this.restoreRightColumn();
                    return;
                }
            }

            const link = e.target.closest('.card-link, .featured-link, .search-result-item');
            if (!link) return;

            const url = link.getAttribute('href');
            if (!url || url.startsWith('http') || url.startsWith('#')) return;

            e.preventDefault();
            this._currentUrl = url;

            try {
                const response = await fetch(url);
                const htmlText = await response.text();
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                
                // BƯỚC QUAN TRỌNG: Rút trích cả thẻ <style> từ bài viết để giữ CSS bản đẹp
                let extractedStyles = '';
                doc.querySelectorAll('style').forEach(s => extractedStyles += s.outerHTML);

                // Lấy nội dung cột phải của bài viết gốc
                let realContent = doc.querySelector('.main-articles-body')?.innerHTML || doc.body.innerHTML;

                // Gói gọn lại trong class .main-articles-body để CSS nhận diện chuẩn xác
                const finalHTML = extractedStyles + '<div class="main-articles-body" style="padding:0; margin:0;">' + realContent + '</div>';
                
                this.openHTML(finalHTML);
            } catch (error) {
                console.error(error);
            }
        });
    },

    // Hàm xử lý: Cột phải biến mất -> Hiện đang tải -> Bài viết trượt từ phải sang
    loadIntoRightColumn(url, col) {
        if (!this._savedContent) this._savedContent = col.innerHTML;

        // Hiệu ứng mờ dần và trượt sang trái
        col.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        col.style.opacity = '0';
        col.style.transform = 'translateX(-20px)';
        
        setTimeout(async () => {
            col.innerHTML = `
                <div class="content-loading" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height: 350px;">
                    <div style="width:40px; height:40px; border:3px solid rgba(92,225,230,0.2); border-top-color:#5ce1e6; border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                    <span style="margin-top:20px; color:var(--text-muted, #888); font-family:monospace; font-size: 0.9rem;">Đang tải bản đẹp bài viết...</span>
                </div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            `;
            col.style.opacity = '1';
            col.style.transform = 'translateX(0)';
            
            try {
                const response = await fetch(url);
                const htmlText = await response.text();
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                
                // Nhúng cả CSS và Nội dung vào cột phải trang chủ
                let extractedStyles = '';
                doc.querySelectorAll('style').forEach(s => extractedStyles += s.outerHTML);
                let fullRealContent = doc.querySelector('.main-articles-body')?.innerHTML || doc.body.innerHTML;

                col.style.opacity = '0';
                col.style.transform = 'translateX(40px)'; 
                
                setTimeout(() => {
                    col.innerHTML = extractedStyles + fullRealContent;
                    col.style.transition = 'opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1), transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
                    col.style.opacity = '1';
                    col.style.transform = 'translateX(0)';
                    
                    col.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    if (window.MathJax) {
                        MathJax.typesetClear([col]);
                        MathJax.typesetPromise([col]).catch(() => {});
                    }
                }, 200);
            } catch(e) {
                col.innerHTML = `<div style="text-align:center; padding:40px; color:#ff6b6b;">⚠ Lỗi tải bài viết.</div><button class="back-to-list-btn">← Quay Lại Danh Sách</button>`;
            }
        }, 250);
    },

    // Khôi phục mượt mà danh sách bài viết ban đầu
    restoreRightColumn() {
        const col = document.querySelector('.main-content-layout .main-articles-body');
        if (col && this._savedContent) {
            col.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            col.style.opacity = '0';
            col.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                col.innerHTML = this._savedContent;
                col.style.opacity = '1';
                col.style.transform = 'translateX(0)';
                this._savedContent = null;
                
                if (typeof loadChallenge === 'function') loadChallenge();
                if (window.MathJax) {
                    MathJax.typesetClear([col]);
                    MathJax.typesetPromise([col]).catch(() => {});
                }
            }, 200);
        }
    },

    openHTML(htmlContent) {
        const body = document.getElementById('modal-body');
        body.innerHTML = htmlContent;
        document.getElementById('post-viewer-modal').classList.add('show');
        
        if (window.MathJax) {
            MathJax.typesetClear([body]);
            MathJax.typesetPromise([body]).catch(err => console.error(err));
        }
    }
};

// === INIT ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
    LiveSearch.init();
    setActiveNav();
    PostViewer.init(); 
});