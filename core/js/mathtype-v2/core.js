var mathFields = [];
var activeMathField = null;

// Undo/Redo System
var undoStack = [];
var redoStack = [];
var isUndoRedoAction = false;
var saveStateTimeout = null;

// ── Hàm chuẩn hóa & gỡ bỏ math delimiters bao bọc ngoài cùng ──
function stripOuterMathDelimiters(str) {
    if (!str) return '';
    str = str.trim();
    var changed = true;
    while (changed) {
        changed = false;
        // \[ ... \]
        if (str.startsWith('\\[') && str.endsWith('\\]') && str.length >= 4) {
            var inner = str.substring(2, str.length - 2);
            if (inner.indexOf('\\]') === -1) {
                str = inner.trim();
                changed = true;
                continue;
            }
        }
        // $$ ... $$
        if (str.startsWith('$$') && str.endsWith('$$') && str.length >= 4) {
            var inner = str.substring(2, str.length - 2);
            if (inner.indexOf('$$') === -1) {
                str = inner.trim();
                changed = true;
                continue;
            }
        }
        // \( ... \)
        if (str.startsWith('\\(') && str.endsWith('\\)') && str.length >= 4) {
            var inner = str.substring(2, str.length - 2);
            if (inner.indexOf('\\)') === -1) {
                str = inner.trim();
                changed = true;
                continue;
            }
        }
        // $ ... $ (không phải escaped \$)
        if (str.startsWith('$') && !str.startsWith('$$') && str.endsWith('$') && !str.endsWith('$$') && str.length >= 2) {
            var inner = str.substring(1, str.length - 1);
            if (inner.replace(/\\\$/g, '').indexOf('$') === -1) {
                str = inner.trim();
                changed = true;
                continue;
            }
        }
    }
    return str;
}

// ── Hàm phân tích cú pháp TeX nhận diện từ công cụ khác ──
function parseTransferredLatex(raw) {
    if (!raw || typeof raw !== 'string') return [];
    var str = raw.trim();
    if (!str) return [];

    // Chuẩn hóa xuống dòng
    str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Chuyển đổi các môi trường căn lề văn bản không thuộc math mode
    str = str.replace(/\\begin\{center\}/gi, '')
             .replace(/\\end\{center\}/gi, '')
             .replace(/\\centering\b/gi, '')
             .replace(/\\begin\{flushleft\}/gi, '')
             .replace(/\\end\{flushleft\}/gi, '')
             .replace(/\\begin\{flushright\}/gi, '')
             .replace(/\\end\{flushright\}/gi, '')
             .replace(/\\fbox\b/g, '\\boxed');

    // Gỡ bỏ delimiters ngoài cùng bao bọc toàn bộ chuỗi
    str = stripOuterMathDelimiters(str);
    if (!str) return [];

    // Phân tách các khối dòng ở cấp ngoài cùng
    var chunks = [];
    var lastIdx = 0;
    var braceDepth = 0;
    var envDepth = 0;
    var mathDepth = 0;
    var inDoubleDollar = false;
    var i = 0;
    var n = str.length;

    while (i < n) {
        if (str.substr(i, 2) === '$$') {
            inDoubleDollar = !inDoubleDollar;
            i += 2;
            continue;
        }
        if (str.substr(i, 2) === '\\[' || str.substr(i, 2) === '\\(') {
            mathDepth++;
            i += 2;
            continue;
        }
        if (str.substr(i, 2) === '\\]' || str.substr(i, 2) === '\\)') {
            if (mathDepth > 0) mathDepth--;
            i += 2;
            continue;
        }
        if (str.substr(i, 7) === '\\begin{') {
            var cb = str.indexOf('}', i + 7);
            if (cb !== -1) {
                envDepth++;
                i = cb + 1;
                continue;
            }
        }
        if (str.substr(i, 5) === '\\end{') {
            var cb = str.indexOf('}', i + 5);
            if (cb !== -1) {
                if (envDepth > 0) envDepth--;
                i = cb + 1;
                continue;
            }
        }
        if (str[i] === '{' && (i === 0 || str[i - 1] !== '\\')) {
            braceDepth++;
            i++;
            continue;
        }
        if (str[i] === '}' && (i === 0 || str[i - 1] !== '\\')) {
            if (braceDepth > 0) braceDepth--;
            i++;
            continue;
        }

        if (braceDepth === 0 && envDepth === 0 && mathDepth === 0 && !inDoubleDollar) {
            if (str.substr(i, 2) === '\\\\') {
                var nextChar = str.substr(i + 2, 1);
                if (nextChar !== '[' && nextChar !== ']' && nextChar !== '(' && nextChar !== ')' && nextChar !== '\\') {
                    var chunk = str.substring(lastIdx, i).trim();
                    if (chunk) chunks.push(chunk);
                    i += 2;
                    while (i < n && (str[i] === ' ' || str[i] === '\t' || str[i] === '\n')) {
                        i++;
                    }
                    lastIdx = i;
                    continue;
                }
            } else if (str[i] === '\n') {
                var chunk = str.substring(lastIdx, i).trim();
                if (chunk) chunks.push(chunk);
                i++;
                while (i < n && (str[i] === ' ' || str[i] === '\t' || str[i] === '\n')) {
                    i++;
                }
                lastIdx = i;
                continue;
            }
        }
        i++;
    }

    var tail = str.substring(lastIdx).trim();
    if (tail) chunks.push(tail);

    var lines = [];
    chunks.forEach(function(c) {
        var cleanLine = stripOuterMathDelimiters(c);
        if (cleanLine) lines.push(cleanLine);
    });

    return lines.length > 0 ? lines : [str];
}

