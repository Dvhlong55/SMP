var API_BASE = 'https://smp-backend-kcwn.onrender.com';
let currentThreadId = null;
let editingReplyId = null;

// ─── Helpers ──────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('smp_access_token'); }
function getUsername() { return localStorage.getItem('smp_username'); }

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t] || t)
    );
}

function parseLatexTextCommands(text) {
    let result = '';
    let i = 0;
    while (i < text.length) {
        if (text.startsWith('\\textbf{', i) || text.startsWith('\\textit{', i) || text.startsWith('\\underline{', i)) {
            let cmdType = '';
            let cmdLength = 0;
            if (text.startsWith('\\textbf{', i)) { cmdType = 'b'; cmdLength = 8; }
            else if (text.startsWith('\\textit{', i)) { cmdType = 'i'; cmdLength = 8; }
            else if (text.startsWith('\\underline{', i)) { cmdType = 'u'; cmdLength = 11; }
            
            let braceCount = 1;
            let j = i + cmdLength;
            while (j < text.length && braceCount > 0) {
                if (text[j] === '{') braceCount++;
                else if (text[j] === '}') braceCount--;
                if (braceCount > 0) j++;
            }
            if (j < text.length && text[j] === '}') {
                const innerText = text.substring(i + cmdLength, j);
                result += `<${cmdType}>${parseLatexTextCommands(innerText)}</${cmdType}>`;
                i = j + 1;
                continue;
            }
        }
        result += text[i];
        i++;
    }
    return result;
}

function renderLatexText(text) {
    if (!text) return '';
    let parsed = parseLatexTextCommands(escapeHTML(text));
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    parsed = parsed.replace(/(^|[^\\])\*([^*]+)\*/g, '$1<i>$2</i>');
    parsed = parsed.replace(/@([A-Za-z0-9_.-]+)/g, '<span class="forum-mention">@$1</span>');
    
    // Parse custom buttons: [button:Text|Url]
    parsed = parsed.replace(/\[button:([^\]|]+)\|([^\]]+)\]/g, (match, textVal, urlVal) => {
        return `<div style="text-align: center; margin: 12px 0;"><a href="${urlVal.trim()}" target="_blank" class="btn-primary" style="display: inline-block; text-decoration: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; font-size: 0.82rem; font-family: 'JetBrains Mono', monospace; color: #111;">${textVal.trim()}</a></div>`;
    });
    
    // Parse normal markdown links: [Text](Url)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, textVal, urlVal) => {
        return `<a href="${urlVal.trim()}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline; font-weight: 500;">${textVal.trim()}</a>`;
    });

    // Parse SMP problem / theory box: [smp-box]...[/smp-box]
    parsed = parsed.replace(/\[smp-box\]([\s\S]*?)\[\/smp-box\]/g, (match, inner) => {
        return `<div class="smp-graybox" style="margin: 12px 0 18px;">${inner.trim()}</div>`;
    });

    return parsed;
}

