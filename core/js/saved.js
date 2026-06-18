
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('smp_access_token');
    
    const authReq = document.getElementById('auth-required');
    const savedContent = document.getElementById('saved-content');
    
    if (authReq && savedContent) {
        if (!token) {
            authReq.style.display = 'block';
        } else {
            savedContent.style.display = 'block';
            loadSavedPosts(token);
        }
    }
});

async function loadSavedPosts(token) {
    const listContainer = document.getElementById('saved-list');
    
    try {
        const res = await fetch(`${API_BASE}/api/users/saved`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!res.ok) throw new Error('Failed to load saved posts');
        
        const posts = await res.json();
        
        if (posts.length === 0) {
            listContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; border: 1px dashed var(--border-light); border-radius: 8px;">
                    <p style="color: var(--text-muted); margin-bottom: 16px;">Bạn chưa lưu bài viết nào.</p>
                    <a href="/index.html" style="color: var(--accent-cyan); text-decoration: underline;">Khám phá bài viết mới</a>
                </div>
            `;
            return;
        }
        
        let html = '';
        posts.forEach(post => {
            html += `
                <div class="saved-card" id="saved-card-${post.postId}">
                    <a href="${post.postUrl}" class="saved-title">${escapeHTML(post.postTitle)}</a>
                    <div class="saved-actions">
                        <a href="${post.postUrl}" style="color: var(--accent-gold); font-size: 0.9rem; font-family: 'JetBrains Mono', monospace;">Đọc tiếp &rarr;</a>
                        <button class="unsave-btn" onclick="unsavePost('${post.postId}')">Bỏ lưu</button>
                    </div>
                </div>
            `;
        });
        
        listContainer.innerHTML = html;
        
    } catch (err) {
        listContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #e74c3c;">Lỗi: ${err.message}</div>`;
    }
}

async function unsavePost(postId) {
    const token = localStorage.getItem('smp_access_token');
    if (!token) return;
    
    try {
        const res = await fetch(`${API_BASE}/api/users/saved`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ postId, postTitle: "", postUrl: "" })
        });
        
        if (res.ok) {
            const card = document.getElementById(`saved-card-${postId}`);
            if (card) {
                card.style.opacity = '0';
                setTimeout(() => card.remove(), 300);
            }
        }
    } catch (err) {
        alert("Có lỗi khi bỏ lưu: " + err.message);
    }
}


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
