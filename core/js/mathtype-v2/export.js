function copyLatex() {
    var text = document.getElementById('latex-output').value;
    if(!text) {
        showToast('Chưa có công thức để copy!');
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        showToast('✓ Đã copy mã LaTeX');
    }).catch(function(err) {
        showToast('Lỗi copy: ' + err.message);
    });
}

function copyForMathType() {
    var text = document.getElementById('latex-output').value;
    if (!text || !text.trim()) {
        showToast('Chưa có công thức để copy!');
        return;
    }
    
    var cleanText = text.trim();
    // Loại bỏ placeholder rỗng nếu người dùng chưa điền
    cleanText = cleanText.replace(/\\placeholder\{\}/g, '');

    var formattedTeX = '';
    // Xử lý căn dòng nếu công thức có nhiều dòng
    if (cleanText.indexOf('\\\\') !== -1) {
        if (cleanText.indexOf('\\begin{aligned}') === -1 && 
            cleanText.indexOf('\\begin{cases}') === -1 && 
            cleanText.indexOf('\\begin{matrix}') === -1 &&
            cleanText.indexOf('\\begin{pmatrix}') === -1 &&
            cleanText.indexOf('\\begin{bmatrix}') === -1) {
            formattedTeX = '$$\\begin{aligned}\n' + cleanText + '\n\\end{aligned}$$';
        } else {
            formattedTeX = '$$' + cleanText + '$$';
        }
    } else {
        formattedTeX = '$' + cleanText + '$';
    }

    navigator.clipboard.writeText(formattedTeX).then(function () {
        showToast('✓ Đã copy cho MathType! Dán vào Word rồi nhấn Alt + \\ để tạo công thức.');
    }).catch(function (err) {
        showToast('Lỗi copy: ' + err.message);
    });
}

function copyWord() {
    var text = document.getElementById('latex-output').value;
    if(!text || !text.trim()) {
        showToast('Chưa có công thức để copy!');
        return;
    }
    
    // Loại bỏ placeholder để tránh lỗi MathJax
    var cleanText = text.replace(/\\placeholder\{\}/g, '');
    
    if (!window.MathJax || !MathJax.tex2mmlPromise) {
        showToast('Đang tải công cụ chuyển đổi, vui lòng đợi...');
        return;
    }
    
    MathJax.tex2mmlPromise(cleanText).then(function(mml) {
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
        
        // CHỈ ghi plain text thuần: Word chỉ tự động render công thức MathML khi ở dạng text/plain
        // Tuyệt đối không nhét text/html vì Word sẽ ưu tiên HTML và giáng cấp MathML thành text LaTeX!
        navigator.clipboard.writeText(wordMathML).then(function() {
            showToast('✓ Đã copy cho Word! Dán (Ctrl + V) vào Word.');
        }).catch(function(err) {
            showToast('Lỗi copy: ' + err.message);
        });
    }).catch(function(err) {
        showToast('Lỗi chuyển đổi: ' + err.message);
    });
}

// ── Copy Công Thức Dạng Ảnh (PNG 300 DPI Nét Căng) ──
var _svgMathRenderer = null;
var _svgRendererLoading = false;

function getSvgRenderer(callback) {
    if (_svgMathRenderer) {
        callback(_svgMathRenderer);
        return;
    }
    if (_svgRendererLoading) {
        var wait = setInterval(function() {
            if (_svgMathRenderer) {
                clearInterval(wait);
                callback(_svgMathRenderer);
            }
        }, 100);
        return;
    }
    _svgRendererLoading = true;
    
    // Tạo iframe ẩn độc lập để không ảnh hưởng MathJax CHTML của trang chính
    var iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;border:none;pointer-events:none;';
    document.body.appendChild(iframe);
    
    var idoc = iframe.contentWindow.document;
    idoc.open();
    idoc.write('<!DOCTYPE html><html><head><script>window.MathJax={tex:{inlineMath:[["$","$"]]}};\x3C/script><script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js">\x3C/script></head><body></body></html>');
    idoc.close();
    
    var checkInterval = setInterval(function() {
        try {
            if (iframe.contentWindow && iframe.contentWindow.MathJax && iframe.contentWindow.MathJax.tex2svgPromise) {
                clearInterval(checkInterval);
                _svgMathRenderer = iframe.contentWindow.MathJax;
                _svgRendererLoading = false;
                callback(_svgMathRenderer);
            }
        } catch(e) {}
    }, 150);
}

