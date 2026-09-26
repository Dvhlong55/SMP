// ========================================================
//   SMP - LaTeX-OCR (Math Vision) Client Controller
// ========================================================

(function() {
    'use strict';

    // Xác định Backend API URL linh hoạt theo môi trường
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = window.API_BASE_URL || (isLocal ? 'http://localhost:8000' : 'https://smp-backend-kcwn.onrender.com');

    // Các biến trạng thái
    let currentBase64 = null;
    let currentMimeType = 'image/jpeg';
    let currentLatex = '';
    let isProcessing = false;

    // Đồng bộ Theme (Dark/Light) và Embed Mode
    function syncThemeAndEmbed() {
        if (window.location.search.includes('embed=true')) {
            document.body.classList.add('embed-mode');
        }
        try {
            if (window.parent && window.parent.document && window.parent.document.body.classList.contains('dark-mode')) {
                document.body.classList.add('dark-mode');
            } else if (localStorage.getItem('smp-dark-mode') === 'true') {
                document.body.classList.add('dark-mode');
            }
        } catch (e) {
            if (localStorage.getItem('smp-dark-mode') === 'true') {
                document.body.classList.add('dark-mode');
            }
        }
    }
    syncThemeAndEmbed();

    // Các phần tử DOM
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropPrompt = document.getElementById('drop-prompt');
    const previewContainer = document.getElementById('preview-img-container');
    const selectedImage = document.getElementById('selected-image');
    const scanBtn = document.getElementById('scan-btn');
    const scanBtnText = document.getElementById('scan-btn-text');
    const scanEnterBadge = document.getElementById('scan-enter-badge');
    const clearImgBtn = document.getElementById('clear-img-btn');
    const imgStatus = document.getElementById('img-status');
    const imgMeta = document.getElementById('img-meta');
    const ocrStatus = document.getElementById('ocr-status');
    const charMeta = document.getElementById('char-meta');
    const mathPreview = document.getElementById('math-preview');
    const latexOutput = document.getElementById('latex-output');
    const btnCopy = document.getElementById('btn-copy-latex');
    const btnSendLatex = document.getElementById('btn-send-latex');
    const btnSendMathType = document.getElementById('btn-send-mathtype');

    // ── Xử lý Kéo Thả (Drag & Drop) ────────────────────────
    if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        });

        dropZone.addEventListener('click', (e) => {
            // Không mở file dialog nếu người dùng click vào ảnh đã hiển thị
            if (currentBase64 && e.target === selectedImage) return;
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (fileInput.files && fileInput.files.length > 0) {
                handleFile(fileInput.files[0]);
            }
        });
    }

    // ── Xử lý Dán Trực Tiếp từ Clipboard (Ctrl + V) ────────
    window.addEventListener('paste', (e) => {
        const clipboardItems = (e.clipboardData || window.clipboardData).items;
        if (!clipboardItems) return;

        for (let i = 0; i < clipboardItems.length; i++) {
            const item = clipboardItems[i];
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                handleFile(blob, 'Ảnh chụp màn hình (Clipboard)');
                showToast('✓ Đã dán ảnh từ Clipboard!');
                break;
            }
        }
    });

    // ── Đọc File và Cập Nhật Preview ───────────────────────
    function handleFile(file, customName) {
        if (!file || !file.type.startsWith('image/')) {
            showToast('⚠️ Vui lòng chọn định dạng file ảnh hợp lệ (PNG, JPG, WEBP).');
            return;
        }

        currentMimeType = file.type || 'image/jpeg';
        const reader = new FileReader();

        reader.onload = function(e) {
            currentBase64 = e.target.result;
            selectedImage.src = currentBase64;
            dropPrompt.style.display = 'none';
            previewContainer.style.display = 'flex';
            clearImgBtn.style.display = 'inline-block';
            scanBtn.disabled = false;
            if (scanBtnText) scanBtnText.textContent = 'Quét Công Thức';
            if (scanEnterBadge) scanEnterBadge.style.display = 'inline-flex';
            setTimeout(() => { if (scanBtn) scanBtn.focus(); }, 80);

            const name = customName || file.name || 'Ảnh đã chọn';
            const sizeKB = (file.size ? (file.size / 1024).toFixed(1) + ' KB' : '');
            imgStatus.innerHTML = `<span class="status-dot green"></span>${name}`;
            imgMeta.textContent = sizeKB;

            ocrStatus.innerHTML = `<span class="status-dot"></span>Sẵn sàng quét`;
        };

        reader.readAsDataURL(file);
    }

    // ── Xóa Ảnh ───────────────────────────────────────────
    window.clearImage = function() {
        currentBase64 = null;
        selectedImage.src = '';
        dropPrompt.style.display = 'flex';
        previewContainer.style.display = 'none';
        clearImgBtn.style.display = 'none';
        scanBtn.disabled = true;
        if (scanBtnText) scanBtnText.textContent = 'Quét Công Thức';
        if (scanEnterBadge) scanEnterBadge.style.display = 'inline-flex';
        fileInput.value = '';

        imgStatus.innerHTML = `<span class="status-dot"></span>Chưa có ảnh nào được chọn`;
        imgMeta.textContent = '';

        // Reset kết quả & preview
        currentLatex = '';
        if (latexOutput) latexOutput.value = '';
        if (charMeta) charMeta.textContent = '0 ký tự';
        renderLatexPreview('');
        if (btnCopy) btnCopy.disabled = true;
        if (btnSendLatex) btnSendLatex.disabled = true;
        if (btnSendMathType) btnSendMathType.disabled = true;
        if (ocrStatus) ocrStatus.innerHTML = `<span class="status-dot green"></span>Sẵn sàng`;
    };

    // ── Tải Ảnh Mẫu Để Trải Nghiệm ─────────────────────────
    window.loadSampleImage = function() {
        const canvas = document.createElement('canvas');
        canvas.width = 650;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // Nền tối thanh lịch
        ctx.fillStyle = '#12181b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Viền trang trí
        ctx.strokeStyle = '#23383b';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

        // Vẽ chữ công thức mẫu
        ctx.fillStyle = '#5ce1e6';
        ctx.font = 'bold 22px serif';
        ctx.fillText('Bài toán: Tính tích phân Dirichlet', 35, 48);

        ctx.fillStyle = '#f0f0f0';
        ctx.font = 'italic 34px Times New Roman';
        ctx.fillText('∫  (sin x / x) dx  =  π / 2', 120, 115);

        ctx.fillStyle = '#888888';
        ctx.font = '20px Times New Roman';
        ctx.fillText('0', 135, 140);
        ctx.fillText('∞', 132, 85);

        ctx.fillStyle = '#a78bfa';
        ctx.font = '16px monospace';
        ctx.fillText('[Ảnh đề thi mẫu - SMP Mathematical OCR]', 35, 175);

        const dataUrl = canvas.toDataURL('image/png');
        currentBase64 = dataUrl;
        currentMimeType = 'image/png';
        selectedImage.src = dataUrl;
        dropPrompt.style.display = 'none';
        previewContainer.style.display = 'flex';
        clearImgBtn.style.display = 'inline-block';
        scanBtn.disabled = false;
        if (scanBtnText) scanBtnText.textContent = 'Quét Công Thức';
        if (scanEnterBadge) scanEnterBadge.style.display = 'inline-flex';
        setTimeout(() => { if (scanBtn) scanBtn.focus(); }, 80);

        imgStatus.innerHTML = `<span class="status-dot green"></span>Ảnh mẫu: Tích phân Dirichlet`;
        imgMeta.textContent = 'Mẫu SMP';
        showToast('✓ Đã nạp ảnh công thức mẫu thành công!');
    };

    // ── Gửi Ảnh Tới Backend Nhận Diện ──────────────────────
    window.processOCR = async function() {
        if (!currentBase64 || isProcessing) return;

        isProcessing = true;
        scanBtn.disabled = true;
        scanBtnText.innerHTML = '<span class="spinner"></span> Đang nhận diện...';
        if (scanEnterBadge) scanEnterBadge.style.display = 'none';
        ocrStatus.innerHTML = '<span class="status-dot"></span>Đang xử lý...';

        try {
            const response = await fetch(`${API_BASE}/api/tools/ocr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: currentBase64,
                    mime_type: currentMimeType
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Lỗi máy chủ (${response.status})`);
            }

            const data = await response.json();
            const latex = data.latex || '';
            currentLatex = latex;

            // Đưa mã vào textarea
            latexOutput.value = latex;
            charMeta.textContent = `${latex.length} ký tự`;

            // Render Preview bằng MathJax
            renderLatexPreview(latex);

            // Bật các nút hành động
            btnCopy.disabled = false;
            btnSendLatex.disabled = false;
            btnSendMathType.disabled = false;

            ocrStatus.innerHTML = '<span class="status-dot green"></span>✓ Hoàn thành';
            showToast('✓ Hoàn thành!');

        } catch (error) {
            console.error('OCR Error:', error);
            ocrStatus.innerHTML = `<span class="status-dot red"></span>Hệ thống bận`;
            mathPreview.className = 'error-state';
            mathPreview.innerHTML = `
                <div class="ocr-error-box">
                    <div class="ocr-error-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    </div>
                    <p class="ocr-error-title">Không thể nhận diện ảnh</p>
                    <p class="ocr-error-desc">Lỗi hệ thống: Vui lòng thử lại sau giây lát.</p>
                </div>
            `;
            showToast('⚠️ Hệ thống đang bận, vui lòng thử lại sau.');
        } finally {
            isProcessing = false;
            scanBtn.disabled = !currentBase64;
            if (scanBtnText) scanBtnText.textContent = 'Quét Lại';
            if (scanEnterBadge) scanEnterBadge.style.display = 'inline-flex';
        }
    };

    // ── Lắng nghe phím Enter để Quét Công Thức ───────────────
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
            // Không can thiệp nếu đang gõ trong ô văn bản textarea hoặc text input
            if (activeTag === 'textarea' || (activeTag === 'input' && document.activeElement.type === 'text')) {
                return;
            }

            if (currentBase64 && !isProcessing && scanBtn && !scanBtn.disabled) {
                e.preventDefault();
                processOCR();
            }
        }
    });

    // ── Xử lý \fbox, \framebox và \boxed có hỗ trợ ngoặc nhọn lồng nhau ──
    function parseLatexFbox(str) {
        if (!str || (!str.includes('\\fbox') && !str.includes('\\framebox') && !str.includes('\\boxed'))) return str;
        var keywords = ['\\fbox', '\\framebox', '\\boxed'];
        for (var k = 0; k < keywords.length; k++) {
            var kw = keywords[k];
            var pos = 0;
            while ((pos = str.indexOf(kw, pos)) !== -1) {
                var braceStart = pos + kw.length;
                while (braceStart < str.length && str[braceStart] === ' ') braceStart++;
                if (braceStart < str.length && str[braceStart] === '[') {
                    var optEnd = str.indexOf(']', braceStart);
                    if (optEnd !== -1) {
                        braceStart = optEnd + 1;
                        while (braceStart < str.length && str[braceStart] === ' ') braceStart++;
                        if (braceStart < str.length && str[braceStart] === '[') {
                            var optEnd2 = str.indexOf(']', braceStart);
                            if (optEnd2 !== -1) {
                                braceStart = optEnd2 + 1;
                                while (braceStart < str.length && str[braceStart] === ' ') braceStart++;
                            }
                        }
                    }
                }
                if (braceStart >= str.length || str[braceStart] !== '{') {
                    pos += kw.length;
                    continue;
                }

                var start = braceStart + 1;
                var depth = 1;
                var i = start;
                while (i < str.length && depth > 0) {
                    var ch = str[i];
                    var prev = str[i - 1];
                    if (ch === '{' && prev !== '\\') depth++;
                    else if (ch === '}' && prev !== '\\') depth--;
                    i++;
                }

                if (depth === 0) {
                    var inner = str.substring(start, i - 1);
                    var processedInner = parseLatexFbox(inner);
                    // Nếu bên trong có lệnh toán học mà chưa có delimiter, tự bọc $ để MathJax render chuẩn
                    if (/\\(frac|sqrt|sum|prod|int|alpha|beta|gamma|Delta|pi|le|ge|neq|equiv|forall|exists|in|subset|times|div)\b/.test(processedInner) && !processedInner.includes('$')) {
                        processedInner = '$' + processedInner + '$';
                    }
                    var replacement = '<span class="latex-fbox">' + processedInner + '</span>';
                    str = str.substring(0, pos) + replacement + str.substring(i);
                    pos += replacement.length;
                } else {
                    pos += kw.length;
                }
            }
        }
        return str;
    }

    // ── Xử lý văn bản bên ngoài chế độ toán học để tránh làm hỏng công thức math ──
    function processOutsideMath(src, fn) {
        var mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|gathered|array|equation|align|gather|multline)\*?\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|gathered|array|equation|align|gather|multline)\*?\}|(?<!\\)\$[\s\S]*?(?<!\\)\$|\\\([\s\S]*?\\\))/g;

        var result = '';
        var lastIndex = 0;
        var match;

        while ((match = mathRegex.exec(src)) !== null) {
            var textPart = src.substring(lastIndex, match.index);
            result += fn(textPart);
            result += match[0];
            lastIndex = mathRegex.lastIndex;
        }

        var tail = src.substring(lastIndex);
        result += fn(tail);
        return result;
    }

    // ── Phân tách các ô trong một dòng của bảng LaTeX (&) ──
    function splitTableCells(rowStr) {
        var cells = [];
        var current = '';
        var inMath = false;
        var depth = 0;

        for (var i = 0; i < rowStr.length; i++) {
            var ch = rowStr[i];
            var prev = i > 0 ? rowStr[i - 1] : '';

            if (ch === '$' && prev !== '\\') {
                inMath = !inMath;
            } else if (ch === '{' && prev !== '\\') {
                depth++;
            } else if (ch === '}' && prev !== '\\') {
                if (depth > 0) depth--;
            }

            if (ch === '&' && !inMath && depth === 0) {
                cells.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current);
        return cells;
    }

    // ── Xử lý môi trường bảng \begin{tabular}{...} ... \end{tabular} ──
    function parseLatexTabular(str) {
        if (!str || !str.includes('\\begin{tabular')) return str;

        // Bỏ bọc ngoài nếu người dùng vô tình đặt \begin{tabular} trong \[ ... \]
        str = str.replace(/\\\[\s*(\\begin\{tabular\}[\s\S]*?\\end\{tabular\})\s*\\\]/gi, '$1');

        var regex = /\\begin\{tabular\}(?:\[[^\]]*\])?\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/gi;

        return str.replace(regex, function(match, colSpec, tableBody) {
            var colDefs = [];
            var cleanColSpec = colSpec.replace(/\s+/g, '');
            // Mở rộng lặp lại *{n}{spec} (ví dụ *{3}{|c|} -> |c||c||c|)
            cleanColSpec = cleanColSpec.replace(/\*\{(\d+)\}\{([^}]+)\}/g, function(_, count, spec) {
                return spec.repeat(parseInt(count, 10));
            });

            var hasLeftBorder = false;
            if (cleanColSpec.startsWith('|')) {
                hasLeftBorder = true;
                cleanColSpec = cleanColSpec.replace(/^\|+/, '');
            }

            for (var c = 0; c < cleanColSpec.length; c++) {
                var ch = cleanColSpec[c];
                if (ch === 'l' || ch === 'c' || ch === 'r' || ch === 'p') {
                    var align = ch === 'r' ? 'right' : (ch === 'c' ? 'center' : 'left');
                    var borderRight = false;
                    if (c + 1 < cleanColSpec.length && cleanColSpec[c + 1] === '|') {
                        borderRight = true;
                    }
                    colDefs.push({ align: align, borderRight: borderRight });
                }
            }

            // Tách các hàng của bảng
            var rawRows = tableBody.split(/\\\\(?:\[[^\]]*\])?/);
            var htmlRows = [];

            for (var r = 0; r < rawRows.length; r++) {
                var rowStr = rawRows[r].trim();
                if (!rowStr) continue;

                var hasTopBorder = false;
                var hasBottomBorder = false;

                while (rowStr.startsWith('\\hline')) {
                    hasTopBorder = true;
                    rowStr = rowStr.replace(/^\\hline\s*/, '').trim();
                }

                while (rowStr.endsWith('\\hline')) {
                    hasBottomBorder = true;
                    rowStr = rowStr.replace(/\\hline\s*$/, '').trim();
                }

                if (rowStr.includes('\\hline')) {
                    hasTopBorder = true;
                    rowStr = rowStr.replace(/\\hline/g, '').trim();
                }

                if (!rowStr) continue;

                var cells = splitTableCells(rowStr);
                var trHtml = '<tr' + (hasTopBorder ? ' class="border-top"' : '') + (hasBottomBorder ? ' class="border-bottom"' : '') + '>';
                var currentColIndex = 0;

                for (var colIdx = 0; colIdx < cells.length; colIdx++) {
                    var rawCell = cells[colIdx].trim();
                    var cellContent = rawCell;
                    var colSpan = 1;
                    var cellAlign = null;
                    var cellBorderRight = false;
                    var cellBorderLeft = false;

                    // Hỗ trợ \multicolumn{num}{align}{content}
                    var multiMatch = cellContent.match(/^\\multicolumn\{(\d+)\}\{([^}]*)\}\{([\s\S]*)\}$/);
                    if (multiMatch) {
                        colSpan = parseInt(multiMatch[1], 10);
                        var multiAlignSpec = multiMatch[2].trim();
                        cellContent = multiMatch[3].trim();
                        if (multiAlignSpec.includes('r')) cellAlign = 'right';
                        else if (multiAlignSpec.includes('c')) cellAlign = 'center';
                        else cellAlign = 'left';

                        if (multiAlignSpec.startsWith('|')) cellBorderLeft = true;
                        if (multiAlignSpec.endsWith('|')) cellBorderRight = true;
                    }

                    var colDef = colDefs[currentColIndex] || { align: 'left', borderRight: false };
                    var finalAlign = cellAlign || colDef.align;
                    var borderClass = [];

                    if ((currentColIndex === 0 && hasLeftBorder) || cellBorderLeft) borderClass.push('border-left');
                    if (colDef.borderRight || cellBorderRight) borderClass.push('border-right');
                    if (hasTopBorder) borderClass.push('border-top');
                    if (hasBottomBorder) borderClass.push('border-bottom');

                    var spanAttr = colSpan > 1 ? ' colspan="' + colSpan + '"' : '';
                    var classAttr = borderClass.length ? ' class="' + borderClass.join(' ') + '"' : '';
                    var styleAttr = ' style="text-align: ' + finalAlign + ';"';

                    trHtml += '<td' + spanAttr + classAttr + styleAttr + '>' + cellContent + '</td>';
                    currentColIndex += colSpan;
                }

                trHtml += '</tr>';
                htmlRows.push(trHtml);
            }

            return '<div class="latex-table-wrapper"><table class="latex-table">' + htmlRows.join('') + '</table></div>';
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    var smpTikzCounter = 0;
    function parseLatexTikz(str) {
        if (!str || !str.includes('\\begin{tikzpicture}')) return str;

        var globalDefs = [];
        var colorMatches = str.match(/\\definecolor\{[^}]+\}\{[^}]+\}\{[^}]+\}/g);
        if (colorMatches) globalDefs = globalDefs.concat(colorMatches);
        var libMatches = str.match(/\\usetikzlibrary\{[^}]+\}/g);
        if (libMatches) globalDefs = globalDefs.concat(libMatches);
        var globalPrefix = globalDefs.join('\n');

        var isDark = true;
        if (typeof document !== 'undefined' && document.body) {
            isDark = !document.body.classList.contains('light-theme') && !document.body.classList.contains('light-mode');
        }
        var filterCss = isDark ? 'svg { filter: invert(1); }' : '';

        var tikzRegex = /\\begin\{tikzpicture\}(?:\[[\s\S]*?\])?[\s\S]*?\\end\{tikzpicture\}/gi;

        return str.replace(tikzRegex, function(match) {
            smpTikzCounter++;
            var frameId = 'smp-tikz-ocr-' + smpTikzCounter + '-' + Math.random().toString(36).substring(2, 7);
            var safeCode = match.trim();
            var escapedCode = encodeURIComponent(safeCode);

            var fullCode = (globalPrefix ? globalPrefix + '\n' : '') + safeCode;

            var iframeSrc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css">
<style>
  html, body {
    margin: 0;
    padding: 8px;
    background: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100%;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  svg {
    max-width: 100%;
    height: auto;
    display: block;
    margin: auto;
    overflow: visible !important;
  }
  ${filterCss}
  .tikz-err {
    color: #f87171;
    font-size: 0.78rem;
    font-family: monospace;
    padding: 6px 10px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
</style>
<script src="https://tikzjax.com/v1/tikzjax.js"><\/script>
</head>
<body>
<script type="text/tikz" data-show-console="false">
\\usetikzlibrary{calc,arrows.meta,positioning}
${fullCode}
<\/script>
<script>
  (function() {
    function notifyParent() {
      var svg = document.querySelector('svg');
      if (svg) {
        var rect = svg.getBoundingClientRect();
        var h = Math.ceil(Math.max(rect.height, svg.clientHeight || 0, 60)) + 24;
        window.parent.postMessage({ type: 'smpTikzResize', id: '${frameId}', height: h }, '*');
      }
    }
    var observer = new MutationObserver(function() {
      if (document.querySelector('svg')) {
        notifyParent();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', function() {
      setTimeout(notifyParent, 400);
      setTimeout(notifyParent, 1200);
      setTimeout(notifyParent, 3000);
    });
  })();
<\/script>
</body>
</html>`;

            var cardHtml = '<div class="latex-tikz-card" id="card-' + frameId + '">'
                + '<div class="latex-tikz-header">'
                + '  <span class="latex-tikz-badge">'
                + '    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>'
                + '    Hình vẽ TikZ'
                + '  </span>'
                + '  <div class="latex-tikz-actions">'
                + '    <button type="button" class="latex-tikz-btn" onclick="copyTikzCode(\'' + frameId + '\')">Sao chép</button>'
                + '    <button type="button" class="latex-tikz-btn" onclick="toggleTikzRaw(\'' + frameId + '\')">Mã TikZ</button>'
                + '    <a href="/tools/GeoGebra.html" target="_blank" class="latex-tikz-btn" title="Mở bộ trích xuất & xem TikZ">GeoGebra →</a>'
                + '  </div>'
                + '</div>'
                + '<div class="latex-tikz-viewport">'
                + '  <iframe id="' + frameId + '" class="latex-tikz-iframe" srcdoc="' + iframeSrc.replace(/"/g, '&quot;') + '" frameborder="0" scrolling="no"></iframe>'
                + '  <pre id="raw-' + frameId + '" class="latex-tikz-raw" style="display:none;" data-code="' + escapedCode + '"><code>' + escapeHtml(safeCode) + '</code></pre>'
                + '</div>'
                + '</div>';

            return cardHtml;
        });
    }

    // ── Xử lý khoảng cách dọc \vspace{...} ──
    function parseLatexVspace(str) {
        if (!str || !str.includes('\\vspace')) return str;
        return str.replace(/\\vspace\*?\{([^}]+)\}/gi, function(match, val) {
            var trimmed = val.trim();
            if (/baselineskip/i.test(trimmed)) {
                var multMatch = trimmed.match(/([0-9.]+)\s*\\?baselineskip/i);
                var mult = multMatch ? parseFloat(multMatch[1]) : 1;
                var emVal = (mult * 1.3).toFixed(2);
                return '<div class="latex-vspace" style="height:' + emVal + 'em;"></div>';
            }
            var dimMatch = trimmed.match(/^(-?[0-9.]+)\s*(cm|mm|in|pt|em|ex|px)?$/i);
            if (dimMatch) {
                var num = parseFloat(dimMatch[1]);
                var unit = (dimMatch[2] || 'pt').toLowerCase();
                if (num < 0) {
                    return '<div class="latex-vspace negative" style="margin-top:' + num + unit + '; height:0;"></div>';
                } else {
                    return '<div class="latex-vspace" style="height:' + num + unit + ';"></div>';
                }
            }
            return '<div class="latex-vspace" style="height:0.5em;"></div>';
        });
    }

    // ── Xử lý khoảng cách ngang \hspace{...} ──
    function parseLatexHspace(str) {
        if (!str || !str.includes('\\hspace')) return str;
        return str.replace(/\\hspace\*?\{([^}]+)\}/gi, function(match, val) {
            var trimmed = val.trim();
            var dimMatch = trimmed.match(/^(-?[0-9.]+)\s*(cm|mm|in|pt|em|ex|px)?$/i);
            if (dimMatch) {
                var num = parseFloat(dimMatch[1]);
                var unit = (dimMatch[2] || 'pt').toLowerCase();
                if (num < 0) {
                    return '<span class="latex-hspace" style="margin-left:' + num + unit + ';"></span>';
                } else {
                    return '<span class="latex-hspace" style="width:' + num + unit + ';"></span>';
                }
            }
            return '<span class="latex-hspace" style="width:1em;"></span>';
        });
    }

    // ── Xử lý căn lề / giãn đều hàng ngang \hfill ──
    function parseLatexHfill(str) {
        if (!str || !str.includes('\\hfill')) return str;
        var lines = str.split(/(<br\s*\/?>|\n)/gi);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.includes('\\hfill')) {
                var rawParts = line.split(/\\hfill/g);
                var partsHtml = rawParts.map(function(p) {
                    var trimmed = p.trim();
                    return '<div class="hfill-part' + (trimmed === '' ? ' empty' : '') + '">' + trimmed + '</div>';
                }).join('');
                lines[i] = '<div class="latex-line-hfill">' + partsHtml + '</div>';
            }
        }
        var res = lines.join('');
        res = res.replace(/<br\s*\/?>\s*(<div class="latex-line-hfill">)/gi, '$1')
                 .replace(/(<\/div>)\s*<br\s*\/?>/gi, '$1');
        return res;
    }

    // Các hàm tương tác toàn cục cho card TikZ
    window.copyTikzCode = function(frameId) {
        var rawEl = document.getElementById('raw-' + frameId);
        if (!rawEl) return;
        var code = decodeURIComponent(rawEl.getAttribute('data-code') || '');
        if (!code) code = rawEl.textContent;
        navigator.clipboard.writeText(code).then(function() {
            if (typeof showToast === 'function') {
                showToast('✓ Đã sao chép mã TikZ vào Clipboard');
            }
        });
    };

    window.toggleTikzRaw = function(frameId) {
        var rawEl = document.getElementById('raw-' + frameId);
        if (rawEl) {
            rawEl.style.display = (rawEl.style.display === 'none') ? 'block' : 'none';
        }
    };

    window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'smpTikzResize' && e.data.id && e.data.height) {
            var frame = document.getElementById(e.data.id);
            if (frame) {
                frame.style.height = Math.max(e.data.height, 100) + 'px';
            }
        }
    });

    // ── Hàm chuẩn bị định dạng LaTeX để xem Preview trực tiếp ──
    function formatLatexForPreview(raw) {
        if (!raw || !raw.trim()) return '';

        let text = raw.trim();

        // 1. Kiểm tra môi trường cấu trúc văn bản (center, flushleft, tabular, table, fbox, section, tikzpicture, vspace, v.v.)
        const hasTextEnvironments = /\\begin\{(?:center|flushleft|flushright|document|tabular|table|tikzpicture)\}/i.test(text) ||
                                    /\\(section|subsection|title|author|fbox|framebox|caption|vspace|hspace|hfill)/i.test(text);

        // 2. Kiểm tra xem đã có math delimiters ($...$, $$...$$, \[...\], \(...\))
        // hoặc các môi trường display math độc lập (equation, align, gather, multline)
        const hasTopLevelDelimiters = text.includes('$') || 
                                     text.includes('\\[') || 
                                     text.includes('$$') || 
                                     text.includes('\\(') ||
                                     text.startsWith('\\begin{align') || 
                                     text.startsWith('\\begin{equation') || 
                                     text.startsWith('\\begin{gather') || 
                                     text.startsWith('\\begin{multline');

        // 3. Nếu chuỗi KHÔNG có text environments VÀ hoàn toàn KHÔNG có math delimiter nào:
        // Đa số là công thức toán thuần túy (\frac, x^2, \begin{cases}, \begin{pmatrix}, v.v.)
        // Ta bọc toàn bộ trong \[ ... \] để MathJax render toán học chuẩn xác
        if (!hasTextEnvironments && !hasTopLevelDelimiters) {
            return `\\[ ${text} \\]`;
        }

        // 4. Chuyển đổi môi trường TikZ trước tiên để ngăn MathJax báo lỗi "Unknown environment 'tikzpicture'"
        text = parseLatexTikz(text);

        // 5. Xử lý môi trường bảng table & tabular
        text = text
            .replace(/\\begin\{table\}(?:\[[^\]]*\])?/gi, '<div class="latex-table-container">')
            .replace(/\\end\{table\}/gi, '</div>')
            .replace(/\\caption\{([^}]*)\}/gi, '<div class="latex-table-caption">$1</div>');

        text = parseLatexTabular(text);

        // 6. Đảm bảo các sub-environments như \begin{cases}, \begin{matrix}, \begin{pmatrix}, \begin{aligned}
        // nếu đứng ngoài math mode thì được bọc trong \[ ... \]
        text = text.replace(/(?<![\$\\])(\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|gathered|array)\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|gathered|array)\})/g, function(match) {
            return `\\[ ${match} \\]`;
        });

        // 7. Xử lý các định dạng chữ và căn lề văn bản bên ngoài math mode
        text = processOutsideMath(text, function(t) {
            var res = t
                .replace(/\\begin\{center\}/gi, '<div class="latex-center">')
                .replace(/\\end\{center\}/gi, '</div>')
                .replace(/\\begin\{flushleft\}/gi, '<div class="latex-flushleft">')
                .replace(/\\end\{flushleft\}/gi, '</div>')
                .replace(/\\begin\{flushright\}/gi, '<div class="latex-flushright">')
                .replace(/\\end\{flushright\}/gi, '</div>')
                .replace(/\\centering\b/gi, '<div class="latex-center">');

            res = parseLatexFbox(res);

            // Chuyển đổi \vspace và \hspace
            res = parseLatexVspace(res);
            res = parseLatexHspace(res);

            res = res
                .replace(/\\textbf\{([^}]*)\}/g, '<b>$1</b>')
                .replace(/\\textit\{([^}]*)\}/g, '<i>$1</i>')
                .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
                .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
                .replace(/\\title\{([^}]*)\}/g, '<h1>$1</h1>')
                .replace(/\\author\{([^}]*)\}/g, '<h2>$1</h2>')
                .replace(/\\section\{([^}]*)\}/g, '<h2>$1</h2>')
                .replace(/\\subsection\{([^}]*)\}/g, '<h3>$1</h3>')
                .replace(/\\subsubsection\{([^}]*)\}/g, '<h4>$1</h4>')
                .replace(/\\item\s+/g, '• ')
                .replace(/\\noindent\s*/g, '')
                .replace(/\\\\(?![a-zA-Z])/g, '<br>')
                .replace(/\\(medskip|bigskip|smallskip)/g, '<br>')
                .replace(/\n\s*\n/g, '<br><br>');

            return res;
        });

        // 8. Chuyển đổi \hfill trên toàn dòng
        text = parseLatexHfill(text);

        return text;
    }

    // ── Render Preview MathJax ────────────────────────────
    function renderLatexPreview(latexText) {
        if (!latexText || !latexText.trim()) {
            mathPreview.className = 'empty-state';
            mathPreview.innerHTML = 'Kết quả render công thức toán học sẽ hiển thị tại đây sau khi quét ảnh...';
            return;
        }

        mathPreview.className = '';
        mathPreview.innerHTML = formatLatexForPreview(latexText);

        if (window.MathJax && window.MathJax.typesetPromise) {
            try {
                if (window.MathJax.typesetClear) {
                    window.MathJax.typesetClear([mathPreview]);
                }
                window.MathJax.typesetPromise([mathPreview]).catch(err => {
                    console.warn('MathJax preview warning:', err);
                });
            } catch (e) {
                console.warn('MathJax error:', e);
            }
        }
    }

    // ── Chuyển Đổi Tab Xem Preview / Mã Raw ─────────────────
    window.switchResultTab = function(tabName) {
        const previewTabBtn = document.getElementById('tab-preview-btn');
        const rawTabBtn = document.getElementById('tab-raw-btn');
        const previewView = document.getElementById('ocr-preview-view');
        const rawView = document.getElementById('ocr-raw-view');

        if (tabName === 'preview') {
            previewTabBtn.classList.add('active');
            rawTabBtn.classList.remove('active');
            previewView.style.display = 'flex';
            rawView.style.display = 'none';
        } else {
            rawTabBtn.classList.add('active');
            previewTabBtn.classList.remove('active');
            rawView.style.display = 'flex';
            previewView.style.display = 'none';
        }
    };

    // ── Sao Chép Mã LaTeX ─────────────────────────────────
    window.copyLatex = function() {
        const text = latexOutput.value || currentLatex;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            showToast('✓ Đã sao chép mã LaTeX vào Clipboard!');
        }).catch(err => {
            latexOutput.select();
            document.execCommand('copy');
            showToast('✓ Đã sao chép mã LaTeX!');
        });
    };

    // ── Mở Trong Trình Soạn Thảo LaTeX (Tool 1) ─────────────
    window.sendToLatexEditor = function() {
        const text = (latexOutput && latexOutput.value.trim().length > 0) ? latexOutput.value.trim() : (currentLatex || '').trim();
        if (!text) return;

        localStorage.setItem('smp_latex_transfer', text);
        showToast('⚡ Đang mở trong Trình Soạn Thảo LaTeX...');
        setTimeout(() => {
            window.location.href = '/tools/latex-v2/index.html';
        }, 350);
    };

    // ── Mở Trong MathType (Tool 2) ─────────────────────────
    window.sendToMathType = function() {
        const text = (latexOutput && latexOutput.value.trim().length > 0) ? latexOutput.value.trim() : (currentLatex || '').trim();
        if (!text) return;

        localStorage.setItem('smp_latex_transfer', text);
        showToast('✏️ Đang mở trong MathType...');
        setTimeout(() => {
            window.location.href = '/tools/MathType-v2.html';
        }, 350);
    };

    // ── Toast Thông Báo Nổi ────────────────────────────────
    let toastTimeout = null;
    function showToast(message) {
        const toast = document.getElementById('ocr-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ── Lắng nghe chỉnh sửa trực tiếp trên ô Mã LaTeX để cập nhật realtime Preview ──
    if (latexOutput) {
        latexOutput.addEventListener('input', () => {
            const val = latexOutput.value;
            currentLatex = val;
            if (charMeta) charMeta.textContent = `${val.length} ký tự`;
            renderLatexPreview(val);
            const hasVal = val.trim().length > 0;
            if (btnCopy) btnCopy.disabled = !hasVal;
            if (btnSendLatex) btnSendLatex.disabled = !hasVal;
            if (btnSendMathType) btnSendMathType.disabled = !hasVal;
        });
    }

})();
