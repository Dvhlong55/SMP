// ============================================
//   SMP WEBSITE - SHARED JAVASCRIPT
//   Secret of Mathematical Principles
// ============================================

var API_BASE = 'https://smp-backend-kcwn.onrender.com';

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
window.DarkMode = {
    init() {
        const saved = localStorage.getItem('smp-dark-mode');
        if (saved === 'true') this.enable(false);
        else if (saved === 'false') this.disable(false);
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
        title: '§ Ước Lượng Hàm Định Giá p-adic',
        date: 'June 21, 2026',
        url: '/posts/math/vmo/uoc-luong-ham-dinh-gia-p-adic.html',
        tags: ['Số Học', 'VMO'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'Bài Tập Về Hệ Thặng Dư -- Phương Trình Đồng Dư',
        date: 'June 17, 2026',
        url: '/posts/math/vmo/bai-tap-dong-du.html',
        tags: ['Số Học', 'VMO'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'Bổ đề Thue và biểu diễn số nguyên tố',
        date: 'June 13, 2026',
        url: '/posts/math/BoDeThueVaBieuDienSoNguyenTo.html',
        tags: ['Số Học', 'VMO'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[VIASM] Đề thi Vietnam IMO New Initiative 2026 - Khối 11',
        date: 'June 14, 2026',
        url: '/posts/math/vmo/viasm-khoi-11-2026.html',
        tags: ['Đề Thi', 'VMO'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[VIASM] Đề thi Vietnam IMO New Initiative 2026 - Khối 10',
        date: 'June 14, 2026',
        url: '/posts/math/vmo/viasm-khoi-10-2026.html',
        tags: ['Đề Thi', 'VMO'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Bắc Ninh] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/bacninh-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[An Giang] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/angiang-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Đà Nẵng] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/danang-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Đồng Tháp] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/dongthap-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Hải Phòng] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/haiphong-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Hưng Yên] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/hungyen-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Lai Châu] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/laichau-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Lào Cai] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/laocai-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Ninh Bình] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/ninhbinh-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Quảng Ngãi] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/quangngai-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Quảng Trị] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/quangtri-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Thanh Hóa] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/thanhhoa-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Tuyên Quang] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/tuyenquang-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Nghệ An] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/nghean-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
{
        title: '[PTNK] Đề thi tuyển sinh lớp 10 môn Toán Chuyên năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/ptnk-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Phú Thọ] Đề thi môn Toán chuyên Toán năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/phutho-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Phú Thọ] Đề thi môn Toán chuyên Tin năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/phutho-tin-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Đắk Lắk] Đề thi môn Toán chuyên năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/daklak-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Hà Nội] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/hanoi-chuyen-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Hà Nội] Đề thi tuyển sinh lớp 10 môn Toán (Chuyên Tin) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/hanoi-tin-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[ĐH Vinh] Đề thi tuyển sinh lớp 10 THPT Chuyên ĐH Vinh năm 2026 (Vòng 2)',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/dhvinh-vong2-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Khánh Hòa] Đề thi tuyển sinh lớp 10 THPT Chuyên năm 2026',
        date: 'May 29, 2026',
        url: '/posts/math/dethichuyen/khanhhoa-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Thái Nguyên] Đề thi tuyển sinh lớp 10 THPT môn Toán (Chuyên Toán) năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/thainguyen-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Huế] Đề thi tuyển sinh lớp 10 Chuyên môn Toán năm 2026',
        date: 'June 01, 2026',
        url: '/posts/math/dethichuyen/hue-toan-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[KHTN] Đề thi tuyển sinh lớp 10 THPT Chuyên KHTN năm 2026 (Vòng 1 & Vòng 2)',
        date: 'June 06, 2026',
        url: '/posts/math/dethichuyen/khtn-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Hà Nội] Đề thi tuyển sinh lớp 10 môn Toán năm 2026',
        date: 'May 31, 2026',
        url: '/posts/math/hanoi-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Hà Tĩnh] Đề thi môn Toán chuyên lớp 10 THPT Chuyên Hà Tĩnh năm 2026',
        date: 'June 05, 2026',
        url: '/posts/math/dethichuyen/hatinh-2026.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[HSGS] Đề thi thử lần 2 môn Toán (Chuyên) năm 2026',
        date: 'March 08, 2026',
        url: '/posts/math/ThiThuLan2HSGS2526.html',
        tags: ['Chuyên Toán', 'Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[HSGS] Số Học trong đề thi thử (Toán điều kiện) năm 2026 (Đợt 2)',
        date: 'March 07, 2026',
        url: '/posts/math/SoHocTrongDeThiThuToanDKHSGS2526.html',
        tags: ['Số Học', 'Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[HSGS] Đề thi thử lần 2 môn Toán (Chung) năm 2026',
        date: 'March 07, 2026',
        url: '/posts/math/DeThiThuLan2ToanDKHSGS.html',
        tags: ['Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'HCMUS Olympic Team Selection Test (Algebra)',
        date: 'March 07, 2026',
        url: '/posts/math/HCMUS_Olympic_Team_Selection_Test_Algebra.html',
        tags: ['Math Olympiad', 'Đại số'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'On a Counting Problem, From HCMUS TST',
        date: 'March 07, 2026',
        url: '/posts/math/On_a_Counting_Problem_From_HCMUS_TST.html',
        tags: ['Tổ Hợp', 'TST'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'Về Một Bài Phương Trình Hàm',
        date: 'March 07, 2026',
        url: '/posts/math/Về_Một_Bài_Phương_Trình_Hàm.html',
        tags: ['Đại số', 'Math'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'Tọa Độ Cực và Ứng Dụng',
        date: 'May 06, 2026',
        url: '/posts/math/toa_do_cuc.html',
        tags: ['THPT'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'A Number Theory Problem from the Poland TST',
        date: 'March 07, 2026',
        url: '/posts/math/polandNumber.html',
        tags: ['Số Học', 'TST'],
        page: '/pages/toanhoc.html'
    },
    {
        title: '[Đồng Nai] Đề tuyển sinh lớp 10 môn Toán (chuyên) năm 2025',
        date: 'February 23, 2026',
        url: '/posts/math/dethichuyen/dongnai-2025.html',
        tags: ['Chuyên Toán', 'Đề Thi'],
        page: '/pages/toanhoc.html'
    },
    {
        title: 'Khóa học Số học Olympic 2026',
        date: 'April 19, 2026',
        url: '/posts/math/KhoaSoHoc.html',
        tags: ['Tài Liệu', 'Số Học'],
        page: '/pages/nonmath.html'
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
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });

    // Tự động tải lại trang khi Service Worker mới được kích hoạt và chiếm quyền kiểm soát
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            console.log('Service Worker updated. Reloading page...');
            window.location.reload();
        }
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

// === MATHJAX OVERFLOW FIXER ===
// Liên tục kiểm tra và xử lý công thức Toán dài vượt quá màn hình
setInterval(function() {
    document.querySelectorAll('mjx-container:not([display="true"])').forEach(mjx => {
        if (mjx.offsetWidth > mjx.parentElement.clientWidth) {
            mjx.style.display = 'block';
            mjx.style.overflowX = 'auto';
            mjx.style.overflowY = 'hidden';
            mjx.style.maxWidth = '100%';
            mjx.style.minWidth = '0';
            mjx.style.paddingBottom = '4px'; // Avoid clipping scrollbar
        }
    });
}, 1000);


// === HIGHLIGHT ACTIVE NAV LINK ===
function setActiveNav() {
    let current = window.location.pathname;
    // Normalise trailing slash to /index.html
    if (current === '/' || current === '') current = '/index.html';
    if (current === '/SMP' || current === '/') current = '/index.html';
    document.querySelectorAll('.sidebar-nav a, .mobile-bottom-nav a').forEach(a => {
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
                    extractedStyles += '<link rel="stylesheet" href="/core/css/post.css">';
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
                    extractedStyles += '<link rel="stylesheet" href="/core/css/post.css">';
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

// === ADD SAVE BUTTONS TO CARDS DYNAMICALLY ===
function addSaveButtonsToCards() {
    const cards = document.querySelectorAll('.card, .featured-card');
    cards.forEach(card => {
        if (card.querySelector('.card-save-btn')) return;

        const link = card.querySelector('.card-link, .featured-link');
        const titleEl = card.querySelector('h3');
        if (!link || !titleEl) return;

        const url = link.getAttribute('href');
        const title = titleEl.innerText.trim();

        if (!url || url.startsWith('http') || url.startsWith('#') || url.includes('forum.html')) return;

        const postId = url.split('/').pop().replace('.html', '');

        const saveBtn = document.createElement('button');
        saveBtn.className = 'card-save-btn';
        saveBtn.innerHTML = '&#x2606; Lưu bài';
        Object.assign(saveBtn.style, {
            background: 'none',
            border: '1px solid var(--border-light)',
            color: 'var(--text-muted)',
            padding: '4px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s',
            marginLeft: 'auto'
        });
        
        saveBtn.onmouseover = () => { saveBtn.style.color = 'var(--accent-gold)'; saveBtn.style.borderColor = 'var(--accent-gold)'; };
        saveBtn.onmouseout = () => { 
            if (!saveBtn.classList.contains('saved-active')) { 
                saveBtn.style.color = 'var(--text-muted)'; 
                saveBtn.style.borderColor = 'var(--border-light)'; 
            } 
        };

        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (window.toggleSavePost) {
                const fullUrl = window.location.origin + url;
                window.toggleSavePost(postId, title, fullUrl, saveBtn);
            } else {
                alert('Vui lòng đăng nhập để lưu bài viết!');
            }
        });

        const footerDiv = document.createElement('div');
        footerDiv.style.display = 'flex';
        footerDiv.style.justifyContent = 'space-between';
        footerDiv.style.alignItems = 'center';
        footerDiv.style.marginTop = '15px';
        
        link.style.marginTop = '0';
        
        link.parentNode.insertBefore(footerDiv, link);
        footerDiv.appendChild(link);
        footerDiv.appendChild(saveBtn);
    });
}

// === INIT ON DOM READY ===
function initShared() {
    if (window.location.search.includes('embed=true')) {
        document.body.classList.add('embed-mode');
    }
    
    window.DarkMode.init();
    LiveSearch.init();
    setActiveNav();
    PostViewer.init();
    addSaveButtonsToCards();

    // Fetch and display view count for posts
    const viewCountEl = document.getElementById('post-view-count');
    if (viewCountEl) {
        const postIdMeta = document.querySelector('meta[name="post-id"]');
        const postId = postIdMeta ? postIdMeta.getAttribute('content') : null;
        if (postId) {
            fetch(`${API_BASE}/api/views/${postId}`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.views !== undefined) {
                        viewCountEl.textContent = `👁 ${data.views} lượt xem`;
                    }
                })
                .catch(err => console.error('Error fetching view count:', err));
        }
    }

    // === BACK BUTTON: dùng history.back() thay vì link cứng ===
    // Intercept tất cả .exam-back-btn để quay lại trang trước
    document.querySelectorAll('.exam-back-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (window.history.length > 1) {
                e.preventDefault();
                window.history.back();
            }
        });
    });

    initCustomCursor();
    initFadeUpAnimation();
}

