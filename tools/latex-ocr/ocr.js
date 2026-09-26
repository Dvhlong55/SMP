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
        fileInput.value = '';

        imgStatus.innerHTML = `<span class="status-dot"></span>Chưa có ảnh nào được chọn`;
        imgMeta.textContent = '';
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
            ocrStatus.innerHTML = `<span class="status-dot red"></span>Thất bại`;
            mathPreview.innerHTML = `
                <div style="color: #f87171; text-align: center; padding: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px;"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    <p style="font-weight: 600; margin: 0 0 6px 0;">Không thể xử lý ảnh</p>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin: 0;">${error.message}</p>
                </div>
            `;
            showToast(`⚠️ Lỗi: ${error.message}`);
        } finally {
            isProcessing = false;
            scanBtn.disabled = !currentBase64;
            scanBtnText.innerHTML = 'Quét Lại';
        }
    };

    // ── Render Preview MathJax ────────────────────────────
    function renderLatexPreview(latexText) {
        mathPreview.classList.remove('empty-state');

        let formatted = latexText;
        // Nếu chuỗi chưa có ký hiệu toán học $ hoặc \[, bọc vào khối display math nếu cần
        const hasDelimiters = latexText.includes('$') || latexText.includes('\\[') || latexText.includes('\\begin{');
        if (!hasDelimiters) {
            formatted = `\\[ ${latexText} \\]`;
        }

        // Chuyển ký tự xuống dòng thành thẻ ngắt dòng
        mathPreview.innerHTML = formatted;

        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([mathPreview]).catch(err => {
                console.warn('MathJax typeset error:', err);
            });
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

})();
