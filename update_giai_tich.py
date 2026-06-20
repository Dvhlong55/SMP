import re

with open(r'e:\User_Data\Desktop\wED\SMP\posts\math\KhoaGiaiTich.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update meta tags and titles
content = content.replace('<title>Khóa Số Học Olympic Cơ Bản</title>', '<title>Khóa Giải Tích HSGQG</title>')
content = content.replace('<meta name="post-id" content="KhoaSoHocOlympic">', '<meta name="post-id" content="KhoaGiaiTichHSGQG">')
content = content.replace('SMP – Số học Olympic', 'SMP – Giải tích Olympic')

# Update description
desc_old = 'Khóa học Số học chuyên sâu được thiết kế dành cho học sinh định hướng thi học sinh giỏi và Olympic Toán, tập trung vào các kỹ thuật quan trọng và tư duy giải toán thường xuất hiện trong các kỳ thi cấp tỉnh và quốc gia.'
desc_new = 'Khóa học Giải tích chuyên sâu được thiết kế dành cho học sinh định hướng thi HSGQG và Olympic Toán. Bản đề cương này mang tính ứng dụng cao, mở rộng giải tích sang các phân môn đại số, phương trình hàm và bất đẳng thức thể hiện tư duy nhìn nhận toán học rất toàn diện.'
content = content.replace(desc_old, desc_new)

# Update instructor
instructor_old = '''<div class="instructor-container">
                <div class="instructor-card">
                    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--smp-border-block); padding-bottom: 6px;">
                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700;">Dạy lý thuyết -- <code>Đỗ Viết Hoàng Long</code></h4>
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
                        <li style="display: flex; gap: 8px;"><span>🌐</span> Admin page Toán SMP.</li>
                        <li style="display: flex; gap: 8px;"><span>🥈</span> Giải Nhì kì thi chọn HSG Quốc Gia môn Toán.</li>
                        <li style="display: flex; gap: 8px;"><span>🏆</span> Đạt hạng thứ 2 trong <a href="https://www.facebook.com/share/p/1E1xUKmagf/" target="_blank"><i>Bài giảng và bài viết về Toán học, mang tên Hoàng Tụy</i></a>.</li>
                        <li style="display: flex; gap: 8px;"><span>✨</span> Đạt thành tích xuất sắc trong phong trào giải toán tạp chí Pi.</li>
                        <li style="display: flex; gap: 8px;"><span>🥇</span> Đạt giải Nhất môn Toán cấp tỉnh.</li>
                        <li style="display: flex; gap: 8px;"><span>🥇</span> Đạt 2 huy chương vàng Olympic 30-4.</li>
                        <li style="display: flex; gap: 8px;"><span>👨‍⚖️</span> Giám khảo kì thi <a href="https://www.facebook.com/share/p/1AySrKXPaU/" target="_blank"><i>hình học IGO</i></a>.</li>
                    </ul>
                </div>

                <div class="instructor-card">
                    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--smp-border-block); padding-bottom: 6px;">
                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700;">Luyện bài tập -- <code>Nguyễn Khắc Duy</code></h4>
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
                        <li style="display: flex; gap: 8px;"><span>🥈</span> Đạt giải Nhì HSG Quốc gia môn Toán.</li>
                        <li style="display: flex; gap: 8px;"><span>🏅</span> Đạt giải khuyến khích HSG Quốc Gia từ năm lớp 11.</li>
                        <li style="display: flex; gap: 8px;"><span>🥈</span> Đạt huy chương bạc kì thi Olympic chuyên Khoa học Tự Nhiên.</li>
                    </ul>
                </div>
            </div>'''
instructor_new = '''<div class="instructor-container">
                <div class="instructor-card">
                    <div style="margin-bottom: 12px; border-bottom: 1px solid var(--smp-border-block); padding-bottom: 6px;">
                        <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700;">Giảng viên -- <code>Đỗ Viết Hoàng Long</code></h4>
                    </div>
                    <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
                        <li style="display: flex; gap: 8px;"><span>🌐</span> Admin page Toán SMP.</li>
                        <li style="display: flex; gap: 8px;"><span>🥈</span> Giải Nhì kì thi chọn HSG Quốc Gia môn Toán.</li>
                        <li style="display: flex; gap: 8px;"><span>🏆</span> Đạt hạng thứ 2 trong <a href="https://www.facebook.com/share/p/1E1xUKmagf/" target="_blank"><i>Bài giảng và bài viết về Toán học, mang tên Hoàng Tụy</i></a>.</li>
                        <li style="display: flex; gap: 8px;"><span>✨</span> Đạt thành tích xuất sắc trong phong trào giải toán tạp chí Pi.</li>
                        <li style="display: flex; gap: 8px;"><span>🥇</span> Đạt giải Nhất môn Toán cấp tỉnh.</li>
                        <li style="display: flex; gap: 8px;"><span>🥇</span> Đạt 2 huy chương vàng Olympic 30-4.</li>
                        <li style="display: flex; gap: 8px;"><span>👨‍⚖️</span> Giám khảo kì thi <a href="https://www.facebook.com/share/p/1AySrKXPaU/" target="_blank"><i>hình học IGO</i></a>.</li>
                    </ul>
                </div>
            </div>'''
content = content.replace(instructor_old, instructor_new)

# Update topics text before the list
intro_old = 'Học viên được cung cấp bộ tài liệu nền tảng gồm 5 chuyên đề số học cơ bản, bao gồm: Phép chia hai số nguyên, Ước chung và bội chung, Số nguyên tố, Số chính phương, và Phương trình tuyến tính bậc nhất. Khung chương trình chi tiết:'
intro_new = 'Học viên được cung cấp hệ thống bài giảng và chuyên đề giải tích toàn diện từ cơ bản đến nâng cao. Khung chương trình chi tiết:'
content = content.replace(intro_old, intro_new)

topics_regex = re.compile(r'<ol class="topic-list">.*?</ol>', re.DOTALL)
topics_new = r'''
            <h3 style="margin-top: 30px;">PHẦN I: KIẾN THỨC NỀN TẢNG</h3>
            <ol class="topic-list">
                <li>
                    <span>Dãy số và cấp số</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Định nghĩa dãy số</li>
                        <li>Cách cho dãy số</li>
                        <li>Dãy số tăng, giảm và dãy số bị chặn</li>
                        <li>Cấp số cộng: Định nghĩa và tính chất</li>
                        <li>Cấp số nhân: Định nghĩa và tính chất</li>
                        <li>Ứng dụng cấp số cộng, cấp số nhân để tìm công thức tổng quát của dãy số</li>
                    </ol>
                </li>
                <li>
                    <span>Giới hạn cơ bản và tính liên tục</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Giới hạn dãy số: Định nghĩa bằng ngôn ngữ $\varepsilon - N$ và các định lý về phép toán</li>
                        <li>Giới hạn vô cực và các quy tắc tính</li>
                        <li>Giới hạn hàm số: Định nghĩa bằng ngôn ngữ $\varepsilon - \delta$ và các dạng vô định cơ bản</li>
                        <li>Tính liên tục: Hàm số liên tục tại điểm, trên khoảng và Định lý giá trị trung gian</li>
                    </ol>
                </li>
            </ol>

            <h3 style="margin-top: 30px;">PHẦN II: KỸ THUẬT NÂNG CAO</h3>
            <ol class="topic-list">
                <li>
                    <span>Xác định số hạng tổng quát của dãy số</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Phương pháp sai phân tuyến tính: Bậc 1, bậc 2, bậc cao và hệ phương trình sai phân</li>
                        <li>Dãy số phi tuyến: Dãy Homographic $x_{n+1} = \frac{ax_n+b}{cx_n+d}$</li>
                        <li>Kỹ thuật lượng giác hóa</li>
                        <li>Kỹ thuật sử dụng hàm sinh (Generating Functions)</li>
                    </ol>
                </li>
                <li>
                    <span>Các phương pháp và định lí tính giới hạn</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Tiêu chuẩn Weierstrass: Kỹ thuật chứng minh tính đơn điệu và tính bị chặn</li>
                        <li>Nguyên lý kẹp và ước lượng: Đánh giá qua bất đẳng thức đại số và vận dụng hàm số siêu việt</li>
                        <li>Các bổ đề giới hạn quan trọng</li>
                        <li>Định lý Trung bình Stolz - Cesaro: Khử dạng vô định và giới hạn dạng tổng</li>
                        <li>Tiêu chuẩn Cauchy cho dãy số</li>
                    </ol>
                </li>
                <li>
                    <span>Dãy số xác định bởi hệ thức truy hồi $x_{n+1} = f(x_n)$</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Hàm $f(x)$ đơn điệu tăng: Tính chất nghiệm và sự hội tụ</li>
                        <li>Hàm $f(x)$ đơn điệu giảm: Phân tích dãy con $x_{2n}$ và $x_{2n+1}$</li>
                        <li>Định lý điểm bất động</li>
                        <li>Đánh giá sự hội tụ qua đạo hàm: Kỹ thuật ánh xạ co $|f'(x)| < 1$</li>
                    </ol>
                </li>
                <li>
                    <span>Phương trình sinh bởi dãy số</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Sự tồn tại và duy nhất nghiệm qua khảo sát hàm số</li>
                        <li>Kỹ thuật tìm giới hạn của dãy nghiệm $\lim x_n$</li>
                        <li>Đánh giá sai số và tiệm cận: Phân tích giới hạn dạng $n^\alpha(x_n - a)$</li>
                    </ol>
                </li>
            </ol>

            <h3 style="margin-top: 30px;">PHẦN III: ỨNG DỤNG CỦA GIẢI TÍCH</h3>
            <ol class="topic-list">
                <li>
                    <span>Ứng dụng trong Đa thức</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Chứng minh sự tồn tại nghiệm của đa thức trên một khoảng</li>
                        <li>Vận dụng định lý Rolle và Lagrange để đánh giá, thu hẹp miền nghiệm</li>
                        <li>Đạo hàm và các kỹ thuật ước lượng bậc của đa thức</li>
                        <li>Khảo sát sự biến thiên để đếm số nghiệm thực của đa thức</li>
                    </ol>
                </li>
                <li>
                    <span>Ứng dụng trong Phương trình hàm</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Khai thác tính đơn điệu và tính liên tục để xác định hàm</li>
                        <li>Ứng dụng đạo hàm trong phương trình hàm có điều kiện khả vi</li>
                        <li>Khai thác tính tuần hoàn và điểm bất động của hàm số</li>
                        <li>Kỹ thuật xử lý các phương trình hàm trên tập rời rạc</li>
                    </ol>
                </li>
                <li>
                    <span>Ứng dụng trong Bất đẳng thức</span>
                    <ol style="padding-left: 18px; margin-top: 6px;">
                        <li>Ứng dụng đạo hàm và khảo sát hàm số để tìm hằng số tốt nhất (Best constant)</li>
                        <li>Đánh giá bất đẳng thức nhiều biến thông qua việc cố định biến và khảo sát hàm một biến</li>
                        <li>Kỹ thuật tiếp tuyến và ứng dụng tính lồi, lõm (Bất đẳng thức Jensen) trong đánh giá cực trị</li>
                    </ol>
                </li>
            </ol>
'''
content = topics_regex.sub(lambda m: topics_new, content)

with open(r'e:\User_Data\Desktop\wED\SMP\posts\math\KhoaGiaiTich.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("KhoaGiaiTich.html written successfully!")