// === TOGGLE SAVE POST GLOBAL LOGIC ===
window.toggleSavePost = async function(postId, postTitle, postUrl, btnElement) {
    const token = localStorage.getItem('smp_access_token');
    if (!token) {
        alert("Vui lòng đăng nhập để lưu bài viết!");
        if (window.openAuthModal) window.openAuthModal('login');
        return;
    }
    
    const isSaving = btnElement.innerText.includes('Bỏ lưu') ? false : true;
    const originalText = btnElement.innerText;
    btnElement.innerText = 'Đang xử lý...';
    btnElement.disabled = true;
    
    try {
        const res = await fetch(`${API_BASE}/api/users/saved`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ postId, postTitle, postUrl })
        });
        
        const data = await res.json();
        if (res.ok) {
            if (data.saved) {
                btnElement.innerHTML = '&#x2605; Đã lưu';
                btnElement.classList.add('saved-active');
            } else {
                btnElement.innerHTML = '&#x2606; Lưu bài';
                btnElement.classList.remove('saved-active');
            }
        } else {
            btnElement.innerText = originalText;
            alert(data.detail || "Lỗi lưu bài viết");
        }
    } catch (err) {
        btnElement.innerText = originalText;
        alert("Không thể kết nối đến máy chủ.");
    } finally {
        btnElement.disabled = false;
    }
}

