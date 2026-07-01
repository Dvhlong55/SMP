var mathFields = [];
var activeMathField = null;

// Undo/Redo System
var undoStack = [];
var redoStack = [];
var isUndoRedoAction = false;
var saveStateTimeout = null;

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

    // Auto-save logic: Khôi phục nếu có
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







