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

function getTagStyle(tag) {
    const lvl = getTagLevel(tag);
    if (lvl === 1) {
        return 'background: rgba(92,225,230,0.1); color: var(--accent-cyan); border-color: rgba(92,225,230,0.3);';
    } else if (lvl === 2) {
        return 'background: rgba(201,169,110,0.1); color: var(--accent-gold); border-color: rgba(201,169,110,0.3);';
    } else if (lvl === 3) {
        return 'background: rgba(185,117,255,0.1); color: var(--accent-purple); border-color: rgba(185,117,255,0.3);';
    } else {
        return 'background: rgba(231,76,60,0.1); color: #e74c3c; border-color: rgba(231,76,60,0.3);';
    }
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
        c.innerHTML = '<button class="nav-filter-btn active lvl1" onclick="selectMainFilter(1, \'all\')">Tất Cả</button>' + 
                      items.map(i => `<button class="nav-filter-btn lvl1" data-val="${i}" onclick="selectMainFilter(1, '${i}')">${getDisplayName(i)}</button>`).join('');
        document.getElementById('filter-level2').style.display = 'none';
        document.getElementById('filter-level3').style.display = 'none';
    } else if (level === 2) {
        const c = document.getElementById('filter-level2');
        if (!c) return;
        if (!items || items.length === 0) { c.style.display = 'none'; return; }
        c.style.display = 'flex';
        c.innerHTML = items.map(i => `<button class="nav-filter-btn lvl2" data-val="${i}" onclick="selectMainFilter(2, '${i}')">${getDisplayName(i)}</button>`).join('');
        document.getElementById('filter-level3').style.display = 'none';
    } else if (level === 3) {
        const c = document.getElementById('filter-level3');
        if (!c) return;
        if (!items || items.length === 0) { c.style.display = 'none'; return; }
        c.style.display = 'flex';
        c.innerHTML = items.map(i => `<button class="nav-filter-btn lvl3" data-val="${i}" onclick="selectMainFilter(3, '${i}')">${getDisplayName(i)}</button>`).join('');
    }
}

