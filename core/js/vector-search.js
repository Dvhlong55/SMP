/**
 * Vector Search & Semantic Search Logic using MongoDB Atlas Vector Search
 */

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t] || t)
    );
}

// =========================================================================
// MONGO VECTOR SEARCH LOGIC
// =========================================================================

/**
 * Tìm kiếm các bài viết tương đồng thông qua Backend FastAPI
 * @param {string} query - Câu hỏi hoặc từ khóa ngữ nghĩa
 * @param {number} limit - Số kết quả tối đa
 */
async function searchVectorPosts(query, limit = 10) {
    const apiBase = window.API_BASE || 'https://smp-backend-kcwn.onrender.com';
    const viewerId = localStorage.getItem('smp_username') || '';
    
    const url = `${apiBase}/api/forum/threads/search?query=${encodeURIComponent(query)}&limit=${limit}&viewer_id=${encodeURIComponent(viewerId)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("Vector Search Backend Error:", err);
        throw new Error(err.detail || 'Lỗi khi tìm kiếm nâng cao bằng AI');
    }
    
    return await response.json();
}

// =========================================================================
// UI BINDING
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnAdvancedSearch = document.getElementById('btn-advanced-search');
    const advancedInput = document.getElementById('forum-advanced-search-input');
    const statusEl = document.getElementById('advanced-search-status');
    const container = document.getElementById('thread-list-container');
    
    if (!btnAdvancedSearch || !advancedInput) return;
    
    btnAdvancedSearch.addEventListener('click', async () => {
        const query = advancedInput.value.trim();
        if (!query) return;
        
        statusEl.style.display = 'block';
        statusEl.innerText = '✨ Đang phân tích ngữ nghĩa và tìm kiếm (có thể mất vài giây)...';
        statusEl.style.color = 'var(--accent-purple)';
        container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--accent-purple);">Đang tìm kiếm bài viết tương đồng bằng AI...</div>';
        
        try {
            const results = await searchVectorPosts(query, 10);
            
            statusEl.style.display = 'none';
            
            if (!results || results.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:60px; border:1px dashed var(--accent-purple); border-radius:8px;">
                        <p style="color:var(--text-muted); font-size:1.1rem;">Không tìm thấy bài viết nào có ý nghĩa tương đồng.</p>
                        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:8px;">Vui lòng thử lại với câu hỏi khác!</p>
                    </div>`;
                return;
            }
            
            // Hiển thị kết quả
            container.innerHTML = results.map(t => {
                let tagsHtml = '';
                const tags = window.parseTagsFromContent ? window.parseTagsFromContent(t.content) : [];
                if (tags && tags.length > 0) {
                    tagsHtml = '<div style="margin-top: 8px;">' + tags.map(tag => {
                        const style = window.getTagStyle ? window.getTagStyle(tag) : '';
                        const name = window.getDisplayName ? window.getDisplayName(tag) : tag;
                        return `<span class="forum-tag" style="${style}">${name}</span>`;
                    }).join('') + '</div>';
                }
                
                // MongoDB Vector Search Score thường nằm trong khoảng 0 đến 1.
                // Chúng ta hiển thị dưới dạng % độ khớp.
                const similarity = (t.similarity * 100).toFixed(1);
                
                return `
                <div class="thread-item" onclick="openThread('${t.id}')" style="border-left: 3px solid var(--accent-purple);">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div class="thread-item-title">${escapeHTML(t.title)}</div>
                        <div style="font-size: 0.75rem; color: var(--accent-purple); background: rgba(185,117,255,0.1); padding: 3px 8px; border-radius: 12px; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> Độ khớp: ${similarity}%
                        </div>
                    </div>
                    <div class="thread-item-meta" style="margin-top: 8px;">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ${escapeHTML(t.author_name || 'Ẩn danh')}</span>
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg> ${t.viewCount || 0} lượt xem</span>
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> ${t.replyCount || 0} phản hồi</span>
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block; margin-right: 4px; margin-top: -2px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${window.formatDate ? window.formatDate(t.createdAt) : new Date(t.createdAt).toLocaleString()}</span>
                    </div>
                    ${tagsHtml}
                </div>
                `;
            }).join('');
            
        } catch (err) {
            statusEl.innerText = '❌ Lỗi: ' + err.message;
            statusEl.style.color = '#e74c3c';
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:#e74c3c;">
                    <p>Đã xảy ra lỗi khi tìm kiếm.</p>
                    <p style="font-size:0.85rem; margin-top:8px;">Chi tiết: ${err.message}</p>
                </div>`;
        }
    });
    
    advancedInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnAdvancedSearch.click();
        }
    });
});
