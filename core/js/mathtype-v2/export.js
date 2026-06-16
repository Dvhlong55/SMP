function copyLatex() {
        var text = document.getElementById('latex-output').value;
        if(!text) return;
        navigator.clipboard.writeText(text).then(function () {
            showToast('Đã copy mã LaTeX');
        });
    }

    function copyWord() {
        var text = document.getElementById('latex-output').value;
        if(!text) {
            showToast('Chưa có công thức để copy!');
            return;
        }
        
        if (!window.MathJax || !MathJax.tex2mmlPromise) {
            showToast('Đang tải công cụ chuyển đổi, vui lòng đợi...');
            return;
        }
        
        MathJax.tex2mmlPromise(text).then(function(mml) {
            // Fix thần thánh cho MS Word (DOM Parser chống vỡ XML khi có ma trận lồng nhau)
            try {
                var parser = new DOMParser();
                var doc = parser.parseFromString(mml, "application/xml");
                var ns = "http://www.w3.org/1998/Math/MathML";
                var mrows = doc.getElementsByTagNameNS ? doc.getElementsByTagNameNS(ns, 'mrow') : doc.getElementsByTagName('mrow');
                if (!mrows || mrows.length === 0) mrows = doc.getElementsByTagName('mrow');
                
                // Phải lặp từ dưới lên để xử lý các thẻ con (nested) trước thẻ cha
                for (var i = mrows.length - 1; i >= 0; i--) {
                    var row = mrows[i];
                    var children = Array.from(row.childNodes).filter(function(n) { return n.nodeType === 1; });
                    
                    if (children.length === 3 && 
                        children[0].localName === 'mo' && 
                        children[1].localName === 'mtable' && 
                        children[2].localName === 'mo') {
                        
                        var mfenced = doc.createElementNS(ns, 'mfenced');
                        mfenced.setAttribute('open', children[0].textContent);
                        mfenced.setAttribute('close', children[2].textContent);
                        mfenced.appendChild(children[1].cloneNode(true));
                        row.parentNode.replaceChild(mfenced, row);
                    }
                }
                var serializer = new XMLSerializer();
                mml = serializer.serializeToString(doc);
                mml = mml.replace(/ xmlns=""/g, ''); // Fix bug DOMParser sinh namespace rỗng
            } catch (e) {
                console.error("Lỗi parse MathML:", e);
            }

            // Thêm XML header để MS Word nhận diện đây là một phương trình (Equation)
            var wordMathML = '<?xml version="1.0"?>\n' + mml;
            
            navigator.clipboard.writeText(wordMathML).then(function() {
                showToast('Đã copy! Mở Word và ấn Ctrl + V để dán.');
            }).catch(function(err) {
                showToast('Lỗi copy: ' + err.message);
            });
        }).catch(function(err) {
            showToast('Lỗi chuyển đổi: ' + err.message);
        });
    }

    function sendToLaTeXTool() {
        var text = document.getElementById('latex-output').value;
        if(!text) {
            showToast('Chưa có công thức để chuyển!');
            return;
        }
        localStorage.setItem('smp_latex_transfer', text);
        window.location.href = '/tools/latex-v2/index.html';
    }

    function printPreview() {
        var content = document.getElementById('latex-output').value;
        if(!content) {
            showToast('Chưa có nội dung để in');
            return;
        }
        
        var win = window.open('', '_blank');
        if (!win) { showToast('Vui lòng cho phép popup để in PDF'); return; }
        
        var head = '<!DOCTYPE html><html><head>'
            + '<meta charset="UTF-8"><title>SMP MathType Export</title>'
            + '<script>'
            + 'window.MathJax = {'
            + '  tex: { inlineMath: [["$","$"], ["\\\\(","\\\\)"]], displayMath: [["$$","$$"], ["\\\\[","\\\\]"]] },'
            + '  startup: {'
            + '    pageReady: function () {'
            + '      return MathJax.startup.defaultPageReady().then(function () {'
            + '        setTimeout(function() { window.print(); }, 500);'
            + '      });'
            + '    }'
            + '  }'
            + '};'
            + '\x3C/script\x3E'
            + '\x3Cscript src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"\x3E\x3C/script\x3E'
            + '<style>'
            + 'body { font-family: "Segoe UI", Arial, sans-serif; margin: 40px; color: #333; }'
            + '.print-box { border: 2px solid #5ce1e6; border-radius: 8px; padding: 30px; font-size: 16pt; min-height: 150px; display: flex; align-items: flex-start; justify-content: flex-start; }'
            + '.print-title { font-weight: bold; margin-bottom: 15px; color: #333; font-size: 14pt; }'
            + '@media print { body { margin: 10mm; } .print-box { border-color: #000; } }'
            + '\x3C/style\x3E'
            + '\x3C/head\x3E\x3Cbody\x3E'
            + '<div class="print-title">Kết quả MathType:</div>'
            + '<div class="print-box">$$ \\begin{aligned}\n& ' + content.replace(/\\\\\\\\/g, '\\\\\\\\ & ') + '\n\\end{aligned} $$</div>'
            + '\x3C/body\x3E\x3C/html\x3E';
            
        win.document.write(head);
        win.document.close();
    }

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

    // Modal Văn Bản Tiếng Việt
    


