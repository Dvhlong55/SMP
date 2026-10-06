/**
 * SMP LaTeX Quick Viewer — Extension Popup Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('input-text');
    const previewBox = document.getElementById('preview-box');
    const statInfo = document.getElementById('stat-info');
    const btnTranslate = document.getElementById('btn-translate');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const btnSample = document.getElementById('btn-sample');

    let currentLatex = '';

    const SAMPLE_COMMENT = "Dạ em xin góp câu 1 ạ: a) Xét f_n(x) = 1/x+1 +...+ 1/n(x+n) -1 thì f_n(x) nghịch biến trên ( 0, + vô cùng ) và lim f_n(x) ^( x ->0+) =... > 0 và lim f_n(x)^(x -> - vô cùng) <0 nên kết hợp với f_n(x) nghịch biến thì suy ra có nghiệm duy nhất x_n. b) Ta cm đc: x_n < 1 ( xét f_n(1) <0 = f_n(x_n)) . Khi đó dùng Lagrange rồi đánh giá một tí thì tìm được lim y_n = 0";

    function doRender() {
        const text = inputText.value;
        if (!text.trim()) {
            previewBox.innerHTML = '<span style="color: #64748b; font-style: italic;">Nhập hoặc dán văn bản phía trên để xem kết quả biên dịch...</span>';
            currentLatex = '';
            return;
        }

        const res = SMPNormalizer.normalizeMathText(text);
        currentLatex = res.cleanLatex;

        previewBox.innerText = res.cleanLatex;
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(previewBox, {
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

    inputText.addEventListener('input', doRender);
    btnTranslate.addEventListener('click', doRender);

    btnSample.addEventListener('click', () => {
        inputText.value = SAMPLE_COMMENT;
        doRender();
    });

    btnClear.addEventListener('click', () => {
        inputText.value = '';
        doRender();
        inputText.focus();
    });

    btnCopy.addEventListener('click', () => {
        if (!currentLatex) return;
        navigator.clipboard.writeText(currentLatex).then(() => {
            const old = btnCopy.textContent;
            btnCopy.textContent = '✓ Đã chép!';
            setTimeout(() => {
                btnCopy.textContent = old;
            }, 1800);
        });
    });
});
