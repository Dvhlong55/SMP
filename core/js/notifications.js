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
                document.querySelectorAll('.notif-context-menu').forEach(el => el.style.display = 'none');
            }
        });

        // Initialize full notifications page if container exists
        if (document.getElementById('notif-container')) {
            window.renderFullNotifications = () => this.renderFullPage();
            this.renderFullPage();
        }
    }
    
    createDropdownUI() {
        if (document.getElementById('notif-dropdown')) return;
        
        const dropdown = document.createElement('div');
        dropdown.id = 'notif-dropdown';
        
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
                if (window.renderFullNotifications) {
                    window.renderFullNotifications();
                }
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
                <div class="notif-empty-state">
                    Không có thông báo nào.
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="notif-dropdown-header">
                <h4>Thông báo</h4>
                <button onclick="notifCtrl.markAllRead()" class="notif-mark-all-btn">Đánh dấu tất cả đã đọc</button>
            </div>
            <div class="notif-dropdown-list">
        `;
        
        // Hiển thị tối đa 10 thông báo trong dropdown
        const displayNotifs = this.notifications.slice(0, 10);
        
        displayNotifs.forEach(notif => {
            const isRead = notif.read;
            const itemClass = isRead ? 'notif-dropdown-item' : 'notif-dropdown-item unread';
            
            html += `
                <div class="${itemClass}">
                    ${!isRead ? '<div class="notif-unread-dot"></div>' : '<div class="notif-dot-placeholder"></div>'}
                    <div class="notif-item-body">
                        <a href="${notif.url}" onclick="notifCtrl.markReadAndGo('${notif.id}', '${notif.url}', event)" class="notif-item-link">
                            <span class="notif-item-sender">${this.escapeHTML(notif.senderName)}</span> ${this.escapeHTML(notif.message)}
                        </a>
                        <div class="notif-item-time">${this.formatDate(notif.createdAt)}</div>
                    </div>
                    
                    <div class="notif-menu-wrapper">
                        <button onclick="notifCtrl.toggleMenu('${notif.id}', event)" class="notif-opt-btn">⋯</button>
                        <div id="notif-menu-${notif.id}" class="notif-context-menu">
                            ${!isRead ? `<button onclick="notifCtrl.markRead('${notif.id}', event)">Đánh dấu đã đọc</button>` : ''}
                            <button onclick="notifCtrl.deleteNotif('${notif.id}', event)" class="delete">Xóa thông báo</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
            </div>
            <a href="/SMP/pages/notifications.html" class="notif-dropdown-footer">Xem tất cả</a>
        `;
        
        this.dropdownEl.innerHTML = html;
    }
    
    toggleMenu(id, e) {
        e.preventDefault();
        e.stopPropagation();
        const menu = document.getElementById(`notif-menu-${id}`);
        const isVisible = menu.style.display === 'block';
        
        // Đóng các menu khác
        document.querySelectorAll('.notif-context-menu').forEach(el => el.style.display = 'none');
        
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
    
    renderFullPage() {
        const container = document.getElementById('notif-container');
        if (!container) return;
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; border: 1px dashed var(--border-light); border-radius: 8px; grid-column: 1 / -1;">
                    <p style="color: var(--text-muted); margin-bottom: 16px;">Bạn không có thông báo nào.</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-direction: column; gap: 14px;">';
        this.notifications.forEach(notif => {
            const isRead = notif.read;
            const cardClass = isRead ? 'notif-full-card' : 'notif-full-card unread';
            
            html += `
                <div class="${cardClass}">
                    <div class="notif-full-content">
                        <a href="${notif.url}" onclick="notifCtrl.markReadAndGo('${notif.id}', '${notif.url}', event)" class="notif-full-link">
                            <span class="notif-full-sender">${this.escapeHTML(notif.senderName)}</span> ${this.escapeHTML(notif.message)}
                        </a>
                        <div class="notif-full-time">${this.formatDate(notif.createdAt)}</div>
                    </div>
                    <div class="notif-full-actions">
                        ${!isRead ? `<button onclick="notifCtrl.markRead('${notif.id}', event)" class="notif-full-btn">Đánh dấu đã đọc</button>` : ''}
                        <button onclick="notifCtrl.deleteNotif('${notif.id}', event)" class="notif-full-btn delete">Xóa</button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
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
