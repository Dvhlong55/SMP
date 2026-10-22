/**
 * SMP EXTRA LATEX — Free-form Positioning & WYSIWYG Math Editor
 * Architecture: Canvas Artboard + Draggable Blocks + Floating Selection Bubble + Dual LaTeX Exporter
 */

(function () {
    'use strict';

    // === Global State ===
    const state = {
        blocks: [],
        selectedBlockId: null,
        activeExportTab: 'tikz', // 'tikz' | 'flow' | 'math'
        gridType: 'dots',        // 'dots' | 'lines' | 'none'
        snapGrid: 10,            // 0, 10, 20
        zoom: 1,
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
    let viewport, artboard, bubbleToolbar, latexOutput, toastEl, snippetContainer;

    // Default sample content on first load
    const DEFAULT_BLOCKS = [
        {
            id: 'b-1',
            type: 'text',
            x: 80,
            y: 50,
            w: 420,
            h: 70,
            content: '<strong>Định lý Fermat nhỏ:</strong> Cho $p$ là số nguyên tố và $a \\in \\mathbb{Z}$ không chia hết cho $p$, khi đó:',
            zIndex: 1
        },
        {
            id: 'b-2',
            type: 'math',
            x: 120,
            y: 140,
            w: 320,
            h: 60,
            content: 'a^{p-1} \\equiv 1 \\pmod{p}',
            zIndex: 2
        },
        {
            id: 'b-3',
            type: 'box',
            x: 60,
            y: 35,
            w: 480,
            h: 190,
            content: 'Ghi chú quan trọng',
            zIndex: 0
        },
        {
            id: 'b-4',
            type: 'text',
            x: 80,
            y: 250,
            w: 460,
            h: 60,
            content: 'Hệ quả trực tiếp với mọi số nguyên $a$ bất kỳ:',
            zIndex: 3
        },
        {
            id: 'b-5',
            type: 'math',
            x: 140,
            y: 320,
            w: 300,
            h: 60,
            content: 'a^p \\equiv a \\pmod{p}',
            zIndex: 4
        }
    ];

    // === Initialization ===
    window.addEventListener('DOMContentLoaded', () => {
        viewport = document.getElementById('canvas-viewport');
        artboard = document.getElementById('artboard');
        bubbleToolbar = document.getElementById('floating-bubble');
        latexOutput = document.getElementById('latex-output');
        toastEl = document.getElementById('el-toast');
        snippetContainer = document.getElementById('snippet-container');

        initViewportEvents();
        initBubbleToolbar();
        initSnippets();
        loadSavedState();
        renderAllBlocks();
        saveHistoryState();
        updateLatexCode();

        // Keyboard shortcuts
        document.addEventListener('keydown', handleGlobalKeydown);
    });

    // === Block Creation & Rendering ===
    function createBlock(type, x = 100, y = 100, content = '') {
        const id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        let defaultW = 280;
        let defaultH = 65;
        let defaultContent = content;

        if (type === 'math') {
            defaultContent = content || 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
            defaultW = 320;
            defaultH = 65;
        } else if (type === 'text') {
            defaultContent = content || 'Nhập văn bản tại đây hoặc bôi đen để định dạng...';
            defaultW = 340;
            defaultH = 65;
        } else if (type === 'box') {
            defaultContent = content || 'Khung ghi chú / Chú thích';
            defaultW = 360;
            defaultH = 140;
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
        artboard.innerHTML = '';
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
                <button class="block-action-btn" title="Lên trên (Layer Up)" data-action="layer-up">▲</button>
                <button class="block-action-btn" title="Xuống dưới (Layer Down)" data-action="layer-down">▼</button>
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

        // Events
        setupBlockEvents(div, block);

        artboard.appendChild(div);
        checkEmptyHint();
    }

    function setupBlockEvents(el, block) {
        // Selection
        el.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.block-action-btn')) return;
            selectBlock(block.id);
        });

        // Action buttons
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

        // Header Dragging
        const header = el.querySelector('.block-header');
        header.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.block-action-btn')) return;
            e.preventDefault();
            startDragging(e, block, el);
        });

        // Resizing
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

            let nw = Math.max(120, state.initialSize.w + deltaX);
            let nh = Math.max(50, state.initialSize.h + deltaY);

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
        createBlock(source.type, source.x + 30, source.y + 30, source.content);
    }

    function checkEmptyHint() {
        let hint = document.getElementById('canvas-empty-hint');
        if (state.blocks.length === 0) {
            if (!hint) {
                hint = document.createElement('div');
                hint.id = 'canvas-empty-hint';
                hint.className = 'canvas-empty-hint';
                hint.innerHTML = `
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    <div style="font-size:0.95rem; font-weight:500;">Bảng vẽ đang trống</div>
                    <div style="font-size:0.8rem; margin-top:4px;">Nhấp đúp chuột vào bất kỳ đâu hoặc bấm các nút phía trên để thêm công thức!</div>
                `;
                artboard.appendChild(hint);
            }
            hint.style.display = 'block';
        } else if (hint) {
            hint.style.display = 'none';
        }
    }

    // === Viewport Double Click & Events ===
    function initViewportEvents() {
        viewport.addEventListener('dblclick', (e) => {
            if (e.target.closest('.movable-block')) return;
            const rect = artboard.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            createBlock('math', clickX - 80, clickY - 25);
        });

        // Click outside blocks deselects
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

        // Bubble button handlers
        const buttons = bubbleToolbar.querySelectorAll('[data-format]');
        buttons.forEach(btn => {
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Prevent losing focus / selection
                const format = btn.getAttribute('data-format');
                applyFormatToSelection(format);
            });
        });

        // Color dots
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

        // Check if selection is within our editable areas
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const parentEditor = container.nodeType === 1 ? container.closest('.text-editor-area, math-field') : container.parentElement.closest('.text-editor-area, math-field');

        if (!parentEditor) {
            hideBubble();
            return;
        }

        state.savedSelectionRange = range.cloneRange();
        const rect = range.getBoundingClientRect();

        // Position bubble safely above the selection
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
            if (mf) block.content = mf.getValue();
        } else {
            const ed = el.querySelector('.text-editor-area');
            if (ed) block.content = ed.innerHTML;
        }
    }

    // === Snippet Toolbar Integration ===
    const SNIPPET_GROUPS = {
        'co-ban': [
            { label: '\\frac{a}{b}', code: '\\frac{#?}{#?}' },
            { label: '\\sqrt{x}', code: '\\sqrt{#?}' },
            { label: '\\sqrt[n]{x}', code: '\\sqrt[#?]{#?}' },
            { label: 'x^n', code: '^{#?}' },
            { label: 'x_n', code: '_{#?}' },
            { label: '\\pm', code: '\\pm ' },
            { label: '\\times', code: '\\times ' },
            { label: '\\div', code: '\\div ' }
        ],
        'dai-so': [
            { label: '\\le', code: '\\le ' },
            { label: '\\ge', code: '\\ge ' },
            { label: '\\neq', code: '\\neq ' },
            { label: '\\approx', code: '\\approx ' },
            { label: '\\equiv', code: '\\equiv ' },
            { label: '\\in', code: '\\in ' },
            { label: '\\subset', code: '\\subset ' },
            { label: '\\forall', code: '\\forall ' },
            { label: '\\exists', code: '\\exists ' }
        ],
        'giai-tich': [
            { label: '\\sum', code: '\\sum_{#?}^{#?} #?' },
            { label: '\\int', code: '\\int_{#?}^{#?} #? \\, dx' },
            { label: '\\lim', code: '\\lim_{#? \\to #?} #?' },
            { label: '\\prod', code: '\\prod_{#?}^{#?} #?' },
            { label: '\\infty', code: '\\infty' },
            { label: '\\partial', code: '\\partial' }
        ],
        'he-ma-tran': [
            { label: '\\begin{cases}', code: '\\begin{cases} #? \\\\ #? \\end{cases}' },
            { label: '\\begin{pmatrix}', code: '\\begin{pmatrix} #? & #? \\\\ #? & #? \\end{pmatrix}' },
            { label: '\\begin{bmatrix}', code: '\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}' },
            { label: '\\vec{v}', code: '\\vec{#?}' }
        ],
        'hy-lap': [
            { label: '\\alpha', code: '\\alpha' },
            { label: '\\beta', code: '\\beta' },
            { label: '\\gamma', code: '\\gamma' },
            { label: '\\theta', code: '\\theta' },
            { label: '\\pi', code: '\\pi' },
            { label: '\\lambda', code: '\\lambda' },
            { label: '\\Delta', code: '\\Delta' },
            { label: '\\Omega', code: '\\Omega' }
        ]
    };

    function initSnippets() {
        if (!snippetContainer) return;
        renderSnippetGroup('co-ban');

        const tabBtns = document.querySelectorAll('.snippet-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const group = btn.getAttribute('data-group');
                renderSnippetGroup(group);
            });
        });
    }

    function renderSnippetGroup(groupKey) {
        const list = SNIPPET_GROUPS[groupKey] || [];
        snippetContainer.innerHTML = '';
        list.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'snip-item-btn';
            btn.title = item.label;
            btn.innerHTML = `$${item.label}$`;
            btn.addEventListener('click', () => insertSnippet(item.code));
            snippetContainer.appendChild(btn);
        });

        // Re-render math in snippet buttons
        function renderMathSafely() {
            if (window.renderMathInElement) {
                renderMathInElement(snippetContainer, {
                    delimiters: [{ left: '$', right: '$', display: false }]
                });
            } else {
                setTimeout(renderMathSafely, 200);
            }
        }
        renderMathSafely();
    }

    function insertSnippet(code) {
        if (!state.selectedBlockId) {
            // If no block selected, create a new math block with snippet
            createBlock('math', 150, 150, code.replace(/#\?/g, ''));
            return;
        }

        const block = state.blocks.find(b => b.id === state.selectedBlockId);
        if (!block) return;

        const el = document.getElementById(block.id);
        if (block.type === 'math') {
            const mf = el.querySelector('math-field');
            if (mf) {
                if (typeof mf.insert === 'function') {
                    mf.insert(code);
                } else if (typeof mf.executeCommand === 'function') {
                    mf.executeCommand(['insert', code]);
                }
                mf.focus();
                block.content = mf.value || (typeof mf.getValue === 'function' ? mf.getValue() : '');
            }
        } else {
            const cleanCode = code.replace(/#\?/g, '');
            document.execCommand('insertText', false, `$${cleanCode}$`);
            const ed = el.querySelector('.text-editor-area');
            if (ed) block.content = ed.innerHTML;
        }

        saveHistoryState();
        updateLatexCode();
    }

    // === LaTeX Code Generation ===
    function updateLatexCode() {
        if (!latexOutput) return;

        if (state.activeExportTab === 'tikz') {
            latexOutput.value = generateTikzCode();
        } else if (state.activeExportTab === 'flow') {
            latexOutput.value = generateFlowCode();
        } else {
            latexOutput.value = generateMathOnlyCode();
        }
    }

    function generateTikzCode() {
        if (state.blocks.length === 0) return '% Bảng vẽ đang trống. Thêm công thức để xuất mã TikZ.';

        let code = `\\documentclass{standalone}\n\\usepackage{amsmath,amssymb,amsfonts,xcolor}\n\\usepackage{tikz}\n\\begin{document}\n\\begin{tikzpicture}[x=1mm, y=1mm]\n`;

        state.blocks.forEach(b => {
            // Convert px to mm: ~ 3.78 px = 1mm
            const xMm = (b.x / 3.78).toFixed(1);
            const yMm = (-b.y / 3.78).toFixed(1); // In TikZ Y goes upwards

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

        code += `\\end{tikzpicture}\n\\end{document}`;
        return code;
    }

    function generateFlowCode() {
        if (state.blocks.length === 0) return '% Chưa có nội dung để xuất.';

        // Sort blocks by Y position (top to bottom), then by X
        const sorted = [...state.blocks].sort((a, b) => {
            if (Math.abs(a.y - b.y) < 25) return a.x - b.x;
            return a.y - b.y;
        });

        let code = `\\documentclass{article}\n\\usepackage{amsmath,amssymb,amsfonts,xcolor}\n\\begin{document}\n\n`;

        sorted.forEach(b => {
            if (b.type === 'math') {
                code += `\\begin{equation*}\n  ${b.content}\n\\end{equation*}\n\n`;
            } else if (b.type === 'box') {
                code += `\\begin{tcolorbox}[title=${b.content}]\n\\end{tcolorbox}\n\n`;
            } else {
                code += `${convertHtmlToLatex(b.content)}\n\n`;
            }
        });

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
    window.addBlock = function (type) {
        // Find center of current viewport scroll
        const scrollX = viewport.scrollLeft + 150;
        const scrollY = viewport.scrollTop + 120;
        createBlock(type, scrollX, scrollY);
    };

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
        document.querySelectorAll('.export-tab-btn').forEach(btn => {
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
        showToast(isZen ? 'Đã bật Chế độ Zen (Toàn màn hình)' : 'Đã thoát Chế độ Zen');
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
            showToast('Đang tải MathJax, vui lòng thử lại...');
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

        // Calculate bounding box of all blocks
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        state.blocks.forEach(b => {
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.x + b.w);
            maxY = Math.max(maxY, b.y + b.h);
        });

        const padding = 24;
        const captureArea = {
            x: Math.max(0, minX - padding),
            y: Math.max(0, minY - padding),
            width: (maxX - minX) + padding * 2,
            height: (maxY - minY) + padding * 2
        };

        showToast('Đang xử lý ảnh độ phân giải cao (300 DPI)...');

        html2canvas(artboard, {
            scale: 3,
            backgroundColor: null,
            x: captureArea.x,
            y: captureArea.y,
            width: captureArea.width,
            height: captureArea.height,
            logging: false
        }).then(canvas => {
            canvas.toBlob(blob => {
                if (navigator.clipboard && window.ClipboardItem) {
                    navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]).then(() => {
                        showToast('✓ Đã copy ảnh PNG vào bộ nhớ tạm! Dán trực tiếp vào Word/Docs');
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

    // === History (Undo / Redo) & Persistence ===
    function saveHistoryState() {
        const snapshot = JSON.stringify(state.blocks);
        if (state.historyIndex >= 0 && state.history[state.historyIndex] === snapshot) return;

        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(snapshot);
        state.historyIndex++;

        // Keep last 30 states
        if (state.history.length > 30) {
            state.history.shift();
            state.historyIndex--;
        }

        // Auto save to localStorage
        try {
            localStorage.setItem('smp-extra-latex-blocks', snapshot);
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
            const saved = localStorage.getItem('smp-extra-latex-blocks');
            if (saved) {
                state.blocks = JSON.parse(saved);
                return;
            }
        } catch (e) { }
        state.blocks = JSON.parse(JSON.stringify(DEFAULT_BLOCKS));
    }

    // === Keyboard Shortcuts ===
    function handleGlobalKeydown(e) {
        // Undo / Redo
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

        // Delete block when not typing
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

        // Arrow keys to nudge selected block
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
        }, 2600);
    }

})();
