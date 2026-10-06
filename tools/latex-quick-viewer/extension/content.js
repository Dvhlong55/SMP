/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer & Composer — Content Script (Shadow DOM Sandbox UI)
 * ==============================================================================
 * Hoạt động độc lập trong Shadow DOM, không bị ảnh hưởng bởi CSS của Facebook,
 * VOZ, VMF, hay bất kỳ diễn đàn nào.
 * Tích hợp đầy đủ:
 * - Soạn thảo công thức trực tiếp song song với xem trước
 * - Biên dịch nhanh văn bản toán học từ mạng xã hội
 * - Xuất và sao chép ảnh công thức (PNG nét cao) vào Clipboard
 * - Chèn trực tiếp công thức vào ô bình luận Facebook / diễn đàn
 * ==============================================================================
 */

(function () {
    'use strict';

    let modalHost = null;
    let shadowRoot = null;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let modalInitialLeft = 0;
    let modalInitialTop = 0;
    let lastActiveEditable = null;
    let currentActiveTab = 'compose'; // 'compose' | 'translate' | 'raw'

    // Bắt và lưu vết ô nhập liệu / ô bình luận người dùng đang tương tác
    document.addEventListener('contextmenu', (e) => {
        const t = e.target;
        if (t && (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.closest('[contenteditable="true"]'))) {
            lastActiveEditable = t.closest('[contenteditable="true"]') || t;
        }
    }, true);

    document.addEventListener('focusin', (e) => {
        const t = e.target;
        if (t && (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || t.closest('[contenteditable="true"]'))) {
            lastActiveEditable = t.closest('[contenteditable="true"]') || t;
        }
    }, true);

    /**
     * Tạo hoặc lấy Shadow DOM Container
     */
    function ensureModalHost() {
        if (!modalHost || !document.body.contains(modalHost)) {
            modalHost = document.createElement('div');
            modalHost.id = 'smp-latex-modal-host';
            modalHost.style.position = 'fixed';
            modalHost.style.top = '0';
            modalHost.style.left = '0';
            modalHost.style.width = '0';
            modalHost.style.height = '0';
            modalHost.style.zIndex = '2147483647'; // Luôn nổi trên cùng
            document.body.appendChild(modalHost);

            shadowRoot = modalHost.attachShadow({ mode: 'open' });

            // Nạp KaTeX CSS vào bên trong Shadow DOM
            const katexCssLink = document.createElement('link');
            katexCssLink.rel = 'stylesheet';
            katexCssLink.href = chrome.runtime.getURL('katex/katex.min.css');
            shadowRoot.appendChild(katexCssLink);

            // Nạp Modal Stylesheet
            const style = document.createElement('style');
            style.textContent = getModalStyles();
            shadowRoot.appendChild(style);
        }
        return shadowRoot;
    }

    /**
     * CSS đóng gói bên trong Shadow DOM
     */
    function getModalStyles() {
        return `
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }
            :host {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
            }
            .smp-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.45);
                backdrop-filter: blur(2px);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.2s ease;
            }
            .smp-backdrop.active {
                opacity: 1;
                pointer-events: auto;
            }
            .smp-dialog {
                position: absolute;
                width: 780px;
                max-width: 95vw;
                max-height: 88vh;
                background: #14181a;
                color: #e2e8f0;
                border-radius: 12px;
                border: 1px solid rgba(92, 225, 230, 0.3);
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(92, 225, 230, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.96) translateY(8px);
                transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
            }
            .smp-backdrop.active .smp-dialog {
                transform: scale(1) translateY(0);
            }
            .smp-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                background: #182024;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                cursor: move;
                user-select: none;
            }
            .smp-title-wrap {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .smp-badge {
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                background: rgba(92, 225, 230, 0.15);
                color: #5ce1e6;
                padding: 2px 7px;
                border-radius: 4px;
                border: 1px solid rgba(92, 225, 230, 0.3);
            }
            .smp-title {
                font-size: 13px;
                font-weight: 600;
                color: #f8fafc;
            }
            .smp-header-actions {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .smp-tab-btn {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #94a3b8;
                font-size: 11px;
                font-weight: 500;
                padding: 4px 10px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .smp-tab-btn.active {
                background: rgba(92, 225, 230, 0.2);
                border-color: #5ce1e6;
                color: #5ce1e6;
            }
            .smp-tab-btn:hover:not(.active) {
                background: rgba(255, 255, 255, 0.05);
                color: #e2e8f0;
            }
            .smp-close-btn {
                background: transparent;
                border: none;
                color: #94a3b8;
                font-size: 17px;
                line-height: 1;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
            }
            .smp-close-btn:hover {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }
            .smp-body {
                padding: 14px 16px;
                overflow-y: auto;
                max-height: calc(88vh - 110px);
                background: #0f1315;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .smp-body::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .smp-body::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 3px;
            }

            /* --- Thanh Ký Hiệu Toán (Snippet Toolbar) --- */
            .smp-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                padding: 8px 10px;
                background: #14191c;
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-radius: 8px;
                max-height: 110px;
                overflow-y: auto;
            }
            .smp-tool-btn {
                background: #1a2226;
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #e2e8f0;
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.12s ease;
                white-space: nowrap;
                font-family: inherit;
            }
            .smp-tool-btn:hover {
                background: rgba(92, 225, 230, 0.18);
                border-color: #5ce1e6;
                color: #5ce1e6;
                transform: translateY(-1px);
            }

            /* --- Giao diện Soạn Thảo Song Song (2 Cột) --- */
            .smp-compose-wrap {
                display: flex;
                gap: 12px;
                min-height: 220px;
            }
            .smp-compose-pane {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .smp-pane-label {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #64748b;
                margin-bottom: 5px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .smp-compose-textarea {
                width: 100%;
                flex: 1;
                min-height: 200px;
                background: #080b0c;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #a5f3fc;
                font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
                font-size: 13px;
                padding: 10px;
                outline: none;
                resize: vertical;
                box-sizing: border-box;
                line-height: 1.5;
            }
            .smp-compose-textarea:focus {
                border-color: #5ce1e6;
            }
            .smp-compose-preview {
                width: 100%;
                flex: 1;
                min-height: 200px;
                max-height: 380px;
                overflow-y: auto;
                background: #080b0c;
                border: 1px solid rgba(92, 225, 230, 0.2);
                border-radius: 8px;
                padding: 12px;
                color: #f1f5f9;
                font-family: "Times New Roman", Times, serif;
                font-size: 16px;
                line-height: 2.1;
                letter-spacing: 0.025em;
                word-spacing: 0.05em;
                white-space: pre-wrap;
                word-break: break-word;
            }

            /* --- Giao diện Biên Dịch & Mã Thô --- */
            .smp-translate-view {
                font-family: "Times New Roman", Times, serif;
                color: #f1f5f9;
                font-size: 16px;
                line-height: 2.1;
                letter-spacing: 0.025em;
                word-spacing: 0.05em;
                white-space: pre-wrap;
                word-break: break-word;
                min-height: 160px;
                padding: 8px;
            }
            .smp-raw-textarea {
                width: 100%;
                min-height: 200px;
                background: #080b0c;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #a5f3fc;
                font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
                font-size: 13px;
                padding: 12px;
                outline: none;
                resize: vertical;
                box-sizing: border-box;
                line-height: 1.5;
            }
            .smp-raw-textarea:focus {
                border-color: #5ce1e6;
            }

            /* --- Định dạng KaTeX --- */
            .katex {
                font-size: 1.05em;
                color: inherit;
            }
            .katex-display {
                margin: 0.8em 0;
                overflow-x: auto;
                overflow-y: hidden;
                padding: 6px 0;
            }

            /* --- Thanh Chân Trang (Footer Actions) --- */
            .smp-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                background: #14181a;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                font-size: 11px;
                color: #64748b;
            }
            .smp-footer-left {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .smp-status-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #10b981;
                box-shadow: 0 0 6px #10b981;
            }
            .smp-footer-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .smp-action-btn {
                background: rgba(92, 225, 230, 0.12);
                border: 1px solid rgba(92, 225, 230, 0.3);
                color: #5ce1e6;
                padding: 5px 12px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .smp-action-btn:hover {
                background: rgba(92, 225, 230, 0.25);
                transform: translateY(-1px);
            }
            .smp-action-btn:active {
                transform: translateY(0);
            }
            .smp-action-btn.btn-primary {
                background: #0ea5e9;
                border-color: #38bdf8;
                color: #ffffff;
                font-weight: 600;
            }
            .smp-action-btn.btn-primary:hover {
                background: #0284c7;
            }

            /* --- Toast Thông Báo --- */
            .smp-toast {
                position: absolute;
                bottom: 50px;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid rgba(92, 225, 230, 0.5);
                color: #5ce1e6;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
                opacity: 0;
                pointer-events: none;
                transition: all 0.2s ease;
                z-index: 100;
                white-space: nowrap;
            }
            .smp-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        `;
    }

    /**
     * Tạo markup hộp thoại
     */
    function createModalDom() {
        const root = ensureModalHost();
        let backdrop = root.querySelector('.smp-backdrop');

        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'smp-backdrop';
            backdrop.innerHTML = `
                <div class="smp-dialog" id="smp-dialog">
                    <div class="smp-header" id="smp-drag-header">
                        <div class="smp-title-wrap">
                            <span class="smp-badge">SMP</span>
                            <span class="smp-title" id="smp-modal-title">Soạn Thảo & Biên Dịch</span>
                        </div>
                        <div class="smp-header-actions">
                            <button class="smp-tab-btn" id="smp-btn-tab-compose">Soạn Thảo</button>
                            <button class="smp-tab-btn" id="smp-btn-tab-translate">Biên Dịch</button>
                            <button class="smp-tab-btn" id="smp-btn-tab-raw">Mã Công Thức</button>
                            <button class="smp-close-btn" id="smp-btn-close" title="Đóng (Esc)">✕</button>
                        </div>
                    </div>

                    <div class="smp-body">
                        <!-- 1. Giao diện Soạn Thảo Song Song -->
                        <div id="smp-panel-compose" style="display: flex; flex-direction: column; gap: 10px;">
                            <div class="smp-toolbar" id="smp-toolbar">
                                <!-- Nhóm nút nhanh lấy cảm hứng từ SMP LaTeX Editor -->
                                <button class="smp-tool-btn" data-snip="\\frac{a}{b}">\\frac{a}{b}</button>
                                <button class="smp-tool-btn" data-snip="\\sqrt{x}">\\sqrt{x}</button>
                                <button class="smp-tool-btn" data-snip="\\sqrt[n]{x}">\\sqrt[n]{x}</button>
                                <button class="smp-tool-btn" data-snip="^{n}">x^{n}</button>
                                <button class="smp-tool-btn" data-snip="_{n}">x_{n}</button>
                                <button class="smp-tool-btn" data-snip="\\sum_{i=1}^{n}">\\sum</button>
                                <button class="smp-tool-btn" data-snip="\\prod_{i=1}^{n}">\\prod</button>
                                <button class="smp-tool-btn" data-snip="\\int_{a}^{b}">\\int</button>
                                <button class="smp-tool-btn" data-snip="\\lim_{x \\to \\infty}">lim</button>
                                <button class="smp-tool-btn" data-snip="\\infty">\\infty</button>
                                <button class="smp-tool-btn" data-snip="\\le">\\le</button>
                                <button class="smp-tool-btn" data-snip="\\ge">\\ge</button>
                                <button class="smp-tool-btn" data-snip="\\neq">\\neq</button>
                                <button class="smp-tool-btn" data-snip="\\equiv">\\equiv</button>
                                <button class="smp-tool-btn" data-snip="\\pmod{m}">pmod</button>
                                <button class="smp-tool-btn" data-snip="\\mid">\\mid</button>
                                <button class="smp-tool-btn" data-snip="\\Rightarrow">\\Rightarrow</button>
                                <button class="smp-tool-btn" data-snip="\\Leftrightarrow">\\Leftrightarrow</button>
                                <button class="smp-tool-btn" data-snip="\\forall">\\forall</button>
                                <button class="smp-tool-btn" data-snip="\\exists">\\exists</button>
                                <button class="smp-tool-btn" data-snip="\\mathbb{R}">\\mathbb{R}</button>
                                <button class="smp-tool-btn" data-snip="\\mathbb{N}">\\mathbb{N}</button>
                                <button class="smp-tool-btn" data-snip="\\mathbb{Z}">\\mathbb{Z}</button>
                                <button class="smp-tool-btn" data-snip="\\in">\\in</button>
                                <button class="smp-tool-btn" data-snip="\\subset">\\subset</button>
                                <button class="smp-tool-btn" data-snip="\\cup">\\cup</button>
                                <button class="smp-tool-btn" data-snip="\\cap">\\cap</button>
                                <button class="smp-tool-btn" data-snip="\\emptyset">\\emptyset</button>
                                <button class="smp-tool-btn" data-snip="\\alpha">\\alpha</button>
                                <button class="smp-tool-btn" data-snip="\\beta">\\beta</button>
                                <button class="smp-tool-btn" data-snip="\\pi">\\pi</button>
                                <button class="smp-tool-btn" data-snip="\\varphi">\\varphi</button>
                                <button class="smp-tool-btn" data-snip="\\vec{v}">\\vec{v}</button>
                                <button class="smp-tool-btn" data-snip="\\binom{n}{k}">\\binom{n}{k}</button>
                                <button class="smp-tool-btn" data-snip="\\begin{cases}\n  & \\\\\n  &\n\\end{cases}">cases</button>
                                <button class="smp-tool-btn" data-snip="\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}">matrix</button>
                                <button class="smp-tool-btn" data-snip="\\begin{align*}\n  \n\\end{align*}">align</button>
                            </div>
                            <div class="smp-compose-wrap">
                                <div class="smp-compose-pane">
                                    <div class="smp-pane-label">
                                        <span>Soạn thảo công thức</span>
                                        <span id="smp-char-count">0 ký tự</span>
                                    </div>
                                    <textarea class="smp-compose-textarea" id="smp-compose-input" placeholder="Gõ công thức hoặc nội dung thảo luận tại đây...&#10;&#10;Ví dụ:&#10;Theo BĐT AM-GM ta có:&#10;$$ \\frac{a}{b+c} + \\frac{b}{c+a} + \\frac{c}{a+b} \\ge \\frac{3}{2} $$"></textarea>
                                </div>
                                <div class="smp-compose-pane">
                                    <div class="smp-pane-label">
                                        <span>Xem trước trực tiếp</span>
                                    </div>
                                    <div class="smp-compose-preview" id="smp-compose-preview"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Giao diện Biên Dịch (Từ đoạn bôi đen) -->
                        <div id="smp-panel-translate" style="display: none;">
                            <div class="smp-translate-view" id="smp-translate-view"></div>
                        </div>

                        <!-- 3. Giao diện Mã Công Thức -->
                        <div id="smp-panel-raw" style="display: none;">
                            <textarea class="smp-raw-textarea" id="smp-raw-textarea" placeholder="Nhập hoặc chỉnh sửa mã công thức tại đây..."></textarea>
                        </div>
                    </div>

                    <div class="smp-footer">
                        <div class="smp-footer-left">
                            <span class="smp-status-dot"></span>
                            <span id="smp-status-text">Sẵn sàng</span>
                        </div>
                        <div class="smp-footer-actions">
                            <button class="smp-action-btn btn-primary" id="smp-btn-insert" title="Chèn trực tiếp vào ô bình luận đang chọn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                                <span>Chèn Vào Bình Luận</span>
                            </button>
                            <button class="smp-action-btn" id="smp-btn-copy-image" title="Chép ảnh công thức vào Clipboard để bấm Ctrl + V dán ảnh vào bình luận">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                <span>Chép Ảnh</span>
                            </button>
                            <button class="smp-action-btn" id="smp-btn-copy-code" title="Sao chép chuỗi mã vào Clipboard">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                <span id="smp-copy-code-text">Sao Chép Mã</span>
                            </button>
                        </div>
                    </div>
                    <div class="smp-toast" id="smp-toast">✓ Đã sao chép!</div>
                </div>
            `;
            root.appendChild(backdrop);
            bindModalEvents(backdrop);
        }
        return backdrop;
    }

    /**
     * Hiển thị thông báo Toast
     */
    function showToast(backdrop, msg) {
        const toast = backdrop.querySelector('#smp-toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2600);
    }

    /**
     * Render KaTeX vào phần tử hiển thị từ chuỗi LaTeX
     */
    function renderLatexContent(element, latexText) {
        if (!element) return;
        element.innerText = latexText || '';
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(element, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
    }

    /**
     * Chuyển Tab (Soạn Thảo / Biên Dịch / Mã Công Thức)
     */
    function switchTab(root, tab) {
        currentActiveTab = tab;
        const btnCompose = root.querySelector('#smp-btn-tab-compose');
        const btnTranslate = root.querySelector('#smp-btn-tab-translate');
        const btnRaw = root.querySelector('#smp-btn-tab-raw');

        const panelCompose = root.querySelector('#smp-panel-compose');
        const panelTranslate = root.querySelector('#smp-panel-translate');
        const panelRaw = root.querySelector('#smp-panel-raw');

        const composeInput = root.querySelector('#smp-compose-input');
        const composePreview = root.querySelector('#smp-compose-preview');
        const translateView = root.querySelector('#smp-translate-view');
        const rawTextarea = root.querySelector('#smp-raw-textarea');

        // Bỏ active tất cả nút
        [btnCompose, btnTranslate, btnRaw].forEach(btn => btn && btn.classList.remove('active'));
        [panelCompose, panelTranslate, panelRaw].forEach(p => p && (p.style.display = 'none'));

        if (tab === 'compose') {
            btnCompose.classList.add('active');
            panelCompose.style.display = 'flex';
            if (composeInput && composePreview) {
                renderLatexContent(composePreview, composeInput.value);
                composeInput.focus();
            }
        } else if (tab === 'translate') {
            btnTranslate.classList.add('active');
            panelTranslate.style.display = 'block';
            // Đồng bộ từ ô raw hoặc nội dung dịch
            if (rawTextarea && translateView) {
                renderLatexContent(translateView, rawTextarea.value);
            }
        } else {
            btnRaw.classList.add('active');
            panelRaw.style.display = 'block';
            // Cập nhật giá trị vào ô raw tùy thuộc tab trước đó
            if (rawTextarea) {
                if (composeInput && composeInput.value.trim()) {
                    rawTextarea.value = composeInput.value;
                }
                rawTextarea.focus();
            }
        }
    }

    /**
     * Mở hộp thoại ở chế độ Biên Dịch (bôi đen đoạn văn bản)
     */
    function showTranslateModal(rawText) {
        const root = ensureModalHost();
        const backdrop = createModalDom();

        const normalized = window.SMPNormalizer ? window.SMPNormalizer.normalizeMathText(rawText || '') : { cleanLatex: rawText, mathCount: 1 };

        const translateView = root.querySelector('#smp-translate-view');
        const rawTextarea = root.querySelector('#smp-raw-textarea');

        if (rawTextarea) {
            rawTextarea.value = normalized.cleanLatex;
        }
        if (translateView) {
            renderLatexContent(translateView, normalized.cleanLatex);
        }

        switchTab(root, 'translate');

        requestAnimationFrame(() => {
            backdrop.classList.add('active');
        });
    }

    /**
     * Mở hộp thoại ở chế độ Soạn Thảo (khi bấm chuột phải vào ô cmt hoặc phím tắt)
     */
    function showComposerModal() {
        const root = ensureModalHost();
        const backdrop = createModalDom();

        const composeInput = root.querySelector('#smp-compose-input');
        const composePreview = root.querySelector('#smp-compose-preview');

        // Khôi phục nháp đã lưu nếu có
        if (composeInput && !composeInput.value) {
            const savedDraft = localStorage.getItem('smp_composer_draft');
            if (savedDraft) {
                composeInput.value = savedDraft;
            }
        }

        if (composeInput && composePreview) {
            renderLatexContent(composePreview, composeInput.value);
        }

        switchTab(root, 'compose');

        requestAnimationFrame(() => {
            backdrop.classList.add('active');
            if (composeInput) composeInput.focus();
        });
    }

    /**
     * Chèn snippet vào ô soạn thảo
     */
    function insertSnippet(textarea, snipText) {
        if (!textarea) return;
        textarea.focus();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const sel = textarea.value.substring(start, end);

        let insertVal = snipText;
        let cursorOffset = insertVal.length;

        // Tự động bọc nếu người dùng đã bôi đen chữ
        if (snipText.includes('{a}') || snipText.includes('{x}')) {
            if (sel) {
                insertVal = snipText.replace('{a}', `{${sel}}`).replace('{x}', `{${sel}}`);
            }
        } else if (sel) {
            insertVal = snipText + sel;
        }

        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + insertVal + after;
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;

        // Kích hoạt sự kiện input để live render
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Xuất và sao chép ảnh công thức vào Clipboard (PNG chất lượng cao)
     */
    async function copyFormulaImage(backdrop) {
        let previewEl = null;
        if (currentActiveTab === 'compose') {
            previewEl = backdrop.querySelector('#smp-compose-preview');
        } else {
            previewEl = backdrop.querySelector('#smp-translate-view');
        }

        if (!previewEl || !previewEl.innerText.trim()) {
            showToast(backdrop, 'Chưa có công thức để chép ảnh!');
            return;
        }

        showToast(backdrop, 'Đang tạo ảnh công thức...');

        try {
            // Tạo card sạch để chụp ảnh sắc nét (nền trắng, chữ đen chuẩn để dán lên FB rõ đẹp)
            const clone = previewEl.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = 'auto';
            clone.style.maxWidth = '640px';
            clone.style.padding = '22px 26px';
            clone.style.background = '#ffffff';
            clone.style.color = '#0f172a';
            clone.style.borderRadius = '10px';
            clone.style.border = '1px solid #e2e8f0';
            clone.style.boxShadow = 'none';
            clone.style.fontFamily = '"Times New Roman", Times, serif';
            clone.style.fontSize = '18px';
            clone.style.lineHeight = '2.2';

            clone.querySelectorAll('.katex').forEach(k => {
                k.style.color = '#0f172a';
            });

            document.body.appendChild(clone);

            if (typeof html2canvas === 'undefined') {
                document.body.removeChild(clone);
                showToast(backdrop, 'Công cụ tạo ảnh đang nạp, vui lòng thử lại sau 1 giây.');
                return;
            }

            const canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: 2.5, // 2.5x Độ nét cao
                logging: false,
                useCORS: true
            });

            document.body.removeChild(clone);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showToast(backdrop, 'Không thể tạo file ảnh!');
                    return;
                }

                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                        showToast(backdrop, '✓ Đã chép ảnh vào Clipboard! Nhấp ô bình luận và bấm Ctrl + V để dán.');
                        return;
                    } catch (clipErr) {
                        console.warn('[SMP] Trình duyệt chặn ghi blob ảnh, chuyển sang tải file:', clipErr);
                    }
                }

                // Tải xuống file ảnh nếu trình duyệt chặn ClipboardItem
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'cong-thuc.png';
                a.click();
                showToast(backdrop, 'Đã tải ảnh cong-thuc.png về máy!');
            }, 'image/png');

        } catch (err) {
            console.error('[SMP] Lỗi xuất ảnh:', err);
            showToast(backdrop, 'Lỗi xuất ảnh: ' + (err.message || ''));
        }
    }

    /**
     * Chèn nội dung vào ô bình luận hoặc ô nhập liệu đang tương tác
     */
    function insertTextIntoCommentBox(backdrop) {
        let textToInsert = '';
        if (currentActiveTab === 'compose') {
            textToInsert = backdrop.querySelector('#smp-compose-input').value;
        } else {
            textToInsert = backdrop.querySelector('#smp-raw-textarea').value;
        }

        if (!textToInsert || !textToInsert.trim()) {
            showToast(backdrop, 'Nội dung đang trống!');
            return;
        }

        if (lastActiveEditable && document.body.contains(lastActiveEditable)) {
            lastActiveEditable.focus();
            const success = document.execCommand('insertText', false, textToInsert);
            if (!success) {
                if ('value' in lastActiveEditable) {
                    const start = lastActiveEditable.selectionStart || 0;
                    const end = lastActiveEditable.selectionEnd || 0;
                    const val = lastActiveEditable.value;
                    lastActiveEditable.value = val.slice(0, start) + textToInsert + val.slice(end);
                    lastActiveEditable.selectionStart = lastActiveEditable.selectionEnd = start + textToInsert.length;
                    lastActiveEditable.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            showToast(backdrop, '✓ Đã chèn vào ô bình luận!');
        } else {
            // Nếu không tìm thấy ô bình luận nào, copy vào clipboard và báo người dùng
            navigator.clipboard.writeText(textToInsert).then(() => {
                showToast(backdrop, '✓ Đã sao chép! Hãy nhấp vào ô bình luận và bấm Ctrl + V.');
            });
        }
    }

    /**
     * Gắn các sự kiện (kéo thả, đóng, copy, chèn, phím Esc)
     */
    function bindModalEvents(backdrop) {
        const dialog = backdrop.querySelector('#smp-dialog');
        const dragHeader = backdrop.querySelector('#smp-drag-header');
        const btnClose = backdrop.querySelector('#smp-btn-close');

        const btnTabCompose = backdrop.querySelector('#smp-btn-tab-compose');
        const btnTabTranslate = backdrop.querySelector('#smp-btn-tab-translate');
        const btnTabRaw = backdrop.querySelector('#smp-btn-tab-raw');

        const composeInput = backdrop.querySelector('#smp-compose-input');
        const composePreview = backdrop.querySelector('#smp-compose-preview');
        const rawTextarea = backdrop.querySelector('#smp-raw-textarea');
        const charCount = backdrop.querySelector('#smp-char-count');

        const btnInsert = backdrop.querySelector('#smp-btn-insert');
        const btnCopyImage = backdrop.querySelector('#smp-btn-copy-image');
        const btnCopyCode = backdrop.querySelector('#smp-btn-copy-code');
        const copyCodeText = backdrop.querySelector('#smp-copy-code-text');
        const toolbar = backdrop.querySelector('#smp-toolbar');

        // Đóng modal
        function closeModal() {
            backdrop.classList.remove('active');
        }

        btnClose.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // Chuyển tab
        btnTabCompose.addEventListener('click', () => switchTab(backdrop, 'compose'));
        btnTabTranslate.addEventListener('click', () => switchTab(backdrop, 'translate'));
        btnTabRaw.addEventListener('click', () => switchTab(backdrop, 'raw'));

        // Sự kiện gõ trực tiếp trong ô Soạn Thảo (Live Render realtime)
        if (composeInput) {
            let composeDebounce = null;
            composeInput.addEventListener('input', () => {
                const val = composeInput.value;
                if (charCount) charCount.textContent = `${val.length} ký tự`;

                // Lưu nháp tự động
                localStorage.setItem('smp_composer_draft', val);

                clearTimeout(composeDebounce);
                composeDebounce = setTimeout(() => {
                    renderLatexContent(composePreview, val);
                }, 40);
            });

            // Tự động đóng cặp dấu ngoặc và $
            composeInput.addEventListener('keydown', (e) => {
                if (e.key === '$') {
                    const start = composeInput.selectionStart;
                    const end = composeInput.selectionEnd;
                    if (start !== end) {
                        e.preventDefault();
                        const sel = composeInput.value.substring(start, end);
                        composeInput.setRangeText(`$${sel}$`, start, end, 'select');
                    } else {
                        e.preventDefault();
                        composeInput.setRangeText('$$', start, start, 'end');
                        composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                    }
                    composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                } else if (e.key === '(' || e.key === '[' || e.key === '{') {
                    const closePair = e.key === '(' ? ')' : (e.key === '[' ? ']' : '}');
                    const start = composeInput.selectionStart;
                    const end = composeInput.selectionEnd;
                    if (start !== end) {
                        e.preventDefault();
                        const sel = composeInput.value.substring(start, end);
                        composeInput.setRangeText(`${e.key}${sel}${closePair}`, start, end, 'select');
                    } else {
                        e.preventDefault();
                        composeInput.setRangeText(`${e.key}${closePair}`, start, start, 'end');
                        composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                    }
                    composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }

        // Sự kiện click nút công thức trên thanh công cụ
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                const btn = e.target.closest('.smp-tool-btn');
                if (btn && btn.dataset.snip) {
                    insertSnippet(composeInput, btn.dataset.snip);
                }
            });
        }

        // Sự kiện nút Chèn Vào Bình Luận
        btnInsert.addEventListener('click', () => {
            insertTextIntoCommentBox(backdrop);
        });

        // Sự kiện nút Chép Ảnh
        btnCopyImage.addEventListener('click', () => {
            copyFormulaImage(backdrop);
        });

        // Sự kiện nút Sao Chép Mã
        btnCopyCode.addEventListener('click', () => {
            let textToCopy = '';
            if (currentActiveTab === 'compose') {
                textToCopy = composeInput.value;
            } else {
                textToCopy = rawTextarea.value;
            }

            navigator.clipboard.writeText(textToCopy).then(() => {
                btnCopyCode.classList.add('copied');
                copyCodeText.textContent = '✓ Đã chép!';
                showToast(backdrop, '✓ Đã sao chép mã!');
                setTimeout(() => {
                    btnCopyCode.classList.remove('copied');
                    copyCodeText.textContent = 'Sao Chép Mã';
                }, 2000);
            }).catch(err => {
                console.error('[SMP] Không thể sao chép:', err);
            });
        });

        // Kéo thả di chuyển hộp thoại
        dragHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.smp-header-actions')) return;
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            const rect = dialog.getBoundingClientRect();
            modalInitialLeft = rect.left;
            modalInitialTop = rect.top;

            dialog.style.left = `${modalInitialLeft}px`;
            dialog.style.top = `${modalInitialTop}px`;
            dialog.style.position = 'fixed';
            dialog.style.margin = '0';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStartX;
            const dy = e.clientY - dragStartY;
            dialog.style.left = `${modalInitialLeft + dx}px`;
            dialog.style.top = `${modalInitialTop + dy}px`;
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Phím tắt Esc để đóng modal
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && backdrop.classList.contains('active')) {
                closeModal();
            }
        });
    }

    /**
     * Nhận tin nhắn từ background script
     */
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'SMP_TRANSLATE_SELECTION') {
            let text = '';
            try {
                const domSelection = window.getSelection() ? window.getSelection().toString() : '';
                if (domSelection && domSelection.trim()) {
                    text = domSelection;
                }
            } catch (e) {}
            if (!text) {
                text = request.text || '';
            }
            showTranslateModal(text);
            sendResponse({ success: true });
        } else if (request.action === 'SMP_OPEN_COMPOSER') {
            showComposerModal();
            sendResponse({ success: true });
        } else if (request.action === 'SMP_TRANSLATE_HOTKEY') {
            const selectedText = window.getSelection().toString();
            if (selectedText && selectedText.trim()) {
                showTranslateModal(selectedText);
            } else {
                showComposerModal();
            }
            sendResponse({ success: true });
        }
    });

    console.log('[SMP] Tiện ích Soạn Thảo & Biên Dịch đã sẵn sàng.');
})();
