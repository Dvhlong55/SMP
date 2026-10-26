/* ==========================================================================
   SMP — DỮ LIỆU LỘ TRÌNH CHUYÊN TOÁN THCS (Đại số · Số học · Hình học · Tổ hợp)
   --------------------------------------------------------------------------
   Phát triển dựa trên toàn bộ 42 tài liệu bồi dưỡng Chuyên Toán THCS:
     - Đại số (A2): P1 -> P6
     - Số học (N2): Exercise 1 -> 7, NT2Ass8, NT2Ass9, NT2Ass10
     - Hình học (G2): 1 -> 16 & Bổ đề trung tuyến
     - Tổ hợp (C2): C2Ass1 -> C2Ass10
   Mỗi file tài liệu tương ứng một bài học độc lập trên lộ trình.
   ========================================================================== */

window.SMP_ROADMAP_CHUYEN_TOAN = {
    id: 'chuyen-toan',
    title: 'Lộ Trình Chuyên Toán THCS',
    kicker: 'THCS · Chuyên Toán',
    subtitle: 'Hệ thống chuyên đề và bài tập chọn lọc bồi dưỡng thi vào lớp 10 Chuyên Toán & Học sinh Giỏi, bao trọn 4 phân môn Đại số, Số học, Hình học và Tổ hợp.',
    listUrl: '/pages/toanhoc.html?filter=thcs',
    phasePrefix: 'Chuyên đề',
    treeRoot: 'SMP · CHUYÊN TOÁN THCS',
    quote: '“Mục đích tối thượng của việc học Toán là rèn luyện khả năng tư duy độc lập và giải quyết vấn đề.”',
    cite: '— George Pólya —',

    phases: [
        { id: 1, name: 'Đại số' },
        { id: 2, name: 'Số học' },
        { id: 3, name: 'Hình học' },
        { id: 4, name: 'Tổ hợp' }
    ],

    stations: [
        /* ============================================================
           CHUYÊN ĐỀ I: ĐẠI SỐ (A2)
           ============================================================ */
        {
            id: 1, phase: 1,
            title: 'Biến đổi đẳng thức',
            tiles: [
                {
                    title: 'Tỉ lệ thức & Dãy tỉ số bằng nhau',
                    desc: 'Tính chất dãy tỉ số bằng nhau, phương pháp đặt ẩn phụ và giải hệ phương trình đối xứng bậc nhất.',
                    url: '/posts/math/thcs/dai-so/ti-le-thuc-va-day-ti-so-bang-nhau.html'
                },
                {
                    title: 'Nhiều hơn về đẳng thức & Phân thức',
                    desc: 'Khai thác hằng đẳng thức đối xứng $a+b+c=0$, phương pháp nội suy Lagrange và biến đổi phân thức nâng cao.',
                    url: '/posts/math/thcs/dai-so/nhieu-hon-ve-dang-thuc.html'
                }
            ]
        },

        {
            id: 2, phase: 1,
            title: 'Căn thức đại số',
            tiles: [
                {
                    title: 'Biến đổi căn thức bậc hai',
                    desc: 'Kỹ thuật biến đổi căn thức lồng nhau, rút gọn biểu thức chứa biến, tìm giá trị nguyên và cực trị.',
                    url: '/posts/math/thcs/dai-so/bien-doi-can-thuc.html'
                },
                {
                    title: 'Luyện tập biến đổi căn thức tổng hợp',
                    desc: 'Tuyển tập các bài toán rút gọn căn thức bậc hai, căn bậc ba phức tạp trong đề thi học sinh giỏi và vào 10 chuyên.',
                    url: '/posts/math/thcs/dai-so/luyen-tap-bien-doi-dai-so.html'
                }
            ]
        },

        {
            id: 3, phase: 1,
            title: 'Phương trình bậc hai & Parabol',
            tiles: [
                {
                    title: 'Định lý Viète & Ứng dụng',
                    desc: 'Hệ thức Viète thuận và đảo, dấu nghiệm, chứng minh phương trình bậc hai luôn có nghiệm thực.',
                    url: '/posts/math/thcs/dai-so/dinh-ly-viete-va-ung-dung.html'
                },
                {
                    title: 'So sánh nghiệm tam thức bậc hai',
                    desc: 'Dấu của $a \\cdot f(\\alpha)$, kỹ thuật so sánh nghiệm với một hằng số và điều kiện phân ly nghiệm.',
                    url: '/posts/math/thcs/dai-so/so-sanh-nghiem-tam-thuc-bac-hai.html'
                },
                {
                    title: 'Parabol & Tương giao đường thẳng',
                    desc: 'Tọa độ đỉnh, trục đối xứng, vị trí tương đối giữa Parabol $(P)$ và đường thẳng $(d)$, hệ thức Viète cho hoành độ giao điểm.',
                    url: '/posts/math/thcs/dai-so/parabol-va-tuong-giao-duong-thang.html'
                }
            ]
        },

        /* ============================================================
           CHUYÊN ĐỀ II: SỐ HỌC (N2)
           ============================================================ */
        {
            id: 4, phase: 2,
            title: 'Phép chia & Tính chia hết',
            tiles: [
                {
                    title: 'Phép chia hai số nguyên & Số dư',
                    desc: 'Định lý phép chia có dư, tìm chữ số tận cùng và số dư của các biểu thức lũy thừa bậc cao.',
                    url: '/posts/math/thcs/so-hoc/phep-chia-va-so-du.html'
                },
                {
                    title: 'Ước chung & Bội chung',
                    desc: 'Thuật toán Euclid, tính chất của $\\gcd(a, b)$ và bài toán tìm $n$ để phân thức tối giản hoặc biểu thức chia hết.',
                    url: '/posts/math/thcs/so-hoc/uoc-chung-va-boi-chung.html'
                },
                {
                    title: 'Đồng dư & Ứng dụng',
                    desc: 'Định nghĩa đồng dư thức $a \\equiv b \\pmod m$, các tính chất cơ bản và kỹ thuật xét modulo chứng minh chia hết.',
                    url: '/posts/math/thcs/so-hoc/dong-du-va-ung-dung.html'
                }
            ]
        },

        {
            id: 5, phase: 2,
            title: 'Các loại số quan trọng',
            tiles: [
                {
                    title: 'Số nguyên tố & Hợp số',
                    desc: 'Định lý cơ bản của số học, đánh giá tính nguyên tố qua chẵn lẻ, modulo 3, modulo 6 và bài toán tìm $p$.',
                    url: '/posts/math/thcs/so-hoc/so-nguyen-to-va-hop-so.html'
                },
                {
                    title: 'Số chính phương & Ứng dụng',
                    desc: 'Tính chất số chính phương, số dư khi chia cho 3, 4, 8, phương pháp kẹp giữa hai số chính phương liên tiếp.',
                    url: '/posts/math/thcs/so-hoc/so-chinh-phuong.html'
                },
                {
                    title: 'Số hữu tỷ & Số vô tỷ',
                    desc: 'Phương pháp chứng minh số vô tỷ (phản chứng), tính chất đóng của tập hữu tỷ và tính vô tỷ của căn bậc hai.',
                    url: '/posts/math/thcs/so-hoc/so-huu-ty-va-so-vo-ty.html'
                }
            ]
        },

        {
            id: 6, phase: 2,
            title: 'Phương trình nghiệm nguyên',
            tiles: [
                {
                    title: 'PT nghiệm nguyên (Đưa về tích)',
                    desc: 'Kỹ thuật phân tích đa thức thành nhân tử, dùng ước số của hằng số và tách phần nguyên để chặn nghiệm.',
                    url: '/posts/math/thcs/so-hoc/phuong-trinh-nghiem-nguyen-co-ban.html'
                },
                {
                    title: 'PT nghiệm nguyên (Phương pháp kẹp)',
                    desc: 'Kỹ thuật kẹp giữa hai số chính phương liên tiếp hoặc hai lũy thừa liên tiếp để chặn miền giá trị của biến.',
                    url: '/posts/math/thcs/so-hoc/phuong-trinh-nghiem-nguyen-phuong-phap-kep.html'
                },
                {
                    title: 'PT nghiệm nguyên (Đánh giá & Biệt thức)',
                    desc: 'Đưa về phương trình bậc hai theo một ẩn để $\\Delta$ là số chính phương, phương pháp lùi vô hạn Fermat.',
                    url: '/posts/math/thcs/so-hoc/phuong-trinh-nghiem-nguyen-nang-cao.html'
                },
                {
                    title: 'Bài toán chứa ẩn ở số mũ',
                    desc: 'Kỹ thuật xét tính chẵn lẻ của số mũ, phân tích nhân tử dạng $a^n - b^n$ và đồng dư khống chế trong phương trình mũ.',
                    url: '/posts/math/thcs/so-hoc/bai-toan-chua-an-o-mu.html'
                }
            ]
        },

        /* ============================================================
           CHUYÊN ĐỀ III: HÌNH HỌC (G2)
           ============================================================ */
        {
            id: 7, phase: 3,
            title: 'Định lý Thales & Tỉ số',
            tiles: [
                {
                    title: 'Định lý Thales (Phần 1)',
                    desc: 'Ứng dụng định lý Thales trong việc thiết lập hệ thức tỉ lệ, tính độ dài đoạn thẳng và bài toán phân giác.',
                    url: '/posts/math/thcs/hinh-hoc/dinh-ly-thales-phan-1.html'
                },
                {
                    title: 'Định lý Thales (Phần 2)',
                    desc: 'Kỹ thuật kẻ đường phụ song song, chứng minh song song và các bài toán tỉ số nâng cao thi vào 10 chuyên.',
                    url: '/posts/math/thcs/hinh-hoc/dinh-ly-thales-phan-2.html'
                }
            ]
        },

        {
            id: 8, phase: 3,
            title: 'Tam giác đồng dạng',
            tiles: [
                {
                    title: 'Tam giác đồng dạng (Phần 1)',
                    desc: 'Nhận diện tam giác đồng dạng qua góc chung và góc đối đỉnh, thiết lập các đẳng thức tích $AB \\cdot AC = AD \\cdot AE$.',
                    url: '/posts/math/thcs/hinh-hoc/tam-giac-dong-dang-phan-1.html'
                },
                {
                    title: 'Tam giác đồng dạng (Phần 2)',
                    desc: 'Mô hình tam giác có hai đường cao, trực tâm tam giác và kỹ thuật chứng minh các cặp tam giác đồng dạng gián tiếp.',
                    url: '/posts/math/thcs/hinh-hoc/tam-giac-dong-dang-phan-2.html'
                }
            ]
        },

        {
            id: 9, phase: 3,
            title: 'Tứ giác nội tiếp & Phương tích',
            tiles: [
                {
                    title: 'Tứ giác nội tiếp',
                    desc: 'Bốn dấu hiệu nhận biết tứ giác nội tiếp, kỹ thuật cộng góc và chứng minh các điểm cùng thuộc một đường tròn.',
                    url: '/posts/math/thcs/hinh-hoc/tu-giac-noi-tiep.html'
                },
                {
                    title: 'Luyện tập tứ giác nội tiếp',
                    desc: 'Tuyển tập các bài toán tứ giác nội tiếp nhiều tầng, mô hình trực tâm và tâm ngoại tiếp thường gặp trong đề thi.',
                    url: '/posts/math/thcs/hinh-hoc/luyen-tap-tu-giac-noi-tiep.html'
                },
                {
                    title: 'Phương tích dưới góc nhìn THCS',
                    desc: 'Hệ thức cát tuyến - tiếp tuyến $MA \\cdot MB = MC \\cdot MD = MT^2$ và ứng dụng chứng minh thẳng hàng, đồng quy.',
                    url: '/posts/math/thcs/hinh-hoc/phuong-tich-thcs.html'
                }
            ]
        },

        {
            id: 10, phase: 3,
            title: 'Mô hình tiếp tuyến & Đường tròn',
            tiles: [
                {
                    title: 'Hai tiếp tuyến cắt nhau',
                    desc: 'Mô hình hai tiếp tuyến cắt nhau, tính đối xứng, góc tạo bởi tiếp tuyến và dây cung, đường kính trực giao.',
                    url: '/posts/math/thcs/hinh-hoc/hai-tiep-tuyen-cat-nhau.html'
                },
                {
                    title: 'Mô hình tâm nội tiếp',
                    desc: 'Tính chất đường phân giác, tâm đường tròn nội tiếp tam giác, bổ đề góc $\\widehat{BIC} = 90^\\circ + \\frac{\\widehat{A}}{2}$.',
                    url: '/posts/math/thcs/hinh-hoc/mo-hinh-tam-noi-tiep.html'
                }
            ]
        },

        {
            id: 11, phase: 3,
            title: 'Các bổ đề hình học',
            tiles: [
                {
                    title: 'Bổ đề hình thang',
                    desc: 'Giao điểm hai cạnh bên, giao điểm hai đường chéo và trung điểm hai đáy của hình thang luôn thẳng hàng.',
                    url: '/posts/math/thcs/hinh-hoc/bo-de-hinh-thang.html'
                },
                {
                    title: 'Bổ đề trung tuyến',
                    desc: 'Tính chất đường trung tuyến trong tam giác, mô hình chùm đường thẳng đồng quy và ứng dụng chia đôi đoạn thẳng.',
                    url: '/posts/math/thcs/hinh-hoc/bo-de-trung-tuyen.html'
                }
            ]
        },

        {
            id: 12, phase: 3,
            title: 'Đường thẳng Simson & Steiner',
            tiles: [
                {
                    title: 'Đường thẳng Simson & Steiner (Phần 1)',
                    desc: 'Định nghĩa và chứng minh đường thẳng Simson: hình chiếu của một điểm trên đường tròn ngoại tiếp lên ba cạnh.',
                    url: '/posts/math/thcs/hinh-hoc/duong-thang-simson-va-steiner-phan-1.html'
                },
                {
                    title: 'Đường thẳng Simson & Steiner (Phần 2)',
                    desc: 'Đường thẳng Steiner đi qua trực tâm, góc giữa hai đường thẳng Simson và các bài toán cực trị quỹ tích.',
                    url: '/posts/math/thcs/hinh-hoc/duong-thang-simson-va-steiner-phan-2.html'
                }
            ]
        },

        {
            id: 13, phase: 3,
            title: 'Biến đổi tỉ số & Ôn tập hình học',
            tiles: [
                {
                    title: 'Kĩ thuật biến đổi tỉ số (Phần 1)',
                    desc: 'Ứng dụng định lý Sin và tỉ số diện tích tam giác để thiết lập các đẳng thức tỉ số độ dài phức tạp.',
                    url: '/posts/math/thcs/hinh-hoc/ki-thuat-bien-doi-ti-so-phan-1.html'
                },
                {
                    title: 'Kĩ thuật biến đổi tỉ số (Phần 2)',
                    desc: 'Định lý Menelaus và Ceva trong hình học phẳng THCS, kỹ thuật chứng minh ba điểm thẳng hàng và ba đường đồng quy.',
                    url: '/posts/math/thcs/hinh-hoc/ki-thuat-bien-doi-ti-so-phan-2.html'
                },
                {
                    title: 'Ôn tập hình học tổng hợp',
                    desc: 'Tuyển tập các bài toán hình học tổng hợp nhiều câu chọn lọc từ đề thi vào 10 chuyên KHTN, Sư Phạm và các tỉnh thành.',
                    url: '/posts/math/thcs/hinh-hoc/on-tap-hinh-hoc-tong-hop.html'
                }
            ]
        },

        /* ============================================================
           CHUYÊN ĐỀ IV: TỔ HỢP & SUY LUẬN (C2)
           ============================================================ */
        {
            id: 14, phase: 4,
            title: 'Suy luận logic & Dirichlet',
            tiles: [
                {
                    title: 'Mở đầu về suy luận logic',
                    desc: 'Lập luận logic chặt chẽ, mệnh đề kéo theo, xây dựng phản ví dụ và phương pháp chứng minh phản chứng.',
                    url: '/posts/math/thcs/to-hop/mo-dau-ve-suy-luan.html'
                },
                {
                    title: 'Nguyên lý Dirichlet (Phần 1)',
                    desc: 'Nguyên lý lồng và thỏ dạng cơ bản, ứng dụng trong các bài toán chia hết và tập hợp số nguyên.',
                    url: '/posts/math/thcs/to-hop/nguyen-ly-dirichlet-phan-1.html'
                },
                {
                    title: 'Nguyên lý Dirichlet (Phần 2)',
                    desc: 'Nguyên lý Dirichlet mở rộng, kỹ thuật phân hoạch hình học và các bài toán tô màu đoạn thẳng, tam giác.',
                    url: '/posts/math/thcs/to-hop/nguyen-ly-dirichlet-phan-2.html'
                },
                {
                    title: 'Nguyên lý Cực hạn',
                    desc: 'Phương pháp xét phần tử có kích thước cực đại / cực tiểu để tìm mâu thuẫn hoặc nghiệm tối ưu trong tổ hợp.',
                    url: '/posts/math/thcs/to-hop/nguyen-ly-cuc-han.html'
                }
            ]
        },

        {
            id: 15, phase: 4,
            title: 'Bất biến, Trò chơi & Bảng ô vuông',
            tiles: [
                {
                    title: 'Giải toán bằng đại lượng bất biến',
                    desc: 'Xác định đại lượng không đổi (tổng, tích, tính chẵn lẻ, số dư) để chứng minh tính không thể đạt được của trạng thái đích.',
                    url: '/posts/math/thcs/to-hop/dai-luong-bat-bien.html'
                },
                {
                    title: 'Bài toán trò chơi',
                    desc: 'Trò chơi hai người bốc sỏi, di chuyển quân cờ, khái niệm vị trí thắng/thua và chiến thuật đối xứng.',
                    url: '/posts/math/thcs/to-hop/bai-toan-tro-choi.html'
                },
                {
                    title: 'Bài toán bảng ô vuông',
                    desc: 'Tô màu lưới ô vuông, bài toán phủ bảng bằng quân domino/tetromino và đường đi của robot.',
                    url: '/posts/math/thcs/to-hop/bang-o-vuong.html'
                }
            ]
        },

        {
            id: 16, phase: 4,
            title: 'Đại số tổ hợp & Xác suất',
            tiles: [
                {
                    title: 'Bài toán đếm cơ bản',
                    desc: 'Quy tắc cộng, quy tắc nhân, phương pháp liệt kê có hệ thống, hoán vị và tổ hợp không lặp sơ cấp.',
                    url: '/posts/math/thcs/to-hop/bai-toan-dem-co-ban.html'
                },
                {
                    title: 'Nhiều hơn về đếm & Xác suất',
                    desc: 'Phương pháp đếm bằng hai cách, nguyên lý bù trừ và tính xác suất biến cố trong các mô hình ngẫu nhiên.',
                    url: '/posts/math/thcs/to-hop/nhieu-hon-ve-dem-va-xac-suat.html'
                }
            ]
        },

        {
            id: 17, phase: 4,
            title: 'Hình học tổ hợp',
            tiles: [
                {
                    title: 'Hình học tổ hợp',
                    desc: 'Số giao điểm nhiều nhất của các đường thẳng, tam giác tạo bởi các điểm và định lý Sylvester sơ cấp.',
                    url: '/posts/math/thcs/to-hop/hinh-hoc-to-hop.html'
                }
            ]
        }
    ]
};
