/* ==========================================================================
   SMP — DỮ LIỆU LỘ TRÌNH TỔ HỢP (VMO → Tổ Hợp)
   --------------------------------------------------------------------------
   Phát triển dựa trên khung 15 chuyên đề bồi dưỡng Tổ Hợp Olympic VMO
   Tác giả: SMP • Email: smp.mth@gmail.com
   ========================================================================== */

window.SMP_ROADMAP_TOHOP = {
    id: 'to-hop',
    title: 'Lộ Trình Tổ Hợp Olympic',
    kicker: 'VMO · Tổ Hợp',
    subtitle: 'Hệ thống chuyên đề và bài tập chọn lọc bồi dưỡng thi Học sinh Giỏi Quốc gia (VMO), phân bố từ các nguyên lý tư duy nền tảng, bài toán đếm chuyên sâu đến lý thuyết đồ thị và phương pháp hiện đại.',
    listUrl: '/pages/toanhoc.html?filter=vmo&sub=to-hop',
    author: 'SMP',
    email: 'smp.mth@gmail.com',

    phases: [
        { id: 1, name: 'Mở đầu về tư duy' },
        { id: 2, name: 'Bài toán đếm' },
        { id: 3, name: 'Bảng ô vuông & Trò chơi' },
        { id: 4, name: 'Lý thuyết đồ thị' },
        { id: 5, name: 'Phương pháp nâng cao & Về đích' }
    ],

    stations: [
        /* ============================================================
           GIAI ĐOẠN I: MỞ ĐẦU VỀ TƯ DUY
           ============================================================ */
        {
            id: 1, phase: 1,
            title: 'Bộ 3 nguyên lý: Dirichlet, Cực hạn & Bất biến',
            desc: 'Bộ ba nguyên lý kinh điển rèn luyện tư duy lập luận logic và chứng minh sự tồn tại cấu hình rời rạc.',
            tiles: [
                {
                    title: 'Nguyên lý Dirichlet nâng cao',
                    desc: 'Nguyên lý lồng chim bồ câu, dạng mở rộng cho tập vô hạn, ứng dụng trong số học và hình học tổ hợp.',
                    url: null
                },
                {
                    title: 'Nguyên lý Cực hạn',
                    desc: 'Kỹ thuật xét phần tử biên (nhỏ nhất, lớn nhất), bài toán cấu hình điểm Sylvester-Gallai và đường biên.',
                    url: null
                },
                {
                    title: 'Đại lượng Bất biến & Đơn biến',
                    desc: 'Xây dựng hàm thế năng, bất biến chẵn lẻ, bất biến modulo và tính dừng của quá trình hữu hạn bước.',
                    url: null
                },
                {
                    title: 'Tổng hợp các nguyên lý quan trọng',
                    desc: 'Tuyển chọn các bài toán phối hợp Dirichlet, cực hạn và đại lượng bất biến trong các kỳ thi HSGQG.',
                    url: null
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN II: BÀI TOÁN ĐẾM
           ============================================================ */
        {
            id: 2, phase: 2,
            title: 'Các nguyên tắc đếm cơ bản',
            desc: 'Quy tắc cộng, quy tắc nhân, hoán vị, chỉnh hợp và tổ hợp — nền tảng của mọi bài toán đếm rời rạc.',
            tiles: [
                {
                    title: 'Quy tắc đếm cơ bản & Hoán vị, Chỉnh hợp, Tổ hợp',
                    desc: 'Phân biệt mô hình có thứ tự và không thứ tự, hoán vị vòng quanh và các bài toán phân nhóm cơ bản.',
                    url: null
                }
            ]
        },

        {
            id: 3, phase: 2,
            title: 'Nguyên lý bù trừ (PIE) & Bài toán tồn tại',
            desc: 'Công thức hợp của các tập hợp, bài toán đếm phần tử thỏa mãn tính chất và ứng dụng chỉ ra sự tồn tại.',
            tiles: [
                {
                    title: 'Nguyên lý bù trừ (Inclusion-Exclusion Principle)',
                    desc: 'Công thức tổng quát cho n tập hợp, bài toán mất thứ tự (Derangements) và bài toán số các toàn ánh.',
                    url: null
                }
            ]
        },

        {
            id: 4, phase: 2,
            title: 'Bài toán chia kẹo Euler & Phương pháp vách ngăn',
            desc: 'Mô hình Stars and Bars tìm số nghiệm nguyên không âm, nguyên dương của phương trình tổng.',
            tiles: [
                {
                    title: 'Chia kẹo Euler (Phần 1)',
                    desc: 'Phương pháp vách ngăn cơ bản, số nghiệm nguyên thỏa mãn cận dưới $x_i \\ge c_i$.',
                    url: null
                },
                {
                    title: 'Chia kẹo Euler (Phần 2) & Phân hoạch',
                    desc: 'Kết hợp chia kẹo với nguyên lý bù trừ xử lý điều kiện chặn trên $x_i \\le b_i$ và phân hoạch số nguyên.',
                    url: null
                }
            ]
        },

        {
            id: 5, phase: 2,
            title: 'Hệ thức truy hồi & Đếm bằng truy hồi',
            desc: 'Phương pháp thiết lập hệ thức truy hồi tuyến tính từ cấu trúc con của bài toán đếm.',
            tiles: [
                {
                    title: 'Đếm bằng truy hồi (Phần 1)',
                    desc: 'Mô hình hóa bài toán đếm chuỗi nhị phân không chứa mẫu cấm, dãy Fibonacci và truy hồi cấp 2.',
                    url: null
                },
                {
                    title: 'Đếm bằng truy hồi (Phần 2)',
                    desc: 'Hệ phương trình truy hồi liên kết, lát bảng ô vuông dải $2 \\times n$, $3 \\times n$ và phương pháp đa thức đặc trưng.',
                    url: null
                }
            ]
        },

        {
            id: 6, phase: 2,
            title: 'Phương pháp đếm bằng hai cách (Double Counting)',
            desc: 'Kỹ thuật đếm số cặp liên thuộc $(x, S)$ trên hai tập hợp để chứng minh đẳng thức và bất đẳng thức tổ hợp.',
            tiles: [
                {
                    title: 'Đếm bằng hai cách — Cơ bản',
                    desc: 'Ý tưởng đếm hai chiều, ma trận 0-1 và các hệ thức tổ hợp nhị thức kinh điển.',
                    url: null
                },
                {
                    title: 'Đếm bằng hai cách — Ma trận liên thuộc',
                    desc: 'Khai thác tổng theo hàng và cột, số giao điểm của các tập hợp và bất đẳng thức Cauchy-Schwarz rời rạc.',
                    url: null
                },
                {
                    title: 'Đếm bằng hai cách — Bất đẳng thức tổ hợp nâng cao',
                    desc: 'Đánh giá số cặp phần tử cùng thuộc tính, thiết lập chặn trên/dưới trong các kỳ thi Olympic.',
                    url: null
                }
            ]
        },

        {
            id: 7, phase: 2,
            title: 'Hàm số & Đếm bằng song ánh',
            desc: 'Kỹ thuật chuyển đổi bài toán đếm phức tạp về mô hình quen thuộc thông qua ánh xạ song ánh.',
            tiles: [
                {
                    title: 'Đếm bằng song ánh & Ánh xạ',
                    desc: 'Xây dựng song ánh bảo toàn cấu trúc, số Catalan, đường đi lưới (Lattice paths) và phản xạ André.',
                    url: null
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN III: BẢNG Ô VUÔNG & TRÒ CHƠI
           ============================================================ */
        {
            id: 8, phase: 3,
            title: 'Một số vấn đề về bảng ô vuông',
            desc: 'Kỹ thuật tô màu, lát gạch (Domino, Tromino), vết cắt và đánh giá trên lưới ô vuông.',
            tiles: [
                {
                    title: 'Bài toán lát Domino & Polyomino',
                    desc: 'Điều kiện cần và đủ để phủ kín bảng ô vuông bị khuyết, đa thức màu và tính chẵn lẻ của số cách lát.',
                    url: null
                },
                {
                    title: 'Tô màu & Đánh giá trên lưới',
                    desc: 'Phương pháp tô màu modulo $k$, đếm số quân mã/quân xe không ăn nhau và bài toán vết cắt bàn cờ.',
                    url: null
                }
            ]
        },

        {
            id: 9, phase: 3,
            title: 'Các bài toán trò chơi và chiến thuật',
            desc: 'Lý thuyết trò chơi tổ hợp hữu hạn bước, phân tích vị trí thắng thua và chiến thuật đối xứng.',
            tiles: [
                {
                    title: 'Trò chơi đối kháng & Chiến thuật đối xứng',
                    desc: 'Xác định chiến lược thắng cho người đi trước/đi sau thông qua tính đối xứng tâm, trục và phép bù.',
                    url: null
                },
                {
                    title: 'Phân tích trạng thái P-position & N-position',
                    desc: 'Truy hồi trạng thái dừng, hàm Grundy và định lý Sprague-Grundy trong trò chơi Nim.',
                    url: null
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN IV: LÝ THUYẾT ĐỒ THỊ
           ============================================================ */
        {
            id: 10, phase: 4,
            title: 'Lý thuyết đồ thị căn bản & Đồ thị phẳng',
            desc: 'Các khái niệm nền tảng: Bậc đỉnh, đường đi, chu trình, đồ thị hai phía, cây và đồ thị phẳng.',
            tiles: [
                {
                    title: 'Graph Theory 1 — Bậc đỉnh & Chu trình',
                    desc: 'Bổ đề bắt tay $\\sum d(v) = 2|E|$, đường đi Euler, chu trình Hamilton và đồ thị liên thông.',
                    url: null
                },
                {
                    title: 'Planar Graph — Đồ thị phẳng & Công thức Euler',
                    desc: 'Định lý Euler $V - E + F = 2$, tính chất đồ thị đối ngẫu, định lý Kuratowski ($K_5, K_{3,3}$) và bài toán tô màu bản đồ.',
                    url: null
                }
            ]
        },

        {
            id: 11, phase: 4,
            title: 'Ứng dụng của Turán & Kỹ thuật đánh giá $V, E$',
            desc: 'Đồ thị cực trị, đánh giá số cạnh cực đại không chứa đồ thị con cấm và lý thuyết Ramsey cơ bản.',
            tiles: [
                {
                    title: 'Graph Theory 2 — Đường đi & Đánh giá liên thông',
                    desc: 'Khoảng cách giữa các đỉnh, đường kính, bán kính và bài toán sắp xếp các đỉnh trên đồ thị.',
                    url: null
                },
                {
                    title: 'Graph Theory 3 — Định lý Turán & Lý thuyết Ramsey',
                    desc: 'Định lý Mantel, đồ thị Turán $T(n, r)$, kỹ thuật đánh giá bậc và số cạnh, bài toán quen - không quen $R(3, 3) = 6$.',
                    url: null
                }
            ]
        },

        {
            id: 12, phase: 4,
            title: 'Định lý Hall và kĩ thuật ghép cặp',
            desc: 'Hệ đại diện phân biệt (SDR), ghép cặp cực đại trên đồ thị hai phía và ứng dụng trong phân phối.',
            tiles: [
                {
                    title: 'Định lý Hall (Marriage Theorem)',
                    desc: 'Điều kiện Hall $|N(S)| \\ge |S|$, chứng minh và ứng dụng ghép cặp hoàn hảo trên đồ thị hai phía.',
                    url: null
                },
                {
                    title: 'Ghép cặp cực đại & Định lý König',
                    desc: 'Mối liên hệ giữa số ghép cặp cực đại và số đỉnh phủ cực tiểu, ứng dụng trong ma trận 0-1.',
                    url: null
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN V: PHƯƠNG PHÁP NÂNG CAO & VỀ ĐÍCH
           ============================================================ */
        {
            id: 13, phase: 5,
            title: 'Ứng dụng số phức & Hàm sinh trong tổ hợp',
            desc: 'Sức mạnh của đại số và giải tích trong việc giải quyết các bài toán đếm và phân hoạch nâng cao.',
            tiles: [
                {
                    title: 'Phương pháp hàm sinh (Generating Functions)',
                    desc: 'Hàm sinh đại số hình thức (OGF), phân tích phân số tối giản và giải hệ thức truy hồi.',
                    url: null
                },
                {
                    title: 'Bộ lọc rễ đơn vị (Roots of Unity Filter)',
                    desc: 'Sử dụng nghiệm phức $z^n = 1$ để tính các tổng tổ hợp $\\sum \\binom{n}{km+r}$ theo bước nhảy modulo $m$.',
                    url: null
                }
            ]
        },

        {
            id: 14, phase: 5,
            title: 'Phương pháp xác suất chứng minh tồn tại',
            desc: 'Sử dụng không gian xác suất rời rạc và kỳ vọng để chứng minh sự tồn tại cấu hình tổ hợp tối ưu.',
            tiles: [
                {
                    title: 'Phương pháp xác suất (Probabilistic Method)',
                    desc: 'Nguyên lý xác suất dương $P(A) > 0 \\implies A \\ne \\emptyset$ và các kỹ thuật xây dựng biến ngẫu nhiên.',
                    url: null
                },
                {
                    title: 'Tính cộng tính của kỳ vọng (Linearity of Expectation)',
                    desc: 'Kỳ vọng biến chỉ thị (Indicator variables) giải quyết các bài toán tồn tại đồ thị con và tập con độc lập.',
                    url: null
                }
            ]
        },

        {
            id: 15, phase: 5,
            title: 'Thuật toán: Tham lam, điều chỉnh địa phương & Cực trị',
            desc: 'Tư duy thuật toán trong giải toán tổ hợp: Tìm kiếm lời giải tối ưu và rời rạc hóa cấu hình.',
            tiles: [
                {
                    title: 'Thuật toán tham lam (Greedy Algorithm)',
                    desc: 'Chiến thuật chọn tối ưu cục bộ, bài toán phân chia tập hợp và sắp xếp công việc.',
                    url: null
                },
                {
                    title: 'Điều chỉnh địa phương (Local Search)',
                    desc: 'Biến đổi vi mô cấu hình để cải thiện hàm mục tiêu, kỹ thuật hoán đổi phần tử và tính ổn định.',
                    url: null
                }
            ]
        },

        {
            id: 16, phase: 5,
            title: 'Tổ hợp có tính chất số học',
            desc: 'Giao thoa giữa Số học và Tổ hợp: Định lý Schur, định lý Van der Waerden và cấu hình thặng dư.',
            tiles: [
                {
                    title: 'Tổ hợp số học (Combinatorial Number Theory)',
                    desc: 'Cấp số cộng trong tập hợp số nguyên, định lý Erdős-Ginzburg-Ziv và tổng modulo $p$.',
                    url: null
                }
            ]
        },

        {
            id: 17, phase: 5, icon: 'trophy', label: '★',
            title: 'Luyện tập tổng hợp Olympic VMO',
            desc: 'Tuyển tập đề thi và bài tập rèn luyện toàn diện các kỹ năng tổ hợp chuẩn bị cho kỳ thi HSGQG.',
            tiles: [
                {
                    title: 'Khởi động Tổ hợp VMO',
                    desc: 'Bộ bài tập khởi động tuyển chọn rèn luyện phản xạ tư duy tổ hợp phân dạng.',
                    url: null
                },
                {
                    title: 'Tổng hợp Tổ Hợp TST Tỉnh 2026',
                    desc: 'Tuyển tập và phân loại toàn bộ 44 bài toán Tổ hợp và Rời rạc từ các kỳ thi chọn đội tuyển HSGQG năm học 2026-2027.',
                    url: '/posts/math/vmo/tong-hop-to-hop-tst-tinh-2026.html'
                },
                {
                    title: 'Bài tập Tổ hợp Tết',
                    desc: 'Tuyển tập các chuyên đề lát domino, xác định tập hợp và ước lượng khoảng cách điểm.',
                    url: null
                }
            ]
        }
    ]
};
