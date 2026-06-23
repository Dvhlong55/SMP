# Kế Hoạch Tối Ưu Trải Nghiệm Đọc Và Theo Dõi Tiến Độ Học Tập (Readability & UX/UI)

Kế hoạch này nhằm nâng cấp tính năng đọc hiểu, SEO mạng xã hội, quản lý lưu bài và theo dõi tiến độ tự học dành cho học sinh ôn thi học sinh giỏi quốc gia (HSGQG).

## 1. Focus Mode (Chế độ đọc tập trung)
- **Mục tiêu**: Giảm thiểu xao nhãng khi học sinh đọc bài viết toán học dài và phức tạp.
- **Giải pháp**:
  - Thêm nút `🔍 Đọc tập trung` vào khu vực thông tin bài viết ở đầu trang.
  - Khi click vào nút này, chuyển đổi class `.focus-mode` cho thẻ `body`.
  - Thiết lập CSS ẩn Sidebar, Topbar, Widget, chân trang, và phần bình luận.
  - Tự động căn giữa nội dung bài viết, phóng to chữ bài viết lên `1.25rem`, tăng line-height lên `1.9` để việc đọc thoải mái nhất.
  - Hiển thị một nút nổi `Thoát tập trung ✕` cố định ở góc trên bên phải để người đọc có thể trở lại giao diện bình thường bất cứ lúc nào.
  - Lưu trạng thái Focus Mode vào `localStorage` của trình duyệt để tự động kích hoạt lại khi học sinh chuyển trang.

## 2. Chuẩn hóa SEO & Open Graph Tags
- **Mục tiêu**: Tối ưu hóa hiển thị khi chia sẻ liên kết các bài viết, chuyên đề lên các nền tảng mạng xã hội như Facebook, Zalo, Telegram...
- **Giải pháp**:
  - Viết script Python tự động duyệt qua tất cả các tệp tin HTML của bài viết toán học trong `posts/math/`.
  - Tự động trích xuất tiêu đề `<title>` để gán cho thẻ `<meta property="og:title">`.
  - Phân tích đoạn mở đầu của bài viết để tự động gán mô tả ngắn cho thẻ `<meta property="og:description">` (giới hạn 150 ký tự). Nếu không có, dùng mô tả mặc định của SMP.
  - Gán link ảnh preview (`og:image`) dựa trên tỉnh thành/thương hiệu của đề thi:
    - File chứa `dhvinh` dùng `dhvinh_logo.png`
    - File chứa `hanoi` dùng `hanoi_cyl.png`
    - File chứa `hatinh` dùng `hatinh_rhombus.png`
    - Các file còn lại dùng logo SMP mặc định `image_49b1a4.png`.
  - Gán đường dẫn tuyệt đối `og:url` và thiết lập Twitter Card.

## 3. Đồng Bộ Trạng Thái Lưu Bài Viết (Bookmark Sync)
- **Mục tiêu**: Tránh hiển thị trạng thái sai lệch giữa bài đã lưu và chưa lưu khi người dùng duyệt web.
- **Giải pháp**:
  - Khi tải trang, nếu người dùng đã đăng nhập, gọi API `/api/users/saved` để tải về danh sách các bài viết đã lưu.
  - Tự động thay đổi nhãn hiển thị của các nút lưu bài viết trên trang (từ card trang chủ, card chuyên mục cho đến nút Lưu bài ở đầu trang nội dung) từ "Lưu bài" sang "★ Đã lưu" có màu vàng đặc trưng nếu bài đó đã được bookmark trước đó.
  - Chuyển toàn bộ CSS hover của nút Lưu bài từ inline style sang file CSS để hiển thị mượt mà.

## 4. Hệ thống theo dõi tiến độ tự học (Learning Progress Tracker)
- **Mục tiêu**: Giúp học sinh tự đánh dấu những phần đã học xong trong các khóa học lớn (Giải tích, Số học) để không bị ngợp.
- **Giải pháp**:
  - Tự động phát hiện nếu bài viết chứa bảng chương trình học `ol.topic-list`.
  - Hiển thị một khung tiến độ (`Progress Bar`) ở đầu trang thể hiện phần trăm bài học đã hoàn thành (Ví dụ: `25% - 2/8 bài đã học`).
  - Thay thế các bullet point tròn tĩnh của từng bài học con bằng một checkbox tròn `.smp-progress-checkbox` có thể click được.
  - Khi học sinh click hoàn thành bài học:
    - Lưu trạng thái vào `localStorage` của trình duyệt với khóa riêng biệt theo ID bài học.
    - Cập nhật hiệu ứng gạch ngang nhẹ/làm mờ tiêu đề bài học đó.
    - Tự động tính toán lại và cập nhật thanh tiến độ phần trăm ở đầu chuyên đề.

## 5. Kế hoạch kiểm thử (Verification)
- Kiểm tra hiển thị của Chế độ tập trung trên các kích cỡ màn hình khác nhau (PC, Tablet, Mobile).
- Kiểm tra tính ổn định của việc lưu trạng thái tiến độ học tập và chế độ tập trung khi F5 tải lại trang.
- Xác nhận các thẻ Open Graph meta hiển thị đầy đủ trong phần mã nguồn HTML của các bài viết sau khi chạy script.
