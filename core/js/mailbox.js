// ========================================================
// SOLUTION SUBMISSION MAILBOX LOGIC
// ========================================================
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwdOWHrWq0fSP9gW8UMk-MjH2pWwlipoZHFDDiI6u2Qx7k8NM7bt6Pe5KYylU1CunOqAA/exec';

// Helper: Convert File to Base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// ── File input: show names ──
document.addEventListener('DOMContentLoaded', function () {
    // We use setTimeout to ensure post-layout.js has finished replacing document.body.innerHTML
    setTimeout(() => {
        const imgInput = document.getElementById('sol-images');
        if (imgInput) {
            imgInput.addEventListener('change', function () {
                updateFileNames(Array.from(this.files));
            });
        }
        
        // LaTeX preview listeners
        const textarea = document.getElementById('sol-content');
        if (textarea) {
            textarea.addEventListener('input', debounce(updatePreview, 600));
        }
    }, 100);
});

// Helper: display file names with icons
function updateFileNames(files) {
    const el = document.getElementById('file-names');
    if (!el) return;
    if (files.length === 0) {
        el.textContent = '';
    } else {
        el.innerHTML = files.map(f => {
            const icon = f.type === 'application/pdf' ? '📄' : '🖼️';
            return `<span style="margin-right:12px">${icon} ${f.name}</span>`;
        }).join('<br>');
    }
}

// ── Preview toggle ──
let previewOpen = false;
function togglePreview() {
    previewOpen = !previewOpen;
    const box = document.getElementById('latex-preview');
    const btn = document.getElementById('preview-toggle');
    if (!box || !btn) return;
    
    if (previewOpen) {
        box.classList.add('active');
        btn.textContent = '▼ ẨN PREVIEW LATEX';
        updatePreview();
    } else {
        box.classList.remove('active');
        btn.textContent = '▶ XEM PREVIEW LATEX';
    }
}

// ── Debounce helper ──
function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ── Update MathJax preview ──
function updatePreview() {
    if (!previewOpen) return;
    const box  = document.getElementById('latex-preview');
    const text = document.getElementById('sol-content').value.trim();
    if (!text) {
        box.innerHTML = '<span class="latex-preview-empty">Bắt đầu gõ để xem preview...</span>';
        return;
    }
    // Escape HTML but keep LaTeX delimiters intact
    const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    box.innerHTML = escaped;
    if (window.MathJax && MathJax.typesetPromise) {
        MathJax.typesetPromise([box]).catch(err => console.warn('MathJax:', err));
    }
}

// ── Gửi form qua Google Apps Script ──
async function sendSolution() {
    const name    = document.getElementById('sol-name').value.trim();
    const contactEl = document.getElementById('sol-contact');
    const fbEl    = document.getElementById('sol-fb');
    
    const contact = contactEl ? contactEl.value.trim() : '';
    const fb      = fbEl ? fbEl.value.trim() : '';
    
    const problem = document.getElementById('sol-problem').value;
    const content = document.getElementById('sol-content').value.trim();
    const fileInput = document.getElementById('sol-images');

    if (!name || !contact || !problem || !content || (fbEl && !fb)) {
        alert('⚠ Vui lòng điền đầy đủ các trường bắt buộc (có dấu *)!');
        return;
    }
    
    const contactCombined = fb ? `Email: ${contact} | FB/Nick: ${fb}` : contact;

    const btn  = document.getElementById('sol-send-btn');
    const icon = document.getElementById('sol-submit-icon');
    const text = document.getElementById('sol-submit-text');

    // Loading state
    btn.disabled = true;
    if (icon) icon.textContent = '⏳';
    if (text) text.textContent = 'Đang tải file và gửi...';
    btn.style.opacity = '0.7';

    try {
        // Chuẩn bị danh sách file đính kèm
        let filesData = [];
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                const file = fileInput.files[i];
                const base64Data = await getBase64(file);
                filesData.push({
                    name: file.name,
                    mimeType: file.type,
                    data: base64Data
                });
            }
        }

        const payload = {
            type: 'loi_giai',
            name: name,
            contact: contactCombined,
            problem: problem,
            content: content,
            files: filesData
        };

        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });

        // Do sử dụng mode 'no-cors', trình duyệt sẽ không cho phép đọc response
        const result = { status: 'success' };
        
        if (result.status === 'success') {
            alert('✅ Lời giải và file đã được gửi thành công đến Google Drive của tác giả!');
            
            // Reset form
            document.getElementById('sol-name').value    = '';
            document.getElementById('sol-contact').value = '';
            document.getElementById('sol-problem').value = '';
            document.getElementById('sol-content').value = '';
            if (fileInput) fileInput.value = '';
            document.getElementById('file-names').innerHTML = '';
        } else {
            alert('❌ Gửi thất bại: ' + result.message);
        }

    } catch (err) {
        console.error('GAS error:', err);
        alert('❌ Đã xảy ra lỗi khi kết nối máy chủ!');
    } finally {
        btn.disabled = false;
        if (icon) icon.textContent = '📨';
        if (text) text.textContent = 'Gửi Lời Giải (Đính Kèm Tự Động)';
        btn.style.opacity = '';
    }
}
