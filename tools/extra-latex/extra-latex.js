/**
 * SMP EXTRA LATEX — Free-form Positioning & WYSIWYG Math Editor
 * Clean Split-View: Left Canvas (3 Modes: Canvas, A4, Beamer) | Right Compiler & Live Render
 */

(function () {
    'use strict';

    // === Global State ===
    const state = {
        blocks: [],
        selectedBlockId: null,
        canvasMode: 'canvas',    // 'canvas' | 'a4' | 'beamer'
        activeExportTab: 'tikz', // 'tikz' | 'flow' | 'math'
        gridType: 'dots',        // 'dots' | 'lines' | 'none'
        snapGrid: 10,            // 0, 10, 20
        history: [],
        historyIndex: -1,
        isDragging: false,
        isResizing: false,
        dragTarget: null,
        dragOffset: { x: 0, y: 0 },
        initialSize: { w: 0, h: 0 },
        savedSelectionRange: null
    };

    // DOM Elements Cache
    let viewport, artboard, bubbleToolbar, latexOutput, liveRenderBox, toastEl, watermarkEl;

    // === Initialization ===
    window.addEventListener('DOMContentLoaded', () => {
        viewport = document.getElementById('canvas-viewport');
        artboard = document.getElementById('artboard');
        bubbleToolbar = document.getElementById('floating-bubble');
        latexOutput = document.getElementById('latex-output');
        liveRenderBox = document.getElementById('live-render-box');
        toastEl = document.getElementById('el-toast');
        watermarkEl = document.getElementById('sheet-watermark');

        initViewportEvents();
        initBubbleToolbar();
        loadSavedState();
        renderAllBlocks();
        saveHistoryState();
        updateLatexCode();

        // Keyboard shortcuts
        document.addEventListener('keydown', handleGlobalKeydown);
    });

    // === Canvas Modes (Bảng vẽ, Giấy A4, Slide Beamer) ===
    window.setCanvasMode = function (mode) {
        state.canvasMode = mode;
        artboard.className = `artboard mode-${mode}`;

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
        });

        if (watermarkEl) {
            if (mode === 'a4') {
                watermarkEl.textContent = 'Khổ Giấy A4 (210 × 297 mm)';
                watermarkEl.style.display = 'block';
            } else if (mode === 'beamer') {
                watermarkEl.textContent = 'Slide Beamer (16:9)';
                watermarkEl.style.display = 'block';
            } else {
                watermarkEl.textContent = 'Bảng Vẽ Tự Do';
                watermarkEl.style.display = 'none';
            }
        }

        saveHistoryState();
        updateLatexCode();
        showToast('Chế độ: ' + (mode === 'a4' ? 'Giấy A4' : (mode === 'beamer' ? 'Slide Beamer' : 'Bảng Vẽ')));
    };

    // === Block Creation & Rendering ===
    window.addBlock = function (type) {
        // Find visible center in artboard
        let spawnX = 60;
        let spawnY = 60;

        if (state.canvasMode === 'a4') {
            spawnX = 80;
            spawnY = Math.max(80, (state.blocks.length * 80) + 60);
            if (spawnY > 1000) spawnY = 80;
        } else if (state.canvasMode === 'beamer') {
            spawnX = 80;
            spawnY = Math.max(60, (state.blocks.length * 75) + 60);
            if (spawnY > 440) spawnY = 60;
        } else {
            spawnX = viewport.scrollLeft + 80;
            spawnY = viewport.scrollTop + 60;
        }

        createBlock(type, spawnX, spawnY);
    };

    function createBlock(type, x = 60, y = 60, content = '') {
        const id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        let defaultW = 280;
        let defaultH = 55;
        let defaultContent = content;

        if (type === 'math') {
            defaultContent = content || 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
            defaultW = 320;
            defaultH = 55;
        } else if (type === 'text') {
            defaultContent = content || 'Gõ văn bản tại đây hoặc bôi đen để định dạng...';
            defaultW = 340;
            defaultH = 55;
        } else if (type === 'box') {
            defaultContent = content || 'Khung ghi chú / Chú thích';
            defaultW = 360;
            defaultH = 120;
        }

        const newBlock = {
            id,
            type,
            x: snap(x),
            y: snap(y),
            w: defaultW,
            h: defaultH,
            content: defaultContent,
            zIndex: state.blocks.length + 1
        };

        state.blocks.push(newBlock);
        renderBlockDOM(newBlock);
        selectBlock(id);
        saveHistoryState();
        updateLatexCode();
        showToast('✓ Đã thêm ' + (type === 'math' ? 'công thức' : (type === 'box' ? 'khung ghi chú' : 'khối văn bản')));
        return newBlock;
    }

    function renderAllBlocks() {
        // Keep watermark if exists
        const wm = document.getElementById('sheet-watermark');
        artboard.innerHTML = '';
        if (wm) artboard.appendChild(wm);

        state.blocks.forEach(block => renderBlockDOM(block));
        checkEmptyHint();
    }

    function renderBlockDOM(block) {
        const div = document.createElement('div');
        div.className = `movable-block ${block.type === 'box' ? 'block-box' : ''}`;
        div.id = block.id;
        div.style.left = block.x + 'px';
        div.style.top = block.y + 'px';
        div.style.width = block.w + 'px';
        div.style.minHeight = block.h + 'px';
        div.style.zIndex = block.zIndex || 1;

        if (state.selectedBlockId === block.id) {
            div.classList.add('selected');
        }

        // Header
        const header = document.createElement('div');
        header.className = 'block-header';
        
        let typeLabel = 'Toán';
        let typeIcon = '∑';
        if (block.type === 'text') { typeLabel = 'Văn bản'; typeIcon = 'T'; }
        if (block.type === 'box') { typeLabel = 'Khung'; typeIcon = '▢'; }

        header.innerHTML = `
            <div class="block-title-tag">
                <span style="opacity:0.6; cursor:grab;">⠿</span>
                <span style="font-weight:600;">${typeIcon}</span> ${typeLabel}
            </div>
            <div class="block-actions">
                <button class="block-action-btn" title="Nhân đôi (Duplicate)" data-action="duplicate">❐</button>
                <button class="block-action-btn" title="Lên trên" data-action="layer-up">▲</button>
                <button class="block-action-btn" title="Xuống dưới" data-action="layer-down">▼</button>
                <button class="block-action-btn del-btn" title="Xóa" data-action="delete">✕</button>
            </div>
        `;

        // Body
        const body = document.createElement('div');
        body.className = 'block-body';

        if (block.type === 'math') {
            const mf = document.createElement('math-field');
            if (typeof mf.setValue === 'function') {
                mf.setValue(block.content);
            } else {
                mf.value = block.content;
            }
            mf.addEventListener('input', () => {
                block.content = mf.value || (typeof mf.getValue === 'function' ? mf.getValue() : '');
                updateLatexCode();
            });
            body.appendChild(mf);
        } else {
            const editor = document.createElement('div');
            editor.className = 'text-editor-area';
            editor.contentEditable = 'true';
            editor.innerHTML = block.content;
            editor.setAttribute('placeholder', 'Nhập văn bản... Gõ $..$ cho công thức');
            editor.addEventListener('input', () => {
                block.content = editor.innerHTML;
                updateLatexCode();
            });
            body.appendChild(editor);
        }

        // Resize Handle
        const resize = document.createElement('div');
        resize.className = 'resize-handle';

        div.appendChild(header);
        div.appendChild(body);
        div.appendChild(resize);

        setupBlockEvents(div, block);
        artboard.appendChild(div);
        checkEmptyHint();
    }

    function setupBlockEvents(el, block) {
        el.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.block-action-btn')) return;
            selectBlock(block.id);
        });

        const actions = el.querySelector('.block-actions');
        actions.addEventListener('click', (e) => {
            const btn = e.target.closest('.block-action-btn');
            if (!btn) return;
            e.stopPropagation();
            const act = btn.getAttribute('data-action');
            if (act === 'delete') {
                deleteBlock(block.id);
            } else if (act === 'duplicate') {
                duplicateBlock(block.id);
            } else if (act === 'layer-up') {
                block.zIndex = (block.zIndex || 1) + 2;
                el.style.zIndex = block.zIndex;
                saveHistoryState();
            } else if (act === 'layer-down') {
                block.zIndex = Math.max(1, (block.zIndex || 1) - 2);
                el.style.zIndex = block.zIndex;
                saveHistoryState();
            }
        });

        const header = el.querySelector('.block-header');
        header.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.block-action-btn')) return;
            e.preventDefault();
            startDragging(e, block, el);
        });

        const resizeHandle = el.querySelector('.resize-handle');
        resizeHandle.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startResizing(e, block, el);
        });
    }

    // === Drag & Resize System ===
    function startDragging(e, block, el) {
        state.isDragging = true;
        state.dragTarget = { block, el };
        state.dragOffset = {
            x: e.clientX - block.x,
            y: e.clientY - block.y
        };
        el.style.cursor = 'grabbing';

        function onPointerMove(moveEvent) {
            if (!state.isDragging) return;
            let nx = moveEvent.clientX - state.dragOffset.x;
            let ny = moveEvent.clientY - state.dragOffset.y;

            nx = snap(Math.max(0, nx));
            ny = snap(Math.max(0, ny));

            block.x = nx;
            block.y = ny;
            el.style.left = nx + 'px';
            el.style.top = ny + 'px';

            hideBubble();
            updateLatexCode();
        }

        function onPointerUp() {
            state.isDragging = false;
            el.style.cursor = '';
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            saveHistoryState();
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    function startResizing(e, block, el) {
        state.isResizing = true;
        state.initialSize = {
            w: el.offsetWidth,
            h: el.offsetHeight,
            startX: e.clientX,
            startY: e.clientY
        };

        function onPointerMove(moveEvent) {
            if (!state.isResizing) return;
            const deltaX = moveEvent.clientX - state.initialSize.startX;
            const deltaY = moveEvent.clientY - state.initialSize.startY;

            let nw = Math.max(100, state.initialSize.w + deltaX);
            let nh = Math.max(45, state.initialSize.h + deltaY);

            nw = snap(nw);
            nh = snap(nh);

            block.w = nw;
            block.h = nh;
            el.style.width = nw + 'px';
            el.style.minHeight = nh + 'px';

            hideBubble();
            updateLatexCode();
        }

        function onPointerUp() {
            state.isResizing = false;
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            saveHistoryState();
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    function snap(val) {
        if (!state.snapGrid || state.snapGrid <= 0) return val;
        return Math.round(val / state.snapGrid) * state.snapGrid;
    }

    function selectBlock(id) {
        state.selectedBlockId = id;
        document.querySelectorAll('.movable-block').forEach(el => {
            if (el.id === id) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
        updateLatexCode();
    }

    function deleteBlock(id) {
        state.blocks = state.blocks.filter(b => b.id !== id);
        const el = document.getElementById(id);
        if (el) el.remove();
        if (state.selectedBlockId === id) {
            state.selectedBlockId = null;
        }
        checkEmptyHint();
        saveHistoryState();
        updateLatexCode();
        showToast('Đã xóa khối');
    }

    function duplicateBlock(id) {
        const source = state.blocks.find(b => b.id === id);
        if (!source) return;
        createBlock(source.type, source.x + 25, source.y + 25, source.content);
    }

    function checkEmptyHint() {
        let hint = document.getElementById('canvas-empty-hint');
        if (state.blocks.length === 0) {
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'canvas-empty-hint';
                hint.className = 'canvas-empty-hint';
                hint.innerHTML = `+ Nhấp đúp chuột hoặc bấm các nút ở trên để thêm công thức / văn bản`;
                artboard.appendChild(hint);
            }
            hint.style.display = 'block';
        } else if (hint) {
            hint.style.display = 'none';
        }
    }

    // === Double Click to Add ===
    function initViewportEvents() {
        viewport.addEventListener('dblclick', (e) => {
            if (e.target.closest('.movable-block')) return;
            const rect = artboard.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            createBlock('math', clickX - 80, clickY - 25);
        });

        viewport.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.movable-block') && !e.target.closest('#floating-bubble')) {
                state.selectedBlockId = null;
                document.querySelectorAll('.movable-block').forEach(el => el.classList.remove('selected'));
            }
        });
    }

    // === Floating Selection Bubble Toolbar (Mathcha Style WYSIWYG) ===
    function initBubbleToolbar() {
        document.addEventListener('selectionchange', handleTextSelection);

        const buttons = bubbleToolbar.querySelectorAll('[data-format]');
        buttons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const format = btn.getAttribute('data-format');
                applyFormatToSelection(format);
            });
        });

        const colorDots = bubbleToolbar.querySelectorAll('.color-dot');
        colorDots.forEach(dot => {
            dot.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const color = dot.getAttribute('data-color');
                applyColorToSelection(color);
            });
        });
    }

    function handleTextSelection() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) {
            hideBubble();
            return;
        }

        const text = sel.toString().trim();
        if (text.length === 0) {
            hideBubble();
            return;
        }

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const parentEditor = container.nodeType === 1 ? container.closest('.text-editor-area, math-field') : container.parentElement.closest('.text-editor-area, math-field');

        if (!parentEditor) {
            hideBubble();
            return;
        }

        state.savedSelectionRange = range.cloneRange();
        const rect = range.getBoundingClientRect();

        const posX = Math.max(160, Math.min(window.innerWidth - 160, rect.left + rect.width / 2));
        const posY = Math.max(12, rect.top - 46);
        bubbleToolbar.style.left = `${posX}px`;
        bubbleToolbar.style.top = `${posY}px`;
        bubbleToolbar.classList.add('active');
    }

    function hideBubble() {
        if (bubbleToolbar) {
            bubbleToolbar.classList.remove('active');
        }
    }

    function applyFormatToSelection(format) {
        if (!state.savedSelectionRange) return;

        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(state.savedSelectionRange);

        if (format === 'bold') {
            document.execCommand('bold', false, null);
        } else if (format === 'italic') {
            document.execCommand('italic', false, null);
        } else if (format === 'underline') {
            document.execCommand('underline', false, null);
        } else if (format === 'strike') {
            document.execCommand('strikeThrough', false, null);
        } else if (format === 'math-inline') {
            wrapSelectionWith('$', '$');
        } else if (format === 'math-block') {
            wrapSelectionWith('$$', '$$');
        }

        syncCurrentActiveBlockContent();
        saveHistoryState();
        updateLatexCode();
        hideBubble();
    }

    function applyColorToSelection(color) {
        if (!state.savedSelectionRange) return;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(state.savedSelectionRange);

        document.execCommand('styleWithCSS', false, true);
        document.execCommand('foreColor', false, color);

        syncCurrentActiveBlockContent();
        saveHistoryState();
        updateLatexCode();
        hideBubble();
    }

    function wrapSelectionWith(before, after) {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        const selectedText = range.toString();
        const textNode = document.createTextNode(`${before}${selectedText}${after}`);
        range.deleteContents();
        range.insertNode(textNode);
    }

    function syncCurrentActiveBlockContent() {
        if (!state.selectedBlockId) return;
        const block = state.blocks.find(b => b.id === state.selectedBlockId);
        if (!block) return;
        const el = document.getElementById(block.id);
        if (!el) return;

        if (block.type === 'math') {
            const mf = el.querySelector('math-field');
            if (mf) block.content = mf.value || (typeof mf.getValue === 'function' ? mf.getValue() : '');
        } else {
            const ed = el.querySelector('.text-editor-area');
            if (ed) block.content = ed.innerHTML;
        }
    }

    // === LaTeX Code Generation & Live Render ===
    function updateLatexCode() {
        if (!latexOutput) return;

        if (state.activeExportTab === 'tikz') {
            latexOutput.value = generateTikzCode();
        } else if (state.activeExportTab === 'flow') {
            latexOutput.value = generateFlowCode();
        } else {
            latexOutput.value = generateMathOnlyCode();
        }

        renderLivePreview();
    }

    function renderLivePreview() {
        if (!liveRenderBox) return;

        if (state.blocks.length === 0) {
            liveRenderBox.innerHTML = '<span style="opacity:0.4; font-style:italic;">Kết quả biên dịch realtime sẽ hiển thị tại đây...</span>';
            return;
        }

        // Render preview ordered top-down
        const sorted = [...state.blocks].sort((a, b) => {
            if (Math.abs(a.y - b.y) < 25) return a.x - b.x;
            return a.y - b.y;
        });

        let html = '';
        sorted.forEach(b => {
            if (b.type === 'math') {
                html += `<div style="margin: 12px 0; text-align: center;">\\[ ${b.content} \\]</div>`;
            } else if (b.type === 'box') {
                html += `<div style="border: 1px dashed var(--accent-cyan); padding: 8px 12px; margin: 8px 0; border-radius: 6px; background: rgba(92,225,230,0.05);">${b.content}</div>`;
            } else {
                html += `<div style="margin: 8px 0;">${b.content}</div>`;
            }
        });

        liveRenderBox.innerHTML = html;

        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([liveRenderBox]).catch(() => {});
        }
    }

    function generateTikzCode() {
        if (state.blocks.length === 0) return '% Bảng vẽ đang trống. Bấm "+ Công Thức" để bắt đầu.';

        let header = '';
        let footer = '';

        if (state.canvasMode === 'a4') {
            header = `\\documentclass[a4paper,12pt]{article}\n\\usepackage[margin=2cm]{geometry}\n\\usepackage{amsmath,amssymb,amsfonts,xcolor}\n\\usepackage{tikz}\n\\begin{document}\n\\noindent\n\\begin{tikzpicture}[x=1mm, y=1mm]\n`;
            footer = `\\end{tikzpicture}\n\\end{document}`;
        } else if (state.canvasMode === 'beamer') {
            header = `\\documentclass[aspectratio=169]{beamer}\n\\usepackage{amsmath,amssymb,amsfonts,xcolor}\n\\usepackage{tikz}\n\\usetheme{Madrid}\n\\begin{document}\n\\begin{frame}{Slide Beamer}\n\\centering\n\\begin{tikzpicture}[x=1mm, y=1mm]\n`;
            footer = `\\end{tikzpicture}\n\\end{frame}\n\\end{document}`;
        } else {
            header = `\\documentclass{standalone}\n\\usepackage{amsmath,amssymb,amsfonts,xcolor}\n\\usepackage{tikz}\n\\begin{document}\n\\begin{tikzpicture}[x=1mm, y=1mm]\n`;
            footer = `\\end{tikzpicture}\n\\end{document}`;
        }

        let code = header;
        state.blocks.forEach(b => {
            const xMm = (b.x / 3.78).toFixed(1);
            const yMm = (-b.y / 3.78).toFixed(1);

            if (b.type === 'math') {
                code += `  \\node[anchor=north west] at (${xMm}, ${yMm}) { $\\displaystyle ${b.content}$ };\n`;
            } else if (b.type === 'box') {
                const wMm = (b.w / 3.78).toFixed(1);
                const hMm = (b.h / 3.78).toFixed(1);
                code += `  \\draw[dashed, color=cyan!70!black, rounded corners=2mm] (${xMm}, ${yMm}) rectangle ++(${wMm}, -${hMm});\n`;
            } else {
                const cleanText = convertHtmlToLatex(b.content);
                code += `  \\node[anchor=north west, align=left, text width=${(b.w / 3.78).toFixed(1)}mm] at (${xMm}, ${yMm}) { ${cleanText} };\n`;
            }
        });

        code += footer;
        return code;
    }

    function generateFlowCode() {
        if (state.blocks.length === 0) return '% Chưa có nội dung để xuất.';

        const sorted = [...state.blocks].sort((a, b) => {
            if (Math.abs(a.y - b.y) < 25) return a.x - b.x;
            return a.y - b.y;
        });

        let docClass = '\\documentclass{article}';
        if (state.canvasMode === 'a4') docClass = '\\documentclass[a4paper,12pt]{article}\n\\usepackage[margin=2cm]{geometry}';
        if (state.canvasMode === 'beamer') docClass = '\\documentclass[aspectratio=169]{beamer}\n\\usetheme{Madrid}';

        let code = `${docClass}\n\\usepackage{amsmath,amssymb,amsfonts,xcolor}\n\\begin{document}\n\n`;
        if (state.canvasMode === 'beamer') code += `\\begin{frame}{Slide Beamer}\n\n`;

        sorted.forEach(b => {
            if (b.type === 'math') {
                code += `\\begin{equation*}\n  ${b.content}\n\\end{equation*}\n\n`;
            } else if (b.type === 'box') {
                code += `\\begin{tcolorbox}[title=${b.content}]\n\\end{tcolorbox}\n\n`;
            } else {
                code += `${convertHtmlToLatex(b.content)}\n\n`;
            }
        });

        if (state.canvasMode === 'beamer') code += `\\end{frame}\n\n`;
        code += `\\end{document}`;
        return code;
    }

    function generateMathOnlyCode() {
        if (state.selectedBlockId) {
            const b = state.blocks.find(x => x.id === state.selectedBlockId);
            if (b && b.type === 'math') return b.content;
        }

        const mathBlocks = state.blocks.filter(b => b.type === 'math');
        if (mathBlocks.length === 0) return '% Không tìm thấy công thức toán nào';
        return mathBlocks.map(b => b.content).join('\n\n');
    }

    function convertHtmlToLatex(html) {
        if (!html) return '';
        let s = html;
        s = s.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '\\textbf{$1}');
        s = s.replace(/<b[^>]*>(.*?)<\/b>/gi, '\\textbf{$1}');
        s = s.replace(/<em[^>]*>(.*?)<\/em>/gi, '\\textit{$1}');
        s = s.replace(/<i[^>]*>(.*?)<\/i>/gi, '\\textit{$1}');
        s = s.replace(/<u[^>]*>(.*?)<\/u>/gi, '\\underline{$1}');
        s = s.replace(/<s[^>]*>(.*?)<\/s>/gi, '\\sout{$1}');
        s = s.replace(/<span style="color:\s*rgb\((.*?)\)"[^>]*>(.*?)<\/span>/gi, '\\textcolor{$1}{$2}');
        s = s.replace(/<span style="color:\s*(.*?)"[^>]*>(.*?)<\/span>/gi, '\\textcolor{$1}{$2}');
        s = s.replace(/<br\s*[\/]?>/gi, '\n');
        s = s.replace(/<div>/gi, '\n');
        s = s.replace(/<\/div>/gi, '');
        s = s.replace(/&nbsp;/g, ' ');
        s = s.replace(/&amp;/g, '&');
        s = s.replace(/&lt;/g, '<');
        s = s.replace(/&gt;/g, '>');
        return s.trim();
    }

    // === Global Action Handlers ===
    window.clearCanvas = function () {
        if (state.blocks.length === 0) return;
        if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ bảng vẽ không?')) return;
        state.blocks = [];
        state.selectedBlockId = null;
        renderAllBlocks();
        saveHistoryState();
        updateLatexCode();
        showToast('Đã dọn sạch bảng vẽ');
    };

    window.setExportTab = function (tab) {
        state.activeExportTab = tab;
        document.querySelectorAll('.compiler-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });
        updateLatexCode();
    };

    window.setGridType = function (type) {
        state.gridType = type;
        viewport.className = `canvas-viewport grid-${type}`;
        showToast('Lưới: ' + (type === 'dots' ? 'Chấm' : (type === 'lines' ? 'Kẻ ô' : 'Tắt')));
    };

    window.setSnapGrid = function (val) {
        state.snapGrid = parseInt(val, 10);
        showToast('Hít lưới: ' + (state.snapGrid ? state.snapGrid + 'px' : 'Tắt'));
    };

    window.toggleZenMode = function () {
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        showToast(isZen ? 'Chế độ Zen (Toàn màn hình)' : 'Thoát Chế độ Zen');
    };

    // === Clipboard & Export Engine ===
    window.copyLatexCode = function () {
        const text = latexOutput.value;
        if (!text) {
            showToast('Chưa có mã để copy');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('✓ Đã copy mã LaTeX');
        }).catch(err => {
            showToast('Lỗi: ' + err.message);
        });
    };

    window.copyForMathType = function () {
        let mathText = generateMathOnlyCode();
        if (!mathText || mathText.startsWith('%')) {
            showToast('Chưa có công thức toán để copy cho MathType');
            return;
        }
        mathText = mathText.replace(/\\placeholder\{\}/g, '');
        const formatted = `$${mathText}$`;
        navigator.clipboard.writeText(formatted).then(() => {
            showToast('✓ Đã copy cho MathType! Dán vào Word rồi ấn Alt + \\');
        }).catch(err => {
            showToast('Lỗi: ' + err.message);
        });
    };

    window.copyForWord = function () {
        let mathText = generateMathOnlyCode();
        if (!mathText || mathText.startsWith('%')) {
            showToast('Chưa có công thức để chuyển sang Word');
            return;
        }
        mathText = mathText.replace(/\\placeholder\{\}/g, '');

        if (!window.MathJax || !MathJax.tex2mmlPromise) {
            showToast('Đang tải MathJax, vui lòng đợi...');
            return;
        }

        MathJax.tex2mmlPromise(mathText).then(function (mml) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(mml, "application/xml");
                const ns = "http://www.w3.org/1998/Math/MathML";
                let mrows = doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS(ns, 'mrow') : doc.getElementsByTagName('mrow');
                if (!mrows || mrows.length === 0) mrows = doc.getElementsByTagName('mrow');

                for (let i = mrows.length - 1; i >= 0; i--) {
                    const row = mrows[i];
                    const children = Array.from(row.childNodes).filter(n => n.nodeType === 1);
                    if (children.length === 3 && children[0].localName === 'mo' && children[1].localName === 'mtable' && children[2].localName === 'mo') {
                        const mfenced = doc.createElementNS(ns, 'mfenced');
                        mfenced.setAttribute('open', children[0].textContent);
                        mfenced.setAttribute('close', children[2].textContent);
                        mfenced.appendChild(children[1].cloneNode(true));
                        row.parentNode.replaceChild(mfenced, row);
                    }
                }
                const serializer = new XMLSerializer();
                mml = serializer.serializeToString(doc).replace(/ xmlns=""/g, '');
            } catch (e) {
                console.error(e);
            }

            const wordMathML = '<?xml version="1.0"?>\n' + mml;
            navigator.clipboard.writeText(wordMathML).then(() => {
                showToast('✓ Đã copy cho Word! Nhấn Ctrl + V vào MS Word');
            }).catch(err => showToast('Lỗi: ' + err.message));
        });
    };

    window.copyCanvasAsImage = function () {
        if (!window.html2canvas) {
            showToast('Đang tải công cụ chụp ảnh...');
            return;
        }

        if (state.blocks.length === 0) {
            showToast('Bảng vẽ đang trống!');
            return;
        }

        showToast('Đang xử lý ảnh (300 DPI)...');

        html2canvas(artboard, {
            scale: 3,
            backgroundColor: null,
            logging: false
        }).then(canvas => {
            canvas.toBlob(blob => {
                if (navigator.clipboard && window.ClipboardItem) {
                    navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]).then(() => {
                        showToast('✓ Đã copy ảnh PNG (300 DPI) vào clipboard!');
                    }).catch(() => downloadBlob(blob, 'extra-latex.png'));
                } else {
                    downloadBlob(blob, 'extra-latex.png');
                }
            });
        }).catch(err => {
            showToast('Lỗi xuất ảnh: ' + err.message);
        });
    };

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast('✓ Đã tải file ảnh về máy');
    }

    window.downloadTexFile = function () {
        const text = latexOutput.value;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, 'extra-latex-export.tex');
    };

    window.printCanvas = function () {
        window.print();
    };

    // === History & Persistence ===
    function saveHistoryState() {
        const snapshot = JSON.stringify(state.blocks);
        if (state.historyIndex >= 0 && state.history[state.historyIndex] === snapshot) return;

        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        state.historyIndex++;

        if (state.history.length > 30) {
            state.history.shift();
            state.historyIndex--;
        }

        try {
            localStorage.setItem('smp-extra-latex-clean-blocks', snapshot);
        } catch (e) { }
    }

    window.undo = function () {
        if (state.historyIndex > 0) {
            state.historyIndex--;
            state.blocks = JSON.parse(state.history[state.historyIndex]);
            renderAllBlocks();
            updateLatexCode();
            showToast('Hoàn tác (Undo)');
        }
    };

    window.redo = function () {
        if (state.historyIndex < state.history.length - 1) {
            state.historyIndex++;
            state.blocks = JSON.parse(state.history[state.historyIndex]);
            renderAllBlocks();
            updateLatexCode();
            showToast('Làm lại (Redo)');
        }
    };

    function loadSavedState() {
        try {
            const saved = localStorage.getItem('smp-extra-latex-clean-blocks');
            if (saved) {
                state.blocks = JSON.parse(saved);
                return;
            }
        } catch (e) { }
        // Default is EMPTY as requested
        state.blocks = [];
    }

    // === Keyboard Shortcuts ===
    function handleGlobalKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            if (e.shiftKey) {
                e.preventDefault();
                window.redo();
            } else {
                e.preventDefault();
                window.undo();
            }
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            window.redo();
            return;
        }

        if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedBlockId) {
            const isTyping = document.activeElement && (
                document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.tagName === 'MATH-FIELD' ||
                document.activeElement.isContentEditable
            );
            if (!isTyping) {
                e.preventDefault();
                deleteBlock(state.selectedBlockId);
                return;
            }
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && state.selectedBlockId) {
            const isTyping = document.activeElement && (
                document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.tagName === 'MATH-FIELD' ||
                document.activeElement.isContentEditable
            );
            if (!isTyping) {
                e.preventDefault();
                const step = e.shiftKey ? 10 : 2;
                const b = state.blocks.find(x => x.id === state.selectedBlockId);
                if (!b) return;

                if (e.key === 'ArrowUp') b.y = Math.max(0, b.y - step);
                if (e.key === 'ArrowDown') b.y += step;
                if (e.key === 'ArrowLeft') b.x = Math.max(0, b.x - step);
                if (e.key === 'ArrowRight') b.x += step;

                const el = document.getElementById(b.id);
                if (el) {
                    el.style.left = b.x + 'px';
                    el.style.top = b.y + 'px';
                }
                updateLatexCode();
            }
        }
    }

    // === Toast Notification ===
    let toastTimer = null;
    function showToast(msg) {
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 2400);
    }

})();