function formatDate(iso) {
    if (!iso) return '';
    if (!iso.endsWith('Z')) iso += 'Z';
    return new Date(iso).toLocaleString('vi-VN', {
        day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
}

// ─── LaTeX helpers ────────────────────────────────────────────────────────
function insertLatex(textareaId, before, after) {
    const ta = document.getElementById(textareaId);
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    ta.value = ta.value.substring(0, start) + before + (selected || after) + ta.value.substring(end);
    ta.focus();
    ta.selectionStart = ta.selectionEnd = start + before.length + (selected.length || after.length);
}

function toggleForumPreview(textareaId, previewId) {
    const box = document.getElementById(previewId);
    const src = document.getElementById(textareaId);
    if (!src || !box) return;
    if (box.classList.contains('active')) { box.classList.remove('active'); return; }
    box.classList.add('active');
    const renderBox = () => {
        const text = src.value.trim();
        if (!text) {
            box.innerHTML = '<span style="opacity:0.4;font-style:italic;">Chưa có nội dung...</span>';
        } else {
            box.innerHTML = renderLatexText(text).replace(/\n/g, '<br>');
            if (window.MathJax && window.MathJax.typesetClear && window.MathJax.typesetPromise) { MathJax.typesetClear([box]); MathJax.typesetPromise([box]).catch(()=>{}); }
        }
    };
    renderBox();
    src.oninput = () => { if (box.classList.contains('active')) renderBox(); };
}

// ─── Cascading Tags Config & State ────────────────────────────────────────
let tagsConfig = {};
let allPostsCache = [];
let currentFilters = { level1: 'all', level2: null, level3: null, keyword: '' };

const SMP_CURATED_FORUM_THREADS = [
    {
        id: 'smp-daily-floor-poly-2026',
        title: 'Đẳng thức phần nguyên của hai đa thức',
        author_name: 'SMP',
        createdAt: '2026-11-28T09:00:00Z',
        viewCount: 128,
        replyCount: 2,
        likeCount: 0,
        likedByMe: false,
        content: `[TAGS: VMO, Dai-So, Da-Thuc]
[smp-box]\\textbf{Đề bài.} Cho hai đa thức hệ số thực $P(x), Q(x)$ khác đa thức hằng thỏa mãn:
$$\\forall x \\in \\mathbb{R}, \\quad \\lfloor P(x) \\rfloor = \\lfloor Q(x) \\rfloor.$$
Chứng minh rằng $P(x) \\equiv Q(x)$.[/smp-box]

\\textbf{Cách 1} *(dựa theo lời giải của bạn @hvduyyy)*

Đặt $G(x) = P(x) - Q(x)$.

\\textbf{Trường hợp 1:} $G(x)$ khác đa thức hằng.
Viết $G(x) = ax^d + H(x)$ với $d \\ge 1$, $a \\ne 0$ và $\\deg H < d$. Không mất tính tổng quát, giả sử $a > 0$ (nếu $a < 0$, ta đổi vai trò của $P$ và $Q$). Khi $x \\to +\\infty$ thì $G(x) \\to +\\infty$, nên tồn tại $x_0 \\in \\mathbb{R}$ sao cho $P(x_0) - Q(x_0) = G(x_0) > 1$.
Mặt khác, từ $\\lfloor P(x) \\rfloor = \\lfloor Q(x) \\rfloor$ và bất đẳng thức $u - 1 < \\lfloor u \\rfloor \\le u$, ta luôn có $|P(x) - Q(x)| < 1$ với mọi $x \\in \\mathbb{R}$, mâu thuẫn.

\\textbf{Trường hợp 2:} $G(x) \\equiv c$ là hằng số.
Giả sử $c \\ne 0$. Đổi vai trò $P$ và $Q$ nếu cần, ta có thể giả sử $c > 0$, tức $Q(x) = P(x) + c$ (hoặc $P(x) - c$).
- Nếu $c \\ge 1$ thì $|P(x) - Q(x)| = c \\ge 1$, mâu thuẫn với $|P(x) - Q(x)| < 1$.
- Nếu $0 < c < 1$: do $P(x)$ khác đa thức hằng và liên tục trên $\\mathbb{R}$, tập giá trị của $P$ chứa một nửa khoảng dạng $[M, +\\infty)$ hoặc $(-\\infty, M]$. Do đó tồn tại số nguyên $h$ sao cho $h - c$ thuộc miền giá trị của $P(x)$, tức tồn tại $x_0 \\in \\mathbb{R}$ thỏa mãn $P(x_0) = h - c$. Khi đó:
$$\\lfloor P(x_0) \\rfloor = \\lfloor h - c \\rfloor = h - 1, \\qquad \\lfloor Q(x_0) \\rfloor = \\lfloor P(x_0) + c \\rfloor = \\lfloor h \\rfloor = h,$$
mâu thuẫn với $\\lfloor P(x_0) \\rfloor = \\lfloor Q(x_0) \\rfloor$. Vậy $c = 0$, suy ra $P(x) \\equiv Q(x)$. $\\square$

---

\\textbf{Cách 2} *(dựa theo lời giải của bạn @skyforlove)*

Đặt $\\deg P = n$ và $\\deg Q = m$ ($n, m \\ge 1$). Không mất tính tổng quát, giả sử $n \\ge m$ và hệ số cao nhất của $P(x)$ dương (trường hợp hệ số cao nhất âm lập luận tương tự khi xét giá trị âm đủ nhỏ).

\\textbf{Bước 1: Chứng minh $n = m$.}
Giả sử $n > m$. Đặt $H(x) = P(x) - Q(x)$, khi đó $\\deg H = n \\ge 1$ và hệ số cao nhất của $H(x)$ dương. Suy ra tồn tại $a \\in \\mathbb{R}$ đủ lớn sao cho với mọi $x > a$ ta có $H(x) > 0$, tức $P(x) > Q(x)$.
Vì $\\lim_{x \\to +\\infty} P(x) = +\\infty$ và $P$ liên tục, ta chọn được số nguyên dương $h > \\max_{x \\le a} P(x)$ và tồn tại $x_0 > a$ sao cho $P(x_0) = h$. Khi đó $\\lfloor P(x_0) \\rfloor = h$, còn $Q(x_0) < P(x_0) = h$ dẫn đến $\\lfloor Q(x_0) \\rfloor \\le Q(x_0) < h$, mâu thuẫn. Vậy $n = m$.

\\textbf{Bước 2: Chứng minh các hệ số trùng nhau.}
Với $n = m$, nếu $\\deg(P - Q) \\ge 1$ thì lập luận tương tự Bước 1 dẫn đến mâu thuẫn. Do đó $P(x)$ và $Q(x)$ trùng nhau toàn bộ các hệ số bậc $\\ge 1$, tức hiệu $P(x) - Q(x) \\equiv d$ là hằng số.
Giả sử $d \\ne 0$; đổi vai trò $P, Q$ nếu cần để $d > 0$, tức $Q(x) = P(x) - d$. Do $P(x)$ liên tục và $\\lim_{x \\to +\\infty} P(x) = +\\infty$, tồn tại $x_1 \\in \\mathbb{R}$ sao cho $P(x_1) = h \\in \\mathbb{Z}$ (nếu $d \\ge 1$ thì mâu thuẫn hiển nhiên; nếu $0 < d < 1$ thì $Q(x_1) = h - d \\in (h - 1, h)$). Khi ấy:
$$\\lfloor P(x_1) \\rfloor = h, \\qquad \\lfloor Q(x_1) \\rfloor = h - 1 \\implies \\lfloor P(x_1) \\rfloor - \\lfloor Q(x_1) \\rfloor = 1,$$
mâu thuẫn. Vậy $d = 0$, hay $P(x) \\equiv Q(x)$. $\\square$`
    }
];

// ─── Form Tags State ──────────────────────────────────────────────────────
let formSelectedTags = { level1: null, level2: null, level3: null };
let formUserTags = [];

const TAGS_DISPLAY_DICT = {
    // THPT
    "Dai-So-Giai-Tich": "Đại Số - Giải Tích",
    "Ham-So-Do-Thi": "Hàm Số & Đồ Thị",
    "Phuong-Trinh-Bat-PT": "Phương Trình & Bất Phương Trình",
    "Luong-Giac": "Lượng Giác",
    "Mu-Logarit": "Mũ & Logarit",
    "Day-So-Gioi-Han": "Dãy Số & Giới Hạn",
    "Dao-Ham-Tich-Phan": "Đạo Hàm & Tích Phân",
    "So-Phuc": "Số Phức",
    "Hinh-Hoc": "Hình Học",
    "Toa-Do-Phong-Oxy": "Tọa Độ Phẳng Oxy",
    "Hinh-Khong-Gian": "Hình Không Gian",
    "Khoi-Da-Dien-Tron-Xoay": "Khối Đa Diện & Tròn Xoay",
    "Toa-Do-Khong-Gian-Oxyz": "Tọa Độ Không Gian Oxyz",
    "To-Hop-Xac-Suat": "Tổ Hợp - Xác Suất",
    "Dai-So-To-Hop": "Đại Số Tổ Hợp",
    "Nhi-Thuc-Newton": "Nhị Thức Newton",
    "Xac-Suat": "Xác Suất",
    "Thong-Ke": "Thống Kê",
    "De-Thi": "Đề Thi",
    "Thi-Tot-Nghiep-THPT": "Thi Tốt Nghiệp THPT",
    "Danh-Gia-Nang-Luc": "Đánh Giá Năng Lực",
    "De-Kiem-Tra-Truong-So": "Đề Kiểm Tra Trường/Sở",
    // VMO
    "Dai-So": "Đại Số",
    "Bat-Dang-Thuc": "Bất Đẳng Thức",
    "Da-Thuc": "Đa Thức",
    "Phuong-Trinh-Ham": "Phương Trình Hàm",
    "Giai-Tich": "Giải Tích",
    "Day-So": "Dãy Số",
    "Tinh-Chat-Ham-So": "Tính Chất Hàm Số",
    "Dong-Quy-Thang-Hang": "Đồng Quy & Thẳng Hàng",
    "Hang-Diem-Cuc-Doi-Cuc": "Hàng Điểm - Cực & Đối Cực",
    "Phep-Bien-Hinh": "Phép Biến Hình",
    "Mo-hinh": "Mô Hình",
    "Mo-Hinh": "Mô Hình",
    "So-Hoc": "Số Học",
    "Chia-Het-Dong-Du": "Chia Hết - Đồng Dư",
    "Phuong-Trinh-Nghiem-Nguyen": "Phương Trình Nghiệm Nguyên",
    "Cap-Can-Nguyen-Thuy": "Cấp & Căn Nguyên Thủy",
    "Ham-So-Hoc": "Hàm Số Học",
    "To-Hop": "Tổ Hợp",
    "Bai-Toan-Dem": "Bài Toán Đếm",
    "Ly-Thuyet-Do-Thi": "Lý Thuyết Đồ Thị",
    "Bat-Bien-Nua-Bat-Bien": "Bất Biến & Nửa Bất Biến",
    "Cuc-Han-Dirichlet": "Cực Hạn - Dirichlet",
    "Tro-Choi-Toan-Hoc": "Trò Chơi Toán Học",
    "VMO-Chinh-Thuc": "VMO Chính Thức",
    "TST-Chon-Doi-Tuyen": "TST - Chọn Đội Tuyển",
    "Tap-Huan-Trai-He": "Tập Huấn - Trại Hè"
};

function getDisplayName(tag) {
    if (!tag) return '';
    if (TAGS_DISPLAY_DICT[tag]) return TAGS_DISPLAY_DICT[tag];
    // Fallback: replace hyphens with spaces, capitalize first letter
    let name = tag.replace(/-/g, ' ');
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function getTagLevel(tag) {
    if (!tag) return 0;
    if (tagsConfig[tag]) return 1;
    for (let l1 in tagsConfig) {
        if (tagsConfig[l1] && tagsConfig[l1][tag] !== undefined) return 2;
    }
    for (let l1 in tagsConfig) {
        if (tagsConfig[l1]) {
            for (let l2 in tagsConfig[l1]) {
                const l3List = tagsConfig[l1][l2];
                if (Array.isArray(l3List) && l3List.includes(tag)) return 3;
            }
        }
    }
    return 4;
}

const FORUM_GEOMETRY_SVG = `<svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;display:inline-block;"><circle cx="10" cy="10" r="7.5"/><polygon points="8,2.8 3.8,14.3 16.5,13.8" fill="none"/></svg>`;
const FORUM_EXAM_SVG = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;display:inline-block;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;

function getForumTagIcon(tag) {
    if (!tag) return '<span class="chip-latex">\\(\\cdot\\)</span>';
    const map = {
        'all': '<span class="chip-latex">\\(\\sum\\)</span>',
        'THCS': '<span class="chip-latex">\\(\\mathbb{N}\\)</span>',
        'THPT': '<span class="chip-latex">\\(\\Delta\\)</span>',
        'VMO': '<span class="chip-latex">\\(\\mathbb{Z}\\)</span>',
        'Đại Học': '<span class="chip-latex">\\(\\nabla\\)</span>',
        'Dai-So': '<span class="chip-latex">\\(P(x)\\)</span>',
        'Đại Số': '<span class="chip-latex">\\(P(x)\\)</span>',
        'Dai-So-Giai-Tich': '<span class="chip-latex">\\(P(x)\\)</span>',
        'Đại Số Tuyến Tính': '<span class="chip-latex">\\(A\\)</span>',
        'Đại Số Đại Cương': '<span class="chip-latex">\\(G\\)</span>',
        'Da-Thuc': '<span class="chip-latex">\\(P(x)\\)</span>',
        'Bat-Dang-Thuc': '<span class="chip-latex">\\(\\ge\\)</span>',
        'Bất Đẳng Thức': '<span class="chip-latex">\\(\\ge\\)</span>',
        'Phuong-Trinh-Ham': '<span class="chip-latex">\\(f(x)\\)</span>',
        'Tinh-Chat-Ham-So': '<span class="chip-latex">\\(f(x)\\)</span>',
        'Ham-So-Do-Thi': '<span class="chip-latex">\\(f(x)\\)</span>',
        'Phuong-Trinh-Bat-PT': '<span class="chip-latex">\\(=\\)</span>',
        'Phương Trình / Hệ Phương Trình': '<span class="chip-latex">\\(=\\)</span>',
        'Luong-Giac': '<span class="chip-latex">\\(\\sin\\)</span>',
        'Mu-Logarit': '<span class="chip-latex">\\(\\log\\)</span>',
        'So-Phuc': '<span class="chip-latex">\\(\\mathbb{C}\\)</span>',
        'Giai-Tich': '<span class="chip-latex">\\(\\int\\)</span>',
        'Giải Tích': '<span class="chip-latex">\\(\\int\\)</span>',
        'Dao-Ham-Tich-Phan': '<span class="chip-latex">\\(\\int\\)</span>',
        'Day-So': '<span class="chip-latex">\\((a_n)\\)</span>',
        'Day-So-Gioi-Han': '<span class="chip-latex">\\((a_n)\\)</span>',
        'So-Hoc': '<span class="chip-latex">\\(\\varphi(n)\\)</span>',
        'Số Học': '<span class="chip-latex">\\(\\varphi(n)\\)</span>',
        'Chia-Het-Dong-Du': '<span class="chip-latex">\\(\\equiv\\)</span>',
        'Phuong-Trinh-Nghiem-Nguyen': '<span class="chip-latex">\\(\\mathbb{Z}\\)</span>',
        'Cap-Can-Nguyen-Thuy': '<span class="chip-latex">\\(\\text{ord}\\)</span>',
        'Ham-So-Hoc': '<span class="chip-latex">\\(\\varphi(n)\\)</span>',
        'To-Hop': '<span class="chip-latex">\\(C_n^k\\)</span>',
        'Tổ Hợp / Rời Rạc': '<span class="chip-latex">\\(C_n^k\\)</span>',
        'To-Hop-Xac-Suat': '<span class="chip-latex">\\(C_n^k\\)</span>',
        'Toán Rời Rạc': '<span class="chip-latex">\\(C_n^k\\)</span>',
        'Bai-Toan-Dem': '<span class="chip-latex">\\(C_n^k\\)</span>',
        'Dai-So-To-Hop': '<span class="chip-latex">\\(C_n^k\\)</span>',
        'Nhi-Thuc-Newton': '<span class="chip-latex">\\(\\binom{n}{k}\\)</span>',
        'Ly-Thuyet-Do-Thi': '<span class="chip-latex">\\(G(V,E)\\)</span>',
        'Bat-Bien-Nua-Bat-Bien': '<span class="chip-latex">\\(\\Delta\\)</span>',
        'Cuc-Han-Dirichlet': '<span class="chip-latex">\\(\\max\\)</span>',
        'Tro-Choi-Toan-Hoc': '<span class="chip-latex">\\(\\star\\)</span>',
        'Xac-Suat': '<span class="chip-latex">\\(\\mathbb{P}\\)</span>',
        'Xác Suất Thống Kê': '<span class="chip-latex">\\(\\mathbb{P}\\)</span>',
        'Thong-Ke': '<span class="chip-latex">\\(\\mu\\)</span>',
        'Hinh-Hoc': FORUM_GEOMETRY_SVG,
        'Hình Học': FORUM_GEOMETRY_SVG,
        'Toa-Do-Phong-Oxy': FORUM_GEOMETRY_SVG,
        'Hinh-Khong-Gian': FORUM_GEOMETRY_SVG,
        'Khoi-Da-Dien-Tron-Xoay': FORUM_GEOMETRY_SVG,
        'Toa-Do-Khong-Gian-Oxyz': FORUM_GEOMETRY_SVG,
        'Dong-Quy-Thang-Hang': FORUM_GEOMETRY_SVG,
        'Hang-Diem-Cuc-Doi-Cuc': FORUM_GEOMETRY_SVG,
        'Phep-Bien-Hinh': FORUM_GEOMETRY_SVG,
        'Mo-hinh': FORUM_GEOMETRY_SVG,
        'Mo-Hinh': FORUM_GEOMETRY_SVG,
        'De-Thi': FORUM_EXAM_SVG,
        'Đề Thi': FORUM_EXAM_SVG,
        'Thi-Tot-Nghiep-THPT': FORUM_EXAM_SVG,
        'Danh-Gia-Nang-Luc': FORUM_EXAM_SVG,
        'De-Kiem-Tra-Truong-So': FORUM_EXAM_SVG,
        'VMO-Chinh-Thuc': FORUM_EXAM_SVG,
        'TST-Chon-Doi-Tuyen': FORUM_EXAM_SVG,
        'Tap-Huan-Trai-He': FORUM_EXAM_SVG
    };
    return map[tag] || '<span class="chip-latex">\\(\\cdot\\)</span>';
}

function typesetForumEl(el) {
    if (el && window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
        window.MathJax.typesetPromise([el]).catch(() => {});
    }
}

function getTagStyle(tag) {
    return '';
}

function getTagClass(tag) {
    return getTagLevel(tag) === 1 ? 'forum-tag forum-tag-lvl1' : 'forum-tag';
}

async function loadTagsConfig() {
    try {
        const res = await fetch('/core/data/tags-config.json');
        tagsConfig = await res.json();
        renderMainFilterLevel(1, Object.keys(tagsConfig));
        renderFormFilterLevel(1, Object.keys(tagsConfig));
        
        // Listeners for keyword search
        const searchInput = document.getElementById('forum-search-input');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    currentFilters.keyword = e.target.value;
                    applyFilters();
                }, 300);
            });
        }
        // Custom tags input
        const customInput = document.getElementById('thread-custom-tags');
        if (customInput) {
            customInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    let tag = customInput.value.trim().replace(/,/g, '');
                    if (tag) {
                        tag = tag.toLowerCase().replace(/\s+/g, '-');
                        if (!formUserTags.includes(tag)) {
                            formUserTags.push(tag);
                            renderFormUserTags();
                        }
                    }
                    customInput.value = '';
                }
            });
        }
    } catch (err) { console.error("Failed to load tags config", err); }
}

