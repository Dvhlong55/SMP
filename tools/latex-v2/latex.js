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

        // Auto-restore from localStorage
        var savedData = localStorage.getItem('smp_latex_autosave');
        if (savedData) {
            cmEditor.setValue(savedData);
            setTimeout(doRender, 100);
        }

        // Check for transfer from MathType
        var transferData = localStorage.getItem('smp_latex_transfer');
        if (transferData) {
            var curr = cmEditor.getValue();
            cmEditor.setValue(curr + (curr ? '\n\n' : '') + '\\[' + transferData + '\\]');
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
            { text: "\\emptyset", displayText: "\\emptyset - Tập rỗng", offset: 0 }
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

    // ── Hàm chuyển đổi thô (Render các định dạng LaTeX thông thường sang HTML) ──
    function latexToHtml(src) {
        var tempSrc = src
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\\textbf\{([^}]*)\}/g, '<b>$1</b>')
            .replace(/\\textit\{([^}]*)\}/g, '<i>$1</i>')
            .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
            .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
            .replace(/\\title\{([^}]*)\}/g, '<h1>$1</h1>')
            .replace(/\\author\{([^}]*)\}/g, '<h2>$1</h2>')
            .replace(/\\section\{([^}]*)\}/g, '<h2>$1</h2>')
            .replace(/\\subsection\{([^}]*)\}/g, '<h3>$1</h3>')
            .replace(/\\item\s/g, '• ')
            .replace(/\\noindent\s*/g, '')
            .replace(/\\(medskip|bigskip|smallskip)/g, '<br>');

        return tempSrc;
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
        
        // Split theo block (cách nhau bằng dòng trống)
        var blocks = src.split(/\n\s*\n/);
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