// ── Kiểm tra và nạp công thức chuyển từ công cụ khác (LaTeX-OCR, LaTeX Editor) ──
function checkAndLoadTransferredLatex() {
    var transferData = localStorage.getItem('smp_latex_transfer');
    if (!transferData) return false;

    localStorage.removeItem('smp_latex_transfer');
    try {
        var lines = parseTransferredLatex(transferData);
        if (lines && lines.length > 0) {
            // Lưu trạng thái trước đó vào undoStack nếu có để có thể hoàn tác
            var prevAutosave = localStorage.getItem('smp_mathtype_autosave');
            if (prevAutosave) {
                try {
                    var prevParsed = JSON.parse(prevAutosave);
                    if (Array.isArray(prevParsed) && prevParsed.length > 0) {
                        undoStack.push(prevParsed);
                    }
                } catch(e) {}
            }

            restoreState(lines);
            localStorage.setItem('smp_mathtype_autosave', JSON.stringify(lines));
            saveState();

            setTimeout(function() {
                if (typeof showToast === 'function') {
                    showToast('✓ Đã nạp công thức toán vào MathType');
                }
            }, 150);
            return true;
        }
    } catch (err) {
        console.error('Error importing transferred LaTeX:', err);
    }
    return false;
}

document.addEventListener('DOMContentLoaded', function () {
    // Cấu hình MathLive ẩn bàn phím ảo (giữ UI giống MathQuill)
    if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.mathVirtualKeyboardPolicy = "manual";
    }

    document.getElementById('math-editor-container').addEventListener('click', function(e) {
        if (e.target === this && mathFields.length > 0) {
            mathFields[mathFields.length - 1].focus();
        }
    });

    // 1. Kiểm tra công thức chuyển từ OCR hoặc LaTeX tool
    var transferred = checkAndLoadTransferredLatex();

    // 2. Nếu không có dữ liệu chuyển giao, khôi phục từ auto-save
    if (!transferred) {
        var savedState = localStorage.getItem('smp_mathtype_autosave');
        if (savedState) {
            try {
                var state = JSON.parse(savedState);
                restoreState(state);
            } catch(e) {
                createNewMathFieldAfter(-1);
            }
        } else {
            createNewMathFieldAfter(-1);
        }
    }

    // Lắng nghe sự kiện toàn cục
    document.addEventListener('keydown', function(e) {
        // Ctrl + Space -> Mở ô gõ tiếng Việt lơ lửng
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            openInlineViInput();
        }
        // Ctrl + Z -> Undo
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            performUndo();
        }
        // Ctrl + Y -> Redo
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            performRedo();
        }
    });

    // Auto-save vòng lặp
    setInterval(function() {
        if (mathFields.length > 0) {
            var latexStrings = mathFields.map(function(m) { return m.value; });
            localStorage.setItem('smp_mathtype_autosave', JSON.stringify(latexStrings));
        }
    }, 10000);
});

// Hỗ trợ khôi phục khi quay lại trang qua bfcache
window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
        checkAndLoadTransferredLatex();
    }
});