function renderFormUserTags() {
    const container = document.getElementById('create-user-tags-badges');
    if (!container) return;
    container.innerHTML = formUserTags.map((t, idx) => 
        `<span class="forum-tag" style="${getTagStyle(t)}">${escapeHTML(getDisplayName(t))} <span style="cursor:pointer;margin-left:4px;" onclick="removeUserTag(${idx})">✖</span></span>`
    ).join('');
}
window.removeUserTag = function(idx) {
    formUserTags.splice(idx, 1);
    renderFormUserTags();
};

function renderMainFilterLevel(level, items) {
    if (level === 1) {
        const c = document.getElementById('filter-level1');
        if (!c) return;
        c.innerHTML = `<button class="nav-filter-btn active lvl1" data-val="all" onclick="selectMainFilter(1, 'all')"><span class="chip-icon">${getForumTagIcon('all')}</span><span class="chip-label">Tất Cả</span></button>` + 
                      items.map(i => `<button class="nav-filter-btn lvl1" data-val="${i}" onclick="selectMainFilter(1, '${i}')"><span class="chip-icon">${getForumTagIcon(i)}</span><span class="chip-label">${getDisplayName(i)}</span></button>`).join('');
        document.getElementById('filter-level2').style.display = 'none';
        document.getElementById('filter-level3').style.display = 'none';
        typesetForumEl(c);
    } else if (level === 2) {
        const c = document.getElementById('filter-level2');
        if (!c) return;
        if (!items || items.length === 0) { c.style.display = 'none'; return; }
        c.style.display = 'flex';
        c.innerHTML = items.map(i => `<button class="nav-filter-btn chip-mode lvl2" data-val="${i}" title="${getDisplayName(i)}" onclick="selectMainFilter(2, '${i}')"><span class="chip-icon">${getForumTagIcon(i)}</span><span class="chip-label">${getDisplayName(i)}</span></button>`).join('');
        document.getElementById('filter-level3').style.display = 'none';
        typesetForumEl(c);
    } else if (level === 3) {
        const c = document.getElementById('filter-level3');
        if (!c) return;
        if (!items || items.length === 0) { c.style.display = 'none'; return; }
        c.style.display = 'flex';
        c.innerHTML = items.map(i => `<button class="nav-filter-btn chip-mode lvl3" data-val="${i}" title="${getDisplayName(i)}" onclick="selectMainFilter(3, '${i}')"><span class="chip-icon">${getForumTagIcon(i)}</span><span class="chip-label">${getDisplayName(i)}</span></button>`).join('');
        typesetForumEl(c);
    }
}

