/* ==========================================================================
   SMP — DỮ LIỆU LỘ TRÌNH SỐ HỌC (VMO → Số Học)
   --------------------------------------------------------------------------
   Cách cập nhật khi có bài viết mới:
     1. Tìm đúng chuyên đề (station) và ô (tile) tương ứng.
     2. Điền `url` (đường dẫn tuyệt đối, ví dụ '/posts/math/vmo/ten-bai.html').
   Ô nào KHÔNG có `url` sẽ tự động hiển thị nhãn "Đang cập nhật".
   Tiến độ của từng chuyên đề và của cả lộ trình được tính tự động.
   ========================================================================== */

window.SMP_ROADMAP_SOHOC = {
    title: 'Lộ Trình Số Học Olympic',
    subtitle: '',

    phases: [
        { id: 1, name: 'Nền tảng' },
        { id: 2, name: 'Chuyên sâu' },
        { id: 3, name: 'Ứng dụng' },
        { id: 4, name: 'Về đích' }
    ],

    stations: [
        /* ------------------------------------------------------------ 1 */
        {
            id: 1, phase: 1, icon: 'mod',
            title: 'Hệ thặng dư',
            tiles: [
                {
                    title: 'Hệ thặng dư đầy đủ & thu gọn',
                    desc: 'Nhắc lại phép chia, định nghĩa hệ thặng dư, tính bất biến khi tịnh tiến và nhân với số nguyên tố cùng nhau.',
                    url: '/posts/math/vmo/he-thang-du-day-du-va-thu-gon.html'
                },
                {
                    title: 'Định lý thặng dư Trung Hoa',
                    desc: 'Phương trình đồng dư tuyến tính, định lý thặng dư Trung Hoa (CRT) và các bài toán tồn tại hệ đồng dư.',
                    url: '/posts/math/vmo/phuong-trinh-he-phuong-trinh-dong-du.html'
                },
                {
                    title: 'Định lý Fermat nhỏ, Euler & Wilson',
                    desc: 'Chứng minh qua hệ thặng dư, các hệ quả thường dùng và kỹ thuật hạ bậc lũy thừa theo modulo.',
                    url: '/posts/math/vmo/wilson-fermat-euler.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 2 */
        {
            id: 2, phase: 1, icon: 'lte',
            title: 'LTE & số mũ đúng $v_p$',
            tiles: [
                {
                    title: 'Bổ đề LTE (Lifting The Exponent)',
                    desc: 'Phát biểu, chứng minh các trường hợp $p$ lẻ và $p = 2$, cùng những ứng dụng điển hình.',
                    url: '/posts/math/vmo/bo-de-nang-so-mu-lte.html'
                },
                {
                    title: 'Công thức Legendre',
                    desc: 'Tính $v_p(n!)$, liên hệ với tổng chữ số trong cơ số $p$ và các bài toán chia hết giai thừa.',
                    url: '/posts/math/vmo/dinh-ly-legendre.html'
                },
                {
                    title: 'Ước lượng hàm định giá $p$-adic',
                    desc: 'Bộ bài nâng cao thử thách tư duy về đánh giá $v_p$ trong các biểu thức lũy thừa và giai thừa.',
                    url: '/posts/math/vmo/uoc-luong-ham-dinh-gia-p-adic.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 3 */
        {
            id: 3, phase: 1, icon: 'cycle',
            title: 'Cấp số nguyên & căn nguyên thủy',
            tiles: [
                {
                    title: 'Mở đầu cơ bản về cấp',
                    desc: 'Định nghĩa, tính chất nền tảng của cấp và những bài toán mở đầu điển hình.',
                    url: '/posts/math/vmo/mo-dau-co-ban-ve-cap.html'
                },
                {
                    title: 'Kĩ thuật xử lý lũy thừa $\\in \\mathcal{P}$',
                    desc: 'Khi biểu thức chứa lũy thừa là số nguyên tố: dùng cấp để khống chế số mũ và cơ số.',
                    url: '/posts/math/vmo/ki-thuat-xu-ly-luy-thua-in-p.html'
                },
                {
                    title: 'Căn nguyên thủy & ứng dụng',
                    desc: 'Sự tồn tại căn nguyên thủy, chỉ số (logarit rời rạc) và ứng dụng trong phương trình đồng dư.',
                    url: '/posts/math/vmo/can-nguyen-thuy-va-ung-dung.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 4 */
        {
            id: 4, phase: 1, icon: 'sequence',
            title: 'Dãy số nguyên',
            tiles: [
                {
                    title: 'Phương trình đặc trưng',
                    desc: 'Tìm công thức tổng quát của dãy truy hồi tuyến tính qua phương trình đặc trưng.',
                    url: '/posts/math/vmo/phuong-trinh-dac-trung.html'
                },
                {
                    title: 'Tính tuần hoàn số dư',
                    desc: 'Dãy số nguyên modulo $m$ luôn tuần hoàn — khai thác chu kỳ để chứng minh chia hết.',
                    url: '/posts/math/vmo/tinh-tuan-hoan-so-du.html'
                },
                {
                    title: 'Dãy số & số chính phương',
                    desc: 'Chứng minh một dãy là dãy nguyên, các bài toán dãy liên quan đến số chính phương.',
                    url: '/posts/math/vmo/bien-doi-dai-so-voi-day-so.html'
                },
                {
                    title: 'Nhiều hơn về CTTQ',
                    desc: 'Các kỹ thuật nâng cao xác định công thức tổng quát và ứng dụng vào tính chất số học của dãy.',
                    url: '/posts/math/vmo/nhieu-hon-ve-cttq.html'
                }
            ]
        },

        /* ------------------------------------------------------------ 5 */
        {
            id: 5, phase: 1, icon: 'function',
            title: 'Hàm số học',
            tiles: [
                {
                    title: 'Hàm phi Euler $\\varphi(n)$',
                    desc: 'Công thức tính, tính nhân tính, đẳng thức Gauss $\\sum_{d \\mid n} \\varphi(d) = n$ và các bài toán áp dụng.',
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

        /* ------------------------------------------------------------ 6 */
        {
            id: 6, phase: 2, icon: 'star',
            title: 'Số đặc biệt',
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

        /* ------------------------------------------------------------ 7 */
        {
            id: 7, phase: 2, icon: 'binom',
            title: 'Số học nhị thức',
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

        /* ------------------------------------------------------------ 8 */
        {
            id: 8, phase: 2, icon: 'square',
            title: 'Thặng dư bậc hai',
            tiles: [
                {
                    title: 'Tiêu chuẩn Euler & kí hiệu Legendre',
                    desc: 'Nhận biết thặng dư bậc hai, tính chất nhân tính và các giá trị đặc biệt $\\left(\\frac{-1}{p}\\right)$, $\\left(\\frac{2}{p}\\right)$.',
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

        /* ------------------------------------------------------------ 9 */
        {
            id: 9, phase: 3, icon: 'equation',
            title: 'Phương trình nghiệm nguyên',
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
            id: 10, phase: 3, icon: 'poly',
            title: 'Đa thức số học',
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
            id: 11, phase: 4, icon: 'trophy', label: '★',
            title: 'Luyện tập tổng hợp',
            tiles: [
                {
                    title: 'Number Theory Set 1',
                    desc: 'Tuyển tập bài toán Số học chuyên sâu từ Secrets of Mathematical Principles.',
                    url: '/posts/math/vmo/number-theory-set-1.html'
                },
                {
                    title: 'Number Theory Set 2',
                    desc: 'Bộ bài Số học chuyên sâu thứ hai, mức độ tương đương đề thi HSG Quốc gia.',
                    url: '/posts/math/vmo/number-theory-set-2.html'
                },
                {
                    title: 'Tổng hợp Số học TST Tỉnh 2026',
                    desc: 'Toàn bộ bài Số học trong các đề chọn đội tuyển HSG Quốc gia năm học 2026 – 2027.',
                    url: '/posts/math/vmo/tong-hop-so-hoc-tst-tinh-2026.html'
                },
                {
                    title: 'Problem Set 1',
                    desc: 'Bộ bài luyện tập tổng hợp: đồng dư, lũy thừa, phương trình nghiệm nguyên và biểu diễn tổng bình phương.',
                    url: '/posts/math/vmo/problem-set-1.html'
                }
            ]
        }
    ]
};
