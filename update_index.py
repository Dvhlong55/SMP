import re

with open(r'e:\User_Data\Desktop\wED\SMP\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update featured-hero
featured_old = '''                    <div class="featured-hero fade-up">
                        <div class="featured-label">✦ Bài Viết Nổi Bật</div>
                        <h2>Khóa học Số học Olympic 2026</h2>
                        <p>Khóa học chuyên sâu được thiết kế dành cho học sinh định hướng thi học sinh giỏi và Olympic Toán, tập trung vào các kỹ thuật quan trọng và tư duy giải toán thường xuất hiện trong các kỳ thi.</p>
                        <a href="/posts/math/KhoaSoHoc.html" target="_blank" class="featured-link">Xem Khóa Học ↗</a>
                    </div>'''
featured_new = '''                    <div class="featured-hero fade-up">
                        <div class="featured-label">✦ Bài Viết Nổi Bật</div>
                        <h2>Khóa Giải Tích HSGQG</h2>
                        <p>Khóa học Giải tích chuyên sâu được thiết kế dành cho học sinh định hướng thi HSGQG và Olympic Toán. Bản đề cương này mang tính ứng dụng cao, mở rộng giải tích sang các phân môn đại số, phương trình hàm và bất đẳng thức.</p>
                        <a href="/posts/math/KhoaGiaiTich.html" target="_blank" class="featured-link">Xem Khóa Học ↗</a>
                    </div>'''
content = content.replace(featured_old, featured_new)

# 2. Remove the two VIASM cards
viasm_1 = '''                            <div class="card fade-up">
                                <div class="card-date">June 14, 2026</div>
                                <h3>[VIASM] Đề thi Vietnam IMO New Initiative 2026 - Khối 11</h3>
                                <p>Đề thi Kiểm tra Giai đoạn I (Ngày 1 & Ngày 2) dành cho Khối 11 của Viện Nghiên cứu Cao cấp về Toán.</p>
                                <a href="/posts/math/vmo/viasm-khoi-11-2026.html" target="_blank" class="card-link">READ MORE</a>
                            </div>'''
viasm_2 = '''                            <div class="card fade-up">
                                <div class="card-date">June 14, 2026</div>
                                <h3>[VIASM] Đề thi Vietnam IMO New Initiative 2026 - Khối 10</h3>
                                <p>Đề thi Kiểm tra Giai đoạn I (Ngày 1 & Ngày 2) dành cho Khối 10 của Viện Nghiên cứu Cao cấp về Toán.</p>
                                <a href="/posts/math/vmo/viasm-khoi-10-2026.html" target="_blank" class="card-link">READ MORE</a>
                            </div>'''
content = content.replace(viasm_1, "")
content = content.replace(viasm_2, "")

# 3. Add Số học Olympic 2026 card
sohoc_card = '''                            <div class="card fade-up">
                                <div class="card-date">June 09, 2026</div>
                                <span class="card-tag" style="color: var(--accent-gold); border-color: rgba(201, 169, 110, 0.4); background: rgba(201, 169, 110, 0.1);">Khóa Học</span>
                                <h3>Khóa học Số học Olympic 2026</h3>
                                <p>Khóa học chuyên sâu được thiết kế dành cho học sinh định hướng thi học sinh giỏi và Olympic Toán, tập trung vào các kỹ thuật quan trọng và tư duy giải toán thường xuất hiện trong các kỳ thi.</p>
                                <a href="/posts/math/KhoaSoHoc.html" target="_blank" class="card-link">READ MORE</a>
                            </div>'''

# We want to insert sohoc_card at the end of the grid-container
# The grid-container ends with:
#                                 <a href="/posts/math/vimoni-2026.html" target="_blank" class="card-link">READ MORE</a>
#                             </div>
#                         </div>
vimoni_end = '''                                <a href="/posts/math/vimoni-2026.html" target="_blank" class="card-link">READ MORE</a>
                            </div>'''
content = content.replace(vimoni_end, vimoni_end + '\n' + sohoc_card)

with open(r'e:\User_Data\Desktop\wED\SMP\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("index.html updated successfully!")
