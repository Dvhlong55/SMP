// ============================================
// SMP - CLASS ADMIN LOGIC
// ============================================

let currentClassId = null;
let currentStudents = [];
let allClasses = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const token = localStorage.getItem('smp_access_token');
    if (!token) {
        if(window.openAuthModal) window.openAuthModal('login');
        return;
    }
    loadClassDashboard();
    
    // Set default date for transaction
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tx-date').value = today;
});

async function loadClassDashboard() {
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const classRes = await fetch(`${API_BASE_URL}/api/admin/classes`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (classRes.ok) {
            allClasses = await classRes.json();
            renderClassList();
            if (allClasses.length > 0) {
                selectClass(allClasses[0].id);
            }
        } else {
            console.error("Failed to load classes (not admin?)");
            document.querySelector('.class-container').innerHTML = '<div style="text-align:center; padding: 50px; color: #ef4444;">Bạn không có quyền truy cập trang này.</div>';
        }
    } catch (e) {
        console.error("Failed to load class info", e);
    }
}

function renderClassList() {
    const container = document.getElementById('class-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    allClasses.forEach(cls => {
        const btn = document.createElement('button');
        btn.className = `admin-tab-btn ${cls.id === currentClassId ? 'active' : ''}`;
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.padding = '12px 16px';
        btn.style.display = 'block';
        btn.style.marginBottom = '4px';
        btn.style.background = cls.id === currentClassId ? 'rgba(92, 225, 230, 0.1)' : 'transparent';
        btn.style.color = cls.id === currentClassId ? 'var(--accent-cyan)' : 'var(--text-muted)';
        btn.style.border = '1px solid';
        btn.style.borderColor = cls.id === currentClassId ? 'var(--accent-cyan)' : 'transparent';
        btn.textContent = cls.name;
        btn.onclick = () => selectClass(cls.id);
        container.appendChild(btn);
    });
}

async function selectClass(classId) {
    currentClassId = classId;
    renderClassList(); // Update active state
    
    const cls = allClasses.find(c => c.id === classId);
    if (cls) {
        const title = document.getElementById('class-title-display');
        if (title) title.textContent = cls.name; // Changed from "Danh sách: " + name
    }
    
    await fetchStudents();
}

window.promptCreateClass = async function() {
    const name = prompt("Nhập tên lớp học mới:");
    if (!name || name.trim() === "") return;
    
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name.trim() })
        });
        if (res.ok) {
            loadClassDashboard();
        }
    } catch (e) {
        alert("Lỗi khi tạo lớp");
    }
};