function saveState() {
    if (isUndoRedoAction) return;
    clearTimeout(saveStateTimeout);
    saveStateTimeout = setTimeout(function() {
        var currentState = mathFields.map(function(m) { return m.value; });
        
        // Không lưu nếu không có thay đổi
        if (undoStack.length > 0) {
            var lastState = undoStack[undoStack.length - 1];
            if (JSON.stringify(lastState) === JSON.stringify(currentState)) return;
        }

        undoStack.push(currentState);
        if (undoStack.length > 50) undoStack.shift(); // Limit history
        redoStack = []; // Clear redo stack on new action
    }, 500);
}

function restoreState(stateArray) {
    var container = document.getElementById('math-editor-container');
    container.innerHTML = '';
    mathFields = [];
    if (!stateArray || stateArray.length === 0) {
        createNewMathFieldAfter(-1);
        return;
    }
    stateArray.forEach(function(latex, idx) {
        var mf = document.createElement('math-field');
        mf.className = 'math-field-instance';
        mf.setAttribute('math-virtual-keyboard-policy', 'manual');
        container.appendChild(mf);
        
        mf.value = latex;
        bindMathFieldEvents(mf);
        mathFields.push(mf);
    });
    activeMathField = mathFields[mathFields.length - 1];
    setTimeout(function() { if(activeMathField) activeMathField.focus(); }, 50);
    updateLatexOutput();
    setTimeout(updateLatexOutput, 60);
}

function performUndo() {
    if (undoStack.length <= 1) {
        if (undoStack.length === 1) {
            var current = undoStack.pop();
            redoStack.push(current);
            isUndoRedoAction = true;
            restoreState([]);
            isUndoRedoAction = false;
        }
        return;
    }
    isUndoRedoAction = true;
    var currentState = undoStack.pop();
    redoStack.push(currentState);
    var previousState = undoStack[undoStack.length - 1];
    restoreState(previousState);
    isUndoRedoAction = false;
}

function performRedo() {
    if (redoStack.length === 0) return;
    isUndoRedoAction = true;
    var nextState = redoStack.pop();
    undoStack.push(nextState);
    restoreState(nextState);
    isUndoRedoAction = false;
}

function bindMathFieldEvents(mf) {
    mf.addEventListener('focus', function() {
        activeMathField = mf;
    });

    mf.addEventListener('input', function() {
        updateLatexOutput();
        saveState();
    });

    mf.addEventListener('keydown', function(e) {
        var currentIdx = mathFields.indexOf(mf);
        
        // Fix siêu cấp: Chặn Unikey/IME nuốt mất định dạng (như Căn bậc, Ký hiệu)
        // khi gõ đè lên placeholder (ô vuông bo tròn).
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey && e.key !== 'Process') {
            e.preventDefault();
            mf.executeCommand(['insert', e.key]);
        } else if (e.keyCode === 229 || e.key === 'Process') {
            // Unikey đang tạo composition (ví dụ gõ số 1 để thêm dấu sắc trong VNI)
            // Lỗi của MathLive là crash khi composition đè lên một selection (placeholder).
            // Mẹo: Nhét một khoảng trống rỗng để ép MathLive xóa selection (placeholder)
            // NGAY TRƯỚC KHI trình duyệt ném composition text vào, biến nó thành trạng thái an toàn!
            mf.executeCommand(['insert', '']);
        }

        // Gõ nhanh "" để chèn tiếng việt
        if (e.key === '"' || e.key === "'") {
            var now = Date.now();
            if (now - (mf._lastQuoteTime || 0) < 400) {
                e.preventDefault();
                mf.executeCommand('deleteBackward');
                openInlineViInput();
                mf._lastQuoteTime = 0;
            } else {
                mf._lastQuoteTime = now;
            }
        }

                // Thêm hàng vào ma trận (Shift + Enter hoặc Shift + Space)
        if (e.shiftKey && (e.key === 'Enter' || e.code === 'Space')) {
            e.preventDefault();
            mf.executeCommand('addRowAfter');
        }
        // Enter -> Thêm dòng mới (khối math-field mới)
        else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createNewMathFieldAfter(currentIdx);
        }
        // Backspace -> Xóa dòng nếu trống
        else if (e.key === 'Backspace') {
            if (mf.value === '' && currentIdx > 0) {
                e.preventDefault();
                mf.remove();
                mathFields.splice(currentIdx, 1);
                mathFields[currentIdx-1].focus();
                updateLatexOutput();
                saveState();
            }
        }
    });

    // Sự kiện move-out khi bấm mũi tên đi ra khỏi giới hạn của phương trình hiện tại
    mf.addEventListener('move-out', function(e) {
        var currentIdx = mathFields.indexOf(mf);
        if (e.detail.direction === 'upward' || e.detail.direction === 'backward') {
            if (currentIdx > 0) {
                mathFields[currentIdx-1].focus();
                mathFields[currentIdx-1].executeCommand('moveToMathFieldEnd');
            }
        } else if (e.detail.direction === 'downward' || e.detail.direction === 'forward') {
            if (currentIdx < mathFields.length - 1) {
                mathFields[currentIdx+1].focus();
                mathFields[currentIdx+1].executeCommand('moveToMathFieldStart');
            }
        }
    });
}

