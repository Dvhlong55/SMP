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
    return parseLatexTextCommands(escapeHTML(text));
}

function formatDate(iso) {
    if (!iso) return '';
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
            if (window.MathJax) { MathJax.typesetClear([box]); MathJax.typesetPromise([box]).catch(()=>{}); }
        }
    };
    renderBox();
    src.oninput = () => { if (box.classList.contains('active')) renderBox(); };
}

// ─── Thread List ──────────────────────────────────────────────────────────
async function loadThreadList() {
    const container = document.getElementById('thread-list-container');
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads`);
        if (!res.ok) throw new Error('Không thể tải danh sách chủ đề');
        const threads = await res.json();

        if (threads.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:60px; border:1px dashed var(--border-light); border-radius:8px;">
                    <p style="color:var(--text-muted); font-size:1.1rem;">Diễn đàn chưa có chủ đề nào.</p>
                    <p style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Hãy tạo chủ đề đầu tiên! 🚀</p>
                </div>`;
            return;
        }

        container.innerHTML = threads.map(t => `
            <div class="thread-item" onclick="openThread('${t.id}')">
                <div class="thread-item-title">${escapeHTML(t.title)}${t.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}</div>
                <div class="thread-item-meta">
                    <span>✍️ ${escapeHTML(t.author_name)}</span>
                    <span>👁 ${t.viewCount} lượt xem</span>
                    <span>💬 ${t.replyCount} phản hồi</span>
                    <span>🕐 ${formatDate(t.createdAt)}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div style="color:#e74c3c; text-align:center; padding:40px;">${err.message}</div>`;
    }
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
        const [threadRes, repliesRes] = await Promise.all([
            fetch(`${API_BASE}/api/forum/threads/${threadId}`),
            fetch(`${API_BASE}/api/forum/threads/${threadId}/replies`)
        ]);
        const thread = await threadRes.json();
        const replies = await repliesRes.json();
        const currentUser = getUsername();
        const isAuthor = currentUser && currentUser === thread.author_name;

        mainContent.innerHTML = `
            <div class="post-card op">
                <h2 style="font-family:'Playfair Display',serif; font-size:1.8rem; color:var(--text-dark); margin-bottom:16px;">
                    ${escapeHTML(thread.title)}
                    ${thread.editedAt ? '<span class="edit-badge">(đã chỉnh sửa)</span>' : ''}
                </h2>
                <div class="post-meta">
                    <div>
                        <span class="post-author">✍️ ${escapeHTML(thread.author_name)}</span>
                        <span class="post-date" style="margin-left:12px;">🕐 ${formatDate(thread.createdAt)}</span>
                        <span class="post-date" style="margin-left:12px;">👁 ${thread.viewCount} lượt xem</span>
                    </div>
                    <div class="post-actions">
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
                <div class="post-content">${renderLatexText(thread.content)}</div>
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

        if (window.MathJax) {
            MathJax.startup.promise.then(() => MathJax.typesetPromise([mainContent, repliesList]));
        }
    } catch (err) {
        mainContent.innerHTML = `<div style="color:#e74c3c;">${err.message}</div>`;
    }
}

// ─── Edit Thread ──────────────────────────────────────────────────────────
function showEditThreadForm(id, title, content) {
    const formEl = document.getElementById('edit-thread-form-container');
    formEl.style.display = 'block';
    document.getElementById('edit-thread-title').value = title;
    document.getElementById('edit-thread-content').value = content;
    formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Edit Reply ───────────────────────────────────────────────────────────
function showEditReplyModal(replyId, currentContent) {
    editingReplyId = replyId;
    document.getElementById('edit-reply-content').value = currentContent;
    document.getElementById('edit-reply-modal').classList.add('show');
}

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
        const content = document.getElementById('create-content').value.trim();
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
}

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadThreadList().then(() => {
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
