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
        }
    };

    // ── Hàm chuẩn bị định dạng LaTeX để xem Preview trực tiếp ──
    function formatLatexForPreview(raw) {
        if (!raw || !raw.trim()) return '';

        let text = raw.trim();

        // 1. Kiểm tra xem đã có math delimiters ($...$, $$...$$, \[...\], \(...\))
        // hoặc các môi trường display math độc lập (equation, align, gather, multline)
        const hasTopLevelDelimiters = text.includes('$') || 
                                     text.includes('\\[') || 
                                     text.includes('$$') || 
                                     text.includes('\\(') ||
                                     text.startsWith('\\begin{align') || 
                                     text.startsWith('\\begin{equation') || 
                                     text.startsWith('\\begin{gather') || 
                                     text.startsWith('\\begin{multline');

        // 2. Nếu chuỗi hoàn toàn KHÔNG có delimiter nào:
        // Đa số là công thức toán thuần túy (\frac, x^2, \begin{cases}, \begin{pmatrix}, v.v.)
        // Ta bọc toàn bộ trong \[ ... \] để MathJax render toán học chuẩn xác
        if (!hasTopLevelDelimiters) {
            return `\\[ ${text} \\]`;
        }

        // 3. Nếu chuỗi đã có delimiter hoặc văn bản kèm công thức:
        // Đảm bảo các sub-environments như \begin{cases}, \begin{matrix}, \begin{pmatrix}, \begin{aligned}
        // nếu đứng ngoài math mode thì được bọc trong \[ ... \]
        text = text.replace(/(?<![\$\\])(\\begin\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|gathered|array)\}[\s\S]*?\\end\{(?:cases|matrix|pmatrix|bmatrix|vmatrix|Vmatrix|aligned|gathered|array)\})/g, function(match) {
            return `\\[ ${match} \\]`;
        });

        // Chuyển đổi định dạng chữ LaTeX thông dụng sang HTML (tương thích như latex-v2)
        text = text
            .replace(/\\textbf\{([^}]*)\}/g, '<b>$1</b>')
            .replace(/\\textit\{([^}]*)\}/g, '<i>$1</i>')
            .replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>')
            .replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>')
            .replace(/\\item\s+/g, '• ')
            .replace(/\\noindent\s*/g, '')
            .replace(/\\(medskip|bigskip|smallskip)/g, '<br>')
            .replace(/\n\s*\n/g, '<br><br>');

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
        const text = latexOutput.value || currentLatex;
        if (!text) return;

        localStorage.setItem('smp_latex_transfer', text);
        showToast('⚡ Đang mở trong Trình Soạn Thảo LaTeX...');
        setTimeout(() => {
            window.location.href = '/tools/latex-v2/index.html';
        }, 350);
    };

    // ── Mở Trong MathType (Tool 2) ─────────────────────────
    window.sendToMathType = function() {
        const text = latexOutput.value || currentLatex;
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
