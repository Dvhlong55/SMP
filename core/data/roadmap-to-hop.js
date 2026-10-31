/* ==========================================================================
   SMP — DỮ LIỆU LỘ TRÌNH TỔ HỢP (VMO → Tổ Hợp)
   --------------------------------------------------------------------------
   Phát triển dựa trên khung chuyên đề bồi dưỡng Tổ Hợp Olympic VMO
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
    treeRoot: 'VMO · TỔ HỢP OLYMPIC',
    quote: '“Nghệ thuật của Toán học tổ hợp là tìm ra vẻ đẹp và trật tự ẩn sâu bên dưới những cấu hình rời rạc tưởng chừng hỗn loạn.”',
    cite: '— Paul Erdős —',

    phases: [
        { id: 1, name: 'Mở đầu về tư duy' },
        { id: 2, name: 'Bài toán đếm' },
        { id: 3, name: 'Bảng ô vuông & Trò chơi' },
        { id: 4, name: 'Lý thuyết đồ thị' },
        { id: 5, name: 'Phương pháp nâng cao' }
    ],

    stations: [
        /* ============================================================
           GIAI ĐOẠN I: MỞ ĐẦU VỀ TƯ DUY
           ============================================================ */
        {
            id: 1, phase: 1,
            title: 'Chuyên đề IV · Tổ hợp (Chuyên Toán)',
            tiles: [
                {
                    title: 'Nền tảng Tổ hợp Chuyên Toán THCS',
                    desc: 'Toàn bộ chuyên đề Tổ hợp Chuyên Toán THCS: Suy luận logic, nguyên lý Dirichlet, cực hạn, bất biến, bài toán đếm và trò chơi.',
                    url: '/pages/roadmap-chuyen-toan.html#rm-station-14',
                    btnText: 'Xem lộ trình ↗'
                }
            ]
        },

        {
            id: 2, phase: 1,
            title: 'Nguyên lý Dirichlet',
            tiles: [
                {
                    title: 'Nguyên lý Dirichlet',
                    desc: 'Nguyên lý lồng chim bồ câu, dạng mở rộng cho tập vô hạn, chia khoảng và ứng dụng trong số học, hình học.',
                    url: '/posts/math/vmo/nguyen-ly-dirichlet.html'
                }
            ]
        },

        {
            id: 3, phase: 1,
            title: 'Nguyên lý Cực hạn',
            tiles: [
                {
                    title: 'Nguyên lý Cực hạn',
                    desc: 'Kỹ thuật xét phần tử biên (nhỏ nhất, lớn nhất), bài toán cấu hình điểm Sylvester-Gallai và điểm biên.',
                    url: '/posts/math/vmo/nguyen-ly-cuc-han-vmo.html'
                }
            ]
        },

        {
            id: 4, phase: 1,
            title: 'Đại lượng Bất biến & Đơn biến',
            tiles: [
                {
                    title: 'Đại lượng Bất biến và Ứng dụng',
                    desc: 'Bất biến chẵn lẻ, bất biến modulo, tính đối xứng và các bài toán biến đổi bộ số.',
                    url: '/posts/math/vmo/dai-luong-bat-bien-va-ung-dung.html'
                },
                {
                    title: 'Đơn biến và Các vấn đề liên quan',
                    desc: 'Xây dựng hàm thế năng, quá trình dừng và tính hữu hạn của thuật toán biến đổi.',
                    url: '/posts/math/vmo/don-bien-va-cac-van-de-lien-quan.html'
                }
            ]
        },

        {
            id: 5, phase: 1,
            title: 'Tổng hợp các nguyên lý quan trọng',
            tiles: [
                {
                    title: 'Các nguyên lý quan trọng',
                    desc: 'Tổng hợp các bài toán vận dụng kết hợp nguyên lý Dirichlet, cực hạn, bất biến và lý thuyết tô màu.',
                    url: '/posts/math/vmo/cac-nguyen-ly-quan-trong.html'
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN II: BÀI TOÁN ĐẾM
           ============================================================ */
        {
            id: 6, phase: 2,
            title: 'Phương pháp đếm cơ bản',
            tiles: [
                {
                    title: 'Phương pháp đếm cơ bản',
                    desc: 'Quy tắc cộng, quy tắc nhân, hoán vị, chỉnh hợp, tổ hợp và kỹ thuật phân chia tập hợp.',
                    url: '/posts/math/vmo/phuong-phap-dem-co-ban.html'
                }
            ]
        },

        {
            id: 7, phase: 2,
            title: 'Nguyên lý bù trừ (PIE)',
            tiles: [
                {
                    title: 'Nguyên lý bù trừ',
                    desc: 'Công thức bao hàm - loại trừ tổng quát cho n tập hợp, bài toán mất thứ tự và bài toán số các toàn ánh.',
                    url: '/posts/math/vmo/nguyen-ly-bu-tru.html'
                }
            ]
        },

        {
            id: 8, phase: 2,
            title: 'Bài toán chia kẹo Euler & Phân hoạch',
            tiles: [
                {
                    title: 'Chia kẹo Euler (Phần 1)',
                    desc: 'Phương pháp vách ngăn cơ bản, số nghiệm nguyên thỏa mãn cận dưới và bài toán chọn phần tử không kề nhau.',
                    url: '/posts/math/vmo/chia-keo-euler-phan-1.html'
                },
                {
                    title: 'Chia kẹo Euler (Phần 2)',
                    desc: 'Kết hợp chia kẹo với nguyên lý bù trừ xử lý điều kiện chặn trên và bài toán đường đi trên lưới nguyên.',
                    url: '/posts/math/vmo/chia-keo-euler-phan-2.html'
                }
            ]
        },

        {
            id: 9, phase: 2,
            title: 'Hệ thức truy hồi & Đếm bằng truy hồi',
            tiles: [
                {
                    title: 'Đếm bằng truy hồi (Phần 1)',
                    desc: 'Mô hình hóa bài toán đếm chuỗi nhị phân không chứa mẫu cấm, dãy Fibonacci và truy hồi tuyến tính cấp 2.',
                    url: '/posts/math/vmo/dem-bang-truy-hoi-phan-1.html'
                },
                {
                    title: 'Đếm bằng truy hồi (Phần 2)',
                    desc: 'Hệ phương trình truy hồi liên kết, lát bảng ô vuông dải 2 x n, 3 x n và bài toán tháp Hà Nội.',
                    url: '/posts/math/vmo/dem-bang-truy-hoi-phan-2.html'
                }
            ]
        },

        {
            id: 10, phase: 2,
            title: 'Phương pháp đếm bằng hai cách',
            tiles: [
                {
                    title: 'Đếm bằng hai cách (Phần 1)',
                    desc: 'Ý tưởng đếm hai chiều, ma trận liên thuộc 0-1 và các hệ thức tổ hợp nhị thức kinh điển.',
                    url: '/posts/math/vmo/dem-bang-hai-cach-phan-1.html'
                },
                {
                    title: 'Đếm bằng hai cách (Phần 2)',
                    desc: 'Khai thác tổng theo hàng và cột, số giao điểm của các tập hợp và bất đẳng thức Cauchy-Schwarz rời rạc.',
                    url: '/posts/math/vmo/dem-bang-hai-cach-phan-2.html'
                },
                {
                    title: 'Đếm bằng hai cách (Phần 3)',
                    desc: 'Đánh giá số cặp phần tử cùng thuộc tính, thiết lập chặn trên/dưới trong các kỳ thi Olympic.',
                    url: '/posts/math/vmo/dem-bang-hai-cach-phan-3.html'
                }
            ]
        },

        {
            id: 11, phase: 2,
            title: 'Hàm số & Đếm bằng song ánh',
            tiles: [
                {
                    title: 'Đếm bằng ánh xạ',
                    desc: 'Xây dựng song ánh bảo toàn cấu trúc, số Catalan, đường đi lưới (Lattice paths) và phản xạ André.',
                    url: '/posts/math/vmo/dem-bang-anh-xa.html'
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN III: BẢNG Ô VUÔNG & TRÒ CHƠI
           ============================================================ */
        {
            id: 12, phase: 3,
            title: 'Một số vấn đề về bảng ô vuông',
            tiles: [
                {
                    title: 'Bài toán lát Domino',
                    desc: 'Điều kiện cần và đủ để phủ kín bảng ô vuông bị khuyết, đa thức màu, hệ thức truy hồi và tính chẵn lẻ của số cách lát.',
                    url: '/posts/math/vmo/bai-toan-lat-domino.html'
                }
            ]
        },

        {
            id: 13, phase: 3,
            title: 'Các bài toán trò chơi và chiến thuật',
            tiles: [
                {
                    title: 'Trò chơi đối kháng & Chiến thuật đối xứng',
                    desc: 'Xác định chiến lược thắng cho người đi trước/đi sau thông qua tính đối xứng tâm, trục và phép bù trạng thái P/N.',
                    url: null
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN IV: LÝ THUYẾT ĐỒ THỊ
           ============================================================ */
        {
            id: 14, phase: 4,
            title: 'Lý thuyết đồ thị căn bản',
            tiles: [
                {
                    title: 'Graph Theory 1 — Kiến thức nền tảng đồ thị',
                    desc: 'Bổ đề bắt tay, chu trình sơ cấp, đồ thị hai phía, cấu trúc cây và định lý Mantel.',
                    url: '/posts/math/vmo/graph-theory-1.html'
                }
            ]
        },

        {
            id: 15, phase: 4,
            title: 'Ứng dụng của Turán & Kỹ thuật đánh giá $V, E$',
            tiles: [
                {
                    title: 'Graph Theory 2 — Đường đi & Đánh giá liên thông',
                    desc: 'Khoảng cách giữa các đỉnh, đường kính, bán kính và bài toán đánh giá liên thông mạng lưới.',
                    url: '/posts/math/vmo/graph-theory-2.html'
                },
                {
                    title: 'Graph Theory 3 — Định lý Turán & Lý thuyết Ramsey',
                    desc: 'Định lý Turán tổng quát, đồ thị Turán T(n, r), số Ramsey R(3, 3) = 6 và chu trình Hamilton.',
                    url: '/posts/math/vmo/graph-theory-3.html'
                }
            ]
        },

        {
            id: 16, phase: 4,
            title: 'Định lý Hall và kĩ thuật ghép cặp',
            tiles: [
                {
                    title: 'Định lý Hall & Ghép cặp cực đại',
                    desc: 'Điều kiện Hall |N(S)| >= |S|, chứng minh và ứng dụng ghép cặp hoàn hảo trên đồ thị hai phía.',
                    url: null
                }
            ]
        },

        {
            id: 17, phase: 4,
            title: 'Đồ thị phẳng & Công thức Euler',
            tiles: [
                {
                    title: 'Planar Graph — Đồ thị phẳng & Công thức Euler',
                    desc: 'Định lý Euler V - E + F = 2, tính chất đồ thị đối ngẫu, định lý Kuratowski (K_5, K_{3,3}) và định lý 5 màu.',
                    url: '/posts/math/vmo/planar-graph-do-thi-phang.html'
                }
            ]
        },

        /* ============================================================
           GIAI ĐOẠN V: PHƯƠNG PHÁP NÂNG CAO
           ============================================================ */
        {
            id: 18, phase: 5,
            title: 'Ứng dụng số phức & Hàm sinh trong tổ hợp',
            tiles: [
                {
                    title: 'Phương pháp hàm sinh & Đa thức tổ hợp',
                    desc: 'Hàm sinh đại số hình thức (OGF), bộ lọc rễ đơn vị (Roots of unity filter) và giải hệ thức truy hồi.',
                    url: null
                }
            ]
        },

        {
            id: 19, phase: 5,
            title: 'Phương pháp xác suất chứng minh tồn tại',
            tiles: [
                {
                    title: 'Phương pháp xác suất trong tổ hợp',
                    desc: 'Nguyên lý xác suất dương, tính cộng tính của kỳ vọng (Linearity of expectation) và biến chỉ thị.',
                    url: null
                }
            ]
        },

        {
            id: 20, phase: 5,
            title: 'Thuật toán: Tham lam, điều chỉnh địa phương & Cực trị',
            tiles: [
                {
                    title: 'Thuật toán tham lam & Điều chỉnh địa phương',
                    desc: 'Chiến thuật chọn tối ưu cục bộ, biến đổi vi mô cấu hình để cải thiện hàm mục tiêu.',
                    url: null
                }
            ]
        },

        {
            id: 21, phase: 5,
            title: 'Tổ hợp có tính chất số học',
            tiles: [
                {
                    title: 'Tổ hợp có tính chất số học',
                    desc: 'Tương tác giữa số học và tổ hợp, tổng thặng dư modulo p, cấp số cộng lũy thừa và định lý EGZ.',
                    url: '/posts/math/vmo/to-hop-co-tinh-chat-so-hoc.html'
                }
            ]
        },

        {
            id: 22, phase: 5, icon: 'trophy', label: '★',
            title: 'Luyện tập tổng hợp Olympic VMO',
            tiles: [
                {
                    title: 'Khởi động Tổ hợp VMO',
                    desc: 'Bộ bài tập khởi động tuyển chọn rèn luyện phản xạ tư duy tổ hợp phân dạng.',
                    url: '/posts/math/vmo/khoi-dong-vmo-to-hop.html'
                },
                {
                    title: 'Tổng hợp Tổ Hợp TST Tỉnh 2026',
                    desc: 'Tuyển tập và phân loại toàn bộ 44 bài toán Tổ hợp và Rời rạc từ các kỳ thi chọn đội tuyển HSGQG năm học 2026-2027.',
                    url: '/posts/math/vmo/tong-hop-to-hop-tst-tinh-2026.html'
                },
                {
                    title: 'Tuyển tập Tổ hợp: Xác định tập hợp & Ước lượng khoảng cách',
                    desc: 'Tuyển tập các chuyên đề xác định tập hợp thỏa mãn tính đóng đại số và bài toán hình học tổ hợp ước lượng khoảng cách điểm.',
                    url: '/posts/math/vmo/bai-tap-to-hop-tet.html'
                }
            ]
        }
    ]
};