window.selectMainFilter = function(level, val) {
    const updateActiveBtn = (containerId, val) => {
        const c = document.getElementById(containerId);
        if (c) {
            c.querySelectorAll('.nav-filter-btn').forEach(b => {
                b.classList.remove('active');
                if (b.getAttribute('data-val') === val) b.classList.add('active');
            });
        }
    };
    
    if (level === 1) {
        currentFilters.level1 = val;
        currentFilters.level2 = null;
        currentFilters.level3 = null;
        updateActiveBtn('filter-level1', val);
        if (val !== 'all' && tagsConfig[val]) {
            renderMainFilterLevel(2, Object.keys(tagsConfig[val]));
        } else {
            document.getElementById('filter-level2').style.display = 'none';
            document.getElementById('filter-level3').style.display = 'none';
        }
    } else if (level === 2) {
        currentFilters.level2 = currentFilters.level2 === val ? null : val;
        currentFilters.level3 = null;
        updateActiveBtn('filter-level2', currentFilters.level2 || '');
        if (currentFilters.level2 && tagsConfig[currentFilters.level1] && tagsConfig[currentFilters.level1][currentFilters.level2]) {
            renderMainFilterLevel(3, tagsConfig[currentFilters.level1][currentFilters.level2]);
        } else {
            document.getElementById('filter-level3').style.display = 'none';
        }
    } else if (level === 3) {
        currentFilters.level3 = currentFilters.level3 === val ? null : val;
        updateActiveBtn('filter-level3', currentFilters.level3 || '');
    }
    applyFilters();
};

