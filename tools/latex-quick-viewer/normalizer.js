/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer — Math Context Parser & Normalization Pipeline
 * ==============================================================================
 * Phiên bản: 3.0.0 — Chuẩn hóa hoàn thiện ngữ cảnh, biểu thức và Typographic Formatting
 * ==============================================================================
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.SMPNormalizer = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Regex phát hiện ký tự có dấu tiếng Việt
    const VI_ACCENTS_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

    // Danh sách từ tiếng Việt & thuật ngữ toán thông dụng (kể cả không dấu / viết tắt)
    const VIETNAMESE_WORDS = new Set([
        'da', 'em', 'xin', 'gop', 'cau', 'xet', 'thi', 'va', 'hoac', 'khi', 'do',
        'ta', 'co', 'suy', 'ra', 'nen', 'ket', 'hop', 'voi', 'nghiem', 'duy', 'nhat',
        'dung', 'danh', 'gia', 'mot', 'ti', 'tim', 'duoc', 'cm', 'dc', 'dpcm', 'cmtt', 'bai',
        'toan', 'loi', 'giai', 'dinh', 'ly', 'bo', 'de', 'he', 'so', 'lien', 'tuc',
        'dong', 'bien', 'nghich', 'tren', 'duoi', 'trong', 'trog', 'ngoai', 'gia', 'su', 'dat',
        'tuong', 'duong', 'nhu', 'vay', 'vo', 'ly', 'mau', 'thuan', 'thoa', 'man',
        'dieu', 'kien', 'tiep', 'tuyen', 'dao', 'ham', 'nguyen', 'tich', 'phan', 'tong',
        'hieu', 'chung', 'minh', 'lagrange', 'cauchy', 'schwarz', 'bernoulli',
        'chebyshev', 'jensen', 'theo', 'gia', 'thiet', 'de', 'thay', 'mat', 'khac',
        'tuong', 'tu', 'lai', 'goi', 'la', 'diem', 'duong', 'thang', 'mat', 'phang',
        'tam', 'giac', 'tu', 'giac', 'hinh', 'vuong', 'chu', 'nhat', 'tro', 'sau', 'day', 'truong',
        'hop', 'th1', 'th2', 'khoang', 'doan', 'nua', 'nho', 'hon', 'lon', 'bang', 'khac',
        'phan', 'buoc', 'muc', 'sao', 'cho', 'hay', 'neu', 'ma', 'roi', 'cung', 'cac', 'nhung',
        'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin', 'muoi', 'khong', 'rat',
        'se', 'dang', 'bi', 'boi', 'cua', 've', 'tai', 'tu', 'den', 'luon', 'chi', 'moi',
        'tat', 'ca', 'ai', 'nao', 'dau', 'biet', 'tuc', 'chia', 'het', 'du', 'trung', 'modulo',
        'giao', 'tap', 'con', 'rong', 'hoan', 'vi', 'chan', 'le', 'tang', 'dan', 'giam',
        'vo', 'han', 'huu', 'da', 'thuc', 'luy', 'thua', 'bac', 'hang', 'tu', 'dong', 'quy',
        'vien', 'thang', 'hang', 'vi', 'tu', 'nghich', 'dao', 'phuong', 'tich', 'truc',
        'dang', 'trung', 'chieu', 'tiep', 'xuc', 'cat', 'nhau', 'nhan', 'that', 'dan', 'toi',
        'ket', 'luan', 'yeu', 'cau', 'goc', 'canh', 'day', 'ban', 'kinh', 'chu', 'vi', 'dien',
        'the', 'bat', 'chua', 'nguoc', 'quy', 'nap', 'manh', 'gia', 'tri', 'ham', 'nham',
        'thoi', 'viet', 'nho', 'giai', 'thich', 'kho', 'bieu', 'dien', 'lap', 'y',
        'tuong', 'nhan', 'thu', 'phia', 'chu', 'quan', 'trong', 'goi', 'y', 'the', 'hinh',
        'ben', 'con', 'truong', 'canh', 'bien', 'duong', 'tron', 'euler', 'quen', 'thuoc',
        'trung', 'diem', 'dinh', 'nghia', 'bo', 'diem', 'phep', 'dang', 'thuc', 'dung',
        'truc', 'phuong', 'dan', 'toi', 'noi', 'giao', 'cach', 'hinh', 'chieu', 'bien',
        'co', 'doi', 'chua', 'it', 'ghep', 'chu', 'y', 'de', 'dang', 'xac', 'dinh', 'phan',
        'tu', 'lon', 'nho', 'xuat', 'hien', 'dang', 'ghep', 'vi', 'tri', 'khong', 'the',
        'chua', 'tat', 'ca', 'ton', 'tai', 'bat', 'ky', 'bat', 'ki', 'co', 'dinh',
        'thoa', 'gia', 'tri', 'nghiem', 'phuong', 'trinh', 'bat', 'dang', 'thuc'
    ]);

    // Các hàm toán học chuẩn (không coi là từ tự nhiên)
    const MATH_FUNCTIONS = new Set([
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'lim', 'ln', 'log', 'exp',
        'sqrt', 'cbrt', 'max', 'min', 'gcd', 'deg', 'det', 'dim', 'ker', 'arg',
        'inf', 'sup', 'mod'
    ]);

    /**
     * Kiểm tra một từ có phải từ tiếng Việt/văn bản thường
     */
    function isNaturalLanguageWord(word, isLineStart = false) {
        if (!word) return false;
        const clean = word.toLowerCase().replace(/^[(\["'«]+|[)\]"'».,:;?!]+$/g, '').trim();
        if (!clean) return false;

        // Nhãn danh sách ở đầu dòng: a), b), (i), (ii), 1)
        if (isLineStart && /^(?:[a-z0-9]\)|\([a-z0-9]+\)|\([ivx]+\))$/i.test(word.trim())) {
            return true;
        }

        // Ký tự đơn (a, b, x, y, A, B...) luôn là biến số toán học
        if (clean.length === 1 && /^[a-zA-Z]$/.test(clean)) {
            return false;
        }

        // Có dấu tiếng Việt
        if (VI_ACCENTS_REGEX.test(clean)) return true;

        // Từ trong từ điển tiếng Việt / thuật ngữ
        if (VIETNAMESE_WORDS.has(clean)) return true;

        // Từ gồm các chữ cái latin thuần túy dài từ 2 ký tự trở lên:
        if (/^[a-zA-Z]+$/.test(clean)) {
            if (clean.length >= 2) {
                if (MATH_FUNCTIONS.has(clean)) return false;
                // Các điểm hình học viết hoa (ABC, XYZ, MN, SB)
                if (/^[A-Z]{2,4}$/.test(word.replace(/^[(\["'«]+|[)\]"'».,:;?!]+$/g, ''))) {
                    return false;
                }
                return true;
            }
        }

        return false;
    }

    /**
     * Kiểm tra dòng có chứa từ tự nhiên hay không
     */
    function lineHasNaturalLanguage(line) {
        const words = line.trim().split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            if (isNaturalLanguageWord(words[i], i === 0)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tiền xử lý văn bản thô
     */
    function preSanitize(text) {
        if (!text) return '';
        let s = text;

        // Bỏ URL theo dõi Facebook hoặc link bọc biến: [GX.GA](https://l.facebook.com/...) -> GX.GA
        s = s.replace(/\[([^\]]+)\]\(https?:\/\/(?:[a-zA-Z0-9.\-]+\.)?(?:facebook\.com|fb\.com|l\.facebook\.com)\/[^\)]*\)/gi, '$1');
        s = s.replace(/\[([A-Za-z0-9_.'\+\-\*\/\^\=]+)\]\(https?:\/\/[^\)]+\)/g, '$1');

        // Bỏ dấu $ cô lập ở cuối dòng nếu có
        s = s.replace(/([^$])\$\s*$/gm, '$1');

        // Tách hàm lượng giác dính liền điểm: sinXGB -> sin XGB, cosA -> cos A
        s = s.replace(/\b(sin|cos|tan|cot|ln|log|exp|sqrt|cbrt)([A-Z][a-zA-Z0-9_']*)\b/gi, '$1 $2');

        // Thoát dấu ngoặc nhọn tập hợp trong văn bản: {1, 2, ..., 2026} -> \{1, 2, ..., 2026\}
        s = s.replace(/\{([^{}\n]*[0-9a-zA-Z_\+\-\.\,][^{}\n]*)\}/g, '\\{$1\\}');

        // Ký hiệu hình học Unicode
        s = s.replace(/[∆Δ]\s*([A-Z]{3,4})/g, '\\triangle $1');
        s = s.replace(/[∆Δ]/g, '\\triangle ');
        s = s.replace(/∠\s*([A-Z]{3})/g, '\\widehat{$1}');

        // Căn thức
        s = s.replace(/(?:căn|can)\s*\(([^)]+)\)/gi, '\\sqrt{$1}');
        s = s.replace(/(?:căn|can)\s+([a-zA-Z0-9]+)/gi, '\\sqrt{$1}');

        // Vô cùng
        s = s.replace(/([+\-])\s*(?:vô cùng|vocung|vô cực|vocuc)/gi, '$1\\infty');
        s = s.replace(/(?:vô cùng|vocung|vô cực|vocuc)/gi, '\\infty');

        // Khoảng / đoạn số học: ( 0, + vô cùng ) -> $(0, +\infty)$
        s = s.replace(/([(\[])\s*([+\-]?[0-9a-zA-Z\\]+)\s*,\s*([+\-]?[0-9a-zA-Z\\]+)\s*([)\]])/g, function(_, open, a, b, close) {
            return ` $${open}${a.trim()}, ${b.trim()}${close}$ `;
        });

        // Đảm bảo dấu phẩy trong danh sách công thức có khoảng trắng sau nó
        s = s.replace(/([0-9a-zA-Z\)])\s*,\s*([0-9a-zA-Z])/g, '$1, $2');

        return s;
    }

    /**
     * Chuẩn hóa tốc ký trong một phân đoạn toán học thuần túy
     */
    function formatMathSegment(mathStr) {
        if (!mathStr) return '';
        let s = mathStr.trim();

        // 1. Phương tích điểm đối với đường tròn: P_(S/(BXZ)) -> Shielded placeholder
        s = s.replace(/P_\(?\s*([A-Za-z0-9_]+)\s*\/\s*\(?([A-Za-z0-9_]+)\)?\)?/gi, '___POWPOINT___$1___$2___');

        // 2. Phép so sánh và mũi tên
        s = s.replace(/<=>/g, ' \\Leftrightarrow ');
        s = s.replace(/=>/g, ' \\Rightarrow ');
        s = s.replace(/->/g, ' \\to ');
        s = s.replace(/<-/g, ' \\leftarrow ');
        s = s.replace(/>=/g, ' \\ge ');
        s = s.replace(/<=/g, ' \\le ');
        s = s.replace(/!=/g, ' \\ne ');
        s = s.replace(/~=/g, ' \\approx ');

        // 3. Dấu chấm lửng
        s = s.replace(/\+\s*\.{2,}\s*\+/g, ' + \\dots + ');
        s = s.replace(/\-\s*\.{2,}\s*\-/g, ' - \\dots - ');
        s = s.replace(/=\s*\.{2,}/g, ' = \\dots ');
        s = s.replace(/,\s*\.{2,}\s*,/g, ', \\dots, ');
        s = s.replace(/(?<=[a-zA-Z0-9_\)\]\}])\s*\.{3,}\s*(?=[a-zA-Z0-9_\(\[\{])/g, ' \\dots ');
        s = s.replace(/\.{3,}/g, ' \\dots ');

        // 4. Modulo: a = b mod m -> a \equiv b \pmod{m}
        s = s.replace(/=\s*([0-9a-zA-Z_]+)\s*mod\s*([0-9a-zA-Z_]+)/gi, '\\equiv $1 \\pmod{$2}');
        s = s.replace(/\bmod\s+([0-9a-zA-Z_]+)/gi, '\\pmod{$1}');

        // 5. Quan hệ chia hết: p | P(p) -> p \mid P(p)
        s = s.replace(/([a-zA-Z0-9_]+)\s*\|\s*([a-zA-Z0-9_]+(?:\([a-zA-Z0-9_]+\))?)/g, '$1 \\mid $2');

        // 6. Giới hạn lim:
        s = s.replace(/lim\s+([a-zA-Z0-9_\(\)]+)\s*\^\s*\(\s*([^)]+)\s*\)/g, function(_, fn, sub) {
            let cleanSub = sub.replace(/->/g, '\\to').replace(/\s+/g, ' ').trim();
            cleanSub = cleanSub.replace(/([0-9\+\-\\infty]+)\s*([+\-])$/, '$1^{$2}');
            return `\\lim_{${cleanSub}} ${fn}`;
        });
        s = s.replace(/lim\s*\^\s*\(\s*([^)]+)\s*\)\s*([a-zA-Z0-9_\(\)]+)/g, function(_, sub, fn) {
            let cleanSub = sub.replace(/->/g, '\\to').replace(/\s+/g, ' ').trim();
            cleanSub = cleanSub.replace(/([0-9\+\-\\infty]+)\s*([+\-])$/, '$1^{$2}');
            return `\\lim_{${cleanSub}} ${fn}`;
        });
        s = s.replace(/lim_\s*\(\s*([^)]+)\s*\)\s*([a-zA-Z0-9_\(\)]+)/g, function(_, sub, fn) {
            let cleanSub = sub.replace(/->/g, '\\to').replace(/\s+/g, ' ').trim();
            cleanSub = cleanSub.replace(/([0-9\+\-\\infty]+)\s*([+\-])$/, '$1^{$2}');
            return `\\lim_{${cleanSub}} ${fn}`;
        });
        s = s.replace(/\blim\s+([a-zA-Z0-9_]+(?:\([a-zA-Z0-9_]+\))?)/g, '\\lim $1');

        // 7. Hàm lượng giác chuẩn hóa
        s = s.replace(/\b(?:sin|Sin)\s*([A-Za-z0-9_']*)/g, '\\sin $1');
        s = s.replace(/\b(?:cos|Cos)\s*([A-Za-z0-9_']*)/g, '\\cos $1');
        s = s.replace(/\b(?:tan|Tan)\s*([A-Za-z0-9_']*)/g, '\\tan $1');
        s = s.replace(/\b(?:cot|Cot)\s*([A-Za-z0-9_']*)/g, '\\cot $1');

        // 8. Phân số:
        // a) Tỉ số lượng giác: \sin XGB / \sin XGC
        s = s.replace(/\\sin\s*([A-Za-z0-9_']+)\s*\/\s*\\sin\s*([A-Za-z0-9_']+)/gi, '\\frac{\\sin $1}{\\sin $2}');
        s = s.replace(/\\cos\s*([A-Za-z0-9_']+)\s*\/\s*\\cos\s*([A-Za-z0-9_']+)/gi, '\\frac{\\cos $1}{\\cos $2}');
        // b) Tỉ số đoạn thẳng hình học: XF/XE, SA'/RA', A_0F/A_0E
        s = s.replace(/([A-Z][a-zA-Z0-9_']*(?:')?)\s*\/\s*([A-Z][a-zA-Z0-9_']*(?:')?)/g, '\\frac{$1}{$2}');
        // c) Phân số có ngoặc:
        s = s.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
        s = s.replace(/([0-9a-zA-Z_]+)\s*\/\s*\(([^)]+)\)/g, '\\frac{$1}{$2}');
        s = s.replace(/\(([^)]+)\)\s*\/\s*([0-9a-zA-Z_]+)/g, '\\frac{$1}{$2}');
        // d) Dạng số học/đại số đơn giản: 1/x+1, 1/n(x+n)
        s = s.replace(/([0-9]+|[a-zA-Z])\/([a-zA-Z][\+\-][0-9a-zA-Z]+)(?=\s*[\+\-\=]|$)/g, '\\frac{$1}{$2}');

        // 9. Phép nhân: dấu chấm '.' và '*'
        s = s.replace(/\s*\*\s*/g, ' \\cdot ');
        s = s.replace(/\s+\.\s+/g, ' \\cdot ');
        s = s.replace(/([A-Za-z0-9_'\\]+|\})\s*\.\s*(\\frac|[A-Za-z0-9_'\\]+)/g, function(match, p1, p2) {
            if (/^\d+$/.test(p1) && /^\d+$/.test(p2)) return match;
            return `${p1} \\cdot ${p2}`;
        });

        // 10. Luỹ thừa và số mũ:
        s = s.replace(/(\([^)]+\))\^\(([^)]+)\)/g, '$1^{$2}');
        s = s.replace(/(\([^)]+\))\^([a-zA-Z0-9_]+)/g, '$1^{$2}');
        s = s.replace(/([a-zA-Z0-9_]+)\^\(([^)]+)\)/g, '$1^{$2}');
        s = s.replace(/([a-zA-Z0-9_]+)\^([a-zA-Z0-9_]+)/g, function(match, base, exp) {
            return `${base}^{${exp}}`;
        });

        // 11. Chỉ số dưới (subscript) trên biến số và đoạn thẳng:
        // Đoạn thẳng ghép 2 chỉ số: C1C2 -> C_1C_2, B_0C_0 -> B_0C_0
        s = s.replace(/\b([A-Z])([0-9]+)([A-Z])([0-9]+)\b/g, '$1_{$2}$3_{$4}');
        s = s.replace(/\b([A-Z])_([0-9]+)([A-Z])_([0-9]+)\b/g, '$1_{$2}$3_{$4}');
        // Biến có ngoặc dưới: a_(i+1) -> a_{i+1}, a_(k+1) -> a_{k+1}
        s = s.replace(/([a-zA-Z0-9\)])\_\(([^)]+)\)/g, '$1_{$2}');
        s = s.replace(/([a-zA-Z0-9\)])\_([a-zA-Z0-9]+)/g, '$1_{$2}');
        // Ký hiệu biến đơn có số: a1 -> a_1, a2026 -> a_{2026}, c1 -> c_1, p1 -> p_1, pr -> p_r
        s = s.replace(/(?<![\\_a-zA-Z0-9])([a-zA-Z])([0-9]+)\b/g, '$1_{$2}');
        s = s.replace(/(?<![\\_a-zA-Z0-9])([A-Z]{2})([0-9]+)\b/g, '$1_{$2}');

        // Khôi phục ký hiệu phương tích đã che chắn
        s = s.replace(/___POWPOINT___([A-Za-z0-9_]+)___([A-Za-z0-9_]+)___/g, '\\mathcal{P}_{$1/($2)}');

        // 12. Định dạng khoảng trắng các phép so sánh
        s = s.replace(/([<>=])\s*(?=[0-9a-zA-Z\-\\+])/g, '$1 ');
        s = s.replace(/(?<=[0-9a-zA-Z\)])\s*([<>=])/g, ' $1');

        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    /**
     * Chuyển đổi môi trường giả lập (Hệ phương trình, Tuyển, Chuỗi tương đương)
     */
    function convertPseudoEnvironments(text) {
        if (!text) return '';
        const lines = text.split('\n');
        const outputLines = [];
        let i = 0;

        while (i < lines.length) {
            // Hệ phương trình: dòng bắt đầu bằng '{'
            if (/^\s*\{\s*/.test(lines[i])) {
                const casesLines = [];
                while (i < lines.length && /^\s*\{\s*/.test(lines[i])) {
                    casesLines.push(lines[i].replace(/^\s*\{\s*/, '').trim());
                    i++;
                }
                if (casesLines.length > 0) {
                    const inner = casesLines.map(l => formatMathSegment(preSanitize(l))).join(' \\\\\n  ');
                    outputLines.push(`$\\begin{cases}\n  ${inner}\n\\end{cases}$`);
                    continue;
                }
            }

            // Tuyển: dòng bắt đầu bằng '['
            if (/^\s*\[\s*/.test(lines[i])) {
                const arrayLines = [];
                while (i < lines.length && /^\s*\[\s*/.test(lines[i])) {
                    arrayLines.push(lines[i].replace(/^\s*\[\s*/, '').trim());
                    i++;
                }
                if (arrayLines.length > 0) {
                    const inner = arrayLines.map(l => formatMathSegment(preSanitize(l))).join(' \\\\\n  ');
                    outputLines.push(`$\\left[\\begin{array}{l}\n  ${inner}\n\\end{array}\\right.$`);
                    continue;
                }
            }

            outputLines.push(lines[i]);
            i++;
        }

        return outputLines.join('\n');
    }

    /**
     * Phân tích và biên dịch một dòng văn bản thô
     */
    function processRawTextLine(line) {
        if (!line.trim()) return line;
        if (/^\\begin\{(?:cases|array|aligned|matrix|pmatrix)\}/.test(line.trim())) {
            return line;
        }

        // Bảo toàn tiền tố danh sách dạng đầu mục (*, -, •)
        let prefix = '';
        const bulletMatch = line.match(/^(\s*[*•-]\s+)/);
        if (bulletMatch) {
            prefix = bulletMatch[1];
            line = line.slice(prefix.length);
        }

        // Bảo toàn tiền tố nhãn câu: a) b) (i)
        let labelPrefix = '';
        const labelMatch = line.match(/^(\s*(?:[a-zA-Z0-9]\)|\([a-zA-Z0-9]+\)|\([ivx]+\))\s+)/i);
        if (labelMatch) {
            labelPrefix = labelMatch[1];
            line = line.slice(labelPrefix.length);
        }

        // DÒNG TOÁN HỌC THUẦN TÚY: Không có bất kỳ từ tự nhiên nào và chứa toán tử/biểu thức toán
        if (!lineHasNaturalLanguage(line) && /[=<>+\-*/\\^_|]|\\infty|\\sqrt|\\triangle|\b[a-zA-Z]\d+\b/.test(line)) {
            const formatted = formatMathSegment(line);
            return prefix + labelPrefix + `$${formatted}$`;
        }

        const words = line.split(/(\s+)/);
        const segments = [];
        let currentType = null;
        let currentTokens = [];

        function flushSegment() {
            if (currentTokens.length === 0) return;
            const str = currentTokens.join('');
            currentTokens = [];
            if (!str) return;

            if (currentType === 'MATH') {
                let cleanMath = str.trim();

                // 1. Tách dấu câu cuối: .,;:?!
                let trailingPunct = '';
                const matchPunct = cleanMath.match(/([.,;:?!]+)$/);
                if (matchPunct) {
                    trailingPunct = matchPunct[1];
                    cleanMath = cleanMath.slice(0, -trailingPunct.length).trim();
                }

                // 2. Cân bằng dấu ngoặc đơn ở hai đầu biểu thức
                let openP = 0, closeP = 0;
                for (let c of cleanMath) {
                    if (c === '(') openP++;
                    else if (c === ')') closeP++;
                }
                if (closeP > openP && cleanMath.endsWith(')')) {
                    const diff = closeP - openP;
                    trailingPunct = ')'.repeat(diff) + trailingPunct;
                    cleanMath = cleanMath.slice(0, -diff).trim();
                }

                let leadingPunct = '';
                if (openP > closeP && cleanMath.startsWith('(')) {
                    const diff = openP - closeP;
                    leadingPunct = '('.repeat(diff);
                    cleanMath = cleanMath.slice(diff).trim();
                }

                if (cleanMath) {
                    const formatted = formatMathSegment(cleanMath);
                    segments.push(`${leadingPunct}$${formatted.trim()}$${trailingPunct}`);
                } else {
                    segments.push(str);
                }
            } else {
                segments.push(str);
            }
        }

        for (let i = 0; i < words.length; i++) {
            const token = words[i];
            if (/^\s+$/.test(token)) {
                currentTokens.push(token);
                continue;
            }

            const isStart = (i === 0 || (i === 2 && /^\s+$/.test(words[1])));
            const isNat = isNaturalLanguageWord(token, isStart);

            if (isNat) {
                if (currentType === 'MATH') {
                    flushSegment();
                }
                currentType = 'TEXT';
                currentTokens.push(token);
                continue;
            }

            // Nhận diện toán tử, biến số và hình học
            const isMathOp = /[=<>+\-*/\\^_|]|\\infty|\\sqrt|\\triangle|\b(?:lim|sum|int|sqrt|sin|cos|tan)\b/.test(token);
            const isVarPattern = /[a-zA-Z]_[a-zA-Z0-9]+|[a-zA-Z]\([a-zA-Z0-9,]+\)|\b[a-zA-Z]\d+\b|\b[A-Z]{2,4}\d*\b/.test(token);
            const isCirclePattern = /^\([A-Z]{1,4}\)$/.test(token);
            const isSingleLetterVar = /^[a-zA-Z]$/.test(token.replace(/[.,;:?!()\[\]]/g, ''));
            const isPureNumber = /^\d+[,.]?\d*$/.test(token.replace(/[.,;:?!()\[\]]/g, ''));

            if (isMathOp || isVarPattern || isCirclePattern) {
                if (currentType === 'TEXT') {
                    flushSegment();
                }
                currentType = 'MATH';
                currentTokens.push(token);
            } else if (isSingleLetterVar) {
                if (currentType === null) {
                    currentType = 'MATH';
                }
                currentTokens.push(token);
            } else if (isPureNumber && currentType === 'MATH') {
                currentTokens.push(token);
            } else {
                if (currentType === 'MATH') {
                    if (/^[.,;:?!]+$/.test(token)) {
                        currentTokens.push(token);
                        continue;
                    }
                    flushSegment();
                }
                if (!currentType) currentType = 'TEXT';
                currentTokens.push(token);
            }
        }

        flushSegment();
        return prefix + labelPrefix + segments.join('');
    }

    /**
     * Hậu xử lý văn bản cuối cùng (Typographic & Delimiter Cleansing)
     */
    function cleanAndFormatFinalTypography(text) {
        if (!text) return '';

        const SPLIT_REGEX = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)|\\begin\{[a-z*]+\}[\s\S]*?\\end\{[a-z*]+\})/g;
        const tokens = [];
        let lastIdx = 0;
        let match;

        while ((match = SPLIT_REGEX.exec(text)) !== null) {
            if (match.index > lastIdx) {
                tokens.push({ type: 'TEXT', val: text.substring(lastIdx, match.index) });
            }
            tokens.push({ type: 'MATH', val: match[0] });
            lastIdx = match.index + match[0].length;
        }
        if (lastIdx < text.length) {
            tokens.push({ type: 'TEXT', val: text.substring(lastIdx) });
        }

        for (let k = 0; k < tokens.length; k++) {
            if (tokens[k].type === 'TEXT') {
                let t = tokens[k].val;
                t = t.replace(/([0-9a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])\(/gi, '$1 (');
                t = t.replace(/\(\s+/g, '(');
                t = t.replace(/\s+\)/g, ')');
                t = t.replace(/\)\s+([.,;:?!])/g, ')$1');
                t = t.replace(/\)([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/gi, ') $1');
                t = t.replace(/\s+([.,;:?!])/g, '$1');
                t = t.replace(/([.,;:?!])([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/gi, '$1 $2');
                tokens[k].val = t;
            } else if (tokens[k].type === 'MATH') {
                let m = tokens[k].val;
                if (m.startsWith('$') && m.endsWith('$') && !m.startsWith('$$')) {
                    const inner = m.slice(1, -1).trim();
                    tokens[k].val = `$${inner}$`;
                }
            }
        }

        let result = '';
        for (let k = 0; k < tokens.length; k++) {
            const curr = tokens[k];
            const next = tokens[k + 1];

            result += curr.val;

            if (next) {
                if (curr.type === 'TEXT' && next.type === 'MATH') {
                    if (!/[\s(\[]$/.test(curr.val)) {
                        result += ' ';
                    }
                } else if (curr.type === 'MATH' && next.type === 'TEXT') {
                    if (!/^[\s)\].,;:?!]/.test(next.val)) {
                        result += ' ';
                    }
                } else if (curr.type === 'MATH' && next.type === 'MATH') {
                    result += ' ';
                }
            }
        }

        result = result.replace(/[ \t]{2,}/g, ' ');
        result = result.replace(/\$\s*\$/g, '');
        return result.trim();
    }

    /**
     * Hàm chính: Chuẩn hóa văn bản toán học (normalizeMathText)
     */
    function normalizeMathText(rawText) {
        if (!rawText || typeof rawText !== 'string') {
            return { raw: '', cleanLatex: '', mathCount: 0 };
        }

        // 1. Đồng bộ ngắt dòng
        let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // 2. Tiền xử lý vô cùng, khoảng số học, URLs
        text = preSanitize(text);

        // 3. Xử lý môi trường giả lập nhiều dòng (cases, array)
        text = convertPseudoEnvironments(text);

        // 4. Xử lý từng dòng
        const lines = text.split('\n');
        const processedLines = lines.map(line => {
            if (/^\s*(?:<=>|=>)\s*/.test(line)) {
                const arrow = line.match(/^\s*(<=>|=>)/)[1];
                const content = line.replace(/^\s*(?:<=>|=>)\s*/, '').trim();
                return `$${arrow === '<=>' ? '\\Leftrightarrow' : '\\Rightarrow'} ${formatMathSegment(content)}$`;
            }
            return processRawTextLine(line);
        });

        let joined = processedLines.join('\n');

        // 5. Hậu xử lý Typographic và Delimiter
        let finalResult = cleanAndFormatFinalTypography(joined);

        const allMaths = finalResult.match(/\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g);
        const totalMathCount = allMaths ? allMaths.length : 0;

        return {
            raw: rawText,
            cleanLatex: finalResult,
            mathCount: totalMathCount
        };
    }

    return {
        normalizeMathText: normalizeMathText,
        formatMathSegment: formatMathSegment,
        convertPseudoEnvironments: convertPseudoEnvironments
    };
}));
