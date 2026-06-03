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
// MẸO: Bài nào viết thành file HTML riêng thì bạn điền tên file vào 'url' (Ví dụ bài Đồng Nai)
// Bài nào chưa kịp chuyển sang file riêng thì cứ giữ nguyên link Blogspot cũ.
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
                    // Nếu là link ngoài thì mở tab mới, nếu là file html riêng thì để PostViewer xử lý công nghệ cao
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

// === NEW FEATURE: POST VIEWER (DYNAMIC FETCH HTML FILES) ===
const PostViewer = {
    _currentUrl: null, // Lưu URL bài viết đang mở để nút "mở trang mới" dùng

    init() {
        // 1. Tự động tạo Khung chứa bài viết (Modal) ở cuối trang nếu chưa có
        if (!document.getElementById('post-viewer-modal')) {
            const modalHTML = `
            <div id="post-viewer-modal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">SMP Reader</h3>
                        <div style="display:flex; align-items:center; gap:10px; flex-shrink:0;">
                            <button id="modal-open-new" class="modal-close-btn" title="Mở ra trang mới" style="display:flex; align-items:center; gap:6px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                            </button>
                            <button id="modal-close" class="modal-close-btn">✕</button>
                        </div>
                    </div>
                    <div id="modal-body" class="modal-body"></div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        const modal = document.getElementById('post-viewer-modal');

        // Nút Đóng — giữ nguyên logic cũ
        document.getElementById('modal-close').addEventListener('click', () => {
            modal.classList.remove('show');
            document.getElementById('modal-body').innerHTML = '';
            this._currentUrl = null;
        });

        // Nút Mở Trang Mới — điều hướng thẳng đến file HTML trong tab mới
        document.getElementById('modal-open-new').addEventListener('click', () => {
            if (this._currentUrl) {
                window.open(this._currentUrl, '_blank');
            }
        });

        // 2. Dùng Event Delegation: Lắng nghe hành vi click toàn trang
        // Kỹ thuật này giúp bắt được cả các link sinh ra từ Live Search
        document.addEventListener('click', async (e) => {
            const link = e.target.closest('.card-link, .featured-link, .search-result-item');
            if (!link) return;

            const url = link.getAttribute('href');
            // Nếu không có link, hoặc là link ngoài (http), hoặc link neo (#) thì bỏ qua
            if (!url || url.startsWith('http') || url.startsWith('#')) return;

            // Chặn chuyển hướng trang mặc định của thẻ <a>
            e.preventDefault();

            // Lưu lại URL để nút "Mở Trang Mới" dùng
            this._currentUrl = url;

            try {
                // Đọc ngầm file HTML riêng biệt
                const response = await fetch(url);
                if (!response.ok) throw new Error("Không thể tải file bài viết.");
                
                const htmlText = await response.text();

                // Bóc tách lấy nội dung bên trong thẻ body của file đó
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const bodyContent = doc.body.innerHTML;
                const pageTitle = doc.querySelector('h1')?.innerText || "Chi Tiết Bài Viết";

                // Hiển thị lên giao diện
                this.openHTML(pageTitle, bodyContent);

            } catch (error) {
                console.error(error);
                alert("Lỗi: Không thể mở bài viết. Hãy chắc chắn bạn đang chạy trang web bằng Live Server chứ không phải click đúp mở trực tiếp từ folder máy tính!");
            }
        });
    },

    openHTML(title, htmlContent) {
        document.getElementById('modal-title').innerText = title;
        const body = document.getElementById('modal-body');
        body.innerHTML = htmlContent;
        document.getElementById('post-viewer-modal').classList.add('show');
        
        // Ép MathJax biên dịch lại các công thức toán vừa nạp động vào
        if (window.MathJax) {
            MathJax.typesetClear([body]);
            MathJax.typesetPromise([body]).catch(err => console.error("MathJax Error: ", err.message));
        }
    }
};

// === INIT ON DOM READY ===
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
    LiveSearch.init();
    setActiveNav();
    PostViewer.init(); // <-- Đã kích hoạt chạy trình xem bài viết
});
