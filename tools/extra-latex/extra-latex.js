/**
 * SMP EXTRA LATEX — Modern Mathcha-Style Architecture
 * Features: Top Ribbon + Left Floating Tool Palette + Document-Centric Canvas (3 Modes) + Slide-Up Export Drawer
 */

(function () {
    'use strict';

    // === Global State ===
    const state = {
        blocks: [],
        selectedBlockId: null,
        canvasMode: 'a4',       // 'canvas' | 'a4' | 'beamer' (Default to A4 for clean document view)
        activeExportTab: 'tikz',// 'tikz' | 'flow' | 'math'
        gridType: 'dots',       // 'dots' | 'lines' | 'none'
        snapGrid: 10,           // 0, 10, 20
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
    let viewport, artboard, bubbleToolbar, exportOverlay, latexOutput, toastEl, sheetBadge;

    // === Initialization ===
    window.addEventListener('DOMContentLoaded', () => {
        viewport = document.getElementById('canvas-viewport');
        artboard = document.getElementById('artboard');
        bubbleToolbar = document.getElementById('floating-bubble');
        exportOverlay = document.getElementById('export-drawer-overlay');
        latexOutput = document.getElementById('latex-output');
        toastEl = document.getElementById('el-toast');
        sheetBadge = document.getElementById('sheet-badge');

        initViewportEvents();
        initBubbleToolbar();
        loadSavedState();
        setCanvasMode(state.canvasMode);
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

        document.querySelectorAll('.mode-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
        });

        const badge = document.getElementById('sheet-badge');
        if (badge) badge.remove();

        saveHistoryState();
        updateLatexCode();
        showToast('Chế độ: ' + (mode === 'a4' ? 'Giấy A4' : (mode === 'beamer' ? 'Slide Beamer' : 'Bảng Vẽ')));
    };

    // === Block Creation & Rendering ===
    window.addBlock = function (type) {
        let spawnX = 60;
        let spawnY = 60;

        if (state.canvasMode === 'a4') {
            spawnX = 70;
            spawnY = Math.max(60, (state.blocks.length * 75) + 60);
            if (spawnY > 1050) spawnY = 60;
        } else if (state.canvasMode === 'beamer') {
            spawnX = 70;
            spawnY = Math.max(50, (state.blocks.length * 70) + 50);
            if (spawnY > 460) spawnY = 50;
        } else {
            spawnX = viewport.scrollLeft + 80;
            spawnY = viewport.scrollTop + 60;
        }

        createBlock(type, spawnX, spawnY);
    };

    function createBlock(type, x = 60, y = 60, content = '') {
        const id = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        let defaultW = 240;
        let defaultH = 46;
        let defaultContent = content || '';

        if (type === 'math') {
            defaultW = 240;
            defaultH = 46;
        } else if (type === 'text') {
            defaultW = 260;
            defaultH = 46;
        } else if (type === 'box') {
            defaultW = 280;
            defaultH = 90;
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

        // Auto-focus the new block for immediate typing
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                if (type === 'math') {
                    const mf = el.querySelector('math-field');
                    if (mf) mf.focus();
                } else {
                    const ed = el.querySelector('.text-editor-area');
                    if (ed) ed.focus();
                }
            }
        }, 50);

        showToast('✓ Đã thêm ' + (type === 'math' ? 'công thức' : (type === 'box' ? 'khung' : 'khối văn bản')));
        return newBlock;
    }

    function renderAllBlocks() {
        const badge = document.getElementById('sheet-badge');
        if (badge) badge.remove();
        artboard.innerHTML = '';

        state.blocks.forEach(block => renderBlockDOM(block));
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

        // Mini Hover Handle Bar (Sleek Mathcha Style)
        const handleBar = document.createElement('div');
        handleBar.className = 'block-handle-bar';
        
        let typeIcon = block.type === 'math' ? '∑' : (block.type === 'box' ? '▢' : 'T');
        handleBar.innerHTML = `
            <span class="block-handle-drag" title="Kéo để di chuyển">⠿ ${typeIcon}</span>
            <button class="block-btn-mini" title="Nhân đôi" data-action="duplicate">❐</button>
            <button class="block-btn-mini" title="Lên trên" data-action="layer-up">▲</button>
            <button class="block-btn-mini" title="Xuống dưới" data-action="layer-down">▼</button>
            <button class="block-btn-mini del" title="Xóa" data-action="delete">✕</button>
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
            editor.setAttribute('placeholder', '');
            editor.addEventListener('input', () => {
                block.content = editor.innerHTML;
                updateLatexCode();
                handleEditorSuggest(editor);
            });
            editor.addEventListener('keydown', (e) => {
                handleSuggestKeydown(e, editor, block);
            });
            editor.addEventListener('blur', () => {
                setTimeout(hideSuggestPopup, 200);
            });
            body.appendChild(editor);
        }

        // Resize Handle
        const resize = document.createElement('div');
        resize.className = 'resize-handle';

        div.appendChild(handleBar);
        div.appendChild(body);
        div.appendChild(resize);

        setupBlockEvents(div, block);
        artboard.appendChild(div);
        checkEmptyHint();
    }

    function setupBlockEvents(el, block) {
        el.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.block-btn-mini')) return;
            selectBlock(block.id);
        });

        const handleBar = el.querySelector('.block-handle-bar');
        handleBar.addEventListener('click', (e) => {
            const btn = e.target.closest('.block-btn-mini');
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

        // Dragging by handle
        handleBar.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.block-btn-mini')) return;
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

            let nw = Math.max(90, state.initialSize.w + deltaX);
            let nh = Math.max(40, state.initialSize.h + deltaY);

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
        createBlock(source.type, source.x + 20, source.y + 20, source.content);
    }

    function checkEmptyHint() {
        const hint = document.getElementById('canvas-empty-hint');
        if (hint) hint.remove();
    }

    // === Viewport Events ===
    function initViewportEvents() {
        viewport.addEventListener('dblclick', (e) => {
            if (e.target.closest('.movable-block')) return;
            const rect = artboard.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            createBlock('math', clickX - 80, clickY - 20);
        });

        viewport.addEventListener('pointerdown', (e) => {
            if (!e.target.closest('.movable-block') && !e.target.closest('#floating-bubble') && !e.target.closest('.mathcha-top-ribbon') && !e.target.closest('.mathcha-left-palette')) {
                state.selectedBlockId = null;
                document.querySelectorAll('.movable-block').forEach(el => el.classList.remove('selected'));
            }
        });
    }

    // === Top Ribbon & Selection Formatting ===
    window.execFormat = function (format, value = null) {
        // If text is selected in an editable element, format the selection
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
            applyFormatToSelection(format, value);
            return;
        }

        // If a block is currently selected, apply block-level styling
        if (state.selectedBlockId) {
            const block = state.blocks.find(b => b.id === state.selectedBlockId);
            if (!block) return;
            const el = document.getElementById(block.id);
            if (!el) return;

            if (format === 'justify-left' || format === 'justify-center' || format === 'justify-right') {
                const align = format.replace('justify-', '');
                el.style.textAlign = align;
                block.align = align;
            } else if (format === 'size') {
                const body = el.querySelector('.block-body');
                if (body) body.style.fontSize = value;
            } else if (format === 'color') {
                el.style.color = value;
                const bar = document.getElementById('active-color-bar');
                if (bar) bar.style.backgroundColor = value;
            }
            saveHistoryState();
            updateLatexCode();
        }
    };

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
        const posY = Math.max(12, rect.top - 44);
        bubbleToolbar.style.left = `${posX}px`;
        bubbleToolbar.style.top = `${posY}px`;
        bubbleToolbar.classList.add('active');
    }

    function hideBubble() {
        if (bubbleToolbar) bubbleToolbar.classList.remove('active');
    }

    function applyFormatToSelection(format, value = null) {
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
        } else if (format === 'color') {
            applyColorToSelection(value);
            return;
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

        const bar = document.getElementById('active-color-bar');
        if (bar) bar.style.backgroundColor = color;

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

    // === LaTeX Autocomplete Database & Engine (Triggers on \) ===
    const LATEX_SYMBOLS = [
        { cmd: '\\frac', label: '\\frac{a}{b}', preview: 'a/b', insert: '\\frac{a}{b}' },
        { cmd: '\\sqrt', label: '\\sqrt{x}', preview: '√x', insert: '\\sqrt{x}' },
        { cmd: '\\cfrac', label: '\\cfrac{a}{b}', preview: 'cfrac', insert: '\\cfrac{a}{b}' },
        { cmd: '\\alpha', label: '\\alpha', preview: 'α', insert: '\\alpha' },
        { cmd: '\\beta', label: '\\beta', preview: 'β', insert: '\\beta' },
        { cmd: '\\gamma', label: '\\gamma', preview: 'γ', insert: '\\gamma' },
        { cmd: '\\delta', label: '\\delta', preview: 'δ', insert: '\\delta' },
        { cmd: '\\Delta', label: '\\Delta', preview: 'Δ', insert: '\\Delta' },
        { cmd: '\\epsilon', label: '\\epsilon', preview: 'ε', insert: '\\epsilon' },
        { cmd: '\\theta', label: '\\theta', preview: 'θ', insert: '\\theta' },
        { cmd: '\\lambda', label: '\\lambda', preview: 'λ', insert: '\\lambda' },
        { cmd: '\\pi', label: '\\pi', preview: 'π', insert: '\\pi' },
        { cmd: '\\sigma', label: '\\sigma', preview: 'σ', insert: '\\sigma' },
        { cmd: '\\omega', label: '\\omega', preview: 'ω', insert: '\\omega' },
        { cmd: '\\Omega', label: '\\Omega', preview: 'Ω', insert: '\\Omega' },
        { cmd: '\\sum', label: '\\sum', preview: '∑', insert: '\\sum_{i=1}^{n}' },
        { cmd: '\\prod', label: '\\prod', preview: '∏', insert: '\\prod_{i=1}^{n}' },
        { cmd: '\\int', label: '\\int', preview: '∫', insert: '\\int_{a}^{b}' },
        { cmd: '\\lim', label: '\\lim', preview: 'lim', insert: '\\lim_{x \\to \\infty}' },
        { cmd: '\\infty', label: '\\infty', preview: '∞', insert: '\\infty' },
        { cmd: '\\le', label: '\\le', preview: '≤', insert: '\\le' },
        { cmd: '\\ge', label: '\\ge', preview: '≥', insert: '\\ge' },
        { cmd: '\\neq', label: '\\neq', preview: '≠', insert: '\\neq' },
        { cmd: '\\approx', label: '\\approx', preview: '≈', insert: '\\approx' },
        { cmd: '\\equiv', label: '\\equiv', preview: '≡', insert: '\\equiv' },
        { cmd: '\\pm', label: '\\pm', preview: '±', insert: '\\pm' },
        { cmd: '\\times', label: '\\times', preview: '×', insert: '\\times' },
        { cmd: '\\div', label: '\\div', preview: '÷', insert: '\\div' },
        { cmd: '\\in', label: '\\in', preview: '∈', insert: '\\in' },
        { cmd: '\\notin', label: '\\notin', preview: '∉', insert: '\\notin' },
        { cmd: '\\subset', label: '\\subset', preview: '⊂', insert: '\\subset' },
        { cmd: '\\cup', label: '\\cup', preview: '∪', insert: '\\cup' },
        { cmd: '\\cap', label: '\\cap', preview: '∩', insert: '\\cap' },
        { cmd: '\\emptyset', label: '\\emptyset', preview: '∅', insert: '\\emptyset' },
        { cmd: '\\forall', label: '\\forall', preview: '∀', insert: '\\forall' },
        { cmd: '\\exists', label: '\\exists', preview: '∃', insert: '\\exists' },
        { cmd: '\\to', label: '\\to', preview: '→', insert: '\\to' },
        { cmd: '\\Rightarrow', label: '\\Rightarrow', preview: '⇒', insert: '\\Rightarrow' },
        { cmd: '\\Leftrightarrow', label: '\\Leftrightarrow', preview: '⇔', insert: '\\Leftrightarrow' },
        { cmd: '\\vec', label: '\\vec{v}', preview: 'v⃗', insert: '\\vec{v}' },
        { cmd: '\\binom', label: '\\binom{n}{k}', preview: 'C(n,k)', insert: '\\binom{n}{k}' },
        { cmd: '\\cases', label: '\\begin{cases}', preview: '{..', insert: '\\begin{cases} x \\\\ y \\end{cases}' },
        { cmd: '\\matrix', label: '\\begin{matrix}', preview: '[..]', insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
        { cmd: '\\textbf', label: '\\textbf{in đậm}', preview: 'Bold', insert: '\\textbf{in đậm}' },
        { cmd: '\\textit', label: '\\textit{in nghiêng}', preview: 'Italic', insert: '\\textit{in nghiêng}' },
        { cmd: '\\underline', label: '\\underline{gạch chân}', preview: 'Underline', insert: '\\underline{gạch chân}' }
    ];

    let suggestState = {
        active: false,
        items: [],
        highlightIndex: 0,
        query: '',
        textNode: null,
        cursorOffset: 0,
        activeEditor: null
    };

    function handleEditorSuggest(editor) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed === false) {
            hideSuggestPopup();
            return;
        }

        const range = sel.getRangeAt(0);
        const node = range.startContainer;
        if (node.nodeType !== Node.TEXT_NODE) {
            hideSuggestPopup();
            return;
        }

        const textBeforeCaret = node.textContent.slice(0, range.startOffset);
        const match = textBeforeCaret.match(/\\([a-zA-Z]*)$/);

        if (!match) {
            hideSuggestPopup();
            return;
        }

        const query = match[1].toLowerCase();
        const matches = LATEX_SYMBOLS.filter(item => item.cmd.slice(1).toLowerCase().startsWith(query));

        if (matches.length === 0) {
            hideSuggestPopup();
            return;
        }

        suggestState.active = true;
        suggestState.items = matches.slice(0, 8);
        suggestState.highlightIndex = 0;
        suggestState.query = match[0];
        suggestState.textNode = node;
        suggestState.cursorOffset = range.startOffset;
        suggestState.activeEditor = editor;

        showSuggestPopup(range);
    }

    function showSuggestPopup(range) {
        const popup = document.getElementById('latex-suggest-popup');
        if (!popup) return;

        popup.innerHTML = '';
        suggestState.items.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = `suggest-item ${idx === suggestState.highlightIndex ? 'highlighted' : ''}`;
            div.innerHTML = `
                <span class="suggest-cmd">${item.label}</span>
                <span class="suggest-preview">${item.preview}</span>
            `;
            div.addEventListener('mousedown', (e) => {
                e.preventDefault();
                insertSuggestion(item);
            });
            popup.appendChild(div);
        });

        const rect = range.getBoundingClientRect();
        const posX = Math.max(10, Math.min(window.innerWidth - 240, rect.left));
        const posY = rect.bottom + 6;

        popup.style.left = `${posX}px`;
        popup.style.top = `${posY}px`;
        popup.classList.add('active');
    }

    function hideSuggestPopup() {
        suggestState.active = false;
        const popup = document.getElementById('latex-suggest-popup');
        if (popup) popup.classList.remove('active');
    }

    function handleSuggestKeydown(e, editor, block) {
        if (!suggestState.active) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            suggestState.highlightIndex = (suggestState.highlightIndex + 1) % suggestState.items.length;
            updateSuggestHighlight();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            suggestState.highlightIndex = (suggestState.highlightIndex - 1 + suggestState.items.length) % suggestState.items.length;
            updateSuggestHighlight();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const item = suggestState.items[suggestState.highlightIndex];
            if (item) insertSuggestion(item);
        } else if (e.key === 'Escape') {
            hideSuggestPopup();
        }
    }

    function updateSuggestHighlight() {
        const popup = document.getElementById('latex-suggest-popup');
        if (!popup) return;
        const items = popup.querySelectorAll('.suggest-item');
        items.forEach((el, idx) => {
            el.classList.toggle('highlighted', idx === suggestState.highlightIndex);
        });
    }

    function insertSuggestion(item) {
        const { textNode, cursorOffset, query } = suggestState;
        if (!textNode || !textNode.parentNode) {
            hideSuggestPopup();
            return;
        }

        const fullText = textNode.textContent;
        const beforeMatch = fullText.slice(0, cursorOffset - query.length);
        const afterMatch = fullText.slice(cursorOffset);

        let insertText = '';
        if (item.cmd.startsWith('\\text') || item.cmd.startsWith('\\under')) {
            insertText = item.insert + ' ';
        } else {
            insertText = `$${item.insert}$ `;
        }

        textNode.textContent = beforeMatch + insertText + afterMatch;

        const sel = window.getSelection();
        const newRange = document.createRange();
        newRange.setStart(textNode, (beforeMatch + insertText).length);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        if (suggestState.activeEditor) {
            syncCurrentActiveBlockContent();
            updateLatexCode();
        }

        hideSuggestPopup();
    }

    // === Export Drawer Controls ===
    window.openExportDrawer = function () {
        updateLatexCode();
        if (exportOverlay) exportOverlay.classList.add('active');
    };

    window.closeExportDrawer = function () {
        if (exportOverlay) exportOverlay.classList.remove('active');
    };

    window.setExportTab = function (tab) {
        state.activeExportTab = tab;
        document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });
        updateLatexCode();
    };

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
        if (state.blocks.length === 0) return '% Bảng vẽ đang trống.';

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

    // === View & Canvas Controls ===
    window.clearCanvas = function () {
        if (state.blocks.length === 0) return;
        if (!confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ bảng không?')) return;
        state.blocks = [];
        state.selectedBlockId = null;
        renderAllBlocks();
        saveHistoryState();
        updateLatexCode();
        showToast('Đã xóa sạch bảng vẽ');
    };

    window.setGridType = function (type) {
        state.gridType = type;
        viewport.className = `mathcha-canvas-viewport grid-${type}`;
        showToast('Lưới: ' + (type === 'dots' ? 'Chấm' : (type === 'lines' ? 'Kẻ ô' : 'Tắt')));
    };

    window.setSnapGrid = function (val) {
        state.snapGrid = parseInt(val, 10);
        showToast('Hít lưới: ' + (state.snapGrid ? state.snapGrid + 'px' : 'Tắt'));
    };

    window.toggleZenMode = function () {
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        showToast(isZen ? 'Chế độ Zen' : 'Thoát Zen');
    };

    // === Export Actions ===
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
            localStorage.setItem('smp-extra-latex-mathcha-blocks', snapshot);
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
            const saved = localStorage.getItem('smp-extra-latex-mathcha-blocks');
            if (saved) {
                state.blocks = JSON.parse(saved);
                return;
            }
        } catch (e) { }
        state.blocks = []; // Clean empty by default
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
        }, 2200);
    }

})();
