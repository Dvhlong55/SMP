/**
 * ==============================================================================
 * SMP LaTeX Quick Viewer — Math Context Parser & Normalization Pipeline
 * ==============================================================================
 * Phiên bản: 2.0.0 — Hoàn thiện chuẩn hóa ngữ cảnh và Typographic Formatting
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
        'da', 'em', 'xin', 'gop', 'cau', 'a', 'xet', 'thi', 'va', 'hoac', 'khi', 'do',
        'ta', 'co', 'suy', 'ra', 'nen', 'ket', 'hop', 'voi', 'nghiem', 'duy', 'nhat',
        'dung', 'danh', 'gia', 'mot', 'ti', 'tim', 'duoc', 'cm', 'dc', 'dpcm', 'bai',
        'toan', 'loi', 'giai', 'dinh', 'ly', 'bo', 'de', 'he', 'so', 'lien', 'tuc',
        'dong', 'bien', 'nghich', 'tren', 'duoi', 'trong', 'ngoai', 'gia', 'su', 'dat',
        'tuong', 'duong', 'nhu', 'vay', 'do', 'vo', 'ly', 'mau', 'thuan', 'thoa', 'man',
        'dieu', 'kien', 'tiep', 'tuyen', 'dao', 'ham', 'nguyen', 'tich', 'phan', 'tong',
        'hieu', 'ti', 'chung', 'minh', 'lagrange', 'cauchy', 'schwarz', 'bernoulli',
        'chebyshev', 'jensen', 'theo', 'gia', 'thiet', 'de', 'thay', 'mat', 'khac',
        'tuong', 'tu', 'lai', 'goi', 'la', 'diem', 'duong', 'thang', 'mat', 'phang',
        'tam', 'giac', 'hinh', 'vuong', 'chu', 'nhat', 'tro', 'sau', 'day', 'truong',
        'hop', 'th1', 'th2', 'khoang', 'doan', 'nua', 'nho', 'hon', 'lon', 'bang', 'khac',
        'phan', 'buoc', 'muc'
    ]);

    /**
     * Kiểm tra một từ có phải từ tiếng Việt/văn bản thường
     */
    function isNaturalLanguageWord(word) {
        if (!word) return false;
        const clean = word.toLowerCase().replace(/^[(\["'«]+|[)\]"'».,:;?!]+$/g, '').trim();
        if (!clean) return false;

        // Có dấu tiếng Việt
        if (VI_ACCENTS_REGEX.test(clean)) return true;

        // Từ trong từ điển
        if (VIETNAMESE_WORDS.has(clean)) return true;

        // Nhãn danh sách như a), b), c), 1)
        if (/^[a-z0-9]\)$/i.test(word.trim())) return true;

        return false;
    }

    /**
     * Chuẩn hóa tốc ký trong một phân đoạn toán học thuần túy
     */
    function formatMathSegment(mathStr) {
        if (!mathStr) return '';
        let s = mathStr.trim();

        // 1. Phép so sánh và mũi tên
        s = s.replace(/<=>/g, ' \\Leftrightarrow ');
        s = s.replace(/=>/g, ' \\Rightarrow ');
        s = s.replace(/->/g, ' \\to ');
        s = s.replace(/<-/g, ' \\leftarrow ');
        s = s.replace(/>=/g, ' \\ge ');
        s = s.replace(/<=/g, ' \\le ');
        s = s.replace(/!=/g, ' \\ne ');
        s = s.replace(/~=/g, ' \\approx ');

        // 2. Dấu chấm lửng
        s = s.replace(/\+\s*\.{2,}\s*\+/g, ' + \\dots + ');
        s = s.replace(/\-\s*\.{2,}\s*\-/g, ' - \\dots - ');
        s = s.replace(/=\s*\.{2,}/g, ' = \\dots ');
        s = s.replace(/(?<=[a-zA-Z0-9_\)\]])\s*\.{3,}\s*(?=[a-zA-Z0-9_\(\[])/g, ' \\dots ');

        // 3. Giới hạn lim:
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

        // 4. Phân số:
        s = s.replace(/([a-zA-Z0-9_]+)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
        s = s.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, '\\frac{$1}{$2}');
        s = s.replace(/([0-9]+|[a-zA-Z])\/([a-zA-Z0-9_]+(?:\([a-zA-Z0-9\+\-\*\/_\s]+\))+)/g, '\\frac{$1}{$2}');
        s = s.replace(/([0-9]+|[a-zA-Z])\/([a-zA-Z][\+\-][0-9a-zA-Z]+)(?=\s*[\+\-\=]|$)/g, '\\frac{$1}{$2}');

        // 5. Căn bậc hai, căn bậc ba
        s = s.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
        s = s.replace(/cbrt\(([^)]+)\)/g, '\\sqrt[3]{$1}');

        // 6. Luỹ thừa và chỉ số dưới: x^(n+1) -> x^{n+1}
        s = s.replace(/([a-zA-Z0-9_\)]+)\^\(([^)]+)\)/g, '{$1}^{$2}');
        s = s.replace(/([a-zA-Z0-9_\)]+)\_\(([^)]+)\)/g, '{$1}_{$2}');

        // 7. Vector
        s = s.replace(/(?:vecto|vt)\s*\(([a-zA-Z]+)\)/g, '\\vec{$1}');
        s = s.replace(/(?:vecto|vt)\s+([A-Z]{1,2})/g, '\\vec{$1}');

        // 8. Định dạng khoảng trắng các dấu toán tử
        s = s.replace(/([<>=])\s*(?=[0-9a-zA-Z\-\\+])/g, '$1 ');
        s = s.replace(/(?<=[0-9a-zA-Z\)])\s*([<>=])/g, ' $1');

        s = s.replace(/\s+/g, ' ').trim();
        return s;
    }

    /**
     * BƯỚC 1: Tiền xử lý vô cùng và khoảng số học
     */
    function preSanitize(text) {
        if (!text) return '';
        let s = text;

        // Vô cùng (Infinity)
        s = s.replace(/([+\-])\s*(?:vô cùng|vocung|vô cực|vocuc)/gi, '$1\\infty');
        s = s.replace(/(?:vô cùng|vocung|vô cực|vocuc)/gi, '\\infty');

        // Nhận diện và đóng gói trước các khoảng / đoạn số học chuẩn
        // Ví dụ: ( 0, + vô cùng ) -> $(0, +\infty)$
        s = s.replace(/([(\[])\s*([+\-]?[0-9a-zA-Z\\]+)\s*,\s*([+\-]?[0-9a-zA-Z\\]+)\s*([)\]])/g, function(_, open, a, b, close) {
            return ` $${open}${a.trim()}, ${b.trim()}${close}$ `;
        });

        return s;
    }

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
                    outputLines.push(`\\begin{cases}\n  ${inner}\n\\end{cases}`);
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
                    outputLines.push(`\\left[\\begin{array}{l}\n  ${inner}\n\\end{array}\\right.`);
                    continue;
                }
            }

            // Chuỗi tương đương: bắt đầu bằng '<=>' hoặc '=>'
            if (/^\s*(?:<=>|=>)\s*/.test(lines[i])) {
                const alignLines = [];
                while (i < lines.length && /^\s*(?:<=>|=>)\s*/.test(lines[i])) {
                    const arrow = lines[i].match(/^\s*(<=>|=>)/)[1];
                    const content = lines[i].replace(/^\s*(?:<=>|=>)\s*/, '').trim();
                    alignLines.push(`&${arrow === '<=>' ? '\\Leftrightarrow' : '\\Rightarrow'} ${formatMathSegment(preSanitize(content))}`);
                    i++;
                }
                if (alignLines.length > 0) {
                    outputLines.push(`\\begin{aligned}\n  ${alignLines.join(' \\\\\n  ')}\n\\end{aligned}`);
                    continue;
                }
            }

            outputLines.push(lines[i]);
            i++;
        }

        return outputLines.join('\n');
    }

    /**
     * Đếm số ký tự trong chuỗi
     */
    function countChar(str, char) {
        let count = 0;
        for (let i = 0; i < str.length; i++) {
            if (str[i] === char) count++;
        }
        return count;
    }

    /**
     * Thuật toán phân đoạn ranh giới Văn bản vs Toán học (Tokenization & Segmentation)
     */
    function processRawTextLine(line) {
        if (!line.trim()) return line;

        if (/^\\begin\{(?:cases|array|aligned|matrix|pmatrix)\}/.test(line.trim())) {
            return line;
        }

        const words = line.split(/(\s+)/);
        const segments = [];
        let currentType = null;
        let currentTokens = [];

        function getNextNonSpaceWord(index) {
            for (let j = index + 1; j < words.length; j++) {
                const w = words[j].trim();
                if (w) return w;
            }
            return '';
        }

        function flushSegment() {
            if (currentTokens.length === 0) return;
            const str = currentTokens.join('');
            currentTokens = [];
            if (!str) return;

            if (currentType === 'MATH') {
                let cleanMath = str.trim();

                // 1. Tách dấu ngắt câu cuối dòng: .,;:?!
                let trailingPunct = '';
                const matchPunct = cleanMath.match(/([.,;:?!]+)$/);
                if (matchPunct) {
                    trailingPunct = matchPunct[1];
                    cleanMath = cleanMath.slice(0, -trailingPunct.length).trim();
                }

                // 2. Tách ngoặc đóng dư thừa ở cuối nếu không cân bằng
                const openParens = countChar(cleanMath, '(');
                const closeParens = countChar(cleanMath, ')');
                if (closeParens > openParens && cleanMath.endsWith(')')) {
                    const diff = closeParens - openParens;
                    trailingPunct = ')'.repeat(diff) + trailingPunct;
                    cleanMath = cleanMath.slice(0, -diff).trim();
                }

                // 3. Tách ngoặc mở dư thừa ở đầu nếu không cân bằng
                let leadingPunct = '';
                const openLeft = countChar(cleanMath, '(');
                const closeRight = countChar(cleanMath, ')');
                if (openLeft > closeRight && cleanMath.startsWith('(')) {
                    const diff = openLeft - closeRight;
                    leadingPunct = '('.repeat(diff);
                    cleanMath = cleanMath.slice(diff).trim();
                }

                if (cleanMath) {
                    const formatted = formatMathSegment(cleanMath);
                    let result = '';
                    if (leadingPunct) result += leadingPunct;
                    result += `$${formatted.trim()}$`;
                    if (trailingPunct) result += trailingPunct;
                    segments.push(result);
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

            // Dấu ngoặc mở theo sau bởi từ tự nhiên: ví dụ "( xét ..."
            if (token === '(' || token === '[' || token === '{') {
                const nextWord = getNextNonSpaceWord(i);
                if (nextWord && isNaturalLanguageWord(nextWord)) {
                    if (currentType === 'MATH') {
                        flushSegment();
                    }
                    currentType = 'TEXT';
                    currentTokens.push(token);
                    continue;
                }
            }

            // Số thứ tự sau từ 'câu', 'bài', 'phần', 'mục'
            const prevWord = (i >= 2) ? words[i - 2].trim().toLowerCase() : '';
            if (/^\d+$/.test(token.replace(/[.,;:?!]/g, '')) && ['cau', 'câu', 'bai', 'bài', 'phan', 'phần', 'buoc', 'bước', 'muc', 'mục'].includes(prevWord)) {
                if (currentType === 'MATH') {
                    flushSegment();
                }
                currentType = 'TEXT';
                currentTokens.push(token);
                continue;
            }

            // Từ tiếng Việt / ngôn ngữ tự nhiên
            if (isNaturalLanguageWord(token)) {
                if (currentType === 'MATH') {
                    flushSegment();
                }
                currentType = 'TEXT';
                currentTokens.push(token);
                continue;
            }

            // Token toán:
            const isMath = /[=<>+\-*/\\^_]|\\infty|\b(?:lim|sum|int|sqrt|sin|cos|tan)\b|[a-zA-Z]_[a-zA-Z0-9]+|[a-zA-Z]\([a-zA-Z0-9,]+\)/.test(token);

            if (isMath) {
                if (currentType === 'TEXT') {
                    flushSegment();
                }
                currentType = 'MATH';
                currentTokens.push(token);
            } else if (/^[a-zA-Z]$/.test(token.replace(/[.,;:?!()\[\]]/g, ''))) {
                if (currentType === null) currentType = 'MATH';
                currentTokens.push(token);
            } else if (/^\d+[,.]?\d*$/.test(token.replace(/[.,;:?!()\[\]]/g, '')) && currentType === 'MATH') {
                currentTokens.push(token);
            } else {
                if (!currentType) currentType = 'TEXT';
                currentTokens.push(token);
            }
        }

        flushSegment();
        return segments.join('');
    }

    /**
     * Hậu xử lý văn bản cuối cùng (Typographic & Delimiter Cleansing)
     */
    function cleanAndFormatFinalTypography(text) {
        if (!text) return '';

        // Tách thành các đoạn LATEX và TEXT
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

        // Xử lý các đoạn TEXT
        for (let k = 0; k < tokens.length; k++) {
            if (tokens[k].type === 'TEXT') {
                let t = tokens[k].val;

                // Xử lý dấu ngoặc mở: trước '(' có chữ/số thì cách ra, sau '(' bỏ cách
                t = t.replace(/([0-9a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])\(/gi, '$1 (');
                t = t.replace(/\(\s+/g, '(');

                // Xử lý dấu ngoặc đóng: trước ')' bỏ cách, sau ')' theo sau là chữ thì cách ra
                t = t.replace(/\s+\)/g, ')');
                t = t.replace(/\)\s+([.,;:?!])/g, ')$1');
                t = t.replace(/\)([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/gi, ') $1');

                // Dấu câu: trước bỏ cách, sau có cách
                t = t.replace(/\s+([.,;:?!])/g, '$1');
                t = t.replace(/([.,;:?!])([a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])/gi, '$1 $2');

                tokens[k].val = t;
            } else if (tokens[k].type === 'MATH') {
                // Làm sạch bên trong $...$
                let m = tokens[k].val;
                if (m.startsWith('$') && m.endsWith('$') && !m.startsWith('$$')) {
                    const inner = m.slice(1, -1).trim();
                    tokens[k].val = `$${inner}$`;
                }
            }
        }

        // Ghép nối và đảm bảo khoảng cách giữa TEXT và MATH
        let result = '';
        for (let k = 0; k < tokens.length; k++) {
            const curr = tokens[k];
            const next = tokens[k + 1];

            result += curr.val;

            if (next) {
                // Nếu TEXT liền kề MATH
                if (curr.type === 'TEXT' && next.type === 'MATH') {
                    // Nếu cuối TEXT không có dấu cách hoặc '('
                    if (!/[\s(\[]$/.test(curr.val)) {
                        result += ' ';
                    }
                }
                // Nếu MATH liền kề TEXT
                else if (curr.type === 'MATH' && next.type === 'TEXT') {
                    // Nếu đầu TEXT không có dấu cách, ')', '.', ',', ':', ';'
                    if (!/^[\s)\].,;:?!]/.test(next.val)) {
                        result += ' ';
                    }
                }
                // Nếu hai khối MATH liền kề nhau
                else if (curr.type === 'MATH' && next.type === 'MATH') {
                    result += ' ';
                }
            }
        }

        // Chuẩn hóa khoảng trắng dư thừa
        result = result.replace(/[ \t]{2,}/g, ' ');
        // Bỏ dấu $ rỗng
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

        // 2. Tiền xử lý vô cùng và khoảng
        text = preSanitize(text);

        // 3. Xử lý môi trường giả lập nhiều dòng
        text = convertPseudoEnvironments(text);

        // 4. Tách các khối đã có sẵn dấu delimit LaTeX: $...$, $$...$$, \(...\), \[...\]
        const DELIMITER_REGEX = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+?\$|\\\([\s\S]*?\\\)|\\begin\{[a-z*]+\}[\s\S]*?\\end\{[a-z*]+\})/gi;

        let parts = [];
        let lastIndex = 0;
        let match;

        while ((match = DELIMITER_REGEX.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'TEXT',
                    content: text.substring(lastIndex, match.index)
                });
            }
            parts.push({
                type: 'LATEX',
                content: match[0]
            });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            parts.push({
                type: 'TEXT',
                content: text.substring(lastIndex)
            });
        }

        // 5. Xử lý từng phần
        let totalMathCount = 0;
        const processedParts = parts.map(part => {
            if (part.type === 'LATEX') {
                totalMathCount++;
                return part.content;
            } else {
                const lines = part.content.split('\n');
                const processedLines = lines.map(processRawTextLine);
                const resText = processedLines.join('\n');
                return resText;
            }
        });

        let joined = processedParts.join('');

        // 6. Hậu xử lý Typographic và Delimiter
        let finalResult = cleanAndFormatFinalTypography(joined);

        const allMaths = finalResult.match(/\$[^\$]+?\$|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$/g);
        totalMathCount = allMaths ? allMaths.length : 0;

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
