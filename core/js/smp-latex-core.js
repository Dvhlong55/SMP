// ==========================================
// SMP LÕI SOẠN THẢO LATEX (CodeMirror Core)
// Dùng cho các Form nhập liệu (Đề bài, Lời giải...)
// Không bao gồm Toolbar Kéo thả hay Split.js
// ==========================================

window.SMPLatexCore = {
    snippets: [
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
    ],

    latexHint: function(cm) {
        var cur = cm.getCursor();
        var line = cm.getLine(cur.line);
        var match = line.slice(0, cur.ch).match(/\\[a-zA-Z]*$/);
        if (!match) return null;

        var word = match[0];
        var start = cur.ch - word.length;
        
        var list = SMPLatexCore.snippets.filter(function(item) {
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
    },

    init: function(textareaId) {
        var textarea = document.getElementById(textareaId);
        if (!textarea) return null;

        // Bọc textarea trong một div tương đối để gài bộ đếm ký tự
        var wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.marginTop = '8px';
        wrapper.style.marginBottom = '8px';
        textarea.parentNode.insertBefore(wrapper, textarea);
        wrapper.appendChild(textarea);

        var cmEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'stex',
            theme: 'material-darker',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            styleActiveLine: true,
            extraKeys: {
                "Ctrl-Space": "autocomplete"
            }
        });

        // Ensure gutter width is calculated correctly when container becomes visible
        if (window.IntersectionObserver) {
            var observer = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting) {
                    cmEditor.refresh();
                }
            }, { root: null }); // root null = viewport
            observer.observe(cmEditor.getWrapperElement());
        } else {
            setTimeout(function() { cmEditor.refresh(); }, 500);
            setTimeout(function() { cmEditor.refresh(); }, 1500);
        }
        cmEditor.on('focus', function() { cmEditor.refresh(); });
        var statusBar = document.createElement('div');
        statusBar.style.display = 'flex';
        statusBar.style.justifyContent = 'space-between';
        statusBar.style.alignItems = 'center';
        statusBar.style.padding = '6px 12px';
        statusBar.style.background = 'rgba(255,255,255,0.02)';
        statusBar.style.border = '1px solid rgba(92,225,230,0.1)';
        statusBar.style.borderTop = 'none';
        statusBar.style.borderBottomLeftRadius = '6px';
        statusBar.style.borderBottomRightRadius = '6px';
        statusBar.style.fontFamily = "'JetBrains Mono', monospace";
        statusBar.style.fontSize = '0.75rem';
        statusBar.style.color = 'var(--text-muted, #888)';
        
        var leftSpan = document.createElement('span');
        leftSpan.innerHTML = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#5ce1e6;margin-right:6px;box-shadow:0 0 5px #5ce1e6;"></span> LaTeX Editor v2 Core';
        
        var rightSpan = document.createElement('span');
        rightSpan.textContent = '0 ký tự | 0 từ | 0 dòng';
        
        statusBar.appendChild(leftSpan);
        statusBar.appendChild(rightSpan);
        wrapper.appendChild(statusBar);

        // Nút mở trình soạn thảo đầy đủ
        var fullEditorBtn = document.createElement('a');
        fullEditorBtn.href = '/SMP/tools/latex-v2/index.html';
        fullEditorBtn.target = '_blank';
        fullEditorBtn.innerHTML = 'Mở Trình Soạn Thảo Đầy Đủ ↗';
        fullEditorBtn.style.position = 'absolute';
        fullEditorBtn.style.top = '10px';
        fullEditorBtn.style.right = '10px';
        fullEditorBtn.style.zIndex = '10';
        fullEditorBtn.style.fontSize = '0.75rem';
        fullEditorBtn.style.background = 'rgba(92,225,230,0.15)';
        fullEditorBtn.style.border = '1px solid rgba(92,225,230,0.4)';
        fullEditorBtn.style.color = '#5ce1e6';
        fullEditorBtn.style.padding = '4px 8px';
        fullEditorBtn.style.borderRadius = '4px';
        fullEditorBtn.style.textDecoration = 'none';
        fullEditorBtn.style.transition = 'all 0.2s';
        fullEditorBtn.onmouseover = function() { this.style.background = 'rgba(92,225,230,0.25)'; };
        fullEditorBtn.onmouseout = function() { this.style.background = 'rgba(92,225,230,0.15)'; };

        // Wrapper for CodeMirror
        cmEditor.getWrapperElement().style.borderRadius = '6px 6px 0 0';
        cmEditor.getWrapperElement().style.borderBottom = 'none';
        cmEditor.getWrapperElement().appendChild(fullEditorBtn);

        // Cập nhật số ký tự
        cmEditor.on('change', function () {
            textarea.value = cmEditor.getValue(); // Sync to textarea for form submit
            textarea.dispatchEvent(new Event('input')); // Trigger oninput for live preview
            var val = cmEditor.getValue();
            var words = val.trim().split(/\s+/).filter(function(x) { return x.length > 0; }).length;
            var lines = val.length === 0 ? 0 : val.split('\n').length;
            rightSpan.textContent = val.length + ' ký tự | ' + words + ' từ | ' + lines + ' dòng';
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

        cmEditor.on("inputRead", function(cm, change) {
            if (change.text[0] === '\\' || change.text[0].match(/[a-zA-Z]/)) {
                if (!cm.state.completionActive) {
                    var cur = cm.getCursor();
                    var line = cm.getLine(cur.line);
                    var match = line.slice(0, cur.ch).match(/\\[a-zA-Z]*$/);
                    if (match) {
                        CodeMirror.showHint(cm, SMPLatexCore.latexHint, { completeSingle: false });
                    }
                }
            }
        });

        return cmEditor;
    }
};
