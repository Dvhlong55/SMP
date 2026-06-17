// --- CONFIGURATION ---
const COMMENT_API_BASE = 'https://smp-backend-kcwn.onrender.com';

function initSmpComments() {
    // Tự động khởi tạo section bình luận nếu có thẻ <main>
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    // Lấy postId từ tên file html hiện tại
    const path = window.location.pathname;
    const postId = path.split('/').pop().replace('.html', '') || 'homepage';
    
    // Tìm container Giscus hoặc smp có sẵn để thay thế
    let commentSection = document.getElementById('giscus-container') || document.getElementById('smp-comments-container');
    
    if (!commentSection) {
        // Tạo container mới nếu không tìm thấy
        commentSection = document.createElement('section');
        commentSection.id = 'smp-comments-wrapper';
        commentSection.className = 'fade-up';
        commentSection.style.marginTop = '40px';
        
        // Chèn section bình luận trước footer nếu có, hoặc ở cuối thẻ main
        const footer = mainEl.querySelector('.site-footer');
        if (footer) {
            mainEl.insertBefore(commentSection, footer);
        } else {
            mainEl.appendChild(commentSection);
        }
    } else {
        // Làm sạch container cũ
        commentSection.innerHTML = '';
    }
    
    // Inject CSS styling cho comment
    const css = `
        .comments-container {
            background: var(--card-bg);
            border: 1px solid var(--border-light);
            border-radius: 8px;
            padding: 32px;
            margin-bottom: 36px;
        }
        .comments-header {
            font-family: 'Playfair Display', serif;
            font-size: 1.5rem;
            margin-bottom: 24px;
            color: var(--text-dark);
            border-bottom: 1px solid var(--border-light);
            padding-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .comments-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
            margin-bottom: 24px;
            max-height: 500px;
            overflow-y: auto;
            padding-right: 8px;
        }
        .comment-item {
            padding: 16px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-light);
            border-radius: 6px;
            position: relative;
            transition: border-color 0.2s;
        }
        body:not(.dark-mode) .comment-item {
            background: rgba(0, 0, 0, 0.01);
        }
        .comment-item:hover {
            border-color: var(--accent-cyan);
        }
        .comment-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 0.8rem;
        }
        .comment-author {
            color: var(--accent-gold);
            font-weight: 600;
        }
        .comment-date {
            color: var(--text-muted);
        }
        .comment-content {
            font-size: 0.92rem;
            line-height: 1.6;
            color: var(--text-dark);
            white-space: pre-line;
            word-break: break-word;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 5px;
        }
        .comment-content::-webkit-scrollbar {
            height: 4px;
        }
        .comment-content::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.05);
        }
        .comment-content::-webkit-scrollbar-thumb {
            background: rgba(92, 225, 230, 0.6);
            border-radius: 4px;
        }
        body.dark-mode .comment-content::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
        }
        .comment-delete {
            background: none;
            border: none;
            color: #e74c3c;
            cursor: pointer;
            font-size: 0.75rem;
            font-family: 'JetBrains Mono', monospace;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid transparent;
            transition: all 0.2s;
        }
        .comment-delete:hover {
            border-color: #e74c3c;
            background: rgba(231, 76, 60, 0.1);
        }
        .comment-form-title {
            font-family: 'Playfair Display', serif;
            font-size: 1.2rem;
            margin-bottom: 16px;
            color: var(--text-dark);
        }
        .comment-form textarea {
            width: 100%;
            height: 100px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border-light);
            border-radius: 6px;
            color: var(--text-dark);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.9rem;
            resize: vertical;
            margin-bottom: 12px;
            transition: border-color 0.3s;
        }
        body:not(.dark-mode) .comment-form textarea {
            background: rgba(0, 0, 0, 0.01);
        }
        .comment-form textarea:focus {
            outline: none;
            border-color: var(--accent-cyan);
        }
        .comment-submit-btn {
            background: var(--accent-cyan);
            color: #111;
            padding: 9px 24px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            border-radius: 6px;
            border: none;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        .comment-submit-btn:hover {
            background: var(--accent-gold);
            transform: translateY(-1px);
        }
        .comment-login-promo {
            text-align: center;
            padding: 24px;
            border: 1px dashed var(--border-light);
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.01);
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        .comment-login-promo a {
            color: var(--accent-cyan);
            font-weight: 600;
            text-decoration: underline;
        }
        .comment-login-promo a:hover {
            color: var(--accent-gold);
        }
        .comment-error-msg {
            color: #e74c3c;
            font-size: 0.8rem;
            margin-bottom: 8px;
            display: none;
        }
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // Bắt đầu load bình luận
    loadComments(postId, commentSection);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmpComments);
} else {
    initSmpComments();
}

// Load comments from API
async function loadComments(postId, container) {
    container.innerHTML = `
        <div class="comments-container">
            <h3 class="comments-title">Bình Luận</h3>
            <div style="text-align: center; padding: 20px; color: var(--text-muted);">Đang tải bình luận...</div>
        </div>
    `;
    
    try {
        const response = await fetch(`${COMMENT_API_BASE}/api/comments/post/${postId}`);
        if (!response.ok) throw new Error('Không thể tải bình luận');
        const comments = await response.json();
        
        renderCommentsSection(postId, comments, container);
    } catch (e) {
        container.innerHTML = `
            <div class="comments-container">
                <h3 class="comments-title">Bình Luận</h3>
                <div style="text-align: center; padding: 20px; color: #e74c3c;">Không thể kết nối đến máy chủ bình luận.</div>
            </div>
        `;
    }
}

// Render comments and form
function renderCommentsSection(postId, comments, container) {
    const currentUsername = localStorage.getItem('smp_username');
    const token = localStorage.getItem('smp_access_token');
    
    let commentsListHTML = '';
    
    if (comments.length === 0) {
        commentsListHTML = `<div style="text-align: center; padding: 30px 0; color: var(--text-muted); font-style: italic;">Chưa có bình luận nào. Hãy là người đầu tiên!</div>`;
    } else {
        comments.forEach(comment => {
            // Check if user is the author of this comment to display Delete button
            const isAuthor = currentUsername && comment.username === currentUsername;
            const deleteBtn = isAuthor ? `<button class="comment-delete" onclick="handleDeleteComment('${comment.id}', '${postId}')">Xóa</button>` : '';
            
            // Format time
            let dateStr = comment.createdAt;
            if (dateStr && !dateStr.endsWith('Z')) dateStr += 'Z';
            const date = new Date(dateStr);
            const timeStr = date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
            
            commentsListHTML += `
                <div class="comment-item">
                    <div class="comment-meta">
                        <div>
                            <span class="comment-author">${escapeHTML(comment.username)}</span>
                            <span class="comment-date" style="margin-left: 8px;">(${timeStr})</span>
                        </div>
                        ${deleteBtn}
                    </div>
                    <div class="comment-content">${renderLatexText(comment.content)}</div>
                </div>
            `;
        });
    }
    
    let formHTML = '';
    if (token) {
        formHTML = `
            <h4 class="comment-form-title">Để lại bình luận</h4>
            <div class="comment-error-msg" id="comment-form-error"></div>
            <form class="comment-form" onsubmit="handleSubmitComment(event, '${postId}')">
                <textarea id="comment-textarea" placeholder="Nhập bình luận của bạn..." required></textarea>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Bình luận với tên: <strong style="color: var(--accent-cyan);">${escapeHTML(currentUsername)}</strong></span>
                    <button type="submit" class="comment-submit-btn">Gửi Bình Luận</button>
                </div>
            </form>
        `;
    } else {
        formHTML = `
            <div class="comment-login-promo">
                Bạn cần <a href="#" onclick="if(window.openAuthModal) window.openAuthModal('login'); return false;">Đăng nhập</a> để tham gia thảo luận và bình luận bài viết này.
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="comments-container">
            <h3 class="comments-header">
                Bình Luận <span>(${comments.length})</span>
            </h3>
            <div class="comments-list">
                ${commentsListHTML}
            </div>
            <div class="comment-form-container">
                ${formHTML}
            </div>
        </div>
    `;
}

// Handle submit new comment
async function handleSubmitComment(event, postId) {
    event.preventDefault();
    const textarea = document.getElementById('comment-textarea');
    const errorMsg = document.getElementById('comment-form-error');
    const submitBtn = event.target.querySelector('.comment-submit-btn');
    
    const content = textarea.value.trim();
    if (!content) return;
    
    const token = localStorage.getItem('smp_access_token');
    if (!token) return;
    
    // Disable form submission state
    submitBtn.disabled = true;
    submitBtn.innerText = 'Đang gửi...';
    if (errorMsg) errorMsg.style.display = 'none';
    
    try {
        const response = await fetch(`${COMMENT_API_BASE}/api/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ postId, content })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Không thể gửi bình luận.');
        }
        
        // Success: reload comments
        const wrapper = document.getElementById('smp-comments-wrapper');
        await loadComments(postId, wrapper);
        
    } catch (err) {
        if (errorMsg) {
            errorMsg.innerText = err.message;
            errorMsg.style.display = 'block';
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Gửi Bình Luận';
    }
}

// Handle delete comment
async function handleDeleteComment(commentId, postId) {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    
    const token = localStorage.getItem('smp_access_token');
    if (!token) return;
    
    try {
        const response = await fetch(`${COMMENT_API_BASE}/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Không thể xóa bình luận.');
        }
        
        // Reload comments
        const wrapper = document.getElementById('smp-comments-wrapper');
        await loadComments(postId, wrapper);
    } catch (err) {
        alert(err.message);
    }
}

// Helper to escape HTML tags to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
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
