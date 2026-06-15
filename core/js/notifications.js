class NotificationsController {
    constructor() {
        this.notifications = [];
        this.dropdownOpen = false;
        
        // Listen for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        const token = localStorage.getItem('smp_access_token');
        if (token) {
            this.fetchNotifications();
            // Optional: Auto fetch every 1 minute
            setInterval(() => this.fetchNotifications(), 60000);
        }
        
        // Add dropdown container to body
        this.createDropdownUI();
        
        // Global toggle function
        window.toggleNotificationDropdown = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            this.toggleDropdown();
        };
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.dropdownOpen && !e.target.closest('#notif-dropdown') && !e.target.closest('.notif-wrapper') && !e.target.closest('[onclick*="toggleNotificationDropdown"]')) {
                this.closeDropdown();
            }
            // Đóng menu context "..."
            if (!e.target.closest('.notif-menu-wrapper')) {
                document.querySelectorAll('[id^="notif-menu-"]').forEach(el => el.style.display = 'none');
            }
        });
    }
    
    createDropdownUI() {
        if (document.getElementById('notif-dropdown')) return;
        
        const dropdown = document.createElement('div');
        dropdown.id = 'notif-dropdown';
        dropdown.style.display = 'none';
        dropdown.style.position = 'absolute';
        // Vị trí mặc định (dùng cho topbar)
        dropdown.style.right = '0';
        dropdown.style.top = '40px';
        dropdown.style.width = '320px';
        dropdown.style.maxHeight = '400px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.background = 'var(--bg-secondary, #1e1e1e)';
        dropdown.style.border = '1px solid var(--border-light, #333)';
        dropdown.style.borderRadius = '8px';
        dropdown.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
        dropdown.style.zIndex = '1000';
        dropdown.style.padding = '0';
        dropdown.style.fontFamily = "'Inter', sans-serif";
        
        // Gắn vào .notif-wrapper của topbar nếu có
        const wrapper = document.querySelector('.notif-wrapper');
        if (wrapper) {
            wrapper.appendChild(dropdown);
        } else {
            // Fallback
            dropdown.style.position = 'fixed';
            dropdown.style.top = '60px';
            dropdown.style.right = '20px';
            document.body.appendChild(dropdown);
        }
        
        this.dropdownEl = dropdown;
    }
    
    async fetchNotifications() {
        const token = localStorage.getItem('smp_access_token');
        if (!token) return;
        
        const backendUrl = window.API_BASE || 'https://smp-backend-kcwn.onrender.com';
        
        try {
            const res = await fetch(`${backendUrl}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                this.notifications = await res.json();
                this.updateBadges();
                this.renderDropdown();
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    }
    
    updateBadges() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const topBadge = document.getElementById('top-notif-badge');
        const sideBadge = document.getElementById('side-notif-badge');
        
        if (unreadCount > 0) {
            if (topBadge) topBadge.style.display = 'block';
            if (sideBadge) sideBadge.style.display = 'block';
        } else {
            if (topBadge) topBadge.style.display = 'none';
            if (sideBadge) sideBadge.style.display = 'none';
        }
    }
    
    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
        if (this.dropdownOpen) {
            this.dropdownEl.style.display = 'block';
            this.renderDropdown();
        } else {
            this.dropdownEl.style.display = 'none';
        }
    }
    
    closeDropdown() {
        this.dropdownOpen = false;
        if (this.dropdownEl) this.dropdownEl.style.display = 'none';
    }
    
    renderDropdown() {
        if (!this.dropdownEl) return;
        
        if (this.notifications.length === 0) {
            this.dropdownEl.innerHTML = `
                <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                    Không có thông báo nào.
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02);">
                <h4 style="margin: 0; font-size: 1rem; color: var(--text-color);">Thông báo</h4>
                <button onclick="notifCtrl.markAllRead()" style="background:none; border:none; color:var(--accent-cyan); cursor:pointer; font-size:0.8rem;">Đánh dấu tất cả đã đọc</button>
            </div>
            <div style="display: flex; flex-direction: column;">
        `;
        
        // Hiển thị tối đa 10 thông báo trong dropdown
        const displayNotifs = this.notifications.slice(0, 10);
        
        displayNotifs.forEach(notif => {
            const isRead = notif.read;
            const bg = isRead ? 'transparent' : 'rgba(92, 225, 230, 0.05)';
            const opacity = isRead ? '0.7' : '1';
            
            html += `
                <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); background: ${bg}; opacity: ${opacity}; display: flex; align-items: flex-start; gap: 10px; position: relative;" class="notif-item">
                    ${!isRead ? '<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--accent-red); margin-top: 6px; flex-shrink: 0;"></div>' : '<div style="width: 8px; flex-shrink: 0;"></div>'}
                    <div style="flex: 1; min-width: 0;">
                        <a href="${notif.url}" onclick="notifCtrl.markReadAndGo('${notif.id}', '${notif.url}', event)" style="text-decoration: none; color: var(--text-color); display: block; font-size: 0.9rem;">
                            <span style="font-weight: bold; color: var(--accent-gold);">${this.escapeHTML(notif.senderName)}</span> ${this.escapeHTML(notif.message)}
                        </a>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${this.formatDate(notif.createdAt)}</div>
                    </div>
                    
                    <div class="notif-menu-wrapper" style="position: relative; flex-shrink: 0;">
                        <button onclick="notifCtrl.toggleMenu('${notif.id}', event)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size: 1.2rem; padding: 0 4px; line-height: 1;">⋯</button>
                        <div id="notif-menu-${notif.id}" style="display:none; position:absolute; right:0; top:20px; background:var(--bg-card,#252525); border:1px solid var(--border-light); border-radius:4px; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:1001; min-width:140px; overflow:hidden;">
                            ${!isRead ? `<button onclick="notifCtrl.markRead('${notif.id}', event)" style="display:block; width:100%; text-align:left; padding:8px 12px; background:none; border:none; color:var(--text-color); cursor:pointer; font-size:0.85rem; border-bottom:1px solid var(--border-light);">Đánh dấu đã đọc</button>` : ''}
                            <button onclick="notifCtrl.deleteNotif('${notif.id}', event)" style="display:block; width:100%; text-align:left; padding:8px 12px; background:none; border:none; color:var(--accent-red,#e74c3c); cursor:pointer; font-size:0.85rem;">Xóa thông báo</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            <a href="/SMP/pages/notifications.html" style="display: block; text-align: center; padding: 12px; background: rgba(255,255,255,0.02); color: var(--accent-cyan); text-decoration: none; font-size: 0.9rem; border-top: 1px solid var(--border-light);">Xem tất cả</a>
        `;
        
        this.dropdownEl.innerHTML = html;
    }
    
    toggleMenu(id, e) {
        e.preventDefault();
        e.stopPropagation();
        const menu = document.getElementById(`notif-menu-${id}`);
        const isVisible = menu.style.display === 'block';
        
        // Đóng các menu khác
        document.querySelectorAll('[id^="notif-menu-"]').forEach(el => el.style.display = 'none');
        
        if (!isVisible) {
            menu.style.display = 'block';
        }
    }
    
    async markReadAndGo(id, url, e) {
        e.preventDefault();
        await this.markRead(id, e, false);
        window.location.href = url;
    }
    
    async markRead(id, e, reRender = true) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const token = localStorage.getItem('smp_access_token');
        if (!token) return;
        const backendUrl = window.API_BASE || 'https://smp-backend-kcwn.onrender.com';
        
        try {
            await fetch(`${backendUrl}/api/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notif = this.notifications.find(n => n.id === id);
            if (notif) notif.read = true;
            this.updateBadges();
            if (reRender) this.renderDropdown();
            // Gọi ra UI full page nếu đang ở trang notifications.html
            if (window.renderFullNotifications) window.renderFullNotifications();
        } catch (err) {}
    }
    
    async markAllRead() {
        const token = localStorage.getItem('smp_access_token');
        if (!token) return;
        const backendUrl = window.API_BASE || 'https://smp-backend-kcwn.onrender.com';
        
        try {
            await fetch(`${backendUrl}/api/notifications/read-all`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.notifications.forEach(n => n.read = true);
            this.updateBadges();
            this.renderDropdown();
            if (window.renderFullNotifications) window.renderFullNotifications();
        } catch (err) {}
    }
    
    async deleteNotif(id, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const token = localStorage.getItem('smp_access_token');
        if (!token) return;
        const backendUrl = window.API_BASE || 'https://smp-backend-kcwn.onrender.com';
        
        try {
            await fetch(`${backendUrl}/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            this.notifications = this.notifications.filter(n => n.id !== id);
            this.updateBadges();
            this.renderDropdown();
            // Nếu ở trang full thì reload list
            if (window.renderFullNotifications) window.renderFullNotifications();
        } catch (err) {}
    }
    
    escapeHTML(str) {
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
    
    formatDate(dateString) {
        const date = new Date(dateString + 'Z');
        return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
}

const notifCtrl = new NotificationsController();
window.notifCtrl = notifCtrl;