window.selectMainFilter = function(level, val) {
    const updateActiveBtn = (containerId, val) => {
        const c = document.getElementById(containerId);
        if (c) {
            c.querySelectorAll('.nav-filter-btn').forEach(b => {
                b.classList.remove('active');
                if ((val === 'all' && b.innerText === 'Tất Cả') || b.getAttribute('data-val') === val) b.classList.add('active');
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
            const res = await fetch(`${API_BASE}/api/forum/threads`);
            if (!res.ok) throw new Error('Không thể tải danh sách chủ đề');
            allPostsCache = await res.json();
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
                <p style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Hãy tạo chủ đề mới hoặc thử từ khóa khác! 🚀</p>
            </div>`;
        return;
    }

    container.innerHTML = threads.map(t => {
        let tagsHtml = '';
        const tags = parseTagsFromContent(t.content);
        if (tags.length > 0) {
            tagsHtml = '<div style="margin-top: 8px;">' + tags.map(tag => `<span class="forum-tag" style="${getTagStyle(tag)}">${escapeHTML(getDisplayName(tag))}</span>`).join('') + '</div>';
        }
        return `
        <div class="thread-item" onclick="openThread('${t.id}')">
            <div class="thread-item-title">${escapeHTML(t.title)}${t.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}</div>
            <div class="thread-item-meta">
                <span>✍️ ${escapeHTML(t.author_name)}</span>
                <span>👁 ${t.viewCount} lượt xem</span>
                <span>💬 ${t.replyCount} phản hồi</span>
                <span>🕐 ${formatDate(t.createdAt)}</span>
            </div>
            ${tagsHtml}
        </div>
        `;
    }).join('');
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
        const viewerId = getUsername() || '';
        const [threadRes, repliesRes] = await Promise.all([
            fetch(`${API_BASE}/api/forum/threads/${threadId}?viewer_id=${encodeURIComponent(viewerId)}`),
            fetch(`${API_BASE}/api/forum/threads/${threadId}/replies?viewer_id=${encodeURIComponent(viewerId)}`)
        ]);
        const thread = await threadRes.json();
        const replies = await repliesRes.json();
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
                        <span class="post-author">✍️ ${escapeHTML(thread.author_name)}</span>
                        <span class="post-date" style="margin-left:12px;">🕐 ${formatDate(thread.createdAt)}</span>
                        <span class="post-date" style="margin-left:12px;">👁 ${thread.viewCount} lượt xem</span>
                    </div>
                    <div class="post-actions">
                        ${!isAuthor && token ? `
                        <button id="like-thread-btn" onclick="toggleLikeThread('${thread.id}', this)"
                            style="background:none; border:1px solid ${thread.likedByMe ? '#e74c3c' : 'var(--border-light)'}; color:${thread.likedByMe ? '#e74c3c' : 'var(--text-muted)'}; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem; transition:all 0.2s;">
                            ${thread.likedByMe ? '❤️' : '♡'} <span id="like-thread-count">${thread.likeCount || 0}</span>
                        </button>` : (thread.likeCount > 0 ? `<span style="font-size:0.8rem; color:var(--text-muted);">❤️ ${thread.likeCount}</span>` : '')}
                        <button id="save-thread-btn"
                            data-id="${thread.id}"
                            data-title="${escapeHTML(thread.title)}"
                            onclick="(function(btn){ if(window.toggleSavePost){ const threadUrl = window.location.origin + window.location.pathname + '?threadId=' + btn.dataset.id; toggleSavePost(btn.dataset.id, btn.dataset.title, threadUrl, btn); } else { alert('Vui lòng đăng nhập để lưu!'); } })(this)"
                            style="background:none; border:1px solid var(--border-light); color:var(--text-muted); padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-family:'JetBrains Mono', monospace;">
                            &#x2606; Lưu bài
                        </button>
                        ${thread.editedAt ? `<button class="btn-secondary" onclick="showHistory('${thread.id}','thread')" style="font-size:0.75rem; padding:4px 10px;">📜 Lịch sử sửa</button>` : ''}
                        ${isAuthor ? `
                            <button class="btn-secondary" style="font-size:0.75rem; padding:4px 10px;" data-id="${thread.id}" data-title="${escapeHTML(thread.title)}" data-content="${escapeHTML(thread.content)}" onclick="showEditThreadForm(this.dataset.id, this.dataset.title, this.dataset.content)">✏️ Sửa</button>
                            <button class="btn-danger" onclick="deleteThread('${thread.id}')">🗑 Xóa</button>
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
                return `
                    <div class="post-card reply" id="reply-${r.id}">
                        <div class="post-meta">
                            <div>
                                <span class="post-author">${escapeHTML(r.author_name)}</span>
                                <span class="post-date" style="margin-left:10px;">${formatDate(r.createdAt)}</span>
                                ${r.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}
                            </div>
                            <div class="post-actions">
                                ${(!isReplyAuthor && token) ? `<button class="btn-like" id="like-reply-${r.id}" onclick="toggleLikeReply('${currentThreadId}','${r.id}',this)" style="background:none; border:1px solid ${r.likedByMe ? '#e74c3c' : 'var(--border-light)'}; color:${r.likedByMe ? '#e74c3c' : 'var(--text-muted)'}; padding:3px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; transition:all 0.2s;">${r.likedByMe ? '❤️' : '♡'} <span>${r.likeCount || 0}</span></button>` : (r.likeCount > 0 ? `<span style="font-size:0.75rem;color:var(--text-muted);">❤️ ${r.likeCount}</span>` : '')}
                                <button class="btn-secondary" onclick="replyToUser('${escapeHTML(r.author_name)}')" style="font-size:0.7rem; padding:3px 8px;">↩ Trả lời</button>
                                ${r.editHistory && r.editHistory.length > 0 ? `<button class="btn-secondary" onclick="showReplyHistory('${r.id}')" style="font-size:0.7rem;padding:3px 8px;">📜</button>` : ''}
                                ${isReplyAuthor ? `
                                    <button class="btn-secondary" style="font-size:0.7rem; padding:3px 8px;" data-content="${escapeHTML(r.content)}" onclick="showEditReplyModal('${r.id}', this.dataset.content)">✏️</button>
                                    <button class="btn-danger" onclick="deleteReply('${r.id}', '${currentThreadId}')">🗑</button>
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
            btn.innerHTML = `❤️ <span>${data.likeCount}</span>`;
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
    if (!token) { alert('Vui lòng đăng nhập để tim bình luận!'); return; }
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads/${threadId}/replies/${replyId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi'); }
        const data = await res.json();
        if (data.liked) {
            btn.innerHTML = `❤️ <span>${data.likeCount}</span>`;
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
        finally { btn.disabled = false; btn.innerText = '📮 Đăng bài'; }
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
            const res = await fetch(`${API_BASE}/api/forum/threads/${currentThreadId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content })
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Lỗi gửi'); }
            e.target.reset();
            const prev = document.getElementById('reply-preview');
            if (prev) prev.classList.remove('active');
            openThread(currentThreadId);
        } catch (err) { alert(err.message); }
        finally { btn.disabled = false; btn.innerText = '💬 Gửi bình luận'; }
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
