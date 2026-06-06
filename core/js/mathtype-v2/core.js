var MQ;

var mathFields = [];
var activeMathField = null;

// Undo/Redo System
var undoStack = [];
var redoStack = [];
var isUndoRedoAction = false;
var saveStateTimeout = null;

document.addEventListener('DOMContentLoaded', function () {
    MQ = MathQuill.getInterface(2);
    
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

    // Gõ tiếng Việt On-the-fly và Undo/Redo Shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl + Space -> Chèn \text{}
        if (e.ctrlKey && e.code === 'Space') {
            e.preventDefault();
            if (activeMathField) {
                activeMathField.cmd('\\text');
            }
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
            var latexStrings = mathFields.map(function(m) { return m.latex(); });
            localStorage.setItem('smp_mathtype_autosave', JSON.stringify(latexStrings));
        }
    }, 10000);
});

function saveState() {
    if (isUndoRedoAction) return;
    clearTimeout(saveStateTimeout);
    saveStateTimeout = setTimeout(function() {
        var currentState = mathFields.map(function(m) { return m.latex(); });
        
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
        var span = document.createElement('span');
        span.className = 'math-field-instance';
        container.appendChild(span);
        
        var mf = MQ.MathField(span, getMathFieldConfig());
        mf.__span = span;
        span.addEventListener('focusin', function() { activeMathField = mf; });
        mf.latex(latex);
        mathFields.push(mf);
        attachDoubleQuoteListener(span, mf);
    });
    activeMathField = mathFields[mathFields.length - 1];
    setTimeout(function() { if(activeMathField) activeMathField.focus(); }, 50);
    updateLatexOutput();
}

function performUndo() {
    if (undoStack.length <= 1) {
        if (undoStack.length === 1) {
            // Revert to initial empty state
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

function getMathFieldConfig() {
    return {
        autoCommands: 'pi theta sqrt sum int alpha beta gamma delta epsilon lambda mu rho sigma phi omega',
        autoOperatorNames: 'sin cos tan cot log ln lim max min',
        handlers: {
            edit: function() { 
                updateLatexOutput(); 
                saveState();
            },
            enter: function(mf) {
                var currentIdx = mathFields.indexOf(mf);
                createNewMathFieldAfter(currentIdx);
            },
            upOutOf: function(mf) {
                var currentIdx = mathFields.indexOf(mf);
                if(currentIdx > 0) mathFields[currentIdx-1].focus();
            },
            downOutOf: function(mf) {
                var currentIdx = mathFields.indexOf(mf);
                if(currentIdx < mathFields.length - 1) mathFields[currentIdx+1].focus();
            },
            deleteOutOf: function(dir, mf) {
                var currentIdx = mathFields.indexOf(mf);
                if (dir === MQ.L && currentIdx > 0 && mf.latex() === '') {
                    mf.__span.remove();
                    mathFields.splice(currentIdx, 1);
                    mathFields[currentIdx-1].focus();
                    updateLatexOutput();
                    saveState();
                }
            }
        }
    };
}

function attachDoubleQuoteListener(span, mf) {
    var lastQuoteTime = 0;
    span.addEventListener('keydown', function(e) {
        if (e.key === '"' || e.key === "'") {
            var now = Date.now();
            if (now - lastQuoteTime < 400) {
                e.preventDefault();
                e.stopPropagation();
                mf.keystroke('Backspace'); // Xóa dấu nháy trước đó (nếu có)
                mf.cmd('\\text');
                lastQuoteTime = 0;
            } else {
                lastQuoteTime = now;
            }
        }
    }, true);
}

function createNewMathFieldAfter(idx) {
    var container = document.getElementById('math-editor-container');
    var span = document.createElement('span');
    span.className = 'math-field-instance';
    
    if (idx === -1 || idx === mathFields.length - 1) {
        container.appendChild(span);
    } else {
        container.insertBefore(span, mathFields[idx+1].__span);
    }

    var mf = MQ.MathField(span, getMathFieldConfig());
    mf.__span = span;
    
    span.addEventListener('focusin', function() { activeMathField = mf; });
    activeMathField = mf;
    attachDoubleQuoteListener(span, mf);

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
    var latexStrings = mathFields.map(function(m) { return m.latex(); });
    var finalLatex = latexStrings.join(' \\\\\n');
    var outputEl = document.getElementById('latex-output');
    if (outputEl) outputEl.value = finalLatex;
}

function insertCmd(cmd) {
    if(activeMathField) activeMathField.cmd(cmd).focus();
}

function writeMath(latex) {
    if(activeMathField) activeMathField.write(latex).focus();
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
