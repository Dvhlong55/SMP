    // Init
    var cmEditor = null;

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof Comments !== 'undefined') Comments.init('LaTeXEditor');

        var textarea = document.getElementById('latex-editor');
        
        cmEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'stex',
            theme: 'material-darker',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            extraKeys: {
                "Ctrl-B": function(cm) { insertSnip('\\textbf{}'); },
                "Cmd-B": function(cm) { insertSnip('\\textbf{}'); },
                "Ctrl-I": function(cm) { insertSnip('\\textit{}'); },
                "Cmd-I": function(cm) { insertSnip('\\textit{}'); },
                "Ctrl-M": function(cm) { insertSnip('$$$$'); },
                "Cmd-M": function(cm) { insertSnip('$$$$'); }
            }
        });

        // Intercept keys for LaTeX auto-close brackets
        cmEditor.on('keydown', function(cm, e) {
            if (e.key === '[' || e.key === '(' || e.key === '{') {
                var cur = cm.getCursor();
                if (cur.ch > 0 && cm.getRange({line: cur.line, ch: cur.ch - 1}, cur) === '\\') {
                    e.preventDefault();
                    var close = e.key === '[' ? '\\]' : (e.key === '(' ? '\\)' : '\\}');
                    cm.replaceSelection(e.key + close);
                    var newCur = cm.getCursor();
                    cm.setCursor({line: newCur.line, ch: newCur.ch - 2});
                }
            } else if (e.key === '$') {
                if (cm.somethingSelected()) {
                    e.preventDefault();
                    cm.replaceSelection("$" + cm.getSelection() + "$");
                } else {
                    var cur = cm.getCursor();
                    if (cm.getRange(cur, {line: cur.line, ch: cur.ch + 1}) === '$') {
                        e.preventDefault();
                        cm.setCursor({line: cur.line, ch: cur.ch + 1});
                    } else {
                        e.preventDefault();
                        cm.replaceSelection("$$");
                        var newCur = cm.getCursor();
                        cm.setCursor({line: newCur.line, ch: newCur.ch - 1});
                    }
                }
            }
        });

        // Auto-restore from localStorage or import from Quick Viewer
        var importedData = localStorage.getItem('smp_latex_editor_import');
        if (importedData) {
            cmEditor.setValue(importedData);
            localStorage.removeItem('smp_latex_editor_import');
            setTimeout(doRender, 100);
        } else {
            var savedData = localStorage.getItem('smp_latex_autosave');
            if (savedData) {
                cmEditor.setValue(savedData);
                setTimeout(doRender, 100);
            }
        }

        // Check for transfer from MathType or LaTeX-OCR
        var transferData = localStorage.getItem('smp_latex_transfer');
        if (transferData) {
            var curr = cmEditor.getValue();
            var contentToAdd = transferData.trim();
            cmEditor.setValue(curr ? (curr + '\n\n' + contentToAdd) : contentToAdd);
            localStorage.removeItem('smp_latex_transfer');
            setTimeout(doRender, 100);
        }

        var charCount = document.getElementById('char-count');
        
        cmEditor.on('change', function () {
            var val = cmEditor.getValue();
            var words = val.trim().split(/\s+/).filter(function(x) { return x.length > 0; }).length;
            var lines = val.length === 0 ? 0 : val.split('\n').length;
            charCount.textContent = val.length + ' ký tự | ' + words + ' từ | ' + lines + ' dòng';
            
        // Auto-save
            localStorage.setItem('smp_latex_autosave', val);
            
            scheduleRender();
        });

        // Split.js
        if (typeof Split !== 'undefined') {
            Split(['.editor-pane', '.preview-pane'], {
                sizes: [50, 50],
                minSize: 250,
                gutterSize: 8,
            });
        }

        // Sync Scroll
        cmEditor.on('scroll', function(cm) {
            var info = cm.getScrollInfo();
            var pct = info.top / (info.height - info.clientHeight);
            if (isNaN(pct) || pct < 0) pct = 0;
            if (pct > 1) pct = 1;
            
            var p = document.getElementById('latex-preview');
            p.scrollTop = pct * (p.scrollHeight - p.clientHeight);
        });

        // Autocomplete Hint
        var latexSnippets = [
            { text: "\\frac{}{}", displayText: "\\frac{}{} - Phân số", offset: 2 },
            { text: "\\sqrt{}", displayText: "\\sqrt{} - Căn", offset: 1 },
            { text: "\\sqrt[]{}", displayText: "\\sqrt[]{} - Căn bậc n", offset: 3 },
            { text: "\\sum_{i=1}^{n}", displayText: "\\sum - Tổng", offset: 0 },
            { text: "\\prod_{i=1}^{n}", displayText: "\\prod - Tích", offset: 0 },
            { text: "\\int_{a}^{b}", displayText: "\\int - Tích phân", offset: 0 },
            { text: "\\textbf{}", displayText: "\\textbf{} - In đậm", offset: 1 },
            { text: "\\textit{}", displayText: "\\textit{} - In nghiêng", offset: 1 },
            { text: "\\mathbb{}", displayText: "\\mathbb{} - Phông toán học kép (R, N, Z)", offset: 1 },
            { text: "\\mathbf{}", displayText: "\\mathbf{} - Phông chữ đậm toán học", offset: 1 },
            { text: "\\mathcal{}", displayText: "\\mathcal{} - Phông chữ thư pháp", offset: 1 },
            { text: "\\mathrm{}", displayText: "\\mathrm{} - Phông chữ La Mã", offset: 1 },
            { text: "\\mathsf{}", displayText: "\\mathsf{} - Phông chữ Sans Serif", offset: 1 },
            { text: "\\begin{cases}\n  & \\\\\n  &\n\\end{cases}", displayText: "\\begin{cases} - Hệ phương trình", offset: 22 },
            { text: "\\begin{align*}\n  \n\\end{align*}", displayText: "\\begin{align*} - Căn lề nhiều dòng", offset: 13 },
            { text: "\\begin{pmatrix}\n  & \\\\\n  &\n\\end{pmatrix}", displayText: "\\begin{pmatrix} - Ma trận ngoặc tròn", offset: 19 },
            { text: "\\Rightarrow", displayText: "\\Rightarrow - Suy ra", offset: 0 },
            { text: "\\Leftrightarrow", displayText: "\\Leftrightarrow - Tương đương", offset: 0 },
            { text: "\\infty", displayText: "\\infty - Vô cực", offset: 0 },
            { text: "\\alpha", displayText: "\\alpha", offset: 0 },
            { text: "\\beta", displayText: "\\beta", offset: 0 },
            { text: "\\gamma", displayText: "\\gamma", offset: 0 },
            { text: "\\Delta", displayText: "\\Delta", offset: 0 },
            { text: "\\pi", displayText: "\\pi", offset: 0 },
            { text: "\\le", displayText: "\\le - Nhỏ hơn hoặc bằng", offset: 0 },
            { text: "\\ge", displayText: "\\ge - Lớn hơn hoặc bằng", offset: 0 },
            { text: "\\neq", displayText: "\\neq - Khác", offset: 0 },
            { text: "\\equiv", displayText: "\\equiv - Đồng dư", offset: 0 },
            { text: "\\pmod{}", displayText: "\\pmod{} - Modulo", offset: 1 },
            { text: "\\forall", displayText: "\\forall - Với mọi", offset: 0 },
            { text: "\\exists", displayText: "\\exists - Tồn tại", offset: 0 },
            { text: "\\in", displayText: "\\in - Thuộc", offset: 0 },
            { text: "\\subset", displayText: "\\subset - Tập con", offset: 0 },
            { text: "\\cup", displayText: "\\cup - Hợp", offset: 0 },
            { text: "\\cap", displayText: "\\cap - Giao", offset: 0 },
            { text: "\\emptyset", displayText: "\\emptyset - Tập rỗng", offset: 0 },
            { text: "\\begin{center}\n  \n\\end{center}", displayText: "\\begin{center} - Căn giữa nội dung", offset: 13 },
            { text: "\\fbox{}", displayText: "\\fbox{} - Đóng khung viền", offset: 1 },
            { text: "\\begin{tabular}{ll}\n  & \\\\\n  &\n\\end{tabular}", displayText: "\\begin{tabular}{ll} - Bảng 2 cột", offset: 19 },
            { text: "\\begin{tabular}{|c|c|}\n\\hline\n  & \\\\\n\\hline\n  & \\\\\n\\hline\n\\end{tabular}", displayText: "\\begin{tabular}{|c|c|} - Bảng có viền", offset: 32 }
        ];

        function latexHint(cm) {
            var cur = cm.getCursor();
            var line = cm.getLine(cur.line);
            var match = line.slice(0, cur.ch).match(/\\[a-zA-Z]*$/);
            if (!match) return null;

            var word = match[0];
            var start = cur.ch - word.length;
            
            var list = latexSnippets.filter(function(item) {
                return item.text.startsWith(word);
            });

            if (list.length === 0) return null;

            return {
                list: list.map(function(item) {
                    return {
                        text: item.text,
                        displayText: item.displayText,
                        hint: function(cm, data, completion) {
                            cm.replaceRange(completion.text, {line: cur.line, ch: start}, {line: cur.line, ch: cur.ch});
                            if (item.offset > 0) {
                                var newCur = cm.getCursor();
                                cm.setCursor({line: newCur.line, ch: newCur.ch - item.offset});
                            }
                        }
                    };
                }),
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, cur.ch)
            };
        }

        cmEditor.on("inputRead", function(cm, change) {
            if (change.text[0] === '\\' || change.text[0].match(/[a-zA-Z]/)) {
                if (!cm.state.completionActive) {
                    var cur = cm.getCursor();
                    var line = cm.getLine(cur.line);
                    var match = line.slice(0, cur.ch).match(/\\[a-zA-Z]*$/);
                    if (match) {
                        CodeMirror.showHint(cm, latexHint, { completeSingle: false });
                    }
                }
            }
        });

        // ── Toolbar Drag & Drop (SortableJS) ──
        var toolbarEl = document.getElementById('snippet-toolbar');
        if (toolbarEl && typeof Sortable !== 'undefined') {
            // Khôi phục thứ tự đã lưu
            var savedOrder = localStorage.getItem('latexToolbarOrder');
            if (savedOrder) {
                try {
                    var orderArr = JSON.parse(savedOrder);
                    orderArr.forEach(function(id) {
                        var el = toolbarEl.querySelector('[data-id="' + id + '"]');
                        if (el) toolbarEl.appendChild(el);
                    });
                } catch (e) { console.error('Lỗi khi khôi phục vị trí toolbar', e); }
            }

            // Kích hoạt kéo thả
            Sortable.create(toolbarEl, {
                animation: 200,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                onEnd: function() {
                    // Lưu lại thứ tự mới
                    var items = toolbarEl.querySelectorAll('.snip-group-row');
                    var order = Array.from(items).map(function(item) {
                        return item.getAttribute('data-id');
                    });
                    localStorage.setItem('latexToolbarOrder', JSON.stringify(order));
                }
            });
        }
    });

    // ── Render ──
    var renderTimer = null;
    function scheduleRender() {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(doRender, 500);
    }

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
                // Bỏ qua các đối số tùy chọn [width][pos]
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

    // ── Xử lý văn bản bên ngoài chế độ toán học để không làm hỏng công thức math ──
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
            var frameId = 'smp-tikz-' + smpTikzCounter + '-' + Math.random().toString(36).substring(2, 7);
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

    // ── Hàm chuyển đổi định dạng LaTeX thông thường sang HTML ──
    function latexToHtml(src) {
        if (!src) return '';

        // 1. Chuyển đổi môi trường TikZ trước tiên để ngăn MathJax báo lỗi "Unknown environment 'tikzpicture'"
        var s = parseLatexTikz(src);

        // 2. Chuyển đổi môi trường table & tabular
        s = s
            .replace(/\\begin\{table\}(?:\[[^\]]*\])?/gi, '<div class="latex-table-container">')
            .replace(/\\end\{table\}/gi, '</div>')
            .replace(/\\caption\{([^}]*)\}/gi, '<div class="latex-table-caption">$1</div>');

        s = parseLatexTabular(s);

        // 3. Tách biệt giữa phần văn bản và phần công thức toán học
        var processed = processOutsideMath(s, function(text) {
            // Chuyển đổi môi trường căn lề văn bản
            var t = text
                .replace(/\\begin\{center\}/gi, '<div class="latex-center">')
                .replace(/\\end\{center\}/gi, '</div>')
                .replace(/\\begin\{flushleft\}/gi, '<div class="latex-flushleft">')
                .replace(/\\end\{flushleft\}/gi, '</div>')
                .replace(/\\begin\{flushright\}/gi, '<div class="latex-flushright">')
                .replace(/\\end\{flushright\}/gi, '</div>')
                .replace(/\\centering\b/gi, '<div class="latex-center">');

            // Chuyển đổi \fbox, \framebox, \boxed trong chế độ văn bản
            t = parseLatexFbox(t);

            // Chuyển đổi \vspace và \hspace
            t = parseLatexVspace(t);
            t = parseLatexHspace(t);

            // Chuyển đổi các định dạng văn bản chuẩn
            t = t
                .replace(/\\textbf\{([^}]*)\}/g, '<b>$1</b>')
                .replace(/\\textit\{([^}]*)\}/g, '<i>$1</i>')
                .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
                .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
                .replace(/\\title\{([^}]*)\}/g, '<h1>$1</h1>')
                .replace(/\\author\{([^}]*)\}/g, '<h2>$1</h2>')
                .replace(/\\section\{([^}]*)\}/g, '<h2>$1</h2>')
                .replace(/\\subsection\{([^}]*)\}/g, '<h3>$1</h3>')
                .replace(/\\subsubsection\{([^}]*)\}/g, '<h4>$1</h4>')
                .replace(/\\item\s/g, '• ')
                .replace(/\\noindent\s*/g, '')
                .replace(/\\\\(?![a-zA-Z])/g, '<br>')
                .replace(/\\(medskip|bigskip|smallskip)/g, '<br>')
                .replace(/\n\s*\n/g, '<br><br>');

            return t;
        });

        // 4. Chuyển đổi \hfill trên toàn dòng
        processed = parseLatexHfill(processed);

        return processed;
    }

    var renderedBlocks = [];

    // ── Hàm Render chính (MathJax render realtime với DOM-diffing cục bộ) ──
    function doRender() {
        var preview = document.getElementById('latex-preview');
        var src = cmEditor ? cmEditor.getValue().trim() : '';
        if (!src) {
            preview.className = 'empty-state';
            preview.innerHTML = 'Kết quả render sẽ hiện ở đây...';
            renderedBlocks = [];
            return;
        }
        preview.className = '';
        
        // Tránh ngắt block bên trong các môi trường bảng hoặc môi trường nhiều dòng
        var protectedSrc = src.replace(/(\\begin\{(?:tabular|table)\}[\s\S]*?\\end\{(?:tabular|table)\})/gi, function(match) {
            return match.replace(/\n\s*\n/g, '\n');
        });

        // Split theo block (cách nhau bằng dòng trống)
        var blocks = protectedSrc.split(/\n\s*\n/);
        var fragment = document.createDocumentFragment();
        var newRenderedBlocks = [];
        var blocksToMathJax = [];

        for (var i = 0; i < blocks.length; i++) {
            var bSrc = blocks[i].trim();
            if (!bSrc) continue;

            // Tìm block cũ có src tương tự để tái sử dụng
            var existingIdx = renderedBlocks.findIndex(function(rb) { return rb.src === bSrc; });
            
            if (existingIdx !== -1) {
                var existing = renderedBlocks[existingIdx];
                fragment.appendChild(existing.el);
                newRenderedBlocks.push(existing);
                // Xóa khỏi mảng cũ để tối ưu việc tìm kiếm các block trùng lặp
                renderedBlocks.splice(existingIdx, 1);
            } else {
                // Tạo block mới và parse HTML thô
                var el = document.createElement('div');
                el.className = 'preview-block';
                el.innerHTML = latexToHtml(bSrc);
                fragment.appendChild(el);
                
                newRenderedBlocks.push({ src: bSrc, el: el });
                blocksToMathJax.push(el);
            }
        }

        // Cập nhật DOM một lần duy nhất
        preview.innerHTML = '';
        preview.appendChild(fragment);
        renderedBlocks = newRenderedBlocks;
        
        // Chỉ gọi MathJax xử lý cho các block MỚI bị thay đổi
        if (blocksToMathJax.length > 0 && window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetClear(blocksToMathJax);
            MathJax.typesetPromise(blocksToMathJax).catch(function (e) { console.warn('MathJax:', e); });
        }
    }

    // ── Insert snippet ──
    function insertSnip(text) {
        if (!cmEditor) return;
        cmEditor.focus();
        var real = text.replace(/\\n/g, '\n');
        var selected = cmEditor.getSelection();
        
        var insertStr = real;
        var moveBack = 0;
        
        if (real.endsWith('{}')) {
            insertStr = real.slice(0, -1) + selected + '}';
            if (selected.length === 0) moveBack = 1;
        } else if (real === '$$$$') {
            insertStr = '$$' + selected + '$$';
            if (selected.length === 0) moveBack = 2;
        } else if (selected.length > 0) {
            insertStr = real;
        }

        cmEditor.replaceSelection(insertStr);
        
        if (moveBack > 0) {
            var pos = cmEditor.getCursor();
            cmEditor.setCursor({line: pos.line, ch: pos.ch - moveBack});
        }
    }

    // ── Templates ──
    var TEMPLATES = {
        problem: '\\textbf{Bài toán.} Cho $a, b, c > 0$ thỏa mãn $a + b + c = 1$. Chứng minh:\n\\[\n  \\frac{a^2}{b+c} + \\frac{b^2}{a+c} + \\frac{c^2}{a+b} \\ge \\frac{1}{2}\n\\]',
        proof: '\\textbf{Chứng minh.}\n\nTa có:\n\\[\n  \\text{(Điền bước 1)}\n\\]\n\nTiếp theo:\n\\[\n  \\text{(Điền bước 2)}\n\\]\n\nVậy bất đẳng thức được chứng minh. $\\square$',
        sequence: '\\textbf{Bài toán.} Cho dãy số $\\langle a_n \\rangle_{n \\ge 1}$ xác định bởi:\n\\[\n  a_1 = 1, \\quad a_n = a_{n-1} + 2n - 1 \\quad (n \\ge 2)\n\\]\n\n\\textbf{a)} Tìm công thức tổng quát $a_n$.\n\n\\textbf{b)} Tìm tất cả $n$ sao cho $3 \\mid a_n$.',
        numbertheory: '\\textbf{Bài toán.} Giả sử $p$ là số nguyên tố và $n \\in \\mathbb{N}^*$.\nChứng minh rằng:\n\\[\n  p \\mid \\binom{p}{k} \\quad \\forall k \\in \\{1, 2, \\ldots, p-1\\}\n\\]'
    };

    function insertTemplate(key) {
        if (!cmEditor) return;
        cmEditor.setValue(TEMPLATES[key] || '');
        cmEditor.focus();
    }

    // ── Actions ──
    function clearEditor() {
        if (!confirm('Xóa toàn bộ nội dung?')) return;
        if (cmEditor) cmEditor.setValue('');
    }

    function copySource() {
        var val = cmEditor ? cmEditor.getValue() : '';
        navigator.clipboard.writeText(val).then(function () {
            showToast('✓ Đã copy source LaTeX');
        });
    }

    function copyRendered() {
        var text = document.getElementById('latex-preview').innerText;
        navigator.clipboard.writeText(text).then(function () {
            showToast('✓ Đã copy nội dung preview');
        });
    }

    function printPreview() {
        var content = document.getElementById('latex-preview').innerHTML;
        var win = window.open('', '_blank');
        if (!win) { showToast('Vui lòng cho phép popup để in PDF'); return; }
        var head = '\x3C!DOCTYPE html\x3E\x3Chtml\x3E\x3Chead\x3E'
            + '\x3Cmeta charset="UTF-8"\x3E\x3Ctitle\x3ESMP LaTeX Export\x3C/title\x3E'
            + '\x3Cscript\x3Ewindow.MathJax={tex:{inlineMath:[["$","$"],["\\\\(","\\\\)"]],displayMath:[["$$","$$"],["\\\\[","\\\\]"]]}};\x3C/script\x3E'
            + '\x3Cscript src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"\x3E\x3C/script\x3E'
            + '\x3Cstyle\x3Ebody{font-family:"Times New Roman",serif;margin:40px 60px;font-size:12pt;line-height:1.8;color:#000;white-space:pre-wrap;}h1,h2{text-align:center}h3{text-align:left}@media print{body{margin:20mm 25mm}}\x3C/style\x3E'
            + '\x3C/head\x3E\x3Cbody\x3E' + content + '\x3C/body\x3E\x3C/html\x3E';
        win.document.write(head);
        win.document.close();
        win.onload = function () {
            setTimeout(function () { win.print(); }, 1800);
        };
    }

    function exportTex() {
        var src = cmEditor ? cmEditor.getValue() : '';
        var template = "\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath, amssymb}\n\\begin{document}\n\n" + src + "\n\n\\end{document}";
        var blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'export.tex';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('✓ Đã tải xuống export.tex');
    }

    // ── Toast ──
    function showToast(msg) {
        var t = document.getElementById('smp-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'smp-toast';
            t.style.cssText = 'position:fixed;bottom:26px;right:26px;background:rgba(11,17,17,0.96);border:1px solid rgba(92,225,230,0.4);border-radius:10px;padding:11px 20px;color:#5ce1e6;font-family:\'JetBrains Mono\',monospace;font-size:0.80rem;z-index:10000;transition:opacity 0.3s;pointer-events:none;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(t._t);
        t._t = setTimeout(function () { t.style.opacity = '0'; }, 2200);
    }

    // ── Zen Mode ──
    function toggleZenMode() {
        document.body.classList.toggle('zen-mode');
        showToast(document.body.classList.contains('zen-mode') ? '✓ Đã bật Chế độ Zen' : '✓ Đã tắt Chế độ Zen');
        
        // Trigger resize so Split.js and CodeMirror can adjust layout correctly
        setTimeout(function() {
            window.dispatchEvent(new Event('resize'));
            if (cmEditor) cmEditor.refresh();
        }, 100);
    }
