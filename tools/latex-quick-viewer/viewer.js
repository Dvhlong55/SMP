/**
 * ==============================================================================
 * SMP - LaTeX Quick Viewer Web Client Controller
 * Secret of Mathematical Principles
 * ==============================================================================
 */

(function () {
    'use strict';

    // DOM Elements
    const rawInput = document.getElementById('raw-input');
    const previewView = document.getElementById('preview-view');
    const rawView = document.getElementById('raw-view');
    const latexOutput = document.getElementById('latex-output');
    const tabPreviewBtn = document.getElementById('tab-preview-btn');
    const tabRawBtn = document.getElementById('tab-raw-btn');
    const btnBackPreview = document.getElementById('btn-back-preview');
    const guideModal = document.getElementById('guide-modal');
    const btnCopyLatex = document.getElementById('btn-copy-latex');
    const copyLatexLabel = document.getElementById('copy-latex-label');
    const btnCopyRaw = document.getElementById('btn-copy-raw');
    const copyTextLabel = document.getElementById('copy-text-label');

    // Mẫu ví dụ thực tế theo yêu cầu người dùng
    const USER_SAMPLE = `Dạ em xin góp câu 1 ạ: a) Xét f_n(x) = 1/x+1 +...+ 1/n(x+n) -1 thì f_n(x) nghịch biến trên ( 0, + vô cùng ) và lim f_n(x) ^( x ->0+) =... > 0 và lim f_n(x)^(x -> - vô cùng) <0 nên kết hợp với f_n(x) nghịch biến thì suy ra có nghiệm duy nhất x_n. b) Ta cm đc: x_n < 1 ( xét f_n(1) <0 = f_n(x_n)) . Khi đó dùng Lagrange rồi đánh giá một tí thì tìm được lim y_n = 0`;

    let debounceTimer = null;
    let currentCleanLatex = '';

    /**
     * Render công thức KaTeX vào tab Preview từ chuỗi LaTeX
     */
    function renderPreviewFromLatex(tex) {
        if (!tex || !tex.trim()) {
            previewView.innerHTML = '<span style="color: var(--text-secondary); opacity: 0.6; font-style: italic;">Kết quả biên dịch hiển thị tại đây khi bạn nhập văn bản bên trái...</span>';
            return;
        }

        previewView.innerText = tex;
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(previewView, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ],
                throwOnError: false
            });
        }
    }

    /**
     * Thực hiện biên dịch và hiển thị
     */
    function processTranslation() {
        const text = rawInput.value;

        if (!text.trim()) {
            previewView.innerHTML = '<span style="color: var(--text-secondary); opacity: 0.6; font-style: italic;">Kết quả biên dịch hiển thị tại đây khi bạn nhập văn bản bên trái...</span>';
            latexOutput.value = '';
            currentCleanLatex = '';
            return;
        }

        // 1. Chạy Normalization Pipeline
        const result = window.SMPNormalizer ? window.SMPNormalizer.normalizeMathText(text) : { cleanLatex: text, mathCount: 0 };
        currentCleanLatex = result.cleanLatex;

        // 2. Điền mã LaTeX sạch vào tab Raw
        latexOutput.value = currentCleanLatex;

        // 3. Render KaTeX vào tab Preview
        renderPreviewFromLatex(currentCleanLatex);
    }

    /**
     * Debounce nhập liệu realtime từ ô Văn Bản
     */
    rawInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processTranslation, 40);
    });

    /**
     * Cho phép người dùng trực tiếp sửa mã LaTeX ở Tab Mã LaTeX
     */
    if (latexOutput) {
        latexOutput.addEventListener('input', () => {
            currentCleanLatex = latexOutput.value;
        });
    }

    /**
     * Chuyển tab Biên Dịch <-> Mã LaTeX (Kèm nút Quay Lại)
     */
    window.switchTab = function (tab) {
        if (tab === 'preview') {
            tabPreviewBtn.classList.add('active');
            tabRawBtn.classList.remove('active');
            if (btnBackPreview) btnBackPreview.style.display = 'none';
            previewView.style.display = 'block';
            rawView.style.display = 'none';
            // Đồng bộ kết quả nếu người dùng vừa sửa trực tiếp ở tab Mã LaTeX
            renderPreviewFromLatex(currentCleanLatex);
        } else {
            tabRawBtn.classList.add('active');
            tabPreviewBtn.classList.remove('active');
            if (btnBackPreview) btnBackPreview.style.display = 'inline-flex';
            rawView.style.display = 'block';
            previewView.style.display = 'none';
        }
    };

    /**
     * Thử bình luận mẫu
     */
    window.loadUserSample = function () {
        rawInput.value = USER_SAMPLE;
        processTranslation();
        window.switchTab('preview');
    };

    /**
     * Dán nhanh từ clipboard
     */
    window.pasteClipboard = async function () {
        try {
            const clipText = await navigator.clipboard.readText();
            if (clipText) {
                rawInput.value = clipText;
                processTranslation();
            }
        } catch (err) {
            rawInput.focus();
            document.execCommand('paste');
        }
    };

    /**
     * Xóa nội dung
     */
    window.clearInput = function () {
        rawInput.value = '';
        processTranslation();
        rawInput.focus();
    };

    /**
     * Sao chép mã LaTeX sạch
     */
    window.copyCleanLatex = function () {
        if (!currentCleanLatex) return;
        navigator.clipboard.writeText(currentCleanLatex).then(() => {
            btnCopyLatex.classList.add('primary');
            copyLatexLabel.textContent = '✓ Đã Sao Chép!';
            setTimeout(() => {
                copyLatexLabel.textContent = 'Sao Chép Mã LaTeX';
            }, 1800);
        });
    };

    /**
     * Sao chép văn bản thô
     */
    window.copyFullText = function () {
        const text = rawInput.value;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copyTextLabel.textContent = '✓ Đã Sao Chép!';
            setTimeout(() => {
                copyTextLabel.textContent = 'Sao Chép Văn Bản';
            }, 1800);
        });
    };

    /**
     * Mở sang Trình Soạn Thảo LaTeX (latex-v2)
     */
    window.openInLatexEditor = function () {
        if (currentCleanLatex) {
            localStorage.setItem('smp_latex_editor_import', currentCleanLatex);
        }
        window.open('/tools/latex-v2/index.html', '_blank');
    };

    /**
     * Mở sang MathType
     */
    window.openInMathType = function () {
        if (currentCleanLatex) {
            localStorage.setItem('smp_mathtype_import', currentCleanLatex);
        }
        window.open('/tools/MathType-v2.html', '_blank');
    };

    /**
     * Mở / Đóng Modal Hướng dẫn cài đặt
     */
    window.openGuideModal = function () {
        if (guideModal) guideModal.classList.add('active');
    };

    window.closeGuideModal = function () {
        if (guideModal) guideModal.classList.remove('active');
    };

    if (guideModal) {
        guideModal.addEventListener('click', (e) => {
            if (e.target === guideModal) window.closeGuideModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && guideModal && guideModal.classList.contains('active')) {
            window.closeGuideModal();
        }
    });

    function renderStatsStrip() {
        const stats = document.querySelector('.stats-strip');
        if (stats && typeof renderMathInElement === 'function') {
            renderMathInElement(stats, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }
    }

    // Tự động render ký hiệu toán thanh thống kê và load mẫu ban đầu
    renderStatsStrip();
    loadUserSample();

})();