async function fetchStudents() {
    if (!currentClassId) return;
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/${currentClassId}/students`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            currentStudents = await res.json();
            renderClassTable();
        }
    } catch (e) {
        console.error("Failed to fetch students", e);
    }
}

function calculateTotalDebt(transactions) {
    if (!transactions || !Array.isArray(transactions)) return 0;
    return transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
}

function renderClassTable() {
    const tbody = document.getElementById('class-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (currentStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">Chưa có học viên nào</td></tr>';
        return;
    }
    
    currentStudents.forEach((st, index) => {
        // Compute new fee logic
        const tong = calculateTotalDebt(st.fee_transactions);
        
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => window.openStudentModal(st.id);
        
        tr.onmouseover = () => { tr.style.backgroundColor = 'rgba(255,255,255,0.05)'; };
        tr.onmouseout = () => { tr.style.backgroundColor = 'transparent'; };
        
        let displayTong = (tong / 1000) + 'k';
        if (tong <= 0) {
            displayTong = '<span class="text-green">Đã hoàn thành</span>';
        } else {
            displayTong = '<span class="text-red">Nợ ' + displayTong + '</span>';
        }
        
        tr.innerHTML = `
            <td style="color: var(--text-muted); font-family: 'JetBrains Mono', monospace;">${index + 1}</td>
            <td style="font-weight: bold; color: var(--text-dark);">${st.full_name}</td>
            <td style="text-align: right; font-weight: bold;">${displayTong}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.addNewStudentRow = async function() {
    if (!currentClassId) return;
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    const newStudent = {
        full_name: "Tên Học Viên Mới",
        birth_year: 2010,
        phone: "",
        email: ""
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/${currentClassId}/students`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newStudent)
        });
        if (res.ok) {
            await fetchStudents(); // reload
        }
    } catch(e) {}
};

// Modal functions
let editingStudent = null;

window.openStudentModal = function(studentId) {
    const st = currentStudents.find(x => x.id === studentId);
    if (!st) return;
    
    editingStudent = st;
    
    document.getElementById('modal-student-id').value = st.id;
    document.getElementById('modal-full-name').value = st.full_name || '';
    document.getElementById('modal-birth-year').value = st.birth_year || '';
    document.getElementById('modal-phone').value = st.phone || '';
    document.getElementById('modal-email').value = st.email || '';
    
    renderTransactionHistory();
    
    const modal = document.getElementById('student-detail-modal');
    modal.style.display = 'flex';
    void modal.offsetWidth; // trigger reflow
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'translateY(0)';
};

function renderTransactionHistory() {
    if (!editingStudent) return;
    const transactions = editingStudent.fee_transactions || [];
    const tbody = document.getElementById('transaction-tbody');
    tbody.innerHTML = '';
    
    let total = 0;
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; font-style: italic;">Chưa có giao dịch</td></tr>';
    } else {
        // Sort newest first
        const sorted = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        sorted.forEach(tx => {
            total += (tx.amount || 0);
            const tr = document.createElement('tr');
            
            const isNegative = tx.amount < 0;
            const amountStr = (Math.abs(tx.amount) / 1000) + 'k';
            const displayClass = isNegative ? 'text-green' : 'text-red';
            const prefix = isNegative ? '-' : '+';
            
            tr.innerHTML = `
                <td>${tx.date}</td>
                <td>${tx.note || ''}</td>
                <td style="text-align: right; font-weight: bold;" class="${displayClass}">${prefix}${amountStr}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Re-calculate total from scratch to be safe
        total = calculateTotalDebt(transactions);
    }
    
    const totalEl = document.getElementById('modal-total-debt');
    if (total <= 0) {
        totalEl.innerHTML = '<span class="text-green">0k</span>';
    } else {
        totalEl.innerHTML = '<span class="text-red">' + (total / 1000) + 'k</span>';
    }
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

window.addTransaction = async function() {
    if (!editingStudent) return;
    
    let amountRaw = document.getElementById('tx-amount').value;
    if (!amountRaw || isNaN(amountRaw)) {
        alert("Vui lòng nhập số tiền hợp lệ");
        return;
    }
    
    const amount = parseFloat(amountRaw) * 1000; // Convert k to real value
    const date = document.getElementById('tx-date').value || new Date().toISOString().split('T')[0];
    const note = document.getElementById('tx-note').value.trim();
    
    const newTx = {
        id: generateUUID(),
        amount: amount,
        date: date,
        note: note
    };
    
    if (!editingStudent.fee_transactions) editingStudent.fee_transactions = [];
    editingStudent.fee_transactions.push(newTx);
    
    // Clear inputs
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-note').value = '';
    
    renderTransactionHistory();
};

window.closeStudentModal = function() {
    const modal = document.getElementById('student-detail-modal');
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'translateY(20px)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
    editingStudent = null;
};

window.saveStudentFromModal = async function(e) {
    e.preventDefault();
    if (!editingStudent) return;
    
    const studentId = editingStudent.id;
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    const payload = {
        full_name: document.getElementById('modal-full-name').value.trim(),
        birth_year: parseInt(document.getElementById('modal-birth-year').value) || 0,
        phone: document.getElementById('modal-phone').value.trim(),
        email: document.getElementById('modal-email').value.trim(),
        fee_transactions: editingStudent.fee_transactions || []
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/students/${studentId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            closeStudentModal();
            fetchStudents(); // Refresh UI
        } else {
            alert("Lỗi khi lưu thông tin");
        }
    } catch(err) {
        alert("Lỗi kết nối");
    }
};

window.deleteStudentFromClass = async function() {
    if (!editingStudent) return;
    const studentId = editingStudent.id;
    
    if (!confirm("Bạn có chắc chắn muốn xóa học viên này khỏi danh sách?")) {
        return;
    }
    
    const token = localStorage.getItem('smp_access_token');
    const API_BASE_URL = window.API_BASE_URL || 'https://smp-backend-kcwn.onrender.com';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/classes/students/${studentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            closeStudentModal();
            fetchStudents(); // Refresh UI
        } else {
            alert("Lỗi khi xóa học viên");
        }
    } catch(err) {
        alert("Lỗi kết nối khi xóa");
    }
};