function createNewMathFieldAfter(idx) {
    var container = document.getElementById('math-editor-container');
    var mf = document.createElement('math-field');
    mf.className = 'math-field-instance';
    mf.setAttribute('math-virtual-keyboard-policy', 'manual');
    
    if (idx === -1 || idx === mathFields.length - 1) {
        container.appendChild(mf);
    } else {
        container.insertBefore(mf, mathFields[idx+1]);
    }

    bindMathFieldEvents(mf);
    activeMathField = mf;

    if (idx === -1) {
        mathFields.push(mf);
    } else {
        mathFields.splice(idx + 1, 0, mf);
    }
    
    setTimeout(function() { mf.focus(); }, 50);
    updateLatexOutput();
    saveState();
}

function updateLatexOutput() {
    var latexStrings = mathFields.map(function(m) { return m.value; });
    var finalLatex = latexStrings.join(' \\\\\n');
    var outputEl = document.getElementById('latex-output');
    if (outputEl) outputEl.value = finalLatex;
}

function insertCmd(cmd) {
    if(activeMathField) {
        // MathLive executeCommand insert
        activeMathField.executeCommand(['insert', cmd]);
        activeMathField.focus();
    }
}

function writeMath(latex) {
    if(activeMathField) {
        activeMathField.executeCommand(['insert', latex]);
        activeMathField.focus();
    }
}

function writeMathLeft(latex) {
    if(activeMathField) {
        activeMathField.executeCommand(['insert', latex]);
        activeMathField.executeCommand('moveToPreviousChar');
        activeMathField.focus();
    }
}

function clearMath() {
    if (!confirm('Xóa toàn bộ nội dung?')) return;
    document.getElementById('math-editor-container').innerHTML = '';
    mathFields = [];
    createNewMathFieldAfter(-1);
    undoStack = [];
    redoStack = [];
    saveState();
    localStorage.removeItem('smp_mathtype_autosave');
}

function toggleZenMode() {
    document.body.classList.toggle('zen-mode');
    var isZen = document.body.classList.contains('zen-mode');
    var t = document.getElementById('smp-toast');
    if (t) {
        t.textContent = isZen ? 'Đã bật Chế độ Zen' : 'Đã tắt Chế độ Zen';
        t.style.opacity = '1';
        clearTimeout(t._t);
        t._t = setTimeout(function () { t.style.opacity = '0'; }, 2200);
    }
}

function openInlineViInput() {
    if (!activeMathField) return;
    
    var rect = activeMathField.getBoundingClientRect();
    
    var wrapper = document.createElement('div');
    wrapper.className = 'vi-input-wrapper';
    wrapper.style.left = (rect.left || window.innerWidth / 2) + 'px';
    // Đẩy khung lên trên một chút để không che khuất dòng gõ hiện tại
    wrapper.style.top = ((rect.top || window.innerHeight / 2) - 50) + 'px';
    
    var container = document.createElement('div');
    container.className = 'vi-input-container';
    
    var icon = document.createElement('span');
    icon.className = 'vi-icon';
    icon.textContent = 'VI';
    
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Gõ tiếng Việt...';
    
    var hint = document.createElement('span');
    hint.className = 'vi-hint';
    hint.textContent = 'Enter ↵';
    
    container.appendChild(icon);
    container.appendChild(input);
    container.appendChild(hint);
    wrapper.appendChild(container);
    
    document.body.appendChild(wrapper);
    input.focus();
    
    var committed = false;
    function commit() {
        if (committed) return;
        committed = true;
        if (input.value.trim() !== '') {
            activeMathField.executeCommand(['insert', '\\text{' + input.value + '}']);
        }
        wrapper.remove();
        activeMathField.focus();
    }
    
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            wrapper.remove();
            activeMathField.focus();
        }
    });
    
    input.addEventListener('blur', function() {
        commit();
    });
}