// === CUSTOM CURSOR ===
function initCustomCursor() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // Ignore on touch devices

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    const attachHoverEvents = () => {
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, .sidebar-toggle, .post-card, .custom-cursor-hover');
        interactiveElements.forEach(el => {
            if (!el.dataset.cursorAttached) {
                el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
                el.dataset.cursorAttached = 'true';
            }
        });
    };

    attachHoverEvents();

    // Re-attach hover events when DOM changes (e.g., loading posts dynamically)
    const observer = new MutationObserver((mutations) => {
        let shouldReattach = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) shouldReattach = true;
        });
        if (shouldReattach) attachHoverEvents();
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// === FADE-UP ANIMATION ===
function initFadeUpAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    const observeFadeElements = () => {
        document.querySelectorAll('.post-card, .post-container, .forum-post, .home-banner, .comment-item').forEach(el => {
            if (!el.classList.contains('fade-up')) el.classList.add('fade-up');
            if (!el.dataset.fadeObserved) {
                observer.observe(el);
                el.dataset.fadeObserved = 'true';
            }
        });
    };

    observeFadeElements();

    // Re-observe when DOM changes
    const mutObserver = new MutationObserver((mutations) => {
        let shouldReobserve = false;
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) shouldReobserve = true;
        });
        if (shouldReobserve) observeFadeElements();
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShared);
} else {
    initShared();
}

window.getUserId = function() {
    const userId = localStorage.getItem('smp_user_id');
    if (userId) return userId;
    const token = localStorage.getItem('smp_access_token');
    if (!token) return '';
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        if (payload && payload.sub) {
            localStorage.setItem('smp_user_id', payload.sub);
            return payload.sub;
        }
    } catch (e) {
        console.error("Error parsing token sub", e);
    }
    return '';
};