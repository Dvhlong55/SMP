/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer & Composer — Content Script (Shadow DOM Sandbox UI)
 * ==============================================================================
 * Tích hợp hệ thống LaTeX từ SMP LaTeX Editor:
 * - 8 nhóm ký hiệu & snippet đầy đủ từ SMP LaTeX Editor (render ký hiệu trực quan)
 * - Gợi ý tự động (Autocomplete Hint) khi gõ dấu \ với phím mũi tên & Enter
 * - Hai chế độ Sáng / Tối (Light Mode & Dark Mode) chuyển đổi 1-click
 * - Soạn thảo song song realtime (Live Preview) kèm đếm ký tự, từ, dòng
 * - Xuất và chép ảnh công thức PNG độ nét cao vào Clipboard (Ctrl + V dán vào FB)
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
    let activeHintIndex = 0;
    let filteredHints = [];
    let currentEditorTarget = null; // Textarea đang nhận autocomplete

    // Danh sách gợi ý lệnh quen thuộc chuẩn SMP LaTeX Editor
    const LATEX_SNIPPETS = [
        { text: "\\frac{}{}", displayText: "\\frac{}{} — Phân số", offset: 3 },
        { text: "\\sqrt{}", displayText: "\\sqrt{} — Căn bậc hai", offset: 1 },
        { text: "\\sqrt[]{}", displayText: "\\sqrt[]{} — Căn bậc n", offset: 3 },
        { text: "^{}", displayText: "^{} — Số mũ", offset: 1 },
        { text: "_{}", displayText: "_{} — Chỉ số dưới", offset: 1 },
        { text: "\\sum_{i=1}^{n}", displayText: "\\sum — Tổng sigma", offset: 0 },
        { text: "\\prod_{i=1}^{n}", displayText: "\\prod — Tích", offset: 0 },
        { text: "\\int_{a}^{b}", displayText: "\\int — Tích phân", offset: 0 },
        { text: "\\lim_{x \\to \\infty}", displayText: "\\lim — Giới hạn", offset: 0 },
        { text: "\\infty", displayText: "\\infty — Vô cực", offset: 0 },
        { text: "\\le", displayText: "\\le — Nhỏ hơn hoặc bằng (<=)", offset: 0 },
        { text: "\\ge", displayText: "\\ge — Lớn hơn hoặc bằng (>=)", offset: 0 },
        { text: "\\neq", displayText: "\\neq — Khác (!=)", offset: 0 },
        { text: "\\equiv", displayText: "\\equiv — Đồng dư", offset: 0 },
        { text: "\\pmod{}", displayText: "\\pmod{} — Modulo", offset: 1 },
        { text: "\\mid", displayText: "\\mid — Chia hết cho", offset: 0 },
        { text: "\\nmid", displayText: "\\nmid — Không chia hết cho", offset: 0 },
        { text: "\\Rightarrow", displayText: "\\Rightarrow — Suy ra (=>)", offset: 0 },
        { text: "\\Leftrightarrow", displayText: "\\Leftrightarrow — Tương đương (<=>)", offset: 0 },
        { text: "\\forall", displayText: "\\forall — Với mọi", offset: 0 },
        { text: "\\exists", displayText: "\\exists — Tồn tại", offset: 0 },
        { text: "\\in", displayText: "\\in — Thuộc tập hợp", offset: 0 },
        { text: "\\notin", displayText: "\\notin — Không thuộc", offset: 0 },
        { text: "\\subset", displayText: "\\subset — Tập con", offset: 0 },
        { text: "\\cup", displayText: "\\cup — Phép hợp", offset: 0 },
        { text: "\\cap", displayText: "\\cap — Phép giao", offset: 0 },
        { text: "\\emptyset", displayText: "\\emptyset — Tập rỗng", offset: 0 },
        { text: "\\mathbb{R}", displayText: "\\mathbb{R} — Tập số thực R", offset: 0 },
        { text: "\\mathbb{N}", displayText: "\\mathbb{N} — Tập số tự nhiên N", offset: 0 },
        { text: "\\mathbb{Z}", displayText: "\\mathbb{Z} — Tập số nguyên Z", offset: 0 },
        { text: "\\mathbb{Q}", displayText: "\\mathbb{Q} — Tập số hữu tỉ Q", offset: 0 },
        { text: "\\mathbb{C}", displayText: "\\mathbb{C} — Tập số phức C", offset: 0 },
        { text: "\\alpha", displayText: "\\alpha — Alpha", offset: 0 },
        { text: "\\beta", displayText: "\\beta — Beta", offset: 0 },
        { text: "\\gamma", displayText: "\\gamma — Gamma", offset: 0 },
        { text: "\\delta", displayText: "\\delta — Delta", offset: 0 },
        { text: "\\Delta", displayText: "\\Delta — Delta hoa", offset: 0 },
        { text: "\\pi", displayText: "\\pi — Pi", offset: 0 },
        { text: "\\varphi", displayText: "\\varphi — Phi", offset: 0 },
        { text: "\\sigma", displayText: "\\sigma — Sigma", offset: 0 },
        { text: "\\omega", displayText: "\\omega — Omega", offset: 0 },
        { text: "\\Omega", displayText: "\\Omega — Omega hoa", offset: 0 },
        { text: "\\vec{}", displayText: "\\vec{} — Vectơ", offset: 1 },
        { text: "\\overline{}", displayText: "\\overline{} — Đoạn thẳng", offset: 1 },
        { text: "\\binom{n}{k}", displayText: "\\binom{n}{k} — Hệ số nhị thức / Tổ hợp", offset: 0 },
        { text: "\\gcd(,)", displayText: "\\gcd(,) — Ước chung lớn nhất", offset: 2 },
        { text: "\\lfloor \\rfloor", displayText: "\\lfloor \\rfloor — Phần nguyên dưới", offset: 8 },
        { text: "\\lceil \\rceil", displayText: "\\lceil \\rceil — Phần nguyên trên", offset: 7 },
        { text: "\\begin{cases}\n  & \\\\\n  &\n\\end{cases}", displayText: "\\begin{cases} — Hệ phương trình", offset: 22 },
        { text: "\\begin{pmatrix}\n  & \\\\\n  &\n\\end{pmatrix}", displayText: "\\begin{pmatrix} — Ma trận ngoặc tròn", offset: 19 },
        { text: "\\begin{align*}\n  \n\\end{align*}", displayText: "\\begin{align*} — Căn lề nhiều dòng", offset: 13 },
        { text: "\\textbf{}", displayText: "\\textbf{} — Chữ in đậm", offset: 1 },
        { text: "\\textit{}", displayText: "\\textit{} — Chữ in nghiêng", offset: 1 },
        { text: "\\textbf{Bài toán.} ", displayText: "Bài toán. — Đề mục bài toán", offset: 0 },
        { text: "\\textbf{Lời giải.} ", displayText: "Lời giải. — Đề mục lời giải", offset: 0 },
        { text: "\\textbf{Bổ đề.} ", displayText: "Bổ đề. — Đề mục bổ đề", offset: 0 },
        { text: "\\textbf{Định lý.} ", displayText: "Định lý. — Đề mục định lý", offset: 0 }
    ];

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
            modalHost.style.zIndex = '2147483647';
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
     * CSS đóng gói bên trong Shadow DOM (Bao gồm chế độ Sáng và Tối)
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
                background: rgba(0, 0, 0, 0.48);
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

            /* --- CHẾ ĐỘ TỐI (MẶC ĐỊNH) --- */
            .smp-dialog {
                position: absolute;
                width: 860px;
                max-width: 96vw;
                max-height: 90vh;
                background: #0f1416;
                color: #e2e8f0;
                border-radius: 12px;
                border: 1px solid rgba(92, 225, 230, 0.25);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 24px rgba(92, 225, 230, 0.12);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.96) translateY(8px);
                transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease, background 0.25s, color 0.25s;
            }
            .smp-backdrop.active .smp-dialog {
                transform: scale(1) translateY(0);
            }
            .smp-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                background: #161d20;
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
                border: 1px solid rgba(255, 255, 255, 0.12);
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
            .smp-icon-btn {
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #94a3b8;
                font-size: 13px;
                padding: 4px 8px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.15s ease;
            }
            .smp-icon-btn:hover {
                background: rgba(255, 255, 255, 0.08);
                color: #f8fafc;
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
                padding: 12px 16px;
                overflow-y: auto;
                max-height: calc(90vh - 110px);
                background: #0b1012;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .smp-body::-webkit-scrollbar {
                width: 6px;
                height: 6px;
            }
            .smp-body::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 3px;
            }

            /* --- THANH NHÓM KÝ HIỆU TOÁN CHUẨN SMP LATEX EDITOR --- */
            .smp-snippet-toolbar {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 8px 12px;
                background: #141b1e;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                max-height: 145px;
                overflow-y: auto;
            }
            .smp-snip-row {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
            }
            .smp-snip-label {
                font-size: 10px;
                font-family: 'JetBrains Mono', monospace;
                letter-spacing: 0.8px;
                text-transform: uppercase;
                color: #5ce1e6;
                opacity: 0.85;
                min-width: 90px;
                margin-right: 4px;
            }
            .smp-snip-btns {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                flex: 1;
            }
            .smp-snip-btn {
                background: rgba(92, 225, 230, 0.08);
                border: 1px solid rgba(92, 225, 230, 0.18);
                color: #e2e8f0;
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.15s ease;
                white-space: nowrap;
                font-family: "Times New Roman", serif;
                line-height: 1.2;
            }
            .smp-snip-btn:hover {
                background: rgba(92, 225, 230, 0.22);
                border-color: #5ce1e6;
                color: #5ce1e6;
                transform: translateY(-1px);
            }
            .smp-snip-btn .katex {
                font-size: 0.95em;
            }

            /* --- GIAO DIỆN SOẠN THẢO SONG SONG (2 CỘT) --- */
            .smp-workspace {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                min-height: 240px;
                position: relative;
            }
            @media (max-width: 720px) {
                .smp-workspace { grid-template-columns: 1fr; }
            }
            .smp-pane {
                display: flex;
                flex-direction: column;
                min-width: 0;
                position: relative;
            }
            .smp-pane-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 10px;
                background: #141c20;
                border: 1px solid rgba(92, 225, 230, 0.15);
                border-bottom: none;
                border-radius: 8px 8px 0 0;
            }
            .smp-pane-title {
                font-family: 'JetBrains Mono', monospace;
                font-size: 10px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: #5ce1e6;
            }
            .smp-pane-meta {
                font-size: 10px;
                color: #64748b;
                font-family: 'JetBrains Mono', monospace;
            }
            .smp-editor-box {
                position: relative;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .smp-textarea {
                width: 100%;
                flex: 1;
                min-height: 220px;
                background: #070a0b;
                border: 1px solid rgba(92, 225, 230, 0.15);
                border-radius: 0 0 8px 8px;
                color: #a5f3fc;
                font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
                font-size: 13px;
                padding: 10px;
                outline: none;
                resize: vertical;
                box-sizing: border-box;
                line-height: 1.6;
            }
            .smp-textarea:focus {
                border-color: #5ce1e6;
            }
            .smp-preview-box {
                width: 100%;
                flex: 1;
                min-height: 220px;
                max-height: 420px;
                overflow-y: auto;
                background: #070a0b;
                border: 1px solid rgba(92, 225, 230, 0.15);
                border-radius: 0 0 8px 8px;
                padding: 14px 16px;
                color: #f1f5f9;
                font-family: "Times New Roman", Times, serif;
                font-size: 16px;
                line-height: 2.1;
                letter-spacing: 0.025em;
                word-spacing: 0.05em;
                white-space: pre-wrap;
                word-break: break-word;
            }

            /* --- GỢI Ý TỰ ĐỘNG (AUTOCOMPLETE POPUP) --- */
            .smp-autocomplete-popup {
                position: absolute;
                top: 40px;
                left: 10px;
                max-width: 380px;
                max-height: 200px;
                overflow-y: auto;
                background: #141c20;
                border: 1px solid #5ce1e6;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
                border-radius: 6px;
                z-index: 50;
                display: none;
            }
            .smp-autocomplete-popup.show {
                display: block;
            }
            .smp-hint-item {
                padding: 6px 10px;
                font-size: 12px;
                font-family: 'JetBrains Mono', monospace;
                color: #cbd5e1;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .smp-hint-item:hover, .smp-hint-item.active {
                background: rgba(92, 225, 230, 0.2);
                color: #5ce1e6;
            }
            .smp-hint-badge {
                font-size: 10px;
                opacity: 0.7;
                margin-left: 8px;
            }

            /* --- TAB BIÊN DỊCH & MÃ NGUỒN --- */
            .smp-translate-view {
                font-family: "Times New Roman", Times, serif;
                color: #f1f5f9;
                font-size: 16px;
                line-height: 2.1;
                letter-spacing: 0.025em;
                word-spacing: 0.05em;
                white-space: pre-wrap;
                word-break: break-word;
                min-height: 180px;
                padding: 10px;
            }
            .smp-raw-textarea {
                width: 100%;
                min-height: 220px;
                background: #070a0b;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 8px;
                color: #a5f3fc;
                font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
                font-size: 13px;
                padding: 12px;
                outline: none;
                resize: vertical;
                box-sizing: border-box;
                line-height: 1.6;
            }
            .smp-raw-textarea:focus {
                border-color: #5ce1e6;
            }

            /* --- ĐỊNH DẠNG KATEX --- */
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

            /* --- CHÂN TRANG (FOOTER ACTIONS) --- */
            .smp-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                background: #141a1c;
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

            /* --- TOAST THÔNG BÁO --- */
            .smp-toast {
                position: absolute;
                bottom: 50px;
                left: 50%;
                transform: translateX(-50%) translateY(10px);
                background: rgba(15, 23, 42, 0.96);
                border: 1px solid rgba(92, 225, 230, 0.5);
                color: #5ce1e6;
                padding: 8px 18px;
                border-radius: 8px;
                font-size: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.6);
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

            /* ==============================================================
             * CHẾ ĐỘ SÁNG (LIGHT MODE)
             * ============================================================== */
            .smp-dialog.light-theme {
                background: #ffffff;
                color: #1e293b;
                border-color: rgba(0, 0, 0, 0.15);
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18), 0 0 20px rgba(0, 158, 179, 0.1);
            }
            .smp-dialog.light-theme .smp-header {
                background: #f8fafc;
                border-bottom-color: #e2e8f0;
            }
            .smp-dialog.light-theme .smp-badge {
                background: rgba(0, 158, 179, 0.1);
                color: #009eb3;
                border-color: rgba(0, 158, 179, 0.3);
            }
            .smp-dialog.light-theme .smp-title {
                color: #0f172a;
            }
            .smp-dialog.light-theme .smp-tab-btn {
                border-color: #cbd5e1;
                color: #64748b;
            }
            .smp-dialog.light-theme .smp-tab-btn.active {
                background: rgba(0, 158, 179, 0.12);
                border-color: #009eb3;
                color: #009eb3;
            }
            .smp-dialog.light-theme .smp-tab-btn:hover:not(.active) {
                background: #f1f5f9;
                color: #0f172a;
            }
            .smp-dialog.light-theme .smp-icon-btn {
                border-color: #cbd5e1;
                color: #475569;
            }
            .smp-dialog.light-theme .smp-icon-btn:hover {
                background: #f1f5f9;
                color: #0f172a;
            }
            .smp-dialog.light-theme .smp-body {
                background: #f8fafc;
            }
            .smp-dialog.light-theme .smp-snippet-toolbar {
                background: #ffffff;
                border-color: #e2e8f0;
            }
            .smp-dialog.light-theme .smp-snip-label {
                color: #009eb3;
            }
            .smp-dialog.light-theme .smp-snip-btn {
                background: #f1f5f9;
                border-color: #e2e8f0;
                color: #334155;
            }
            .smp-dialog.light-theme .smp-snip-btn:hover {
                background: rgba(0, 158, 179, 0.15);
                border-color: #009eb3;
                color: #009eb3;
            }
            .smp-dialog.light-theme .smp-pane-header {
                background: #f1f5f9;
                border-color: #cbd5e1;
            }
            .smp-dialog.light-theme .smp-pane-title {
                color: #009eb3;
            }
            .smp-dialog.light-theme .smp-textarea {
                background: #ffffff;
                border-color: #cbd5e1;
                color: #0f172a;
            }
            .smp-dialog.light-theme .smp-textarea:focus {
                border-color: #009eb3;
            }
            .smp-dialog.light-theme .smp-preview-box {
                background: #ffffff;
                border-color: #cbd5e1;
                color: #1e293b;
            }
            .smp-dialog.light-theme .smp-translate-view {
                color: #1e293b;
            }
            .smp-dialog.light-theme .smp-raw-textarea {
                background: #ffffff;
                border-color: #cbd5e1;
                color: #0f172a;
            }
            .smp-dialog.light-theme .smp-raw-textarea:focus {
                border-color: #009eb3;
            }
            .smp-dialog.light-theme .smp-autocomplete-popup {
                background: #ffffff;
                border-color: #009eb3;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            }
            .smp-dialog.light-theme .smp-hint-item {
                color: #334155;
                border-bottom-color: #f1f5f9;
            }
            .smp-dialog.light-theme .smp-hint-item:hover,
            .smp-dialog.light-theme .smp-hint-item.active {
                background: rgba(0, 158, 179, 0.12);
                color: #009eb3;
            }
            .smp-dialog.light-theme .smp-footer {
                background: #f8fafc;
                border-top-color: #e2e8f0;
            }
            .smp-dialog.light-theme .smp-action-btn {
                background: rgba(0, 158, 179, 0.09);
                border-color: rgba(0, 158, 179, 0.3);
                color: #009eb3;
            }
            .smp-dialog.light-theme .smp-action-btn:hover {
                background: rgba(0, 158, 179, 0.2);
            }
            .smp-dialog.light-theme .smp-action-btn.btn-primary {
                background: #009eb3;
                border-color: #008799;
                color: #ffffff;
            }
            .smp-dialog.light-theme .smp-toast {
                background: #0f172a;
                color: #38bdf8;
                border-color: #38bdf8;
            }
        `;
    }

    /**
     * Tạo markup hộp thoại hoàn chỉnh
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
                            <span class="smp-title" id="smp-modal-title">Trình Soạn Thảo & Biên Dịch</span>
                        </div>
                        <div class="smp-header-actions">
                            <button class="smp-tab-btn" id="smp-btn-tab-compose">Soạn Thảo</button>
                            <button class="smp-tab-btn" id="smp-btn-tab-translate">Biên Dịch</button>
                            <button class="smp-tab-btn" id="smp-btn-tab-raw">Mã Công Thức</button>
                            <button class="smp-icon-btn" id="smp-btn-theme-toggle" title="Chuyển chế độ Sáng / Tối">🌙</button>
                            <button class="smp-close-btn" id="smp-btn-close" title="Đóng (Esc)">✕</button>
                        </div>
                    </div>

                    <div class="smp-body">
                        <!-- 1. GIAO DIỆN SOẠN THẢO SONG SONG VỚI BỘ KÝ HIỆU CHUẨN SMP -->
                        <div id="smp-panel-compose" style="display: flex; flex-direction: column; gap: 8px;">
                            <!-- Thanh Ký Hiệu Đầy Đủ 8 Nhóm Từ SMP LaTeX Editor -->
                            <div class="smp-snippet-toolbar" id="smp-snippet-toolbar">
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Phân số & Căn</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\frac{a}{b}">$\\frac{a}{b}$</button>
                                        <button class="smp-snip-btn" data-snip="\\sqrt{x}">$\\sqrt{x}$</button>
                                        <button class="smp-snip-btn" data-snip="\\sqrt[n]{x}">$\\sqrt[n]{x}$</button>
                                        <button class="smp-snip-btn" data-snip="^{n}">$x^{n}$</button>
                                        <button class="smp-snip-btn" data-snip="_{n}">$x_{n}$</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Tổng & Tích phân</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\sum_{i=1}^{n}">$\\sum_{i=1}^{n}$</button>
                                        <button class="smp-snip-btn" data-snip="\\prod_{i=1}^{n}">$\\prod_{i=1}^{n}$</button>
                                        <button class="smp-snip-btn" data-snip="\\int_{a}^{b}">$\\int_{a}^{b}$</button>
                                        <button class="smp-snip-btn" data-snip="\\lim_{x \\to \\infty}">lim</button>
                                        <button class="smp-snip-btn" data-snip="\\infty">$\\infty$</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">BĐT & Logic</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\le">$\\le$</button>
                                        <button class="smp-snip-btn" data-snip="\\ge">$\\ge$</button>
                                        <button class="smp-snip-btn" data-snip="\\neq">$\\neq$</button>
                                        <button class="smp-snip-btn" data-snip="\\equiv">$\\equiv$</button>
                                        <button class="smp-snip-btn" data-snip="\\pmod{m}">$\\pmod{m}$</button>
                                        <button class="smp-snip-btn" data-snip="\\forall">$\\forall$</button>
                                        <button class="smp-snip-btn" data-snip="\\exists">$\\exists$</button>
                                        <button class="smp-snip-btn" data-snip="\\mid">$\\mid$</button>
                                        <button class="smp-snip-btn" data-snip="\\nmid">$\\nmid$</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Tập hợp</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\mathbb{N}">$\\mathbb{N}$</button>
                                        <button class="smp-snip-btn" data-snip="\\mathbb{Z}">$\\mathbb{Z}$</button>
                                        <button class="smp-snip-btn" data-snip="\\mathbb{Q}">$\\mathbb{Q}$</button>
                                        <button class="smp-snip-btn" data-snip="\\mathbb{R}">$\\mathbb{R}$</button>
                                        <button class="smp-snip-btn" data-snip="\\mathbb{C}">$\\mathbb{C}$</button>
                                        <button class="smp-snip-btn" data-snip="\\in">$\\in$</button>
                                        <button class="smp-snip-btn" data-snip="\\notin">$\\notin$</button>
                                        <button class="smp-snip-btn" data-snip="\\subset">$\\subset$</button>
                                        <button class="smp-snip-btn" data-snip="\\cup">$\\cup$</button>
                                        <button class="smp-snip-btn" data-snip="\\cap">$\\cap$</button>
                                        <button class="smp-snip-btn" data-snip="\\emptyset">$\\emptyset$</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Chữ Hy Lạp</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\alpha">$\\alpha$</button>
                                        <button class="smp-snip-btn" data-snip="\\beta">$\\beta$</button>
                                        <button class="smp-snip-btn" data-snip="\\gamma">$\\gamma$</button>
                                        <button class="smp-snip-btn" data-snip="\\delta">$\\delta$</button>
                                        <button class="smp-snip-btn" data-snip="\\varphi">$\\varphi$</button>
                                        <button class="smp-snip-btn" data-snip="\\pi">$\\pi$</button>
                                        <button class="smp-snip-btn" data-snip="\\theta">$\\theta$</button>
                                        <button class="smp-snip-btn" data-snip="\\lambda">$\\lambda$</button>
                                        <button class="smp-snip-btn" data-snip="\\mu">$\\mu$</button>
                                        <button class="smp-snip-btn" data-snip="\\sigma">$\\sigma$</button>
                                        <button class="smp-snip-btn" data-snip="\\omega">$\\omega$</button>
                                        <button class="smp-snip-btn" data-snip="\\Omega">$\\Omega$</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Môi trường</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\begin{align*}\n  \n\\end{align*}">align</button>
                                        <button class="smp-snip-btn" data-snip="\\begin{cases}\n  & \\\\\n  &\n\\end{cases}">cases</button>
                                        <button class="smp-snip-btn" data-snip="\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}">matrix</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Cấu trúc</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\left( \\right)">( )</button>
                                        <button class="smp-snip-btn" data-snip="\\left[ \\right]">[ ]</button>
                                        <button class="smp-snip-btn" data-snip="\\overline{AB}">$\\overline{AB}$</button>
                                        <button class="smp-snip-btn" data-snip="\\vec{v}">$\\vec{v}$</button>
                                        <button class="smp-snip-btn" data-snip="\\binom{n}{k}">$\\binom{n}{k}$</button>
                                        <button class="smp-snip-btn" data-snip="\\gcd(a,b)">gcd</button>
                                        <button class="smp-snip-btn" data-snip="\\lfloor x \\rfloor">$\\lfloor x \\rfloor$</button>
                                        <button class="smp-snip-btn" data-snip="\\lceil x \\rceil">$\\lceil x \\rceil$</button>
                                    </div>
                                </div>
                                <div class="smp-snip-row">
                                    <span class="smp-snip-label">Định dạng</span>
                                    <div class="smp-snip-btns">
                                        <button class="smp-snip-btn" data-snip="\\Rightarrow">$\\Rightarrow$</button>
                                        <button class="smp-snip-btn" data-snip="\\Leftarrow">$\\Leftarrow$</button>
                                        <button class="smp-snip-btn" data-snip="\\textbf{}"><b>B</b></button>
                                        <button class="smp-snip-btn" data-snip="\\textit{}"><i>I</i></button>
                                        <button class="smp-snip-btn" data-snip="\\textbf{Bài toán.} ">Bài Toán</button>
                                        <button class="smp-snip-btn" data-snip="\\textbf{Lời giải.} ">Lời Giải</button>
                                        <button class="smp-snip-btn" data-snip="\\textbf{Bổ đề.} ">Bổ Đề</button>
                                        <button class="smp-snip-btn" data-snip="\\textbf{Định lý.} ">Định Lý</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Workspace 2 Cột: Input bên trái & Preview bên phải -->
                            <div class="smp-workspace">
                                <div class="smp-pane">
                                    <div class="smp-pane-header">
                                        <span class="smp-pane-title">Soạn Thảo (Gõ \ để gợi ý lệnh)</span>
                                        <span class="smp-pane-meta" id="smp-char-meta">0 ký tự | 0 từ | 0 dòng</span>
                                    </div>
                                    <div class="smp-editor-box">
                                        <textarea class="smp-textarea" id="smp-compose-input" spellcheck="false" placeholder="Gõ công thức tại đây (ví dụ: gõ \\fr rồi ấn Enter ra phân số)...&#10;&#10;Theo BĐT AM-GM ta có:&#10;$$ \\frac{a}{b+c} + \\frac{b}{c+a} + \\frac{c}{a+b} \\ge \\frac{3}{2} $$"></textarea>
                                        <!-- Danh sách popup gợi ý lệnh tự động -->
                                        <div class="smp-autocomplete-popup" id="smp-autocomplete-popup"></div>
                                    </div>
                                </div>
                                <div class="smp-pane">
                                    <div class="smp-pane-header">
                                        <span class="smp-pane-title">Xem Trước Trực Tiếp</span>
                                    </div>
                                    <div class="smp-preview-box" id="smp-compose-preview"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. GIAO DIỆN BIÊN DỊCH VĂN BẢN TỪ BÌNH LUẬN BÔI ĐEN -->
                        <div id="smp-panel-translate" style="display: none;">
                            <div class="smp-translate-view" id="smp-translate-view"></div>
                        </div>

                        <!-- 3. GIAO DIỆN MÃ CÔNG THỨC -->
                        <div id="smp-panel-raw" style="display: none;">
                            <div class="smp-editor-box">
                                <textarea class="smp-raw-textarea" id="smp-raw-textarea" spellcheck="false" placeholder="Nhập hoặc chỉnh sửa mã công thức tại đây (hỗ trợ gợi ý khi gõ \\)..."></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="smp-footer">
                        <div class="smp-footer-left">
                            <span class="smp-status-dot"></span>
                            <span id="smp-status-text">Thời gian thực</span>
                        </div>
                        <div class="smp-footer-actions">
                            <button class="smp-action-btn btn-primary" id="smp-btn-insert" title="Chèn trực tiếp vào ô bình luận đang chọn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                                <span>Chèn Vào Bình Luận</span>
                            </button>
                            <button class="smp-action-btn" id="smp-btn-copy-image" title="Chép ảnh công thức nét cao vào Clipboard (nhấn Ctrl+V để dán ảnh vào Facebook)">
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
            initThemePreference(backdrop);
        }
        return backdrop;
    }

    /**
     * Khởi tạo và đồng bộ chế độ Sáng / Tối
     */
    function initThemePreference(backdrop) {
        const dialog = backdrop.querySelector('#smp-dialog');
        const themeBtn = backdrop.querySelector('#smp-btn-theme-toggle');
        const savedTheme = localStorage.getItem('smp_latex_theme') || 'dark';

        if (savedTheme === 'light') {
            dialog.classList.add('light-theme');
            if (themeBtn) themeBtn.textContent = '☀️';
        } else {
            dialog.classList.remove('light-theme');
            if (themeBtn) themeBtn.textContent = '🌙';
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const isLight = dialog.classList.toggle('light-theme');
                themeBtn.textContent = isLight ? '☀️' : '🌙';
                localStorage.setItem('smp_latex_theme', isLight ? 'light' : 'dark');
            });
        }
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
     * Render các công thức trên nút thanh công cụ
     */
    function renderToolbarMath(backdrop) {
        const toolbar = backdrop.querySelector('#smp-snippet-toolbar');
        if (toolbar && !toolbar._mathRendered) {
            toolbar._mathRendered = true;
            if (typeof renderMathInElement === 'function') {
                renderMathInElement(toolbar, {
                    delimiters: [
                        { left: '$', right: '$', display: false }
                    ],
                    throwOnError: false
                });
            }
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

        [btnCompose, btnTranslate, btnRaw].forEach(btn => btn && btn.classList.remove('active'));
        [panelCompose, panelTranslate, panelRaw].forEach(p => p && (p.style.display = 'none'));

        if (tab === 'compose') {
            btnCompose.classList.add('active');
            panelCompose.style.display = 'flex';
            if (composeInput && composePreview) {
                renderLatexContent(composePreview, composeInput.value);
                composeInput.focus();
            }
            renderToolbarMath(root);
        } else if (tab === 'translate') {
            btnTranslate.classList.add('active');
            panelTranslate.style.display = 'block';
            if (rawTextarea && translateView) {
                renderLatexContent(translateView, rawTextarea.value);
            }
        } else {
            btnRaw.classList.add('active');
            panelRaw.style.display = 'block';
            if (rawTextarea) {
                if (composeInput && composeInput.value.trim() && !rawTextarea.value.trim()) {
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
     * Mở hộp thoại ở chế độ Soạn Thảo (chuột phải ô cmt hoặc phím tắt)
     */
    function showComposerModal() {
        const root = ensureModalHost();
        const backdrop = createModalDom();

        const composeInput = root.querySelector('#smp-compose-input');
        const composePreview = root.querySelector('#smp-compose-preview');

        // Khôi phục nháp đã lưu
        if (composeInput && !composeInput.value) {
            const savedDraft = localStorage.getItem('smp_composer_draft');
            if (savedDraft) {
                composeInput.value = savedDraft;
            }
        }

        if (composeInput && composePreview) {
            renderLatexContent(composePreview, composeInput.value);
            updateMetaCounts(backdrop, composeInput.value);
        }

        switchTab(root, 'compose');

        requestAnimationFrame(() => {
            backdrop.classList.add('active');
            if (composeInput) composeInput.focus();
            renderToolbarMath(backdrop);
        });
    }

    /**
     * Cập nhật số ký tự, từ, dòng chuẩn SMP LaTeX Editor
     */
    function updateMetaCounts(backdrop, text) {
        const charMeta = backdrop.querySelector('#smp-char-meta');
        if (!charMeta) return;
        const val = text || '';
        const words = val.trim().split(/\s+/).filter(x => x.length > 0).length;
        const lines = val.length === 0 ? 0 : val.split('\n').length;
        charMeta.textContent = `${val.length} ký tự | ${words} từ | ${lines} dòng`;
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

        if (snipText.includes('{a}') || snipText.includes('{x}')) {
            if (sel) {
                insertVal = snipText.replace('{a}', `{${sel}}`).replace('{x}', `{${sel}}`);
            }
        } else if (snipText === '^{n}' && sel) {
            insertVal = `^{${sel}}`;
        } else if (snipText === '_{n}' && sel) {
            insertVal = `_{${sel}}`;
        } else if (sel) {
            insertVal = snipText + sel;
        }

        const before = textarea.value.substring(0, start);
        const after = textarea.value.substring(end);
        textarea.value = before + insertVal + after;
        textarea.selectionStart = textarea.selectionEnd = start + cursorOffset;

        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Quản lý Autocomplete Hint khi gõ \
     */
    function handleAutocompleteInput(textarea, popupEl) {
        currentEditorTarget = textarea;
        const cur = textarea.selectionStart;
        const textBefore = textarea.value.slice(0, cur);
        const match = textBefore.match(/\\[a-zA-Z]*$/);

        if (!match) {
            popupEl.classList.remove('show');
            filteredHints = [];
            return;
        }

        const query = match[0];
        filteredHints = LATEX_SNIPPETS.filter(item => item.text.startsWith(query));

        if (filteredHints.length === 0) {
            popupEl.classList.remove('show');
            return;
        }

        activeHintIndex = 0;
        renderHintList(popupEl);
        popupEl.classList.add('show');
    }

    function renderHintList(popupEl) {
        popupEl.innerHTML = '';
        filteredHints.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = `smp-hint-item ${index === activeHintIndex ? 'active' : ''}`;
            div.innerHTML = `
                <span>${item.displayText}</span>
                <span class="smp-hint-badge">Enter ↵</span>
            `;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                applyHint(item);
            });
            popupEl.appendChild(div);
        });
    }

    function applyHint(item) {
        if (!currentEditorTarget) return;
        const cur = currentEditorTarget.selectionStart;
        const textBefore = currentEditorTarget.value.slice(0, cur);
        const match = textBefore.match(/\\[a-zA-Z]*$/);
        if (!match) return;

        const start = cur - match[0].length;
        const after = currentEditorTarget.value.slice(cur);
        const before = currentEditorTarget.value.slice(0, start);

        currentEditorTarget.value = before + item.text + after;
        const newCur = start + item.text.length - (item.offset || 0);
        currentEditorTarget.selectionStart = currentEditorTarget.selectionEnd = newCur;

        const popupEl = shadowRoot.querySelector('#smp-autocomplete-popup');
        if (popupEl) popupEl.classList.remove('show');

        currentEditorTarget.dispatchEvent(new Event('input', { bubbles: true }));
        currentEditorTarget.focus();
    }

    /**
     * Xuất và sao chép ảnh công thức vào Clipboard (PNG độ nét cao 2.5x)
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

        showToast(backdrop, 'Đang tạo ảnh công thức sắc nét...');

        try {
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
                scale: 2.5,
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
     * Chèn nội dung vào ô bình luận hoặc ô nhập liệu
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
            navigator.clipboard.writeText(textToInsert).then(() => {
                showToast(backdrop, '✓ Đã sao chép! Hãy nhấp vào ô bình luận và bấm Ctrl + V.');
            });
        }
    }

    /**
     * Gắn các sự kiện (kéo thả, đóng, copy, gợi ý, phím tắt)
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
        const autocompletePopup = backdrop.querySelector('#smp-autocomplete-popup');

        const btnInsert = backdrop.querySelector('#smp-btn-insert');
        const btnCopyImage = backdrop.querySelector('#smp-btn-copy-image');
        const btnCopyCode = backdrop.querySelector('#smp-btn-copy-code');
        const copyCodeText = backdrop.querySelector('#smp-copy-code-text');
        const toolbar = backdrop.querySelector('#smp-snippet-toolbar');

        function closeModal() {
            backdrop.classList.remove('active');
            if (autocompletePopup) autocompletePopup.classList.remove('show');
        }

        btnClose.addEventListener('click', closeModal);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) closeModal();
        });

        // Chuyển tab
        btnTabCompose.addEventListener('click', () => switchTab(backdrop, 'compose'));
        btnTabTranslate.addEventListener('click', () => switchTab(backdrop, 'translate'));
        btnTabRaw.addEventListener('click', () => switchTab(backdrop, 'raw'));

        // Sự kiện gõ trực tiếp trong ô Soạn Thảo (Live Render realtime & Autocomplete)
        if (composeInput) {
            let composeDebounce = null;
            composeInput.addEventListener('input', () => {
                const val = composeInput.value;
                updateMetaCounts(backdrop, val);

                // Lưu nháp tự động
                localStorage.setItem('smp_composer_draft', val);

                // Kích hoạt gợi ý lệnh nếu vừa gõ \
                handleAutocompleteInput(composeInput, autocompletePopup);

                clearTimeout(composeDebounce);
                composeDebounce = setTimeout(() => {
                    renderLatexContent(composePreview, val);
                }, 35);
            });

            // Xử lý phím mũi tên & Enter cho Autocomplete & Tự đóng ngoặc
            composeInput.addEventListener('keydown', (e) => {
                if (autocompletePopup && autocompletePopup.classList.contains('show') && filteredHints.length > 0) {
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        activeHintIndex = (activeHintIndex + 1) % filteredHints.length;
                        renderHintList(autocompletePopup);
                        return;
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        activeHintIndex = (activeHintIndex - 1 + filteredHints.length) % filteredHints.length;
                        renderHintList(autocompletePopup);
                        return;
                    } else if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        applyHint(filteredHints[activeHintIndex]);
                        return;
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        autocompletePopup.classList.remove('show');
                        return;
                    }
                }

                // Tự động đóng cặp dấu ngoặc chuẩn LaTeX (Chuẩn SMP LaTeX Editor)
                const start = composeInput.selectionStart;
                const end = composeInput.selectionEnd;
                const val = composeInput.value;

                if (e.key === '$') {
                    if (start !== end) {
                        e.preventDefault();
                        const sel = val.substring(start, end);
                        composeInput.setRangeText(`$${sel}$`, start, end, 'select');
                        composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }
                    if (val[start] === '$') {
                        e.preventDefault();
                        composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                        return;
                    }
                    e.preventDefault();
                    composeInput.setRangeText('$$', start, start, 'end');
                    composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                    composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                } else if (e.key === '[' || e.key === '(' || e.key === '{') {
                    const isEscaped = start > 0 && val[start - 1] === '\\';
                    if (isEscaped) {
                        // Gõ \[ -> tự động đóng \], gõ \( -> \), gõ \{ -> \}
                        e.preventDefault();
                        const closePair = e.key === '[' ? '\\]' : (e.key === '(' ? '\\)' : '\\}');
                        if (start !== end) {
                            const sel = val.substring(start, end);
                            composeInput.setRangeText(`${e.key}${sel}${closePair}`, start, end, 'select');
                        } else {
                            composeInput.setRangeText(`${e.key}${closePair}`, start, start, 'end');
                            composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                        }
                        composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }

                    // Ký tự ngoặc thông thường
                    const closePair = e.key === '[' ? ']' : (e.key === '(' ? ')' : '}');
                    if (start !== end) {
                        e.preventDefault();
                        const sel = val.substring(start, end);
                        composeInput.setRangeText(`${e.key}${sel}${closePair}`, start, end, 'select');
                        composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }

                    e.preventDefault();
                    composeInput.setRangeText(`${e.key}${closePair}`, start, start, 'end');
                    composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                    composeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                } else if (e.key === ']' || e.key === ')' || e.key === '}') {
                    // Nếu ký tự ngay sau con trỏ đã là dấu đóng tương ứng, nhảy qua
                    if (start === end && val[start] === e.key) {
                        e.preventDefault();
                        composeInput.selectionStart = composeInput.selectionEnd = start + 1;
                        return;
                    }
                }
            });
        }

        // Sự kiện trên ô Mã Công Thức
        if (rawTextarea) {
            rawTextarea.addEventListener('input', () => {
                handleAutocompleteInput(rawTextarea, autocompletePopup);
            });

            rawTextarea.addEventListener('keydown', (e) => {
                const start = rawTextarea.selectionStart;
                const end = rawTextarea.selectionEnd;
                const val = rawTextarea.value;

                if (e.key === '$') {
                    if (start !== end) {
                        e.preventDefault();
                        const sel = val.substring(start, end);
                        rawTextarea.setRangeText(`$${sel}$`, start, end, 'select');
                        rawTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }
                    if (val[start] === '$') {
                        e.preventDefault();
                        rawTextarea.selectionStart = rawTextarea.selectionEnd = start + 1;
                        return;
                    }
                    e.preventDefault();
                    rawTextarea.setRangeText('$$', start, start, 'end');
                    rawTextarea.selectionStart = rawTextarea.selectionEnd = start + 1;
                    rawTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                } else if (e.key === '[' || e.key === '(' || e.key === '{') {
                    const isEscaped = start > 0 && val[start - 1] === '\\';
                    if (isEscaped) {
                        e.preventDefault();
                        const closePair = e.key === '[' ? '\\]' : (e.key === '(' ? '\\)' : '\\}');
                        if (start !== end) {
                            const sel = val.substring(start, end);
                            rawTextarea.setRangeText(`${e.key}${sel}${closePair}`, start, end, 'select');
                        } else {
                            rawTextarea.setRangeText(`${e.key}${closePair}`, start, start, 'end');
                            rawTextarea.selectionStart = rawTextarea.selectionEnd = start + 1;
                        }
                        rawTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }

                    const closePair = e.key === '[' ? ']' : (e.key === '(' ? ')' : '}');
                    if (start !== end) {
                        e.preventDefault();
                        const sel = val.substring(start, end);
                        rawTextarea.setRangeText(`${e.key}${sel}${closePair}`, start, end, 'select');
                        rawTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        return;
                    }

                    e.preventDefault();
                    rawTextarea.setRangeText(`${e.key}${closePair}`, start, start, 'end');
                    rawTextarea.selectionStart = rawTextarea.selectionEnd = start + 1;
                    rawTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                } else if (e.key === ']' || e.key === ')' || e.key === '}') {
                    if (start === end && val[start] === e.key) {
                        e.preventDefault();
                        rawTextarea.selectionStart = rawTextarea.selectionEnd = start + 1;
                        return;
                    }
                }
            });
        }

        // Click nút công thức trên thanh công cụ
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                const btn = e.target.closest('.smp-snip-btn');
                if (btn && btn.dataset.snip) {
                    insertSnippet(composeInput, btn.dataset.snip);
                }
            });
        }

        // Nút Chèn Vào Bình Luận
        btnInsert.addEventListener('click', () => {
            insertTextIntoCommentBox(backdrop);
        });

        // Nút Chép Ảnh
        btnCopyImage.addEventListener('click', () => {
            copyFormulaImage(backdrop);
        });

        // Nút Sao Chép Mã
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

        // Phím tắt Esc
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

    console.log('[SMP] Trình Soạn Thảo & Biên Dịch đã sẵn sàng.');
})();
