/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer — Content Script (Shadow DOM Sandbox UI)
 * ==============================================================================
 * Hoạt động độc lập trong Shadow DOM, không bị ảnh hưởng bởi CSS của Facebook,
 * VOZ, VMF, hay bất kỳ diễn đàn nào.
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
                width: 640px;
                max-width: 92vw;
                max-height: 85vh;
                background: #14181a;
                color: #e2e8f0;
                border-radius: 12px;
                border: 1px solid rgba(92, 225, 230, 0.3);
                box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6), 0 0 20px rgba(92, 225, 230, 0.15);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.95) translateY(10px);
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
            }
            .smp-backdrop.active .smp-dialog {
                transform: scale(1) translateY(0);
            }
            .smp-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: #1a2024;
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
                font-size: 14px;
                font-weight: 600;
                color: #f8fafc;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .smp-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
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
                font-size: 18px;
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
                padding: 16px;
                overflow-y: auto;
                max-height: calc(85vh - 110px);
                background: #0f1315;
            }
            .smp-body::-webkit-scrollbar {
                width: 6px;
            }
            .smp-body::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 3px;
            }
            .smp-render-view {
                font-family: "Times New Roman", Times, serif;
                color: #f1f5f9;
                font-size: 16px;
                line-height: 2.1;
                letter-spacing: 0.025em;
                word-spacing: 0.05em;
                white-space: pre-wrap;
                word-break: break-word;
            }
            /* Định dạng công thức KaTeX tự nhiên chuẩn sách giáo khoa */
            .smp-render-view .katex {
                font-size: 1.05em;
                color: inherit;
            }
            .smp-render-view .katex-display {
                margin: 0.8em 0;
                overflow-x: auto;
                overflow-y: hidden;
                padding: 6px 0;
            }
            .smp-raw-view {
                display: none;
            }
            .smp-raw-textarea {
                width: 100%;
                min-height: 180px;
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
            .smp-action-btn.copied {
                background: rgba(16, 185, 129, 0.2);
                border-color: #10b981;
                color: #10b981;
            }
        `;
    }

    /**
     * Mở và hiển thị hộp thoại dịch LaTeX
     */
    function showTranslateModal(rawText) {
        if (!rawText || !rawText.trim()) return;

        const root = ensureModalHost();
        let backdrop = root.querySelector('.smp-backdrop');

        // Bắt đầu đo thời gian biên dịch
        const startTime = performance.now();

        // Sử dụng Normalizer đã đóng gói
        const normalized = window.SMPNormalizer ? window.SMPNormalizer.normalizeMathText(rawText) : { cleanLatex: rawText, mathCount: 1 };
        const elapsed = (performance.now() - startTime).toFixed(1);

        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'smp-backdrop';
            backdrop.innerHTML = `
                <div class="smp-dialog" id="smp-dialog">
                    <div class="smp-header" id="smp-drag-header">
                        <div class="smp-title-wrap">
                            <span class="smp-badge">SMP</span>
                            <span class="smp-title">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5ce1e6" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                                Dịch LaTeX Ngữ Cảnh
                            </span>
                        </div>
                        <div class="smp-header-actions">
                            <button class="smp-tab-btn active" id="smp-btn-tab-render">Xem Đẹp</button>
                            <button class="smp-tab-btn" id="smp-btn-tab-raw">Mã LaTeX</button>
                            <button class="smp-close-btn" id="smp-btn-close" title="Đóng (Esc)">✕</button>
                        </div>
                    </div>

                    <div class="smp-body">
                        <div class="smp-render-view" id="smp-render-view"></div>
                        <div class="smp-raw-view" id="smp-raw-view">
                            <textarea class="smp-raw-textarea" id="smp-raw-textarea" readonly></textarea>
                        </div>
                    </div>

                    <div class="smp-footer">
                        <div class="smp-footer-left">
                            <span class="smp-status-dot"></span>
                            <span id="smp-status-text">KaTeX Render: ${normalized.mathCount} công thức (${elapsed} ms)</span>
                        </div>
                        <div class="smp-footer-actions">
                            <button class="smp-action-btn" id="smp-btn-copy-tex">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                <span id="smp-copy-text">Sao Chép TeX</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            root.appendChild(backdrop);
            bindModalEvents(backdrop);
        }

        // Cập nhật nội dung
        const renderView = root.querySelector('#smp-render-view');
        const rawTextarea = root.querySelector('#smp-raw-textarea');
        const statusText = root.querySelector('#smp-status-text');

        if (renderView) {
            renderView.innerText = normalized.cleanLatex;
            // Render trực tiếp qua KaTeX
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(renderView, {
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

        if (rawTextarea) {
            rawTextarea.value = normalized.cleanLatex;
        }

        if (statusText) {
            statusText.textContent = `KaTeX Render: ${normalized.mathCount} công thức (${elapsed} ms)`;
        }

        // Đưa về tab Render mặc định
        switchTab(root, 'render');

        // Hiển thị modal
        requestAnimationFrame(() => {
            backdrop.classList.add('active');
        });
    }

    /**
     * Chuyển tab Render / Mã Raw
     */
    function switchTab(root, tab) {
        const btnRender = root.querySelector('#smp-btn-tab-render');
        const btnRaw = root.querySelector('#smp-btn-tab-raw');
        const renderView = root.querySelector('#smp-render-view');
        const rawView = root.querySelector('#smp-raw-view');

        if (tab === 'render') {
            btnRender.classList.add('active');
            btnRaw.classList.remove('active');
            renderView.style.display = 'block';
            rawView.style.display = 'none';
        } else {
            btnRaw.classList.add('active');
            btnRender.classList.remove('active');
            rawView.style.display = 'block';
            renderView.style.display = 'none';
        }
    }

    /**
     * Gắn các sự kiện (kéo thả, đóng, copy, phím Esc)
     */
    function bindModalEvents(backdrop) {
        const dialog = backdrop.querySelector('#smp-dialog');
        const dragHeader = backdrop.querySelector('#smp-drag-header');
        const btnClose = backdrop.querySelector('#smp-btn-close');
        const btnTabRender = backdrop.querySelector('#smp-btn-tab-render');
        const btnTabRaw = backdrop.querySelector('#smp-btn-tab-raw');
        const btnCopy = backdrop.querySelector('#smp-btn-copy-tex');
        const copyText = backdrop.querySelector('#smp-copy-text');
        const rawTextarea = backdrop.querySelector('#smp-raw-textarea');

        // Đóng modal
        function closeModal() {
            backdrop.classList.remove('active');
        }

        btnClose.addEventListener('click', closeModal);

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // Chuyển tab
        btnTabRender.addEventListener('click', () => switchTab(backdrop, 'render'));
        btnTabRaw.addEventListener('click', () => switchTab(backdrop, 'raw'));

        // Sao chép LaTeX sạch
        btnCopy.addEventListener('click', () => {
            const textToCopy = rawTextarea.value;
            navigator.clipboard.writeText(textToCopy).then(() => {
                btnCopy.classList.add('copied');
                copyText.textContent = '✓ Đã chép!';
                setTimeout(() => {
                    btnCopy.classList.remove('copied');
                    copyText.textContent = 'Sao Chép TeX';
                }, 2000);
            }).catch(err => {
                console.error('[SMP] Không thể sao chép:', err);
            });
        });

        // Kéo thả di chuyển hộp thoại
        dragHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('.smp-header-actions')) return; // Bỏ qua nếu bấm vào nút
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
            const text = request.text || window.getSelection().toString();
            showTranslateModal(text);
            sendResponse({ success: true });
        } else if (request.action === 'SMP_TRANSLATE_HOTKEY') {
            const selectedText = window.getSelection().toString();
            if (selectedText && selectedText.trim()) {
                showTranslateModal(selectedText);
                sendResponse({ success: true });
            } else {
                alert('Vui lòng bôi đen văn bản hoặc công thức toán trước khi bấm Alt+Shift+X!');
            }
        }
    });

    console.log('[SMP] LaTeX Quick Viewer Content Script đã tải xong.');
})();