function renderFormFilterLevel(level, items) {
    const createCb = (val, lv) => `<label class="tag-checkbox-label" style="padding:4px 8px; border:1px solid var(--border-light); border-radius:4px;"><input type="radio" name="form-lvl${lv}" value="${val}" onchange="selectFormFilter(${lv}, '${val}')"> ${getDisplayName(val)}</label>`;
    if (level === 1) {
        const c = document.getElementById('create-level1-tags');
        if (!c) return;
        c.innerHTML = items.map(i => createCb(i, 1)).join('');
        document.getElementById('create-level2-tags').style.display = 'none';
        document.getElementById('create-level3-tags').style.display = 'none';
    } else if (level === 2) {
        const c = document.getElementById('create-level2-tags');
        if (!c) return;
        if (!items || items.length === 0) { c.style.display = 'none'; return; }
        c.style.display = 'flex';
        c.innerHTML = items.map(i => createCb(i, 2)).join('');
        document.getElementById('create-level3-tags').style.display = 'none';
    } else if (level === 3) {
        const c = document.getElementById('create-level3-tags');
        if (!c) return;
        if (!items || items.length === 0) { c.style.display = 'none'; return; }
        c.style.display = 'flex';
        c.innerHTML = items.map(i => createCb(i, 3)).join('');
    }
}

window.selectFormFilter = function(level, val) {
    if (level === 1) {
        formSelectedTags.level1 = val;
        formSelectedTags.level2 = null;
        formSelectedTags.level3 = null;
        if (tagsConfig[val]) {
            renderFormFilterLevel(2, Object.keys(tagsConfig[val]));
        } else {
            document.getElementById('create-level2-tags').style.display = 'none';
            document.getElementById('create-level3-tags').style.display = 'none';
        }
    } else if (level === 2) {
        formSelectedTags.level2 = val;
        formSelectedTags.level3 = null;
        if (tagsConfig[formSelectedTags.level1] && tagsConfig[formSelectedTags.level1][val]) {
            renderFormFilterLevel(3, tagsConfig[formSelectedTags.level1][val]);
        } else {
            document.getElementById('create-level3-tags').style.display = 'none';
        }
    } else if (level === 3) {
        formSelectedTags.level3 = val;
    }
};

function parseTagsFromContent(content) {
    const tagsMatch = content.match(/\[TAGS:\s*(.+?)\]/);
    if (tagsMatch) {
        return tagsMatch[1].split(',').map(tag => tag.trim());
    }
    return [];
}

async function loadThreadList() {
    const container = document.getElementById('thread-list-container');
    try {
        if (allPostsCache.length === 0) {
            let apiThreads = [];
            try {
                const res = await fetch(`${API_BASE}/api/forum/threads`);
                if (res.ok) apiThreads = await res.json();
            } catch (e) {}
            const curatedIds = new Set(SMP_CURATED_FORUM_THREADS.map(t => t.id));
            allPostsCache = [...SMP_CURATED_FORUM_THREADS, ...apiThreads.filter(t => !curatedIds.has(t.id))];
        }
        applyFilters();
    } catch (err) {
        container.innerHTML = `<div style="color:#e74c3c; text-align:center; padding:40px;">${err.message}</div>`;
    }
}

