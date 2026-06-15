// ============================================
//   SMP WEBSITE - SHARED JAVASCRIPT
//   Secret of Mathematical Principles
// ============================================

// === EARLY DARK MODE APPLY (trước DOMContentLoaded để tránh flash màu sai) ===
// Áp class ngay khi script được parse, không cần đợi DOM ready
(function() {
    if (localStorage.getItem('smp-dark-mode') === 'true') {
        document.documentElement.classList.add('dark-mode-pre');
        document.addEventListener('DOMContentLoaded', function() {
            document.body.classList.add('dark-mode');
            document.documentElement.classList.remove('dark-mode-pre');
        }, { once: true });
    }
})();

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

const ALL_POSTS = [
    {
        title: 'Bổ đề Thue và biểu diễn số nguyên tố',
        date: 'June 13, 2026',
        url: '/SMP/posts/math/BoDeThueVaBieuDienSoNguyenTo.html',
        tags: ['Số Học', 'VMO'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[VIASM] Đề thi Vietnam IMO New Initiative 2026 - Khối 11',
        date: 'June 14, 2026',
        url: '/SMP/posts/math/vmo/viasm-khoi-11-2026.html',
        tags: ['Đề Thi', 'VMO'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[VIASM] Đề thi Vietnam IMO New Initiative 2026 - Khối 10',
        date: 'June 14, 2026',
        url: '/SMP/posts/math/vmo/viasm-khoi-10-2026.html',
        tags: ['Đề Thi', 'VMO'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Bắc Ninh] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/bacninh-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[An Giang] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/angiang-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Đà Nẵng] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/danang-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Đồng Tháp] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/dongthap-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Hải Phòng] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/haiphong-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Hưng Yên] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/hungyen-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Lai Châu] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/laichau-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Lào Cai] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/laocai-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Ninh Bình] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/ninhbinh-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Quảng Ngãi] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/quangngai-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Quảng Trị] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/quangtri-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Thanh Hóa] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/thanhhoa-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Tuyên Quang] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/tuyenquang-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Nghệ An] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/nghean-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
{
        title: '[PTNK] Đề thi tuyển sinh lớp 10 môn Toán Chuyên năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/ptnk-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Phú Thọ] Đề thi môn Toán chuyên Toán năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/phutho-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Phú Thọ] Đề thi môn Toán chuyên Tin năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/phutho-tin-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Đắk Lắk] Đề thi môn Toán chuyên năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/daklak-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Hà Nội] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/hanoi-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Hà Nội] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên Tin) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/hanoi-tin-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[ĐH Vinh] Đề thi tuyển sinh lớp 10 THPT Chuyên ĐH Vinh năm 2026 (Vòng 2)',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/dhvinh-vong2-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Khánh Hòa] Đề thi tuyển sinh lớp 10 THPT Chuyên năm 2026',
        date: 'May 29, 2026',
        url: '/SMP/posts/math/dethichuyen/khanhhoa-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Thái Nguyên] Đề thi tuyển sinh lớp 10 THPT môn Toán (Chuyên Toán) năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/thainguyen-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Huế] Đề thi tuyển sinh lớp 10 Chuyên môn Toán năm 2026',
        date: 'June 01, 2026',
        url: '/SMP/posts/math/dethichuyen/hue-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[KHTN] Đề thi tuyển sinh lớp 10 THPT Chuyên KHTN năm 2026 (Vòng 1 & Vòng 2)',
        date: 'June 06, 2026',
        url: '/SMP/posts/math/dethichuyen/khtn-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Hà Nội] Đề thi tuyển sinh lớp 10 môn Toán năm 2026',
        date: 'May 31, 2026',
        url: '/SMP/posts/math/hanoi-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Hà Tĩnh] Đề thi môn Toán chuyên lớp 10 THPT Chuyên Hà Tĩnh năm 2026',
        date: 'June 05, 2026',
        url: '/SMP/posts/math/dethichuyen/hatinh-2026.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[HSGS] Đề thi thử lần 2 môn Toán (Chuyên) năm 2026',
        date: 'March 08, 2026',
        url: '/SMP/posts/math/ThiThuLan2HSGS2526.html',
        tags: ['Chuyên Toán', 'Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[HSGS] Số Học trong đề thi thử (Toán điều kiện) năm 2026 (Đợt 2)',
        date: 'March 07, 2026',
        url: '/SMP/posts/math/SoHocTrongDeThiThuToanDKHSGS2526.html',
        tags: ['Số Học', 'Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[HSGS] Đề thi thử lần 2 môn Toán (Chung) năm 2026',
        date: 'March 07, 2026',
        url: '/SMP/posts/math/DeThiThuLan2ToanDKHSGS.html',
        tags: ['Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: 'HCMUS Olympic Team Selection Test (Algebra)',
        date: 'March 07, 2026',
        url: '/SMP/posts/math/HCMUS_Olympic_Team_Selection_Test_Algebra.html',
        tags: ['Math Olympiad', 'Đại số'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: 'On a Counting Problem, From HCMUS TST',
        date: 'March 07, 2026',
        url: '/SMP/posts/math/On_a_Counting_Problem_From_HCMUS_TST.html',
        tags: ['Tổ Hợp', 'TST'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: 'Về Một Bài Phương Trình Hàm',
        date: 'March 07, 2026',
        url: '/SMP/posts/math/Về_Một_Bài_Phương_Trình_Hàm.html',
        tags: ['Đại số', 'Math'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: 'Tọa Độ Cực và Ứng Dụng',
        date: 'May 06, 2026',
        url: '/SMP/posts/math/toa_do_cuc.html',
        tags: ['THPT'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: 'A Number Theory Problem from the Poland TST',
        date: 'March 07, 2026',
        url: '/SMP/posts/math/polandNumber.html',
        tags: ['Số Học', 'TST'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: '[Đồng Nai] Đề tuyển sinh lớp 10 môn Toán (chuyên) năm 2025',
        date: 'February 23, 2026',
        url: '/SMP/posts/math/dethichuyen/dongnai-2025.html',
        tags: ['Chuyên Toán', 'Đề Thi'],
        page: '/SMP/pages/toanhoc.html'
    },
    {
        title: 'Khóa học Số học Olympic 2026',
        date: 'April 19, 2026',
        url: '/SMP/posts/math/KhoaSoHoc.html',
        tags: ['Tài Liệu', 'Số Học'],
        page: '/SMP/pages/nonmath.html'
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

// Register Service Worker for PWA
let deferredPrompt;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/SMP/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    const installBtn = document.getElementById('install-app-btn');
    if (installBtn) {
        installBtn.style.display = 'inline-block';
        installBtn.addEventListener('click', async () => {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
});


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
                    background: var(--main-bg, #fafaf8); border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    display: flex; flex-direction: column; overflow: hidden;
                    transform: translateY(20px); transition: transform 0.25s ease;
                }
                .smp-modal-overlay.show .smp-modal-content { transform: translateY(0); }
                .smp-modal-body { flex: 1; overflow-y: auto; padding: 50px 40px 30px; }
                @media (max-width: 768px) {
                    .smp-modal-content { width: 95%; max-height: 90vh; }
                    .smp-modal-body { padding: 50px 20px 20px; }
                }
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
                if (url.includes('/tools/')) {
                    const embedUrl = url.split('#')[0] + (url.includes('?') ? '&' : '?') + 'embed=true' + (url.includes('#') ? '#' + url.split('#')[1] : '');
                    const iframeHTML = `
                        <style>
                            #modal-body { padding: 0 !important; overflow: hidden !important; }
                            .tool-iframe-wrapper {
                                padding: 2px;
                                background: linear-gradient(135deg, rgba(92,225,230,0.5) 0%, rgba(167,139,250,0.5) 100%);
                                border-radius: 14px;
                                box-shadow: 0 10px 40px -10px rgba(92, 225, 230, 0.25);
                                height: 88vh;
                                width: 100%;
                                box-sizing: border-box;
                            }
                            .tool-iframe-wrapper iframe {
                                width: 100%; height: 100%; display: block; border: none; border-radius: 12px;
                            }
                        </style>
                        <div class="tool-iframe-wrapper">
                            <iframe src="${embedUrl}"></iframe>
                        </div>`;
                    this.openHTML(iframeHTML);
                    return;
                }
                const response = await fetch(url);
                const htmlText = await response.text();
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                
                // BƯỚC QUAN TRỌNG: Rút trích cả thẻ <style> từ bài viết để giữ CSS bản đẹp
                let extractedStyles = '';
                if (!document.querySelector('link[href*="post.css"]')) {
                    extractedStyles += '<link rel="stylesheet" href="/SMP/core/css/post.css">';
                }
                doc.querySelectorAll('style').forEach(s => extractedStyles += s.outerHTML);
                doc.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                    if (!l.href.includes('shared.css') && !l.href.includes('post.css')) {
                        extractedStyles += l.outerHTML;
                    }
                });

                // Lấy nội dung bản dựng mới hoặc cột phải của bài viết gốc
                const newPostContent = doc.getElementById('smp-post-content');
                let realContent = '';
                if (newPostContent) {
                    realContent = '<div class="exam-paper fade-up">' + newPostContent.innerHTML + '</div>';
                } else {
                    realContent = doc.querySelector('.main-articles-body')?.innerHTML || doc.body.innerHTML;
                }

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
                if (url.includes('/tools/')) {
                    const embedUrl = url.split('#')[0] + (url.includes('?') ? '&' : '?') + 'embed=true' + (url.includes('#') ? '#' + url.split('#')[1] : '');
                    setTimeout(() => {
                        col.innerHTML = `
                            <a href="javascript:void(0)" class="exam-back-btn fade-up" style="margin-bottom: 20px; display: inline-flex;">&#8592; Quay Lại Danh Sách</a>
                            <style>
                                .right-col-tool-wrapper {
                                    padding: 2px;
                                    background: linear-gradient(135deg, rgba(92,225,230,0.5) 0%, rgba(167,139,250,0.5) 100%);
                                    border-radius: 14px;
                                    box-shadow: 0 10px 40px -10px rgba(92, 225, 230, 0.25);
                                    height: 80vh;
                                    width: 100%;
                                    box-sizing: border-box;
                                    margin-bottom: 30px;
                                }
                                .right-col-tool-wrapper iframe {
                                    width: 100%; height: 100%; display: block; border: none; border-radius: 12px;
                                }
                            </style>
                            <div class="right-col-tool-wrapper fade-up">
                                <iframe src="${embedUrl}"></iframe>
                            </div>`;
                    }, 200);
                    return;
                }
                const response = await fetch(url);
                const htmlText = await response.text();
                const doc = new DOMParser().parseFromString(htmlText, 'text/html');
                
                // Nhúng cả CSS và Nội dung vào cột phải trang chủ
                let extractedStyles = '';
                if (!document.querySelector('link[href*="post.css"]')) {
                    extractedStyles += '<link rel="stylesheet" href="/SMP/core/css/post.css">';
                }
                doc.querySelectorAll('style').forEach(s => extractedStyles += s.outerHTML);
                doc.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
                    if (!l.href.includes('shared.css') && !l.href.includes('post.css')) {
                        extractedStyles += l.outerHTML;
                    }
                });
                
                const newPostContent = doc.getElementById('smp-post-content');
                let fullRealContent = '';
                if (newPostContent) {
                    fullRealContent = '<a href="javascript:void(0)" class="exam-back-btn fade-up">&#8592; Quay Lại Danh Sách</a>' + 
                                      '<div class="exam-paper fade-up">' + newPostContent.innerHTML + '</div>';
                } else {
                    fullRealContent = doc.querySelector('.main-articles-body')?.innerHTML || doc.body.innerHTML;
                }

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
function initShared() {
    if (window.location.search.includes('embed=true')) {
        document.body.classList.add('embed-mode');
    }
    
    DarkMode.init();
    LiveSearch.init();
    setActiveNav();
    PostViewer.init();

    // === BACK BUTTON: dùng history.back() thay vì link cứng ===
    // Intercept tất cả .exam-back-btn để quay lại trang trước
    document.querySelectorAll('.exam-back-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Nếu có lịch sử duyệt web thì quay lại
            if (window.history.length > 1) {
                e.preventDefault();
                window.history.back();
            }
            // Nếu không có lịch sử (vào thẳng URL), dùng href gốc bình thường
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShared);
} else {
    initShared();
}