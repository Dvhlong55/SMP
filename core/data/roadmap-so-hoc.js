/* ==========================================================================
   SMP — DỮ LIỆU LỘ TRÌNH SỐ HỌC (VMO → Số Học)
   --------------------------------------------------------------------------
   Thiết kế theo chuẩn giáo trình chuyên đề Olympic Toán học:
   - 10 Chuyên đề cốt lõi + 1 Tuyển tập tổng hợp
   - 5 Giai đoạn học tập từ Nền tảng đến Về đích
   - Mỗi chuyên đề đi kèm công thức toán học đặc trưng (LaTeX)
   ========================================================================== */

window.SMP_ROADMAP_SOHOC = {
    title: 'Lộ Trình Số Học Olympic',
    subtitle: 'Từ hệ thặng dư đến đa thức số học — hệ thống 10 chuyên đề then chốt và các tuyển tập bài toán chọn lọc cho kỳ thi Học sinh giỏi Quốc gia.',

    phases: [
        { id: 1, name: 'Nền tảng', desc: 'Đồng dư thức, các định lý kinh điển và số mũ đúng' },
        { id: 2, name: 'Công cụ', desc: 'Cấp của số nguyên, dãy số nguyên và các hàm số học' },
        { id: 3, name: 'Chuyên sâu', desc: 'Các họ số đặc biệt, số học nhị thức và thặng dư bậc hai' },
        { id: 4, name: 'Ứng dụng', desc: 'Phương trình nghiệm nguyên và đa thức số học' },
        { id: 5, name: 'Về đích', desc: 'Tuyển tập đề thi và bài toán chọn lọc VMO / TST' }
    ],

    stations: [
        /* ------------------------------------------------------------ 01 */
        {
            id: 1, phase: 1,
            title: 'Hệ thặng dư',
            desc: 'Phép chia có dư, hệ thặng dư đầy đủ – thu gọn, định lý thặng dư Trung Hoa và các định lý Fermat, Euler, Wilson.',
            formula: '$a \\equiv b \\pmod{m}$',
            tiles: [
                {
                    title: 'Hệ thặng dư đầy đủ & thu gọn',
                    desc: 'Nhắc lại phép chia, định nghĩa hệ thặng dư, tính bất biến khi tịnh tiến và nhân với số nguyên tố cùng nhau.',
                    count: 11,
                    url: '/posts/math/vmo/he-thang-du-day-du-va-thu-gon.html'
                },
                {
                    title: 'Định lý thặng dư Trung Hoa',
                    desc: 'Phương trình đồng dư tuyến tính, định lý thặng dư Trung Hoa (CRT) và các bài toán tồn tại hệ đồng dư.',
                    count: 9,
                    url: '/posts/math/vmo/phuong-trinh-he-phuong-trinh-dong-du.html'
                },
                {
                    title: 'Định lý Fermat nhỏ, Euler & Wilson',
                    desc: 'Chứng minh qua hệ thặng dư, các hệ quả thường dùng và kỹ thuật hạ bậc lũy thừa theo modulo.',
                    count: 10,
                    url: '/posts/math/vmo/wilson-fermat-euler.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 02 */
        {
            id: 2, phase: 1,
            title: 'LTE & số mũ đúng $v_p$',
            desc: 'Hàm định giá $p$-adic, bổ đề LTE và công thức Legendre — vũ khí giải quyết các bài toán lũy thừa lớn và giai thừa.',
            formula: '$v_p(a^n \\pm b^n)$',
            tiles: [
                {
                    title: 'Bổ đề LTE (Lifting The Exponent)',
                    desc: 'Phát biểu, chứng minh các trường hợp $p$ lẻ và $p = 2$, cùng những ứng dụng điển hình trong đề thi.',
                    count: 19,
                    url: '/posts/math/vmo/bo-de-nang-so-mu-lte.html'
                },
                {
                    title: 'Công thức Legendre',
                    desc: 'Tính $v_p(n!)$, liên hệ với tổng chữ số trong cơ số $p$ và các bài toán chia hết giai thừa.',
                    count: 11,
                    url: '/posts/math/vmo/dinh-ly-legendre.html'
                },
                {
                    title: 'Ước lượng hàm định giá $p$-adic',
                    desc: 'Bộ bài nâng cao thử thách tư duy về đánh giá $v_p$ trong các biểu thức lũy thừa và giai thừa.',
                    count: 10,
                    url: '/posts/math/vmo/uoc-luong-ham-dinh-gia-p-adic.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 03 */
        {
            id: 3, phase: 2,
            title: 'Cấp số nguyên & căn nguyên thủy',
            desc: 'Cấp của một số theo modulo, kỹ thuật khống chế số mũ và cấu trúc nhóm nhân $(\\mathbb{Z}/n\\mathbb{Z})^*$.',
            formula: '$\\mathrm{ord}_m(a) \\mid \\varphi(m)$',
            tiles: [
                {
                    title: 'Mở đầu cơ bản về cấp',
                    desc: 'Định nghĩa, tính chất nền tảng của cấp và những bài toán mở đầu điển hình.',
                    count: 10,
                    url: '/posts/math/vmo/mo-dau-co-ban-ve-cap.html'
                },
                {
                    title: 'Kĩ thuật xử lý lũy thừa $\\in \\mathcal{P}$',
                    desc: 'Khi biểu thức chứa lũy thừa là số nguyên tố: dùng cấp để khống chế số mũ và cơ số.',
                    count: 9,
                    url: '/posts/math/vmo/ki-thuat-xu-ly-luy-thua-in-p.html'
                },
                {
                    title: 'Căn nguyên thủy & ứng dụng',
                    desc: 'Sự tồn tại căn nguyên thủy, chỉ số (logarit rời rạc) và ứng dụng trong phương trình đồng dư.',
                    count: 12,
                    url: '/posts/math/vmo/can-nguyen-thuy-va-ung-dung.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 04 */
        {
            id: 4, phase: 2,
            title: 'Dãy số nguyên',
            desc: 'Tính chất số học của dãy số: tính tuần hoàn số dư, phương trình đặc trưng, dãy số nguyên và số chính phương.',
            formula: '$x_{n+2} = a x_{n+1} + b x_n$',
            tiles: [
                {
                    title: 'Tính tuần hoàn số dư',
                    desc: 'Dãy số nguyên modulo $m$ luôn tuần hoàn — khai thác chu kỳ để chứng minh chia hết.',
                    url: '/posts/math/vmo/tinh-tuan-hoan-so-du.html'
                },
                {
                    title: 'Phương trình đặc trưng',
                    desc: 'Tìm công thức tổng quát của dãy truy hồi tuyến tính qua phương trình đặc trưng.',
                    url: '/posts/math/vmo/phuong-trinh-dac-trung.html'
                },
                {
                    title: 'Nhiều hơn về CTTQ',
                    desc: 'Các kỹ thuật nâng cao xác định công thức tổng quát và ứng dụng vào tính chất số học của dãy.',
                    url: '/posts/math/vmo/nhieu-hon-ve-cttq.html'
                },
                {
                    title: 'Dãy số & số chính phương',
                    desc: 'Chứng minh một dãy là dãy nguyên, các bài toán dãy liên quan đến số chính phương.',
                    count: 7,
                    url: '/posts/math/vmo/bien-doi-dai-so-voi-day-so.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 05 */
        {
            id: 5, phase: 2,
            title: 'Hàm số học',
            desc: 'Các hàm nhân tính kinh điển: hàm phi Euler $\\varphi(n)$, hàm đếm ước số $\\tau(n)$, hàm tổng ước $\\sigma(n)$ và hàm tổng chữ số $S(n)$.',
            formula: '$\\sum_{d \\mid n} \\varphi(d) = n$',
            tiles: [
                {
                    title: 'Hàm phi Euler $\\varphi(n)$',
                    desc: 'Công thức tính, tính nhân tính, đẳng thức Gauss $\\sum_{d \\mid n} \\varphi(d) = n$ và các bài toán áp dụng.',
                    count: 14,
                    url: '/posts/math/vmo/ham-phi-euler.html'
                },
                {
                    title: 'Hàm số ước $\\tau(n)$ & tổng ước $\\sigma(n)$',
                    desc: 'Đếm số ước, tổng các ước và những bài toán đánh giá, phương trình liên quan.',
                    url: null
                },
                {
                    title: 'Hàm tổng chữ số $S(n)$',
                    desc: 'Tính chất đồng dư của tổng chữ số, đánh giá kích thước và bài toán biểu diễn thập phân.',
                    url: null
                }
            ]
        },

        /* ------------------------------------------------------------ 06 */
        {
            id: 6, phase: 3,
            title: 'Số đặc biệt',
            desc: 'Những họ số mang tên các nhà toán học: số Fermat, số Mersenne và các tính chất của số hoàn hảo.',
            formula: '$F_n = 2^{2^n} + 1,\\quad M_p = 2^p - 1$',
            tiles: [
                {
                    title: 'Số Fermat',
                    desc: 'Tính nguyên tố cùng nhau của các số Fermat, ước nguyên tố dạng $k \\cdot 2^{n+2} + 1$.',
                    url: null
                },
                {
                    title: 'Số Mersenne',
                    desc: 'Ước nguyên tố của $2^p - 1$, số nguyên tố Mersenne và các bài toán chia hết liên quan.',
                    url: null
                },
                {
                    title: 'Số hoàn hảo',
                    desc: 'Định lý Euclid – Euler về số hoàn hảo chẵn và bài toán về ước số của số hoàn hảo.',
                    url: null
                }
            ]
        },

        /* ------------------------------------------------------------ 07 */
        {
            id: 7, phase: 3,
            title: 'Số học nhị thức',
            desc: 'Tính chất số học của hệ số nhị thức $\\binom{n}{k}$: tính chia hết, định lý Lucas, Kummer và Wolstenholme.',
            formula: '$\\binom{n}{k} \\pmod p$',
            tiles: [
                {
                    title: 'Tính chất cơ bản của $\\binom{n}{k}$',
                    desc: 'Các đẳng thức, tính chia hết cơ bản và ước nguyên tố của hệ số nhị thức.',
                    url: null
                },
                {
                    title: 'Định lý Wolstenholme, Kummer & Lucas',
                    desc: 'Đồng dư của $\\binom{n}{k}$ theo modulo nguyên tố và lũy thừa nguyên tố.',
                    url: null
                },
                {
                    title: 'Đa thức Lagrange & đồng dư nâng cao',
                    desc: 'Liên hệ hệ số nhị thức với nội suy Lagrange, các đồng dư thức nâng cao.',
                    url: null
                }
            ]
        },

        /* ------------------------------------------------------------ 08 */
        {
            id: 8, phase: 3,
            title: 'Thặng dư bậc hai',
            desc: 'Khi nào $x^2 \\equiv a \\pmod p$ có nghiệm? Tiêu chuẩn Euler, kí hiệu Legendre, luật tương hỗ Gauss và bổ đề Thue.',
            formula: '$\\left(\\frac{a}{p}\\right) \\equiv a^{\\frac{p-1}{2}} \\pmod p$',
            tiles: [
                {
                    title: 'Tiêu chuẩn Euler & kí hiệu Legendre',
                    desc: 'Nhận biết thặng dư bậc hai, tính chất nhân tính và các giá trị đặc biệt $(-1/p)$, $(2/p)$.',
                    url: null
                },
                {
                    title: 'Luật tương hỗ Gauss & kí hiệu Jacobi',
                    desc: 'Luật tương hỗ bậc hai, mở rộng sang kí hiệu Jacobi và ứng dụng vào chia hết, dãy số.',
                    url: null
                },
                {
                    title: 'Bổ đề Thue & biểu diễn số nguyên tố',
                    desc: 'Công cụ chứng minh tồn tại nghiệm đồng dư; định lý Fermat về tổng hai bình phương.',
                    url: '/posts/math/BoDeThueVaBieuDienSoNguyenTo.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 09 */
        {
            id: 9, phase: 4,
            title: 'Phương trình nghiệm nguyên',
            desc: 'Các phương pháp giải phương trình nghiệm nguyên: đồng dư, cực hạn, bước nhảy Vieta và phương trình Pell.',
            formula: '$x^2 - d y^2 = 1$',
            tiles: [
                {
                    title: 'Phương pháp cơ bản & bổ đề số học',
                    desc: 'Xét đồng dư, đánh giá, phân tích nhân tử và các bổ đề số học thường dùng.',
                    url: null
                },
                {
                    title: 'Lùi vô hạn & phương trình Pythagore',
                    desc: 'Nguyên lý cực hạn, phương pháp lùi vô hạn Fermat và bộ ba Pythagore.',
                    url: null
                },
                {
                    title: 'Phương trình chứa lũy thừa',
                    desc: 'Kết hợp cấp, LTE và đồng dư để giải phương trình mũ nghiệm nguyên.',
                    url: null
                },
                {
                    title: 'Phương trình tuyến tính & định lý Sylvester',
                    desc: 'Phương trình $ax + by = c$, bài toán đồng xu Frobenius và các biến thể.',
                    url: null
                },
                {
                    title: 'Phương trình Markov — Bước nhảy Viète',
                    desc: 'Tam thức bậc hai, nguyên lý cực hạn và kỹ thuật Vieta jumping.',
                    url: null
                },
                {
                    title: 'Phương trình Pell',
                    desc: 'Phương trình Pell loại I, II, III, kết hợp phương trình Markov và dãy truy hồi.',
                    url: null
                }
            ]
        },

        /* ------------------------------------------------------------ 10 */
        {
            id: 10, phase: 4,
            title: 'Đa thức số học',
            desc: 'Đa thức hệ số nguyên dưới góc nhìn Số học: tính chất chia hết, định lý Schur về vô hạn ước nguyên tố và bổ đề Hensel.',
            formula: '$a - b \\mid P(a) - P(b)$',
            tiles: [
                {
                    title: 'Đa thức hệ số nguyên',
                    desc: 'Tính chất $a - b \\mid P(a) - P(b)$, nghiệm hữu tỉ và các bài toán chia hết cơ bản.',
                    url: null
                },
                {
                    title: 'Ước nguyên tố của $P(n)$',
                    desc: 'Định lý Schur về vô hạn ước nguyên tố và các bài toán liên quan.',
                    url: null
                },
                {
                    title: 'Đồng dư đa thức & định lý Lagrange',
                    desc: 'Số nghiệm của đa thức theo modulo nguyên tố, kết hợp định lý thặng dư Trung Hoa.',
                    url: null
                }
            ]
        },

        /* ------------------------------------------------------------ ★ */
        {
            id: 11, phase: 5, label: '★',
            title: 'Luyện tập tổng hợp',
            desc: 'Tuyển tập các bài toán Số học chuyên sâu và toàn bộ đề thi chọn đội tuyển HSG Quốc gia (TST Tỉnh).',
            formula: '$\\mathrm{VMO} \\cdot \\mathrm{TST}$',
            tiles: [
                {
                    title: 'Number Theory Set 1',
                    desc: 'Tuyển tập bài toán Số học chuyên sâu từ Secrets of Mathematical Principles.',
                    count: 18,
                    url: '/posts/math/vmo/number-theory-set-1.html'
                },
                {
                    title: 'Number Theory Set 2',
                    desc: 'Bộ bài Số học chuyên sâu thứ hai, mức độ tương đương đề thi HSG Quốc gia.',
                    count: 10,
                    url: '/posts/math/vmo/number-theory-set-2.html'
                },
                {
                    title: 'Tổng hợp Số học TST Tỉnh 2026',
                    desc: 'Toàn bộ 43 bài toán Số học từ các kỳ thi chọn đội tuyển HSGQG năm học 2026 – 2027 trên cả nước.',
                    count: 43,
                    url: '/posts/math/vmo/tong-hop-so-hoc-tst-tinh-2026.html'
                },
                {
                    title: 'Problem Set 1',
                    desc: 'Bộ bài luyện tập tổng hợp: đồng dư, lũy thừa, phương trình nghiệm nguyên và biểu diễn tổng bình phương.',
                    count: 15,
                    url: '/posts/math/vmo/problem-set-1.html'
                }
            ]
        }
    ]
};