function applyFilters() {
    const container = document.getElementById('thread-list-container');
    let threads = allPostsCache;

    if (currentFilters.keyword) {
        const kw = currentFilters.keyword.toLowerCase();
        threads = threads.filter(t => 
            t.title.toLowerCase().includes(kw) || 
            (t.author_name && t.author_name.toLowerCase().includes(kw)) ||
            parseTagsFromContent(t.content).some(tag => 
                tag.toLowerCase().includes(kw) || 
                getDisplayName(tag).toLowerCase().includes(kw)
            )
        );
    }

    if (currentFilters.level1 && currentFilters.level1 !== 'all') {
        threads = threads.filter(t => {
            const tags = parseTagsFromContent(t.content);
            if (!tags.includes(currentFilters.level1)) return false;
            if (currentFilters.level2 && !tags.includes(currentFilters.level2)) return false;
            if (currentFilters.level3 && !tags.includes(currentFilters.level3)) return false;
            return true;
        });
    }

    if (threads.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:60px; border:1px dashed var(--border-light); border-radius:8px;">
                <p style="color:var(--text-muted); font-size:1.1rem;">Không tìm thấy chủ đề nào phù hợp.</p>
                <p style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Hãy tạo chủ đề mới hoặc thử từ khóa khác.</p>
            </div>`;
        return;
    }

    container.innerHTML = threads.map(t => {
        let tagsHtml = '';
        const tags = parseTagsFromContent(t.content);
        if (tags.length > 0) {
            tagsHtml = '<div style="margin-top: 8px; display: flex; flex-wrap: wrap; align-items: center;">' + tags.map(tag => `<span class="${getTagClass(tag)}" title="${escapeHTML(getDisplayName(tag))}">${getForumTagIcon(tag)}<span>${escapeHTML(getDisplayName(tag))}</span></span>`).join('') + '</div>';
        }
        return `
        <div class="thread-item" onclick="openThread('${t.id}')">
            <div class="thread-item-title">${escapeHTML(t.title)}${t.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}</div>
            <div class="thread-item-meta">
                <span title="Lượt xem"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>${t.viewCount}</span>
                <span title="Phản hồi"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>${t.replyCount}</span>
            </div>
            ${tagsHtml}
        </div>
        `;
    }).join('');
    typesetForumEl(container);
}

// ─── Thread Detail ────────────────────────────────────────────────────────
async function openThread(threadId) {
    currentThreadId = threadId;
    document.getElementById('thread-list-view').style.display = 'none';
    document.getElementById('thread-detail-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mainContent = document.getElementById('thread-main-content');
    const repliesList = document.getElementById('thread-replies-list');
    mainContent.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:40px;">Đang tải...</div>';
    repliesList.innerHTML = '';

    // Auth check for reply form
    const token = getToken();
    document.getElementById('reply-auth-notice').style.display = token ? 'none' : 'block';
    document.getElementById('create-reply-form').style.display = token ? 'block' : 'none';

    try {
        const curated = SMP_CURATED_FORUM_THREADS.find(t => t.id === threadId);
        let thread, replies;
        if (curated) {
            thread = curated;
            try {
                replies = JSON.parse(localStorage.getItem(`smp_curated_replies_${threadId}`) || '[]');
            } catch (e) { replies = []; }
        } else {
            const viewerId = (window.getUserId && window.getUserId()) || '';
            const [threadRes, repliesRes] = await Promise.all([
                fetch(`${API_BASE}/api/forum/threads/${threadId}?viewer_id=${encodeURIComponent(viewerId)}`),
                fetch(`${API_BASE}/api/forum/threads/${threadId}/replies?viewer_id=${encodeURIComponent(viewerId)}`)
            ]);
            thread = await threadRes.json();
            replies = await repliesRes.json();
        }
        const currentUser = getUsername();
        const isAuthor = currentUser && currentUser === thread.author_name;

        let displayContent = thread.content;
        let tagsHtml = '';
        const tagsMatch = displayContent.match(/\[TAGS:\s*(.+?)\]/);
        if (tagsMatch) {
            const tags = tagsMatch[1].split(',').map(tag => tag.trim());
            tagsHtml = '<div style="margin-bottom: 16px;">' + tags.map(tag => `<span class="forum-tag" style="${getTagStyle(tag)}">${escapeHTML(getDisplayName(tag))}</span>`).join('') + '</div>';
            displayContent = displayContent.replace(/\[TAGS:\s*(.+?)\]\n*/, '');
        }

        mainContent.innerHTML = `
            <div class="post-card op">
                <h2 style="font-family:'Playfair Display',serif; font-size:1.8rem; color:var(--text-dark); margin-bottom:16px;">
                    ${escapeHTML(thread.title)}
                    ${thread.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}
                </h2>
                ${tagsHtml}
                <div class="post-meta">
                    <div>
                        <span class="post-author"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${escapeHTML(thread.author_name)}</span>
                        <span class="post-date" style="margin-left:12px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${formatDate(thread.createdAt)}</span>
                        <span class="post-date" style="margin-left:12px;" title="Lượt xem"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>${thread.viewCount}</span>
                    </div>
                    <div class="post-actions">
                        ${!isAuthor && token ? `
                        <button id="like-thread-btn" onclick="toggleLikeThread('${thread.id}', this)" title="Thích"
                            style="background:none; border:1px solid ${thread.likedByMe ? '#e74c3c' : 'var(--border-light)'}; color:${thread.likedByMe ? '#e74c3c' : 'var(--text-muted)'}; padding:4px 9px; border-radius:4px; cursor:pointer; font-family:'JetBrains Mono', monospace; font-size:0.8rem; transition:all 0.2s;">
                            ${thread.likedByMe ? '♥' : '♡'} <span id="like-thread-count">${thread.likeCount || 0}</span>
                        </button>` : (thread.likeCount > 0 ? `<span style="font-size:0.8rem; color:var(--text-muted);"><span style="color:#e74c3c; margin-right:4px;">♥</span>${thread.likeCount}</span>` : '')}
                        <button id="save-thread-btn"
                            data-id="${thread.id}"
                            data-title="${escapeHTML(thread.title)}"
                            title="Lưu bài viết"
                            aria-label="Lưu bài viết"
                            onclick="(function(btn){ if(window.toggleSavePost){ const threadUrl = window.location.origin + window.location.pathname + '?threadId=' + btn.dataset.id; toggleSavePost(btn.dataset.id, btn.dataset.title, threadUrl, btn); } else { alert('Vui lòng đăng nhập để lưu!'); } })(this)"
                            style="background:none; border:1px solid var(--border-light); color:var(--text-muted); padding:3px 9px; border-radius:4px; cursor:pointer; font-family:'JetBrains Mono', monospace; font-size:1.15rem; line-height:1; display:inline-flex; align-items:center; justify-content:center;">&#x2606;</button>
                        ${thread.editedAt ? `<button class="btn-secondary" onclick="showHistory('${thread.id}','thread')" title="Lịch sử sửa" aria-label="Lịch sử sửa" style="font-size:0.75rem; padding:5px 8px; display:inline-flex; align-items:center; justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg></button>` : ''}
                        ${isAuthor ? `
                            <button class="btn-secondary" title="Chỉnh sửa" aria-label="Chỉnh sửa" style="font-size:0.75rem; padding:5px 8px; display:inline-flex; align-items:center; justify-content:center;" data-id="${thread.id}" data-title="${escapeHTML(thread.title)}" data-content="${escapeHTML(thread.content)}" onclick="showEditThreadForm(this.dataset.id, this.dataset.title, this.dataset.content)"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                            <button class="btn-danger" title="Xóa" aria-label="Xóa" style="font-size:0.75rem; padding:5px 8px; display:inline-flex; align-items:center; justify-content:center;" onclick="deleteThread('${thread.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                        ` : ''}
                    </div>
                </div>
                <div class="post-content">${renderLatexText(displayContent)}</div>
            </div>
        `;

        if (replies.length === 0) {
            repliesList.innerHTML = '<div style="color:var(--text-muted); font-style:italic; text-align:center; padding:20px;">Chưa có bình luận nào. Hãy là người đầu tiên!</div>';
        } else {
            repliesList.innerHTML = replies.map(r => {
                const isReplyAuthor = currentUser && currentUser === r.author_name;
                const approveHtml = r.isApproved ? 
                    `<span style="background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: bold; font-family:'JetBrains Mono', monospace; margin-left: 8px;">✓ Đã duyệt (+${r.approvedPoints}đ)</span>` : 
                    (currentUser === 'SMP' ? `
                        <select onchange="window.approveReply('${r.id}', this.value)" style="background: rgba(201, 169, 110, 0.15); color: var(--accent-gold); border: 1px solid rgba(201,169,110,0.4); padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-family:'JetBrains Mono', monospace; cursor: pointer; outline: none; margin-left: 8px;">
                            <option value="">Duyệt lời giải...</option>
                            <option value="1">Độ khó 1 (Dễ - +1đ)</option>
                            <option value="2">Độ khó 2 (Vừa - +2đ)</option>
                            <option value="3">Độ khó 3 (Khó - +3đ)</option>
                            <option value="4">Độ khó 4 (Rất khó - +4đ)</option>
                            <option value="5">Độ khó 5 (Olympiad - +5đ)</option>
                        </select>
                    ` : '');

                return `
                    <div class="post-card reply" id="reply-${r.id}" style="${r.isApproved ? 'border-left: 3px solid #2ecc71;' : ''}">
                        <div class="post-meta">
                            <div>
                                <span class="post-author">${escapeHTML(r.author_name)}</span>
                                <span class="post-date" style="margin-left:10px;">${formatDate(r.createdAt)}</span>
                                ${r.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}
                                ${approveHtml}
                            </div>
                            <div class="post-actions">
                                ${(!isReplyAuthor && token) ? `<button class="btn-like" id="like-reply-${r.id}" onclick="toggleLikeReply('${currentThreadId}','${r.id}',this)" style="background:none; border:1px solid ${r.likedByMe ? '#e74c3c' : 'var(--border-light)'}; color:${r.likedByMe ? '#e74c3c' : 'var(--text-muted)'}; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; transition:all 0.2s;">${r.likedByMe ? '♥' : '♡'} <span>${r.likeCount || 0}</span></button>` : (r.likeCount > 0 ? `<span style="font-size:0.75rem;color:var(--text-muted);"><span style="color:#e74c3c; margin-right:4px;">♥</span> ${r.likeCount}</span>` : '')}
                                <button class="btn-secondary" onclick="replyToUser('${escapeHTML(r.author_name)}')" title="Trả lời" aria-label="Trả lời" style="font-size:0.75rem; padding:3px 8px; display:inline-flex; align-items:center; justify-content:center;">↳</button>
                                ${r.editHistory && r.editHistory.length > 0 ? `<button class="btn-secondary" onclick="showReplyHistory('${r.id}')" style="font-size:0.7rem;padding:3px 8px;display:inline-flex;align-items:center;justify-content:center;"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg></button>` : ''}
                                ${isReplyAuthor ? `
                                    <button class="btn-secondary" style="font-size:0.7rem; padding:3px 8px;display:inline-flex;align-items:center;justify-content:center;" data-content="${escapeHTML(r.content)}" onclick="showEditReplyModal('${r.id}', this.dataset.content)"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
                                    <button class="btn-danger" style="font-size:0.7rem; padding:3px 8px;display:inline-flex;align-items:center;justify-content:center;" onclick="deleteReply('${r.id}', '${currentThreadId}')"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                                ` : ''}
                            </div>
                        </div>
                        <div class="post-content">${renderLatexText(r.content)}</div>
                    </div>
                `;
            }).join('');
        }

        if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
            MathJax.startup.promise.then(() => MathJax.typesetPromise([mainContent, repliesList]));
        }
    } catch (err) {
        mainContent.innerHTML = `<div style="color:#e74c3c;">${err.message}</div>`;
    }
}

window.approveReply = async function(replyId, points) {
    if (!points) return;
    const token = getToken();
    if (!token) return;
    
    if (!confirm(`Xác nhận duyệt lời giải này với độ khó ${points}/5?`)) {
        openThread(currentThreadId);
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/forum/replies/${replyId}/approve`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ points: parseInt(points) })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Không thể duyệt lời giải.");
        
        alert("Đã duyệt lời giải và cộng điểm thành công!");
        openThread(currentThreadId);
    } catch (err) {
        alert(err.message);
    }
};

