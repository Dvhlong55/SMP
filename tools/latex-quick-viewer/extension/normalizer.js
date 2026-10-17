/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer — Math Context Parser & Normalization Pipeline
 * ==============================================================================
 * Phiên bản: 3.3.0 — Khắc phục lỗi đảo cực $ do chèn sớm khoảng số học, tách sạch từ nối
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

    // Ký tự từ đầy đủ (bao gồm cả chữ cái có dấu tiếng Việt để tránh lỗi \b trong JS Regex)
    const VI_WORD_CHAR = '[a-zA-Z0-9_àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]';

    // Danh sách từ tiếng Việt & thuật ngữ toán thông dụng (kể cả không dấu / viết tắt)
    const VIETNAMESE_WORDS = new Set([
        'da', 'em', 'xin', 'gop', 'cau', 'xet', 'thi', 'va', 'hoac', 'khi', 'do',
        'ta', 'co', 'suy', 'ra', 'nen', 'ket', 'hop', 'voi', 'nghiem', 'duy', 'nhat',
        'dung', 'danh', 'gia', 'mot', 'ti', 'tim', 'duoc', 'cm', 'dc', 'dpcm', 'cmtt', 'cmr', 'bai',
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
        'thoa', 'gia', 'tri', 'nghiem', 'phuong', 'trinh', 'bat', 'dang', 'thuc',
        'ghhh', 'day', 'so', 'ban', 'dau', 'bien', 'doi', 'xac', 'suat', 'ko', 'vuot', 'qua',
        'gs', 'pt', 'bpt', 'hpt', 'bđt', 'bdt', 'đk', 'dk', 'txđ', 'txd', 'gt', 'kl', 'pb', 'vui', 'dưới', 'duoi',
        'c/m', 'cm', 'lhdg', 'tdp', 'tđp', 'pgiac', 'tt', 'dt', 'đt', 'dtron', 'đtron', 'đtròn', 'đpcm', 'dpcm'
    ]);

    // Các hàm toán học chuẩn và ký tự Hy Lạp (không coi là từ tự nhiên)
    const MATH_FUNCTIONS = new Set([
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'lim', 'ln', 'log', 'exp',
        'sqrt', 'cbrt', 'max', 'min', 'gcd', 'deg', 'det', 'dim', 'ker', 'arg',
        'inf', 'sup', 'mod', 'pi', 'phi', 'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda', 'sigma', 'omega'
    ]);

    /**
     * Kiểm tra một từ có phải từ tiếng Việt/văn bản thường
     */
    function isNaturalLanguageWord(word) {
        if (!word) return false;
        const rawClean = word.replace(/^[(\["'«`]+|[)\]"'».,:;?!`]+$/g, '').trim();
        const clean = rawClean.toLowerCase();
        if (!clean) return false;

        // Ký hiệu đánh dấu phương trình (*), (**), (***) giữ ở dạng văn bản thường
        if (/^\(\*{1,3}\)$/.test(word.trim())) {
            return true;
        }

        // Viết tắt toán học tiếng Việt thông dụng
        if (clean === 'c/m' || clean === 'c\\m' || clean === 'đpcm' || clean === 'dpcm' || clean === 'tđp' || clean === 'lhdg') {
            return true;
        }

        // Từ ghép có dấu gạch chéo: chỉ áp dụng khi có dấu tiếng Việt hoặc cả 2 vế là từ tiếng Việt thực sự
        const slashParts = clean.split('/');
        if (slashParts.length === 2) {
            const p1 = slashParts[0].trim();
            const p2 = slashParts[1].trim();
            if (!MATH_FUNCTIONS.has(p1) && !MATH_FUNCTIONS.has(p2) &&
                !/^[a-z]{1,4}\d*$/i.test(p1) && !/^[a-z]{1,4}\d*$/i.test(p2) &&
                (VI_ACCENTS_REGEX.test(clean) || (VIETNAMESE_WORDS.has(p1) && VIETNAMESE_WORDS.has(p2)))) {
                return true;
            }
        }

        // Từ ghép có gạch nối: subset-sum, set-theoretic, non-empty, trade-off
        if (/^[a-zA-Z]{3,}-[a-zA-Z]{3,}$/i.test(clean)) {
            return true;
        }

        // Chuỗi chứa toán tử toán học hoặc dấu ngoặc bên trong KHÔNG BAO GIỜ là một từ ngôn ngữ tự nhiên đơn lẻ
        if (/[=<>\/\\^|~_]|<=|>=|!=|->|=>/.test(clean)) {
            return false;
        }
        if (/[()]/.test(clean)) {
            return false;
        }

        // Nhãn danh sách câu: a), b), (i), (ii), 1) dù ở đầu dòng hay giữa dòng
        if (/^(?:[a-z0-9]\)|\([a-z0-9]+\)|\([ivx]+\))$/i.test(word.trim())) {
            return true;
        }

        // Ký tự đơn (a, b, x, y, A, B...) luôn là biến số toán học
        if (clean.length === 1 && /^[a-zA-Z]$/.test(clean)) {
            return false;
        }

        // Tích biến dạng chữ thường nối chữ hoa (như nA, mA, kA) luôn là biểu thức toán học
        if (/^[a-z]+[A-Z][a-zA-Z0-9]*$/.test(rawClean)) {
            return false;
        }

        // Các đoạn thẳng / điểm hình học viết hoa toàn bộ (AB, MN, CM, TI, TIB, ABCD) luôn là toán học
        if (/^[A-Z]{2,4}$/.test(rawClean)) {
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
            if (isNaturalLanguageWord(words[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Thay thế hàm toán học có ngoặc cân bằng độ sâu (depth-counting)
     */
    function replaceBalancedFunc(str, funcNameRegex, latexCmd) {
        const pattern = new RegExp(`(?:\\\\)?(?:${funcNameRegex})\\s*\\(`, 'gi');
        let match;
        let s = str;
        while ((match = pattern.exec(s)) !== null) {
            const startIdx = match.index;
            const openParenIdx = startIdx + match[0].length - 1;
            let depth = 1;
            let closeParenIdx = -1;
            for (let i = openParenIdx + 1; i < s.length; i++) {
                if (s[i] === '(') depth++;
                else if (s[i] === ')') {
                    depth--;
                    if (depth === 0) {
                        closeParenIdx = i;
                        break;
                    }
                }
            }
            if (closeParenIdx !== -1) {
                const inner = s.substring(openParenIdx + 1, closeParenIdx);
                const replaced = `${latexCmd}{${inner}}`;
                s = s.substring(0, startIdx) + replaced + s.substring(closeParenIdx + 1);
                pattern.lastIndex = startIdx + replaced.length;
            } else {
                break;
            }
        }
        return s;
    }

    /**
     * Thoát dấu ngoặc nhọn tập hợp {a, b, c} hoặc max{a, b} -> \{a, b, c\}, max\{a, b\}
     * Hỗ trợ bên trong có chứa ngoặc nhọn chỉ số/số mũ lồng nhau như {a_{i+1}, ..., a_{2026}}
     */
    function escapeSetBraces(str) {
        if (!str) return '';
        const lines = str.split('\n');
        const NON_SET_CMDS = /\\(?:frac|dfrac|tfrac|sqrt|cbrt|binom|text|textbf|textit|mathrm|mathbb|mathcal|mathfrak|mathscr|pmod|widehat|widetilde|overline|underline|overrightarrow|overleftarrow|vect|vec|hat|bar|tilde|dot|ddot|begin|end|left|right|overset|underset|color|colorbox|boxed)$/;

        return lines.map(line => {
            // Không chạm vào dòng môi trường giả lập cases (mở { ở đầu dòng nhưng không đóng trên cùng dòng)
            let result = '';
            let i = 0;
            while (i < line.length) {
                if (line[i] === '{' && (i === 0 || line[i - 1] !== '\\')) {
                    const beforeTrimmed = result.replace(/\s+$/, '');
                    const lastChar = beforeTrimmed.slice(-1);
                    const isSubSupOrOpt = (lastChar === '_' || lastChar === '^' || lastChar === ']');
                    const isLatexCmdArg = NON_SET_CMDS.test(beforeTrimmed);
                    // Kiểm tra xem có phải đối số thứ 2 của \frac{...}{...}, \binom{...}{...}, \overset{...}{...}
                    const isSecondArg = (lastChar === '}' && /\\(?:frac|dfrac|tfrac|binom|overset|underset|textcolor|colorbox)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}$/.test(beforeTrimmed));

                    if (!isSubSupOrOpt && !isLatexCmdArg && !isSecondArg) {
                        // Tìm dấu } đóng tương ứng trên cùng dòng (có đếm độ sâu ngoặc nhọn lồng nhau)
                        let depth = 1;
                        let closeIdx = -1;
                        for (let j = i + 1; j < line.length; j++) {
                            if (line[j] === '{' && line[j - 1] !== '\\') depth++;
                            else if (line[j] === '}' && line[j - 1] !== '\\') {
                                depth--;
                                if (depth === 0) {
                                    closeIdx = j;
                                    break;
                                }
                            }
                        }
                        if (closeIdx !== -1) {
                            const inner = line.substring(i + 1, closeIdx);
                            result += '\\{' + inner + '\\}';
                            i = closeIdx + 1;
                            continue;
                        }
                    }
                }
                result += line[i];
                i++;
            }
            return result;
        }).join('\n');
    }

    /**
     * Chuyển đổi chỉ số dưới có ngoặc đơn cân bằng: a_(i+1), u_(nA+1) -> a_{i+1}, u_{nA+1}
     */
    function replaceBalancedSubscripts(str) {
        if (!str) return '';
        let s = str;
        const pattern = /([a-zA-Z0-9\)\]])_\s*\(/g;
        let match;
        while ((match = pattern.exec(s)) !== null) {
            const startIdx = match.index;
            const baseChar = match[1];
            // Không biến P_(...) hoặc lim_(...) ở đây
            const prefix = s.substring(Math.max(0, startIdx - 4), startIdx + 1);
            if (/(?:^|[^a-zA-Z])P$/.test(prefix) || /lim$/i.test(prefix)) {
                continue;
            }
            const openParenIdx = startIdx + match[0].length - 1;
            let depth = 1;
            let closeParenIdx = -1;
            for (let i = openParenIdx + 1; i < s.length; i++) {
                if (s[i] === '(') depth++;
                else if (s[i] === ')') {
                    depth--;
                    if (depth === 0) {
                        closeParenIdx = i;
                        break;
                    }
                }
            }
            if (closeParenIdx !== -1) {
                const inner = replaceBalancedSubscripts(s.substring(openParenIdx + 1, closeParenIdx)).trim();
                const replaced = `${baseChar}_{${inner}}`;
                s = s.substring(0, startIdx) + replaced + s.substring(closeParenIdx + 1);
                pattern.lastIndex = startIdx + replaced.length;
            } else {
                break;
            }
        }
        return s;
    }

    /**
     * Chuyển đổi số mũ có ngoặc đơn cân bằng (hỗ trợ ngoặc lồng nhau):
     * c_i^(m0 + t . p . (p - 1)), (c_i^(p-1))^(t . p), a_{0}^(m-1) -> ^{...}
     */
    function replaceBalancedExponents(str) {
        if (!str) return '';
        let s = str;
        const pattern = /\^\s*\(/g;
        let match;
        while ((match = pattern.exec(s)) !== null) {
            const startIdx = match.index;
            // Không chạm vào lim^(x->0)
            const before = s.substring(Math.max(0, startIdx - 6), startIdx).trim();
            if (/lim$/i.test(before)) {
                continue;
            }
            const openParenIdx = startIdx + match[0].length - 1;
            let depth = 1;
            let closeParenIdx = -1;
            for (let i = openParenIdx + 1; i < s.length; i++) {
                if (s[i] === '(') depth++;
                else if (s[i] === ')') {
                    depth--;
                    if (depth === 0) {
                        closeParenIdx = i;
                        break;
                    }
                }
            }
            if (closeParenIdx !== -1) {
                const inner = replaceBalancedExponents(s.substring(openParenIdx + 1, closeParenIdx)).trim();
                const replaced = `^{${inner}}`;
                s = s.substring(0, startIdx) + replaced + s.substring(closeParenIdx + 1);
                pattern.lastIndex = startIdx + replaced.length;
            } else {
                break;
            }
        }
        return s;
    }

    /**
     * Bộ phân tích phân số hợp nhất:
     * Gom toàn bộ cụm ký tự/hạng tử toán học liền kề bên trái và bên phải dấu '/' thành \frac{tử}{mẫu}
     */
    function convertFractions(str) {
        if (!str || str.indexOf('/') === -1) return str;
        let s = str;
        let searchFrom = 0;

        while (searchFrom < s.length) {
            const slashIdx = s.indexOf('/', searchFrom);
            if (slashIdx === -1) break;

            // Bỏ qua viết tắt c/m
            const around = s.substring(Math.max(0, slashIdx - 2), Math.min(s.length, slashIdx + 3));
            if (/(?:^|[^a-zA-Z0-9_])[cC]\/[mM](?:$|[^a-zA-Z0-9_])/.test(around)) {
                searchFrom = slashIdx + 1;
                continue;
            }

            // 1. Xác định TỬ SỐ (bên trái dấu /)
            let leftEnd = slashIdx;
            while (leftEnd > 0 && s[leftEnd - 1] === ' ') leftEnd--;
            if (leftEnd === 0) {
                searchFrom = slashIdx + 1;
                continue;
            }

            let replaceStart = leftEnd;
            let numContent = '';

            if (s[leftEnd - 1] === ')') {
                // Tìm dấu '(' mở tương ứng
                let depth = 1;
                let openIdx = -1;
                for (let i = leftEnd - 2; i >= 0; i--) {
                    if (s[i] === ')') depth++;
                    else if (s[i] === '(') {
                        depth--;
                        if (depth === 0) {
                            openIdx = i;
                            break;
                        }
                    }
                }
                if (openIdx !== -1) {
                    // Kiểm tra xem trước '(' có phải tên hàm toán học không (vd: \varphi(n)/n, f(x)/x, P(n)/n)
                    const beforeParen = s.substring(0, openIdx);
                    const fnMatch = beforeParen.match(/(\\[a-zA-Z]+|[a-zA-Z](?:_\{[^{}]+\}|_[a-zA-Z0-9]+)?)$/);
                    if (fnMatch) {
                        replaceStart = openIdx - fnMatch[1].length;
                        numContent = s.substring(replaceStart, leftEnd).trim();
                    } else {
                        replaceStart = openIdx;
                        numContent = s.substring(openIdx + 1, leftEnd - 1).trim();
                    }
                }
            } else {
                // Quét ngược lấy toàn bộ cụm ký tự/chỉ số/số mũ dính liền (như MN, 2EF, m^{2}, A_{0}F, \sin TIB)
                let pos = leftEnd;
                while (pos > 0) {
                    const ch = s[pos - 1];
                    if (ch === '}' && (pos < 2 || s[pos - 2] !== '\\')) {
                        let bDepth = 1;
                        let openB = -1;
                        for (let i = pos - 2; i >= 0; i--) {
                            if (s[i] === '}' && (i === 0 || s[i - 1] !== '\\')) bDepth++;
                            else if (s[i] === '{' && (i === 0 || s[i - 1] !== '\\')) {
                                bDepth--;
                                if (bDepth === 0) {
                                    openB = i;
                                    break;
                                }
                            }
                        }
                        if (openB !== -1) {
                            pos = openB;
                            continue;
                        }
                        break;
                    } else if (ch === ']') {
                        let openBr = s.lastIndexOf('[', pos - 2);
                        if (openBr !== -1) {
                            pos = openBr;
                            continue;
                        }
                        break;
                    } else if (/[a-zA-Z0-9_'!^\\]/.test(ch)) {
                        pos--;
                    } else {
                        break;
                    }
                }
                // Kiểm tra hàm lượng giác/logarit đứng ngay trước cụm (vd: \sin TIB / \sin TJC)
                const beforeAtom = s.substring(0, pos);
                const trigMatch = beforeAtom.match(/(\\(?:sin|cos|tan|cot|sec|csc|ln|log|deg)\s+)$/i);
                if (trigMatch) {
                    pos -= trigMatch[1].length;
                }
                replaceStart = pos;
                numContent = s.substring(replaceStart, leftEnd).trim();
            }

            if (!numContent) {
                searchFrom = slashIdx + 1;
                continue;
            }

            // 2. Xác định MẪU SỐ (bên phải dấu /)
            let rightStart = slashIdx + 1;
            while (rightStart < s.length && s[rightStart] === ' ') rightStart++;
            if (rightStart >= s.length) {
                searchFrom = slashIdx + 1;
                continue;
            }

            let replaceEnd = rightStart;
            let denContent = '';

            if (s[rightStart] === '(') {
                // Tìm dấu ')' đóng tương ứng
                let depth = 1;
                let closeIdx = -1;
                for (let i = rightStart + 1; i < s.length; i++) {
                    if (s[i] === '(') depth++;
                    else if (s[i] === ')') {
                        depth--;
                        if (depth === 0) {
                            closeIdx = i;
                            break;
                        }
                    }
                }
                if (closeIdx !== -1) {
                    // Kiểm tra xem sau ')' có số mũ không: 1/(u_{n+1})^{2}
                    const afterClose = s.substring(closeIdx + 1);
                    const expMatch = afterClose.match(/^(\^\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\^[a-zA-Z0-9_]+)/);
                    if (expMatch) {
                        replaceEnd = closeIdx + 1 + expMatch[1].length;
                        denContent = s.substring(rightStart, replaceEnd).trim();
                    } else {
                        replaceEnd = closeIdx + 1;
                        denContent = s.substring(rightStart + 1, closeIdx).trim();
                    }
                }
            } else {
                let pos = rightStart;
                // Nếu bắt đầu bằng hàm lượng giác \sin TIB, \cos A...
                const afterSlash = s.substring(pos);
                const trigRightMatch = afterSlash.match(/^(\\(?:sin|cos|tan|cot|sec|csc|ln|log|deg)\s+)/i);
                if (trigRightMatch) {
                    pos += trigRightMatch[1].length;
                }
                while (pos < s.length) {
                    const ch = s[pos];
                    if (ch === '{' && (pos === 0 || s[pos - 1] !== '\\')) {
                        let bDepth = 1;
                        let closeB = -1;
                        for (let i = pos + 1; i < s.length; i++) {
                            if (s[i] === '{' && s[i - 1] !== '\\') bDepth++;
                            else if (s[i] === '}' && s[i - 1] !== '\\') {
                                bDepth--;
                                if (bDepth === 0) {
                                    closeB = i;
                                    break;
                                }
                            }
                        }
                        if (closeB !== -1) {
                            pos = closeB + 1;
                            continue;
                        }
                        break;
                    } else if (ch === '[') {
                        let closeBr = s.indexOf(']', pos + 1);
                        if (closeBr !== -1) {
                            pos = closeBr + 1;
                            continue;
                        }
                        break;
                    } else if (ch === '(' && pos > rightStart) {
                        // Lời gọi hàm ở mẫu số như 1/P(n), 1/n(x+n)
                        let pDepth = 1;
                        let closeP = -1;
                        for (let i = pos + 1; i < s.length; i++) {
                            if (s[i] === '(') pDepth++;
                            else if (s[i] === ')') {
                                pDepth--;
                                if (pDepth === 0) {
                                    closeP = i;
                                    break;
                                }
                            }
                        }
                        if (closeP !== -1) {
                            pos = closeP + 1;
                            continue;
                        }
                        break;
                    } else if (/[a-zA-Z0-9_'!^\\]/.test(ch)) {
                        pos++;
                    } else {
                        break;
                    }
                }
                replaceEnd = pos;
                denContent = s.substring(rightStart, replaceEnd).trim();
            }

            if (!denContent) {
                searchFrom = slashIdx + 1;
                continue;
            }

            const fracStr = `\\frac{${numContent}}{${denContent}}`;
            s = s.substring(0, replaceStart) + fracStr + s.substring(replaceEnd);
            searchFrom = replaceStart + fracStr.length;
        }

        return s;
    }

    /**
     * Tiền xử lý văn bản thô
     */
    function preSanitize(text) {
        if (!text) return '';
        let s = text;

        // Bỏ backticks bọc quanh công thức: `u_n > 0` -> u_n > 0
        s = s.replace(/`([^`\n]+)`/g, '$1');
        s = s.replace(/`/g, '');

        // Bỏ URL theo dõi Facebook hoặc link bọc biến: [GX.GA](https://l.facebook.com/...) -> GX.GA
        s = s.replace(/\[([^\]]+)\]\(https?:\/\/(?:[a-zA-Z0-9.\-]+\.)?(?:facebook\.com|fb\.com|l\.facebook\.com)\/[^\)]*\)/gi, '$1');
        s = s.replace(/\[([A-Za-z0-9_.'\+\-\*\/\^\=]+)\]\(https?:\/\/[^\)]+\)/g, '$1');

        // Bỏ dấu $ cô lập ở cuối dòng nếu có
        s = s.replace(/([^$])\$\s*$/gm, '$1');

        // Chuẩn hóa các ký hiệu toán học Unicode sang dạng chuẩn để bộ phân tích xử lý đồng nhất
        s = s.replace(/≥/g, '>=');
        s = s.replace(/≤/g, '<=');
        s = s.replace(/≠/g, '!=');
        s = s.replace(/≈/g, '~=');
        s = s.replace(/≡/g, ' \\equiv ');
        s = s.replace(/±/g, '+-');
        s = s.replace(/∓/g, '-+');
        s = s.replace(/∞/g, '\\infty');
        s = s.replace(/⇒/g, '=>');
        s = s.replace(/⇔/g, '<=>');
        s = s.replace(/→/g, '->');

        // Sửa lỗi gõ =< thành <=
        s = s.replace(/=</g, '<=');

        // Tách ký hiệu đánh dấu phương trình (*), (**) bị dính vào cuối công thức: -y(y+2)(*) -> -y(y+2) (*)
        s = s.replace(/([^\s(\[])(\(\*{1,3}\))/g, '$1 $2');

        // Tách dấu hai chấm sau từ tiếng Việt nối liền công thức: hồi:S_n -> hồi: S_n
        s = s.replace(/([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]):([A-Za-z0-9_])/g, '$1: $2');

        // Che chắn ký hiệu phương tích hình học sớm: P_(H/(A,0)), P_(H/(T)), P_(S/(BXZ)), P_(S/(BXZ)=
        s = s.replace(/\bP_\(\s*([A-Za-z0-9_']+)\s*\/\s*(\([A-Za-z0-9_,\s.]+\)|[A-Za-z0-9_']+)\s*\)?/gi, function(_, pt, circle) {
            let cleanCircle = circle.trim();
            if (!cleanCircle.startsWith('(')) {
                cleanCircle = `(${cleanCircle})`;
            }
            cleanCircle = cleanCircle.replace(/,/g, '§COMMA§');
            return `___POWPOINT___${pt}___${cleanCircle}___`;
        });

        // Thoát dấu ngoặc nhọn tập hợp SỚM (trước khi tạo _{...} hay ^{...}): {1, 2, ..., 2026}, {a_(i+1), ..., a2026}, max{-2, 4-m^2/6}
        s = escapeSetBraces(s);

        // Hàm phần nguyên: phần nguyên(1000/11) -> \left\lfloor \frac{1000}{11} \right\rfloor
        s = s.replace(/\b(?:phần\s+nguyên|phan\s+nguyen)\s*\(([^()]+)\)/gi, function(_, inner) {
            return `\\left\\lfloor ${inner.trim()} \\right\\rfloor`;
        });

        // Hàm phi Euler: phi(n), 4phi(n), \phi(n) -> \varphi(n)
        s = s.replace(/(\d*)\s*(?:\\phi|phi)\s*\(([^()]+)\)/gi, function(_, coef, n) {
            const prefix = coef ? `${coef}` : '';
            return `${prefix}\\varphi(${n.trim()})`;
        });

        // Dãy số kèm chỉ số điều kiện: (a_n)_(n>=1) hoặc (a_n)_(n\ge 1) -> (a_n)_{n \ge 1}
        s = s.replace(/(\([a-zA-Z0-9_]+\))\s*\_(?:\(([^()]+)\)|\{([^{}]+)\})/g, function(_, base, sub1, sub2) {
            let sub = (sub1 || sub2).replace(/>=/g, '\\ge ').replace(/<=/g, '\\le ').trim();
            return `${base}_{${sub}}`;
        });

        // Chuyển đổi chỉ số dưới có ngoặc đơn cân bằng: u_(A+1), u_(nA+1), a_(i+1) -> u_{A+1}, u_{nA+1}, a_{i+1}
        s = replaceBalancedSubscripts(s);

        // Quan hệ đồng dư dạng lời văn: "<A> trùng <B> theo mod <M>" hoặc "<A> đồng dư (với) <B> theo mod <M>" -> \equiv <B> \pmod{<M>}
        s = s.replace(/\b(?:trùng|đồng\s+dư(?:\s+với)?)\s+([^\n,;]+?)\s+theo\s+mod\s+(\([^\n()]+\)|[a-zA-Z0-9_]+)/gi, function(_, rhs, modExpr) {
            return `\\equiv ${rhs.trim()} \\pmod{${modExpr.trim()}}`;
        });
        s = s.replace(/\btheo\s+mod\s+(\([^\n()]+\)|[a-zA-Z0-9_]+)/gi, '\\pmod{$1}');

        // Tích và tổng hàm số: Prod(i=1,k,expr), Sigma(i=1,k,expr)
        s = s.replace(/\bProd\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*,\s*([^()]+)\s*\)/g, function(_, lower, upper, expr) {
            const cleanExpr = expr.trim();
            if (cleanExpr.startsWith('(') && cleanExpr.endsWith(')')) {
                return `\\prod_{${lower.trim()}}^{${upper.trim()}} ${cleanExpr}`;
            }
            return `\\prod_{${lower.trim()}}^{${upper.trim()}} (${cleanExpr})`;
        });
        s = s.replace(/\b(?:Sigma|sum)\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*,\s*([^()]+)\s*\)/g, function(_, lower, upper, expr) {
            return `\\sum_{${lower.trim()}}^{${upper.trim()}} ${expr.trim()}`;
        });

        // Tích hình học dạng pi(FA_1/EA_1), pi(MP'/MN') -> \prod \left(\frac{FA_1}{EA_1}\right)
        s = s.replace(/\bpi\s*\(([^()]*[A-Z][^()]*\/[^()]*)\)/g, function(_, inner) {
            return `\\prod \\left(${inner.trim()}\\right)`;
        });

        // Căn bậc k: sqrt[k]{...} hoặc sqrt[k](...)
        s = s.replace(/(?:\\)?sqrt\s*\[([^\]]+)\]/gi, '\\sqrt[$1]');
        s = s.replace(/\\sqrt\s*\[([^\]]+)\]\s*\(([^()]+)\)/gi, '\\sqrt[$1]{$2}');

        // deg viết liền biến và chỉ số: dega200 -> deg a_{200}, degb91 -> deg b_{91}, degb2 -> deg b_{2}
        s = s.replace(/\bdeg\s*([a-zA-Z])([0-9]+)\b/gi, 'deg $1_{$2}');
        s = s.replace(/\bdeg([a-zA-Z])([0-9]+)\b/gi, 'deg $1_{$2}');
        s = s.replace(/\bdeg([a-zA-Z])\b/gi, 'deg $1');
        s = s.replace(/\bsiama\b/gi, 'sigma');

        // Tách hàm lượng giác dính liền điểm: sinXGB -> sin XGB, cosA -> cos A
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})(sin|cos|tan|cot|ln|log|exp)([A-Z][a-zA-Z0-9_']*)(?!${VI_WORD_CHAR})`, 'gi'), '$1 $2');

        // Chuẩn hóa khoảng trắng quanh _{ và ^{
        s = s.replace(/([_^\\])\s*\{/g, '$1{');

        // Tổ hợp, chỉnh hợp dạng C^k_n, C_n^k, C^n_(2n), C^(p-1)_(p-2)
        const COMBI_PARAM = '(?:\\{([^{}]+)\\}|\\(([^()]+)\\)|([0-9a-zA-Z]+))';
        const combiRegex1 = new RegExp(`(?<!${VI_WORD_CHAR})([CA])\\^${COMBI_PARAM}\\_${COMBI_PARAM}`, 'g');
        s = s.replace(combiRegex1, function(_, op, e1, e2, e3, s1, s2, s3) {
            const k = (e1 || e2 || e3 || '').trim();
            const n = (s1 || s2 || s3 || '').trim();
            return `${op}_{${n}}^{${k}}`;
        });
        const combiRegex2 = new RegExp(`(?<!${VI_WORD_CHAR})([CA])\\_${COMBI_PARAM}\\^${COMBI_PARAM}`, 'g');
        s = s.replace(combiRegex2, function(_, op, s1, s2, s3, e1, e2, e3) {
            const n = (s1 || s2 || s3 || '').trim();
            const k = (e1 || e2 || e3 || '').trim();
            return `${op}_{${n}}^{${k}}`;
        });

        // Tổ hợp có biểu thức ngoặc: (2n)Cn, (6n)C(3n), (6n+6)C(3n+3) (không khớp nếu trong ngoặc có chữ tiếng Việt có dấu)
        s = s.replace(/\(([^()]+)\)\s*([CA])\s*\(([^()]+)\)/g, function(m, n, op, k) {
            if (VI_ACCENTS_REGEX.test(n) || VI_ACCENTS_REGEX.test(k)) return m;
            return `${op}_{${n.trim()}}^{${k.trim()}}`;
        });
        s = s.replace(new RegExp(`\\(([^()]+)\\)\\s*([CA])\\s*([0-9]+|[nkrmij])(?!${VI_WORD_CHAR})`, 'g'), function(m, n, op, k) {
            if (VI_ACCENTS_REGEX.test(n)) return m;
            return `${op}_{${n.trim()}}^{${k.trim()}}`;
        });
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})(\\d+|[nkm])([CA])\\(([^()]+)\\)`, 'g'), function(m, n, op, k) {
            if (VI_ACCENTS_REGEX.test(k)) return m;
            return `${op}_{${n.trim()}}^{${k.trim()}}`;
        });

        // Tổ hợp, chỉnh hợp dạng số nCk, nAk (2026C1013, 10C3, 2026 C 1013, 2026c1013)
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})(\\d+)\\s*([CAca])\\s*(\\d+)(?!${VI_WORD_CHAR})`, 'g'), function(_, n, op, k) {
            return `${op.toUpperCase()}_{${n}}^{${k}}`;
        });

        // Tổ hợp, chỉnh hợp dạng biến viết liền nCk, nCr, nAk (chỉ áp dụng khi viết liền không khoảng trắng và độc lập khỏi từ tiếng Việt)
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([nkm])([CA])([0-9krmn])(?!${VI_WORD_CHAR})`, 'g'), '$2_{$1}^{$3}');

        // Hệ số nhị thức dạng binom(n, k) -> \binom{n}{k}
        s = s.replace(/\bbinom\s*\(\s*([^,()]+)\s*,\s*([^()]+)\s*\)/gi, '\\binom{$1}{$2}');

        // Toán tử tổng: sum, Sigma -> \sum
        s = s.replace(new RegExp(`(?<!\\\\)(?<!${VI_WORD_CHAR})(?:sum|Sigma)(?!${VI_WORD_CHAR})(?!\\s+(?:họp|suê|vầy|tụ))`, 'g'), '\\sum');

        // Toán tử tích: prod, Prod -> \prod
        s = s.replace(new RegExp(`(?<!\\\\)(?<!${VI_WORD_CHAR})(?:prod|Prod)(?!${VI_WORD_CHAR})`, 'g'), '\\prod');

        // Ký hiệu Hy Lạp / hàm số học sigma: sigma -> \sigma
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})sigma(?!${VI_WORD_CHAR})`, 'g'), '\\sigma');

        // Định giá p-adic: vpi(...) -> v_{p_i}(...), vp(...) -> v_p(...)
        s = s.replace(/\bvpi\s*\(([^()]+)\)/gi, 'v_{p_i}($1)');
        s = s.replace(/\bvp_i\s*\(([^()]+)\)/gi, 'v_{p_i}($1)');
        s = s.replace(/\bvp\s*\(([^()]+)\)/gi, 'v_p($1)');

        // Tích các biến số hoặc số nguyên tố viết liền: p1p2...pk, p_1p_2...p_k, mp_1...p_k, a1a2...an
        s = s.replace(/([a-zA-Z])_?1\s*\1_?2\s*(?:\.{2,}|\\dots)\s*\1_?([kijnmr0-9]+)\b/g, '$1_{1} $1_{2} \\dots $1_{$2}');
        s = s.replace(/([a-zA-Z])([a-zA-Z])_?1\s*(?:\.{2,}|\\dots)\s*\2_?([kijnmr0-9]+)\b/g, '$1 $2_{1} \\dots $2_{$3}');
        s = s.replace(/([a-zA-Z])_1([a-zA-Z])_2/g, '$1_{1} $2_{2}');

        // Biến kèm chỉ số và số mũ: ai^n -> a_i^n, xi^2 -> x_i^2, ak^n -> a_k^n, ck^m0 -> c_k^m0
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([a-zA-Z])([ikjmnr])\\^([0-9a-zA-Z{}]+)`, 'g'), '$1_{$2}^{$3}');

        // Ký hiệu Hy Lạp: eps, epsilon, esp
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})(?:eps|epsilon|esp)(?!${VI_WORD_CHAR})`, 'gi'), '\\epsilon');

        // Bảo vệ "góp c6,7" / "câu c1" không biến thành c_{6}
        s = s.replace(/(?<=\b(?:góp|gop)\s+)c(\d+)/gi, 'câu $1');

        // Biến số kèm chỉ số số: p1, p2, u1, u2, a1, x1, w1, m0, a0 (dùng VI_WORD_CHAR để không khớp nhầm từ tiếng Việt)
        s = s.replace(new RegExp(`(?<!\\\\)(?<!${VI_WORD_CHAR})([a-zA-Z])([0-9]+)(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');

        // Biến số kèm chỉ số chữ: xk, xi, xj, xn, uk, un, um, vk, vn, vm, pk, pm, pn, pj, pr, ck, ak, bk
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([uxyzw])([kijnmr])(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([v])([kjnmr])(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([p])([kjnmr])(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([abc])([kjr])(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');

        // Chuyển pi thành p_i khi trong ngữ cảnh chỉ số số nguyên tố hoặc đi sau với mọi/mọi/các
        s = s.replace(/(?<=\b(?:với mọi|mọi|các|tồn tại)\s+)pi\b/gi, 'p_i');
        s = s.replace(/\bpi\b(?=\s*(?:thuộc|\in|=|!=|<|>|<=|>=|\mid|chia hết))/gi, 'p_i');
        if (/\b(?:ưnt|vpi|p_\d+|p_[kjnmr]|p\d+)\b/i.test(s) || /p_\{?1\}?\s*,\s*p_\{?2\}?/i.test(s)) {
            s = s.replace(/(?<![0-9\\a-zA-Z])pi(?![0-9a-zA-Z\(\\])/g, 'p_i');
        }

        // Biến ai, bi, ci, an, bn, cn khi đi kèm toán tử hoặc trong danh sách biểu thức
        s = s.replace(new RegExp(`(?<!${VI_WORD_CHAR})([abc])([imn])(?!${VI_WORD_CHAR})(?=\\s*[+\\-*.\\/=<>^~|,\\}\\)])`, 'g'), '$1_{$2}');
        s = s.replace(new RegExp(`(?<=[+\\-*.\\/=<>^~|\\\\\\{\\(,]\\s*)(?<!${VI_WORD_CHAR})([abc])([imn])(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');
        s = s.replace(new RegExp(`(?<=(?:\\\\sum|\\\\prod|\\\\sigma)\\s+)(?<!${VI_WORD_CHAR})([abc])([imn])(?!${VI_WORD_CHAR})`, 'g'), '$1_{$2}');

        // Tách biến số trước từ tiếng Việt: p^k k đủ lớn -> p^k, k đủ lớn
        s = s.replace(/([a-zA-Z]\^[0-9a-zA-Z{}]+)\s+([a-zA-Z])\s+([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]{2,})/g, '$1, $2 $3');

        // Dấu chấm lửng (2 hoặc 3 dấu chấm .. / ...) liền kề toán tử hoặc danh sách
        s = s.replace(/([+\-])\s*\.{2,}(?!\.)/g, '$1 \\dots');
        s = s.replace(/>=\s*\.{2,}\s*>=/g, '>= \\dots >=');
        s = s.replace(/<=\s*\.{2,}\s*<=/g, '<= \\dots <=');
        s = s.replace(/,\s*\.{2,}\s*,/g, ', \\dots, ');
        s = s.replace(/([0-9a-zA-Z\)\}])\s*,\s*\.{2,}/g, '$1, \\dots');

        // Tách dấu chấm kết thúc câu dính liền mở ngoặc: C.(khúc -> C. (khúc
        s = s.replace(/([0-9a-zA-Z\)])\.\s*\(/g, '$1. (');

        // Ký hiệu hình học Unicode
        s = s.replace(/[∆Δ]\s*([A-Z]{3,4})/g, '\\triangle $1');
        s = s.replace(/[∆Δ]/g, '\\triangle ');
        s = s.replace(/∠\s*([A-Z]{3})/g, '\\widehat{$1}');

        // Căn thức (sử dụng balanced parenthesis)
        s = replaceBalancedFunc(s, 'sqrt|căn|can', '\\sqrt');
        s = replaceBalancedFunc(s, 'cbrt', '\\sqrt[3]');
        s = s.replace(/(?:\\sqrt|căn|can)\s+([a-zA-Z0-9]+)\b/gi, '\\sqrt{$1}');

        // Vô cùng: oo, +oo, -oo, +inf, -inf, vô cùng, vocung
        s = s.replace(/([+\-])\s*(?:oo|inf|infty|vô cùng|vocung|vô cực|vocuc)\b/gi, '$1\\infty');
        s = s.replace(/(?:vô cùng|vocung|vô cực|vocuc)\b/gi, '\\infty');
        s = s.replace(/(?<=[=><\(\[\{,\s]|\b|->|\\to)\s*oo\b/gi, '\\infty');
        s = s.replace(/(?<=\b(?:ra|tới|đến|->|\\to)\s*)inf\b/gi, '\\infty');

        // Tách khoảng trắng giữa 2 dấu ngoặc liền kề: )( -> ) (
        s = s.replace(/\)\s*\(/g, ') (');

        // Tách khoảng trắng quanh các toán tử so sánh / dấu bằng bị dính liền
        s = s.replace(/([0-9a-zA-Z\)\}])\s*(<=|>=|!=|==|<|>|=)\s*([+\-]?[0-9a-zA-Z\(\[\\])/g, '$1 $2 $3');

        // Tách dấu chấm ở đầu dòng dính liền từ tiếng Việt: .Trước hết -> . Trước hết
        s = s.replace(/(^|\s)\.([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]{2,})/gm, '$1. $2');

        // Tách dấu chấm kết thúc câu dính liền từ tiếng Việt: 2.dễ -> 2. dễ, m>=2.Xét -> m>=2. Xét
        s = s.replace(/([0-9a-zA-Z\)\}])\.([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]+)/g, function(match, p1, p2) {
            if (VI_ACCENTS_REGEX.test(p2) || VIETNAMESE_WORDS.has(p2.toLowerCase())) {
                return `${p1}. ${p2}`;
            }
            return match;
        });

        // Chuyển đổi ký hiệu tích và tổng tốc ký (tích, tổng)
        s = s.replace(/tích\s*\(([^)]+)\)\s*\(([a-zA-Z0-9_\\|\s]+)\)/gi, '\\prod_{$2} ($1)');
        s = s.replace(/tích\s*\(([^)]+)\)/gi, '\\prod ($1)');
        s = s.replace(/tổng\s*\(([^)]+)\)\s*\(([a-zA-Z0-9_\\|\s]+)\)/gi, '\\sum_{$2} ($1)');
        s = s.replace(/tổng\s*\(([^)]+)\)/gi, '\\sum ($1)');

        // Tách \prod, \sum dính liền với dấu ngoặc đóng: ) \prod
        s = s.replace(/\)\s*(\\prod|\\sum)/g, ') $1');

        // Tách từ tiếng Việt dính liền sau dấu ngoặc đóng: )từ -> ) từ
        s = s.replace(/\)([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]+)/g, function(match, word) {
            if (VI_ACCENTS_REGEX.test(word) || VIETNAMESE_WORDS.has(word.toLowerCase())) {
                return `) ${word}`;
            }
            return match;
        });

        // Chuẩn hóa khoảng/đoạn số học dạng liền khối: (0,+\infty) hoặc [1,100] (KHÔNG CHÈN DẤU $)
        s = s.replace(/([(\[])\s*([+\-]?[0-9a-zA-Z\\]+)\s*,\s*([+\-]?[0-9a-zA-Z\\]+)\s*([)\]])/g, function(_, open, a, b, close) {
            return ` ${open}${a.trim()},${b.trim()}${close} `;
        });

        // Đảm bảo dấu phẩy trong danh sách công thức có khoảng trắng sau nó
        s = s.replace(/([0-9a-zA-Z\)\}])\s*,\s*([0-9a-zA-Z\\])/g, '$1, $2');

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

        // 2. Phép so sánh, cộng trừ và mũi tên
        s = s.replace(/<=>/g, ' \\Leftrightarrow ');
        s = s.replace(/=>/g, ' \\Rightarrow ');
        s = s.replace(/->/g, ' \\to ');
        s = s.replace(/<-/g, ' \\leftarrow ');
        s = s.replace(/>=/g, ' \\ge ');
        s = s.replace(/<=/g, ' \\le ');
        s = s.replace(/!=/g, ' \\ne ');
        s = s.replace(/~=/g, ' \\approx ');
        s = s.replace(/\+-/g, ' \\pm ');
        s = s.replace(/-\+/g, ' \\mp ');

        // 3. Dấu ba chấm \dots
        s = s.replace(/\+\s*\.{2,}\s*\+/g, ' + \\dots + ');
        s = s.replace(/\-\s*\.{2,}\s*\-/g, ' - \\dots - ');
        s = s.replace(/=\s*\.{2,}/g, ' = \\dots ');
        s = s.replace(/,\s*\.{2,}\s*,/g, ', \\dots, ');
        s = s.replace(/(?<=[a-zA-Z0-9_\)\]\}])\s*\.{2,}\s*(?=[a-zA-Z0-9_\(\[\{])/g, ' \\dots ');
        s = s.replace(/\.{3,}/g, ' \\dots ');

        // 4. Modulo: = 1 mod (p1p2...pk)^T, = 1 mod p, m = 1 mod ...
        s = s.replace(/=\s*([0-9a-zA-Z_{}\^]+)\s*mod\s*\(([^()]+)\)(\^[a-zA-Z0-9{}]+)?/gi, '\\equiv $1 \\pmod{($2)$3}');
        s = s.replace(/=\s*([0-9a-zA-Z_{}\^]+)\s*mod\s*([0-9a-zA-Z_\^\\]+(?:\{[^{}]+\})?)/gi, '\\equiv $1 \\pmod{$2}');
        s = s.replace(/=\s*([0-9a-zA-Z_{}\^]+)\s*mod\s*(\.{2,}|\\dots)/gi, '\\equiv $1 \\pmod{\\dots}');
        s = s.replace(/\bmod\s*\(([^()]+)\)(\^[a-zA-Z0-9{}]+)?/gi, '\\pmod{($1)$2}');
        s = s.replace(/\bmod\s+([0-9a-zA-Z_\^\\]+(?:\{[^{}]+\})?)/gi, '\\pmod{$1}');
        s = s.replace(/\bmod\s*(\.{2,}|\\dots)/gi, '\\pmod{\\dots}');

        // 5. Quan hệ chia hết: p | P(n) -> p \mid P(n), p | P(m_{0}) -> p \mid P(m_{0}) (không chạm vào trị tuyệt đối |B| > 1)
        s = s.replace(/(?<!\|[^|]*)\b([a-zA-Z0-9_{}\^]+(?:\([^()]+\))?)\s*\|\s*([a-zA-Z0-9_{}\^]+(?:\([^()]+\))?)(?![^|]*\|)/g, '$1 \\mid $2');

        // 6. Giới hạn (Limits): lim f_n(x) ^( x ->0+) -> \lim_{x \to 0^+} f_n(x)
        s = s.replace(/lim\s+([a-zA-Z0-9_\(\){}]+)\s*\^\s*\(\s*([^)]+)\s*\)/g, function(_, fn, sub) {
            let cleanSub = sub.replace(/->/g, '\\to').replace(/\s+/g, ' ').trim();
            cleanSub = cleanSub.replace(/([0-9\+\-\\infty]+)\s*([+\-])$/, '$1^{$2}');
            return `\\lim_{${cleanSub}} ${fn}`;
        });
        s = s.replace(/lim\s*\^\s*\(\s*([^)]+)\s*\)\s*([a-zA-Z0-9_\(\){}]+)/g, function(_, sub, fn) {
            let cleanSub = sub.replace(/->/g, '\\to').replace(/\s+/g, ' ').trim();
            cleanSub = cleanSub.replace(/([0-9\+\-\\infty]+)\s*([+\-])$/, '$1^{$2}');
            return `\\lim_{${cleanSub}} ${fn}`;
        });

        // 6b. Các toán tử chuẩn: sum, prod, lim, min, max, sup, inf, deg
        s = s.replace(/(?<!\\)\b(sum|prod|lim|min|max|inf|sup|deg)(?=[_^({\\]|\s+[a-zA-Z0-9(\\\\])/gi, '\\$1');
        s = s.replace(/(?<!\\)\bdeg\s+([a-zA-Z0-9_{}]+)/gi, '\\deg $1');
        s = s.replace(/lim_\s*\(\s*([^)]+)\s*\)\s*([a-zA-Z0-9_\(\){}]+)/g, function(_, sub, fn) {
            let cleanSub = sub.replace(/->/g, '\\to').replace(/\s+/g, ' ').trim();
            cleanSub = cleanSub.replace(/([0-9\+\-\\infty]+)\s*([+\-])$/, '$1^{$2}');
            return `\\lim_{${cleanSub}} ${fn}`;
        });
        s = s.replace(/\blim\s+([a-zA-Z0-9_{}]+(?:\([a-zA-Z0-9_{}]+\))?)/g, '\\lim $1');

        // 7. Hàm lượng giác & chữ Hy Lạp
        s = s.replace(/(?<!\\)\b(?:sin|Sin)\s*([A-Za-z0-9_']*)/g, '\\sin $1');
        s = s.replace(/(?<!\\)\b(?:cos|Cos)\s*([A-Za-z0-9_']*)/g, '\\cos $1');
        s = s.replace(/(?<!\\)\b(?:tan|Tan)\s*([A-Za-z0-9_']*)/g, '\\tan $1');
        s = s.replace(/(?<!\\)\b(?:cot|Cot)\s*([A-Za-z0-9_']*)/g, '\\cot $1');

        s = s.replace(/(?<!\\)\b(?:pi|Pi)\b/g, '\\pi');
        s = s.replace(/(?<!\\)\b(?:phi|Phi)\b/g, '\\phi');
        s = s.replace(/(?<!\\)\b(?:alpha|Alpha)\b/g, '\\alpha');
        s = s.replace(/(?<!\\)\b(?:beta|Beta)\b/g, '\\beta');
        s = s.replace(/(?<!\\)\b(?:gamma|Gamma)\b/g, '\\gamma');
        s = s.replace(/(?<!\\)\b(?:delta|Delta)\b/g, '\\delta');
        s = s.replace(/(?<!\\)\b(?:theta|Theta)\b/g, '\\theta');
        s = s.replace(/(?<!\\)\b(?:lambda|Lambda)\b/g, '\\lambda');
        s = s.replace(/(?<!\\)\b(?:sigma)\b/g, '\\sigma');
        s = s.replace(/(?<!\\)\b(?:Sigma)\b/g, '\\sum');
        s = s.replace(/(?<!\\)\b(?:omega|Omega)\b/g, '\\omega');

        // 8. Căn thức (sqrt, cbrt)
        s = replaceBalancedFunc(s, 'sqrt', '\\sqrt');
        s = replaceBalancedFunc(s, 'cbrt', '\\sqrt[3]');

        // 9. Chỉ số dưới (subscript) trên biến số và đoạn thẳng
        s = s.replace(/\b([A-Z])_([0-9]+)([A-Z])\b/g, '$1_{$2}$3');
        s = s.replace(/\b([A-Z])([0-9]+)([A-Z])\b/g, '$1_{$2}$3');
        s = s.replace(/\b([A-Z])([0-9]+)([A-Z])([0-9]+)\b/g, '$1_{$2}$3_{$4}');
        s = s.replace(/\b([A-Z])_([0-9]+)([A-Z])_([0-9]+)\b/g, '$1_{$2}$3_{$4}');
        s = replaceBalancedSubscripts(s);
        // Không gộp chữ cái sau chữ số trong chỉ số dưới (để p_1p_2 thành p_{1}p_{2} thay vì p_{1p}_2)
        s = s.replace(/([a-zA-Z0-9\)])\_([\+\-]?[0-9]+|[a-zA-Z]+)/g, '$1_{$2}');
        s = s.replace(/(?<![\\_a-zA-Z0-9])([a-zA-Z])([0-9]+)\b/g, '$1_{$2}');
        s = s.replace(/(?<![\\_a-zA-Z0-9])([A-Z]{2})([0-9]+)\b/g, '$1_{$2}');

        // Bọc từ tiếng Việt có dấu bên trong chỉ số ngoặc nhọn _{...} bằng \text{...}
        s = s.replace(/(?<!\\)_\{([^}]+)\}/g, function(_, inner) {
            if (VI_ACCENTS_REGEX.test(inner)) {
                const parts = inner.split(/(\s+)/);
                const wrapped = parts.map(p => {
                    if (VI_ACCENTS_REGEX.test(p)) return `\\text{${p}}`;
                    return p;
                }).join('');
                return `_{${wrapped}}`;
            }
            return `_{${inner}}`;
        });

        // 10. Luỹ thừa và số mũ (Thực hiện TRƯỚC phân số để m^2/6 thành m^{2}/6 -> \frac{m^{2}}{6} và c_i^m0 -> c_{i}^{m_{0}})
        s = replaceBalancedExponents(s);
        // Số mũ có kèm chỉ số dưới: c_{i}^m_{0}, c_{1}^m_{0}, x^a_1 -> c_{i}^{m_{0}} (khắc phục triệt để lỗi Double Subscript)
        s = s.replace(/\^([a-zA-Z0-9]+(?:_\{[^{}]+\}|_[a-zA-Z0-9]+))/g, '^{$1}');
        // Số mũ đơn giản sau bất kỳ cơ số nào (kể cả sau '}' của c_{1}^n hoặc ')' của (x+1)^2)
        s = s.replace(/\^([+\-]?[a-zA-Z0-9]+)/g, '^{$1}');

        // 11. Phân số (Fractions): Gom cụm ký tự/biểu thức liền kề hai bên dấu '/'
        s = convertFractions(s);

        // 12. Phép nhân: dấu chấm '.' và '*'
        s = s.replace(/\s*\*\s*/g, ' \\cdot ');
        s = s.replace(/\s+\.\s+/g, ' \\cdot ');
        s = s.replace(/([A-Za-z0-9_'\\]+|\}|\))\s*\.\s*(?=[A-Za-z0-9_'\\(\{])/g, function(match, p1, offset, fullStr) {
            const rest = fullStr.slice(offset + match.length);
            if (/^\d+$/.test(p1) && /^\d/.test(rest)) return match;
            return `${p1} \\cdot `;
        });

        // Khôi phục ký hiệu phương tích đã che chắn
        s = s.replace(/___POWPOINT___([A-Za-z0-9_']+)___([^\n_]+)___/g, function(_, pt, circle) {
            let cleanCircle = circle.replace(/§COMMA§/g, ', ').trim();
            if (!cleanCircle.startsWith('(')) {
                cleanCircle = `(${cleanCircle})`;
            }
            return `\\mathcal{P}_{${pt}/${cleanCircle}}`;
        });

        // Chuẩn hóa modulo bỏ ngoặc kép ( \pmod{p} )
        s = s.replace(/\(\s*\\?pmod\s*\(([^()]+)\)\s*\)/gi, '\\pmod{$1}');
        s = s.replace(/\(\s*\\?pmod\{([^}]+)\}\s*\)/gi, '\\pmod{$1}');
        s = s.replace(/\(\s*\\?mod\s+([^()]+)\s*\)/gi, '\\pmod{$1}');

        // 13. Khoảng cách dấu phẩy trong khoảng số học: (0,+\infty) -> (0, +\infty)
        s = s.replace(/([(\[][+\-]?[0-9a-zA-Z\\]+),\s*([+\-]?[0-9a-zA-Z\\]+[)\]])/g, '$1, $2');

        // 14. Khoảng cách toán tử so sánh
        s = s.replace(/([<>=])\s*(?=[0-9a-zA-Z\-\\+])/g, '$1 ');
        s = s.replace(/(?<=[0-9a-zA-Z\)\}])\s*([<>=])/g, ' $1');

        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    /**
     * Chuyển đổi môi trường nhiều dòng dạng ngoặc nhọn hoặc ngoặc vuông
     */
    function convertPseudoEnvironments(text) {
        if (!text) return '';
        const lines = text.split('\n');
        const outputLines = [];
        let i = 0;

        while (i < lines.length) {
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

                // 1. Tách dấu câu cuối: .,;:?! (nhưng bảo tồn dấu 3 chấm \dots và giai thừa n!, k!)
                let trailingPunct = '';
                let matchPunct = cleanMath.match(/([.,;:?]+)$/);
                if (!matchPunct && /(?<![a-zA-Z0-9\)\]])!+$/.test(cleanMath)) {
                    matchPunct = cleanMath.match(/(!+)$/);
                }
                if (matchPunct) {
                    const p = matchPunct[1];
                    if (/^\.{3,}$/.test(p)) {
                        if (p.length > 3) {
                            trailingPunct = p.slice(3);
                            cleanMath = cleanMath.slice(0, -trailingPunct.length).trim();
                        }
                    } else {
                        trailingPunct = p;
                        cleanMath = cleanMath.slice(0, -trailingPunct.length).trim();
                    }
                }

                // Khoảng số học giữ nguyên ngoặc
                const isInterval = /^[(\[][+\-]?[0-9a-zA-Z\\_,\s]+[)\]]$/.test(cleanMath);
                if (!isInterval) {
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
                    if (openP > closeP) {
                        const matchTrailingParen = cleanMath.match(/\s*\(\s*([a-zA-Z0-9_]*)$/);
                        if (matchTrailingParen) {
                            cleanMath = cleanMath.slice(0, -matchTrailingParen[0].length).trim();
                            const innerVar = matchTrailingParen[1];
                            if (innerVar) {
                                trailingPunct = ` ($${innerVar}$` + trailingPunct;
                            } else {
                                trailingPunct = ` (` + trailingPunct;
                            }
                        } else if (cleanMath.startsWith('(')) {
                            const diff = openP - closeP;
                            leadingPunct = '('.repeat(diff);
                            cleanMath = cleanMath.slice(diff).trim();
                        }
                    }

                    if (cleanMath) {
                        const formatted = formatMathSegment(cleanMath);
                        segments.push(`${leadingPunct}$${formatted.trim()}$${trailingPunct}`);
                    } else {
                        segments.push(str);
                    }
                } else {
                    const formatted = formatMathSegment(cleanMath);
                    segments.push(`$${formatted.trim()}$${trailingPunct}`);
                }
            } else {
                segments.push(str);
            }
        }

        let braceDepth = 0;

        for (let i = 0; i < words.length; i++) {
            const token = words[i];
            if (/^\s+$/.test(token)) {
                currentTokens.push(token);
                continue;
            }

            const wasInBraces = braceDepth > 0;
            // Cập nhật độ sâu dấu ngoặc nhọn nhóm LaTeX
            const openBraces = (token.match(/\{/g) || []).length;
            const closeBraces = (token.match(/\}/g) || []).length;
            braceDepth += openBraces - closeBraces;
            if (braceDepth < 0) braceDepth = 0;

            if (wasInBraces) {
                // Token này nằm trong hoặc vừa đóng nhóm ngoặc nhọn LaTeX
                currentTokens.push(token);
                continue;
            }

            const isNat = isNaturalLanguageWord(token);

            if (isNat && braceDepth === 0) {
                if (currentType === 'MATH') {
                    flushSegment();
                }
                currentType = 'TEXT';
                currentTokens.push(token);
                continue;
            }

            // Nhận diện toán tử, biến số, khoảng số học và hình học
            const isMathOp = /[=<>+\-*/\\^_|{}~]|\\infty|\\sqrt|\\triangle|\\prod|\\sum|\b(?:lim|sum|prod|int|sqrt|sin|cos|tan|cot|ln|log|exp|mod|pmod|equiv|min|max|inf|sup|deg)\b/i.test(token);
            const isVarPattern = /[a-zA-Z]_[a-zA-Z0-9]+|[a-zA-Z]\([a-zA-Z0-9,]+\)|\b[a-zA-Z]\d+\b|\b\d+[a-zA-Z]+\b|\b\d+[CAca]\d+\b|\b[A-Z]{2,4}\d*\b|___POWPOINT___/.test(token);
            const isCirclePattern = /^\([A-Z]{1,4}\)$/.test(token);
            const isIntervalPattern = /^[(\[][+\-]?[0-9a-zA-Z\\]+,\s*[+\-]?[0-9a-zA-Z\\]+[)\]]$/.test(token);
            const isSingleLetterVar = /^[a-zA-Z]$/.test(token.replace(/[.,;:?!()\[\]]/g, ''));
            const isPureNumber = /^\d+[,.]?\d*$/.test(token.replace(/[.,;:?!()\[\]]/g, ''));

            // Kiểm tra số thuần túy đứng đầu biểu thức toán (như 2026 > a_{i+1}, 1 <= k <= 2025, 2026 - k, 1, 3, 5, \dots, 2025)
            let isNumberStartingMath = false;
            if (isPureNumber && currentType !== 'MATH') {
                let nextNonSpace = '';
                for (let j = i + 1; j < words.length; j++) {
                    if (!/^\s+$/.test(words[j])) {
                        nextNonSpace = words[j];
                        break;
                    }
                }
                if (nextNonSpace && (/^(?:<=|>=|!=|==|<|>|=|\+|\-|\*|\/|\^|\||\\le|\\ge|\\ne|\\equiv|\\approx|\\mid|\\cdot|\\dots|mod\b|\\pmod)/i.test(nextNonSpace))) {
                    isNumberStartingMath = true;
                } else if (/,$/.test(token)) {
                    const restLine = words.slice(i).join('');
                    if (/^\(?[0-9]+,\s*(?:[0-9]+,\s*)*(?:\\dots|\.{2,})/.test(restLine)) {
                        isNumberStartingMath = true;
                    }
                }
            }

            if (isMathOp || isVarPattern || isCirclePattern || isIntervalPattern || isNumberStartingMath) {
                if (currentType === 'TEXT') {
                    flushSegment();
                }
                currentType = 'MATH';
                currentTokens.push(token);
            } else if (isSingleLetterVar) {
                if (currentType === 'TEXT') {
                    flushSegment();
                }
                currentType = 'MATH';
                currentTokens.push(token);

                let op = 0, cp = 0;
                for (let c of token) {
                    if (c === '(') op++;
                    else if (c === ')') cp++;
                }
                if (cp > op && token.endsWith(')')) {
                    flushSegment();
                    currentType = null;
                }
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
     * Chuẩn hóa Typographic và Delimiter
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
                // Khoảng trắng quanh dấu ngoặc văn bản
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
        // Xóa dấu $ rỗng nhưng bảo tồn ngắt dòng giữa các dòng
        result = result.replace(/\$[ \t]*\$/g, '');
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

        // 2. Tiền xử lý vô cùng, căn thức, khoảng số học, tách từ dính công thức
        text = preSanitize(text);

        // 3. Xử lý môi trường giả lập nhiều dòng (cases, array)
        text = convertPseudoEnvironments(text);

        // 4. Xử lý từng dòng
        const lines = text.split('\n');
        const processedLines = lines.map(line => {
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
