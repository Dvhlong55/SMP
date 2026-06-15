const API_BASE = 'https://smp-backend-kcwn.onrender.com';
let currentThreadId = null;

// ─── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadThreadList();
    setupFormHandlers();
});

// ─── Thread List ──────────────────────────────────────────────────────────
async function loadThreadList() {
    const container = document.getElementById('thread-list-container');
    try {
        const res = await fetch(`${API_BASE}/api/forum/threads`);
        if (!res.ok) throw new Error('Không thể tải danh sách chủ đề');
        const threads = await res.json();

        if (threads.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; border: 1px dashed var(--border-light); border-radius: 8px;">
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 8px;">Diễn đàn chưa có chủ đề nào.</p>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Hãy tạo chủ đề đầu tiên! 🚀</p>
                </div>`;
            return;
        }

        container.innerHTML = threads.map(t => `
            <div class="thread-item" onclick="openThread('${t.id}')">
                <div class="thread-item-title">${escapeHTML(t.title)}</div>
                <div class="thread-item-meta">
                    <span>✍️ ${escapeHTML(t.author_name)}</span>
                    <span>👁 ${t.viewCount} lượt xem</span>
                    <span>💬 ${t.replyCount} phản hồi</span>
                    <span>${formatDate(t.createdAt)}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div style="color: #e74c3c; text-align: center; padding: 40px;">${err.message}</div>`;
    }
}

// ─── Thread Detail ────────────────────────────────────────────────────────
async function openThread(threadId) {
    currentThreadId = threadId;
    
    // Switch views
    document.getElementById('thread-list-view').style.display = 'none';
    document.getElementById('thread-detail-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mainContent = document.getElementById('thread-main-content');
    const repliesList = document.getElementById('thread-replies-list');
    mainContent.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">Đang tải...</div>';
    repliesList.innerHTML = '';

    // Auth check for reply form
    const token = localStorage.getItem('smp_access_token');
    document.getElementById('reply-auth-alert').style.display = token ? 'none' : 'block';
    document.getElementById('create-reply-form').style.display = token ? 'block' : 'none';

    try {
        const [threadRes, repliesRes] = await Promise.all([
            fetch(`${API_BASE}/api/forum/threads/${threadId}`),
            fetch(`${API_BASE}/api/forum/threads/${threadId}/replies`)
        ]);

        const thread = await threadRes.json();
        const replies = await repliesRes.json();

        mainContent.innerHTML = `
            <div class="post-card">
                <h2 style="font-family: 'Playfair Display', serif; font-size: 1.8rem; color: var(--text-dark); margin-bottom: 16px;">${escapeHTML(thread.title)}</h2>
                <div class="post-meta">
                    <span class="post-author">✍️ ${escapeHTML(thread.author_name)}</span>
                    <span class="post-date">${formatDate(thread.createdAt)}</span>
                    <span class="post-date">👁 ${thread.viewCount} lượt xem</span>
                </div>
                <div class="post-content">${escapeHTML(thread.content)}</div>
            </div>
        `;

        if (replies.length === 0) {
            repliesList.innerHTML = '<div style="color: var(--text-muted); font-style: italic; text-align: center; padding: 20px;">Chưa có bình luận nào. Hãy là người đầu tiên!</div>';
        } else {
            repliesList.innerHTML = replies.map((r, i) => `
                <div class="post-card" style="border-left: 3px solid var(--accent-cyan);">
                    <div class="post-meta">
                        <span class="post-author">${escapeHTML(r.author_name)}</span>
                        <span class="post-date">${formatDate(r.createdAt)}</span>
                    </div>
                    <div class="post-content">${escapeHTML(r.content)}</div>
                </div>
            `).join('');
        }

        // Re-render MathJax after content load
        if (window.MathJax) {
            MathJax.startup.promise.then(() => MathJax.typesetPromise([mainContent, repliesList]));
        }

    } catch (err) {
        mainContent.innerHTML = `<div style="color: #e74c3c;">${err.message}</div>`;
    }
}

// ─── Form Handlers ────────────────────────────────────────────────────────
function setupFormHandlers() {
    // Back button
    document.getElementById('btn-back-to-list').addEventListener('click', () => {
        document.getElementById('thread-detail-view').style.display = 'none';
        document.getElementById('thread-list-view').style.display = 'block';
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
            const token = localStorage.getItem('smp_access_token');
            const notice = document.getElementById('create-login-notice');
            const form = document.getElementById('create-thread-form');
            if (token) {
                notice.style.display = 'none';
                form.style.display = 'block';
            } else {
                notice.style.display = 'block';
                form.style.display = 'none';
            }
            formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Cancel create form
    document.getElementById('btn-cancel-create').addEventListener('click', () => {
        document.getElementById('create-thread-form-container').style.display = 'none';
    });

    // Submit create thread
    document.getElementById('create-thread-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('smp_access_token');
        if (!token) return;

        const title = document.getElementById('thread-title').value.trim();
        const content = document.getElementById('thread-content').value.trim();
        const btn = document.getElementById('btn-submit-create');
        btn.disabled = true;
        btn.innerText = 'Đang đăng...';

        try {
            const res = await fetch(`${API_BASE}/api/forum/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, content })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Lỗi đăng bài');
            }

            // Reset form, close it, reload
            e.target.reset();
            document.getElementById('create-thread-form-container').style.display = 'none';
            loadThreadList();

        } catch (err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Đăng bài';
        }
    });

    // Submit reply
    document.getElementById('create-reply-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('smp_access_token');
        if (!token || !currentThreadId) return;

        const content = document.getElementById('reply-content').value.trim();
        const btn = document.getElementById('btn-submit-reply');
        btn.disabled = true;
        btn.innerText = 'Đang gửi...';

        try {
            const res = await fetch(`${API_BASE}/api/forum/threads/${currentThreadId}/replies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Lỗi gửi bình luận');
            }

            e.target.reset();
            // Reload the thread detail to show new reply
            openThread(currentThreadId);

        } catch (err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Gửi bình luận';
        }
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