// ─── Like Thread ──────────────────────────────────────────────────────────
window.toggleLikeThread = async function(threadId, btn) {
    const token = getToken();
    if (!token) { alert('Vui lòng đăng nhập để tim bài!'); return; }
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi'); }
        const data = await res.json();
        const countEl = btn.querySelector('span') || document.getElementById('like-thread-count');
        if (data.liked) {
            btn.innerHTML = `♥ <span>${data.likeCount}</span>`;
            btn.style.color = '#e74c3c';
            btn.style.borderColor = '#e74c3c';
        } else {
            btn.innerHTML = `♡ <span>${data.likeCount}</span>`;
            btn.style.color = 'var(--text-muted)';
            btn.style.borderColor = 'var(--border-light)';
        }
    } catch (err) { alert(err.message); }
};

// ─── Like Reply ───────────────────────────────────────────────────────────
window.toggleLikeReply = async function(threadId, replyId, btn) {
    const token = getToken();
    if (!token) { alert('Vui lòng đăng nhập để thích bình luận!'); return; }
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies/${replyId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi'); }
        const data = await res.json();
        if (data.liked) {
            btn.innerHTML = `♥ <span>${data.likeCount}</span>`;
            btn.style.color = '#e74c3c';
            btn.style.borderColor = '#e74c3c';
        } else {
            btn.innerHTML = `♡ <span>${data.likeCount}</span>`;
            btn.style.color = 'var(--text-muted)';
            btn.style.borderColor = 'var(--border-light)';
        }
    } catch (err) { alert(err.message); }
};

// ─── Edit Thread ──────────────────────────────────────────────────────────
function showEditThreadForm(id, title, content) {
    const formEl = document.getElementById('edit-thread-form-container');
    formEl.style.display = 'block';
    document.getElementById('edit-thread-title').value = title;
    const box = document.getElementById('edit-thread-content');
    if (box) {
        box.value = content;
        if (box.nextElementSibling && box.nextElementSibling.CodeMirror) {
            box.nextElementSibling.CodeMirror.setValue(content);
        }
    }
    formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Edit Reply ───────────────────────────────────────────────────────────
function showEditReplyModal(replyId, currentContent) {
    editingReplyId = replyId;
    const box = document.getElementById('edit-reply-content');
    if (box) {
        box.value = currentContent;
        if (box.nextElementSibling && box.nextElementSibling.CodeMirror) {
            box.nextElementSibling.CodeMirror.setValue(currentContent);
        }
    }
    document.getElementById('edit-reply-modal').classList.add('show');
}

window.replyToUser = function(username) {
    const box = document.getElementById('reply-content');
    if (!box) return;
    
    // Check if CodeMirror is wrapping this textarea
    if (box.nextElementSibling && box.nextElementSibling.CodeMirror) {
        const cm = box.nextElementSibling.CodeMirror;
        const currentVal = cm.getValue();
        const appendText = (currentVal ? ' ' : '') + '@' + username + ' ';
        cm.setValue(currentVal + appendText);
        cm.focus();
        cm.setCursor(cm.lineCount(), 0);
    } else {
        box.value += (box.value ? ' ' : '') + '@' + username + ' ';
        box.focus();
    }
    
    document.getElementById('reply-form-container').scrollIntoView({ behavior: 'smooth', block: 'end' });
};

async function showHistory(id, type) {
    const modal = document.getElementById('history-modal');
    const list = document.getElementById('history-list');
    list.innerHTML = '<div style="color:var(--text-muted)">Đang tải...</div>';
    modal.classList.add('show');
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads/${id}/history`);
        const history = await res.json();
        if (!history || history.length === 0) {
            list.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">Không có lịch sử chỉnh sửa.</div>';
            return;
        }
        list.innerHTML = history.reverse().map((h, i) => `
            <div class="history-item">
                <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:6px; font-family:'JetBrains Mono',monospace;">
                    Phiên bản ${history.length - i} — ${formatDate(h.editedAt)}
                </div>
                ${h.title ? `<div style="font-weight:bold; margin-bottom:4px;">${escapeHTML(h.title)}</div>` : ''}
                <div style="font-size:0.9rem; color:var(--text-dark); white-space:pre-wrap;">${escapeHTML(h.content)}</div>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<div style="color:#e74c3c;">Lỗi tải lịch sử</div>';
    }
}