function copyAsImage() {
    var text = document.getElementById('latex-output').value;
    if(!text || !text.trim()) {
        showToast('Chưa có công thức để copy ảnh!');
        return;
    }
    
    showToast('Đang tạo ảnh độ phân giải cao...');
    
    getSvgRenderer(function(renderer) {
        renderer.tex2svgPromise(text).then(function(svgContainer) {
            var svg = svgContainer.querySelector('svg');
            if (!svg) {
                showToast('Không thể tạo SVG từ công thức!');
                return;
            }
            
            // Lấy kích thước thực tế của SVG
            var wAttr = svg.getAttribute('width');
            var hAttr = svg.getAttribute('height');
            var viewBox = svg.getAttribute('viewBox');
            
            var width = 300;
            var height = 80;
            
            if (viewBox) {
                var vbParts = viewBox.split(/\s+/).map(Number);
                if (vbParts.length === 4 && vbParts[2] > 0 && vbParts[3] > 0) {
                    width = vbParts[2];
                    height = vbParts[3];
                }
            } else if (wAttr && hAttr) {
                width = parseFloat(wAttr) * 16 || 300;
                height = parseFloat(hAttr) * 16 || 80;
            }
            
            // Tăng độ phân giải 3x - 4x để khi in ấn đạt chuẩn 300 DPI
            var scale = 3.5;
            var canvas = document.createElement('canvas');
            canvas.width = Math.max(Math.round(width * scale), 100);
            canvas.height = Math.max(Math.round(height * scale), 50);
            var ctx = canvas.getContext('2d');
            
            // Chuẩn bị chuỗi SVG với màu chữ phù hợp
            var serializer = new XMLSerializer();
            var svgStr = serializer.serializeToString(svg);
            if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
                svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
            }
            
            var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var img = new Image();
            
            img.onload = function() {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);
                
                canvas.toBlob(function(pngBlob) {
                    if (!pngBlob) {
                        showToast('Lỗi xuất dữ liệu ảnh!');
                        return;
                    }
                    if (navigator.clipboard && window.ClipboardItem) {
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': pngBlob })
                        ]).then(function() {
                            showToast('✓ Đã copy ảnh PNG nét căng! Mở Word/PowerPoint và ấn Ctrl + V để dán.');
                        }).catch(function() {
                            downloadBlob(pngBlob, 'cong-thuc.png');
                            showToast('Trình duyệt chặn clipboard ảnh, đã tải file ảnh về máy!');
                        });
                    } else {
                        downloadBlob(pngBlob, 'cong-thuc.png');
                        showToast('Đã tải ảnh cong-thuc.png về máy!');
                    }
                }, 'image/png');
            };
            img.onerror = function() {
                URL.revokeObjectURL(url);
                showToast('Lỗi khi vẽ công thức lên ảnh!');
            };
            img.src = url;
        }).catch(function(err) {
            showToast('Lỗi chuyển SVG: ' + err.message);
        });
    });
}

function downloadBlob(blob, filename) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ── Modal Hướng Dẫn MathType ──
function openMathTypeGuideModal() {
    var modal = document.getElementById('mathtype-guide-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeMathTypeGuideModal(e) {
    if (e && e.target && e.target.className && typeof e.target.className === 'string' && e.target.className.indexOf('guide-modal-overlay') === -1) {
        return;
    }
    var modal = document.getElementById('mathtype-guide-modal');
    if (modal) {
        modal.classList.remove('active');
    }
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
    t._t = setTimeout(function () { t.style.opacity = '0'; }, 2400);
}