async function showReplyHistory(replyId) {
    // For replies, inline — just show modal with the reply's editHistory loaded from DOM data
    // (We'd need a separate API for this; for now show a generic modal)
    alert('Tính năng xem lịch sử bình luận đang phát triển.');
}

async function deleteThread(threadId) {
    if (!confirm('Bạn có chắc chắn muốn xóa chủ đề này? Toàn bộ bình luận sẽ bị xóa theo.')) return;
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Lỗi xóa chủ đề');
        // Back to list
        document.getElementById('thread-detail-view').style.display = 'none';
        document.getElementById('thread-list-view').style.display = 'block';
        currentThreadId = null;
        loadThreadList();
    } catch (err) {
        alert(err.message);
    }
}

async function deleteReply(replyId, threadId) {
    if (!confirm('Xóa bình luận này?')) return;
    const token = getToken();
    if (!token) return;
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies/${replyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Lỗi xóa bình luận');
        openThread(threadId);
    } catch (err) {
        alert(err.message);
    }
}

// ─── Form Handlers ────────────────────────────────────────────────────────
function setupFormHandlers() {
    // Back button
    document.getElementById('btn-back-to-list').addEventListener('click', () => {
        document.getElementById('thread-detail-view').style.display = 'none';
        document.getElementById('thread-list-view').style.display = 'block';
        document.getElementById('edit-thread-form-container').style.display = 'none';
        currentThreadId = null;
        loadThreadList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Show create form
    document.getElementById('btn-show-create').addEventListener('click', () => {
        const formEl = document.getElementById('create-thread-form-container');
        const isVisible = formEl.style.display === 'block';
        formEl.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            const token = getToken();
            document.getElementById('create-login-notice').style.display = token ? 'none' : 'block';
            document.getElementById('create-thread-form').style.display = token ? 'block' : 'none';
            formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    document.getElementById('btn-cancel-create').addEventListener('click', () => {
        document.getElementById('create-thread-form-container').style.display = 'none';
    });

    // Submit create thread
    document.getElementById('create-thread-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getToken();
        if (!token) return;
        const title = document.getElementById('thread-title').value.trim();
        let content = document.getElementById('create-content').value.trim();
        
        // Combine tags
        let selectedTags = [];
        if (formSelectedTags.level1) selectedTags.push(formSelectedTags.level1);
        if (formSelectedTags.level2) selectedTags.push(formSelectedTags.level2);
        if (formSelectedTags.level3) selectedTags.push(formSelectedTags.level3);
        
        selectedTags = selectedTags.concat(formUserTags);
        
        const customTagsInput = document.getElementById('thread-custom-tags');
        if (customTagsInput && customTagsInput.value.trim()) {
            const customTags = customTagsInput.value.split(',').map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(t => t);
            selectedTags = selectedTags.concat(customTags);
        }
        
        // Remove duplicates
        selectedTags = [...new Set(selectedTags)];
        
        if (selectedTags.length > 0) {
            content = `[TAGS: ${selectedTags.join(', ')}]\n\n` + content;
        }

        const btn = document.getElementById('btn-submit-create');
        btn.disabled = true; btn.innerText = 'Đang đăng...';
        try {
            const res = await fetch(`${API_BASE}/api/forum/threads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, content })
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi đăng bài'); }
            e.target.reset();
            allPostsCache = []; // clear cache
            document.getElementById('create-thread-form-container').style.display = 'none';
            loadThreadList();
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px;"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Đăng bài'; }
    });

    // Submit edit thread
    document.getElementById('edit-thread-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getToken();
        if (!token || !currentThreadId) return;
        const title = document.getElementById('edit-thread-title').value.trim();
        const content = document.getElementById('edit-thread-content').value.trim();
        try {
            const res = await fetch(`${API_BASE}/api/forum/threads/${currentThreadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, content })
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi sửa bài'); }
            document.getElementById('edit-thread-form-container').style.display = 'none';
            openThread(currentThreadId);
        } catch (err) { alert(err.message); }
    });

    // Submit reply
    document.getElementById('create-reply-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = getToken();
        if (!token || !currentThreadId) return;
        const content = document.getElementById('reply-content').value.trim();
        const btn = document.getElementById('btn-submit-reply');
        btn.disabled = true; btn.innerText = 'Đang gửi...';
        try {
            const isCurated = SMP_CURATED_FORUM_THREADS.some(t => t.id === currentThreadId);
            if (isCurated) {
                const key = `smp_curated_replies_${currentThreadId}`;
                const list = JSON.parse(localStorage.getItem(key) || '[]');
                list.push({
                    id: 'local-' + Date.now(),
                    author_name: getUsername() || 'Thành viên SMP',
                    content,
                    createdAt: new Date().toISOString(),
                    likeCount: 0,
                    likedByMe: false,
                    isApproved: false
                });
                localStorage.setItem(key, JSON.stringify(list));
            } else {
                const res = await fetch(`${API_BASE}/api/forum/threads/${currentThreadId}/replies`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ content })
                });
                if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi gửi'); }
            }
            e.target.reset();
            const prev = document.getElementById('reply-preview');
            if (prev) prev.classList.remove('active');
            openThread(currentThreadId);
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 6px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Gửi bình luận'; }
    });

    // Save reply edit
    document.getElementById('btn-save-reply-edit').addEventListener('click', async () => {
        if (!editingReplyId || !currentThreadId) return;
        const content = document.getElementById('edit-reply-content').value.trim();
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE}/api/forum/threads/${currentThreadId}/replies/${editingReplyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content })
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi sửa'); }
            document.getElementById('edit-reply-modal').classList.remove('show');
            editingReplyId = null;
            openThread(currentThreadId);
        } catch (err) { alert(err.message); }
    });

    // Close history modal clicking outside
    document.getElementById('history-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
    });
    document.getElementById('edit-reply-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
    });

    // Filter Buttons logic has been replaced by selectMainFilter and selectFormFilter
}

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadTagsConfig().then(() => loadThreadList()).then(() => {
        const params = new URLSearchParams(window.location.search);
        const tId = params.get('threadId');
        if (tId) {
            openThread(tId);
        }
    });
    setupFormHandlers();
    if (typeof SMPLatexCore !== 'undefined') {
        setTimeout(() => {
            SMPLatexCore.init('create-content');
            SMPLatexCore.init('edit-thread-content');
            SMPLatexCore.init('reply-content');
            SMPLatexCore.init('edit-reply-content');
        }, 100);
    }
});
