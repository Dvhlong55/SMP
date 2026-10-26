# 💖 PROJECT PLAN: WEBSITE LÊN LỊCH HẸN HÒ KỶ NIỆM 1 NĂM (`smp-math/love`)

> **Tên dự án:** *Our Sweet Date Planner – 1st Anniversary Secret Page*  
> **Nền tảng tích hợp:** Website `smp-math`  
> **Tên file / Đường dẫn bí mật:** `love.html` (hoặc route `/love`)  
> **Cơ chế truy cập:** **Hidden Route** (Chỉ người tự sửa URL trên thanh địa chỉ thành `.../love` mới vào được) + **Khóa mật khẩu `15/10/2025`**  
> **Ngày diễn ra buổi hẹn:** Chủ Nhật, `25/10/2026`  
> **Phong cách chủ đạo:** Ultra Pink, Coquette Pastel, Cute & Interactive  

---

## 0. 🛡️ Cấu Hình Đường Dẫn Bí Mật Trên Trang `smp-math` (Quan Trọng)

Để đảm bảo trang hẹn hò này nằm gọn trong hệ thống `smp-math` nhưng **người ngoài hoàn toàn không thể phát hiện hay truy cập**, quá trình triển khai cần tuân thủ 4 nguyên tắc sau:

1. **Quy ước tên file & URL (`love`):**
   * **Nếu `smp-math` là web tĩnh (HTML/CSS/JS hoặc GitHub Pages/Vercel):** Tạo file độc lập tên là `love.html` (hoặc tạo thư mục `love/index.html`) đặt ở thư mục gốc (`root` hoặc `public/`).
   * **Nếu `smp-math` dùng Router (React / Next.js / Vue):** Tạo một trang riêng tại route `/love` và **ẩn toàn bộ thanh Header/Sidebar của `smp-math`** khi ở route này.
   * **Cách vào duy nhất:** Chỉ có bạn (hoặc bồ bạn khi được chỉ cách) tự tay gõ sửa đường link trên trình duyệt từ `https://[ten-mien-smp-math]/...` thành `https://[ten-mien-smp-math]/love` (hoặc `/love.html`).

2. **Không liên kết công khai (Zero Public Navigation):**
   * Tuyệt đối **KHÔNG** đặt bất kỳ nút bấm, icon, menu, footer hay đường link nào từ giao diện chính của `smp-math` trỏ sang `/love`.
   * Người dùng bình thường truy cập `smp-math` chỉ thấy trang web toán học như bình thường, không có bất kỳ dấu hiệu nào cho thấy sự tồn tại của trang `/love`.

3. **Chặn công cụ tìm kiếm & Bot (`Noindex / Nofollow`):**
   * Thêm thẻ meta sau vào trong phần `<head>` của trang `love`:
     ```html
     <meta name="robots" content="noindex, nofollow, noarchive" />
     ```
   * Điều này ngăn Google và các công cụ tìm kiếm lập chỉ mục đường dẫn `/love`.

4. **Bảo mật 2 lớp (URL ẩn + Khóa mật khẩu `15/10/2025`):**
   * **Lớp 1:** Phải biết chính xác đường dẫn ẩn `/love` để tự sửa trên thanh địa chỉ.
   * **Lớp 2:** Dù có ai vô tình gõ trúng `/love`, toàn bộ nội dung hẹn hò vẫn bị khóa hoàn toàn sau màn hình mật khẩu kỷ niệm 1 năm **`15/10/2025`**.

---

## 1. 🎨 Định Hướng Thiết Kế Giao Diện (UI/UX & Styling)

### 1.1. Bảng màu (Color Palette)
* **Màu nền chính (Background):** `#FFF0F5` *(Lavender Blush - Hồng phấn siêu nhạt)* kết hợp gradient hồng kem `#FFE4E9`.
* **Màu thẻ chọn (Card Surface):** `#FFFFFF` với viền `#FFB6C1` *(Light Pink)* và hiệu ứng kính mờ (`backdrop-filter: blur(10px)`).
* **Màu nhấn chính (Primary Accent):** `#FF69B4` *(Hot Pink)* cho các nút bấm và trạng thái được chọn (`active`).
* **Màu nhấn phụ (Secondary Accent):** `#FF1493` *(Deep Pink)* cho tiêu đề, icon trái tim và huy hiệu thời gian.
* **Màu chữ (Typography):** `#5A2A3A` *(Nâu hồng đậm – giúp chữ dễ đọc, dịu mắt hơn màu đen tuyền)*.

### 1.2. Font chữ & Hiệu ứng (Typography & Micro-interactions)
* **Font tiêu đề:** `Pacifico` hoặc `Dancing Script` (nét chữ viết tay mềm mại, lãng mạn).
* **Font nội dung:** `Quicksand` hoặc `Nunito` (bo tròn, hiện đại, hỗ trợ tiếng Việt hoàn hảo).
* **Hiệu ứng trang trí:**
  * Trái tim hồng, nơ ruy-băng (coquette bow) và hoa anh đào rơi nhẹ trên nền (`CSS Keyframes` hoặc `Canvas`).
  * Hiệu ứng bắn pháo giấy hình trái tim (`canvas-confetti`) ngay khi mở khóa mật khẩu `15/10/2025` thành công và khi hoàn tất bảng kế hoạch.
  * Thanh tiến trình (Progress Bar) ở đầu trang có icon bé thỏ di chuyển thẳng hàng chính xác ngay bên dưới icon từng buổi: `Sáng 🌞 ➔ Trưa 🍲 ➔ Chiều 🎨 ➔ Tối 🎬 ➔ Chốt đơn 💌`.

---

## 2. 🔐 Luồng Trải Nghiệm Người Dùng (User Flow)

```text
[Truy cập smp-math -> Tự sửa link trên thanh địa chỉ thành /love]
       │
       ▼
[Màn hình Khóa Mật Khẩu: 15/10/2025 (Kỷ niệm 1 năm)]
       │ (Nhập đúng -> Nổ pháo hoa tim hồng)
       ▼
[Màn hình Chào Mừng & Đếm Ngược tới Chủ Nhật 25/10/2026]
       │ (Bấm "Bắt đầu lên đồ đi chơi thôiii 💕")
       ▼
[Bước 1: Chọn Buổi Sáng - Picnic Chill]
       │
       ▼
[Bước 2: Chọn Buổi Trưa - Ăn Trưa Trung Tâm Sài Gòn]
       │
       ▼
[Bước 3: Chọn Buổi Chiều - Workshop Handmade Gần Trung Tâm]
       │
       ▼
[Bước 4: Chọn Buổi Tối - Phố Ăn Vặt & Xem Phim (Lịch chiếu 25/10/2026)]
       │
       ▼
[Màn hình Tổng Kết: Bảng Timeline + Lời Nhắn + Tải Vé Hẹn Hò]
```

---

## 3. 🧩 Chi Tiết Các Màn Hình & Dữ Liệu Lựa Chọn

### 🔒 Màn hình 1: Cổng Mật Khẩu Tình Yêu (Passcode Gate)
* **Giao diện:** Hộp khóa hình trái tim ở chính giữa, có ô nhập `DD/MM/YYYY` kèm bàn phím số ảo hình dâu tây để bấm tiện lợi trên điện thoại.
* **Cơ chế nhập thông minh:**
  * Bỏ Hint để tạo bất ngờ trọn vẹn.
  * Tự động điền dấu `/` khi nhập (không cần phím `/` riêng).
  * Nút Xóa (Backspace) icon SVG hồng bo mềm mại xinh xắn, kèm nút `✨ Xóa hết` tiện lợi.
* **Logic kiểm tra:**
  * Giá trị hợp lệ: `15/10/2025`, `15-10-2025`, hoặc `15102025`.
  * **Nếu nhập sai:** Khung nhập rung lắc (`shake animation`), hiện thông báo dỗi: *"Ơ kìaaa! Quên ngày kỷ niệm 1 năm của tụi mình thật luôn hả? Nhập lại liền điii 😤💢"*.
  * **Nếu nhập đúng:** Tự động phát nhạc nền từ file audio riêng (`audio.mp3`/`music.mp3` - có nút bật/tắt), bắn tim hồng và mở khóa giao diện lên lịch cho ngày **25/10/2026**.

---

### ☀️ Màn hình 2: Buổi Sáng (07:30 – 10:30) | *Ăn Sáng & Dạo Mát Picnic*
*(Tụi mình ăn sáng và dạo mát picnic từ 07:30 đến 10:30 rồi đi ăn trưa kẻo nắng nha ☀️)*

#### Phần 2A: Chọn món ăn sáng kinh điển
| Mã | Món ăn sáng | Địa chỉ / Loại tiệm | Điểm hấp dẫn (Ngắn gọn) |
| :--- | :--- | :--- | :--- |
| **B1** | 🥖 **Bánh mì Sài Gòn / Bánh mì chảo** | Quận 1 / Gần bờ sông | Pate bơ giòn rụm, ấm bụng |
| **B2** | 🍜 **Phở bò / Bún bò Huế** | Quán ăn sáng trung tâm | Nước dùng thanh ngọt, nóng hổi thơm phức |
| **B3** | 🥪 **Sandwich trứng phô mai Egg Drop** | Tiệm bánh tiện lợi | Trứng mềm ngập sốt béo ngậy kiểu Hàn |
| **B4** | 🥟 **Dimsum / Bánh bao xá xíu** | Tiệm ăn sáng nóng hổi | Há cảo tôm thịt, bánh xốp thơm lừng |
| **B5** | 🥐 **Croissant & Cafe / Bạc xỉu** | Tiệm bánh & Cà phê chill | Bánh sừng bò bơ Pháp chuẩn vibe chill |

#### Phần 2B: Chọn nơi dạo mát / trải thảm đón nắng sớm
| Mã | Địa điểm | Địa chỉ | Điểm hấp dẫn (Ngắn gọn) |
| :--- | :--- | :--- | :--- |
| **S1** | **Bờ sông Thủ Thiêm** | An Khánh, TP. Thủ Đức | Gió sông mát rượi, ngắm trọn view Quận 1 |
| **S2** | **Công viên Vinhomes Central Park** | Tân Cảng, Bình Thạnh | Bãi cỏ xanh mát dưới chân Landmark 81 |
| **S3** | **Công viên Bến Bạch Đằng** | Tôn Đức Thắng, Quận 1 | Ngay trung tâm Q1, ngắm sông và bến tàu |

* **Đồ uống & Phụ kiện mang theo (Checkboxes):**
  * `[x]` ☕ Cafe & Trà trái cây hoặc matcha, anything for u
  * `[x]` 🥐🍙 Bánh sừng bò, bánh nắm,... nếu có time :>
  * `[x]` 🧺 Thảm caro hồng + Hoa tươi chụp ảnh
  * `[x]` 📸 Máy ảnh / Điện thoại 100% pin sống ảo

---

### 🍲 Màn hình 3: Buổi Trưa (11:30 – 13:30) | *Ăn Trưa Tại Trung Tâm TP.HCM*
*Câu hỏi hiển thị:* **"Picnic xong đói bụng rùiii, trưa nay mình đi ăn Buffet / Nhà hàng nào ở trung tâm đây?"**

| Mã | Nhà hàng lựa chọn | Địa chỉ chi nhánh dễ di chuyển | Điểm hấp dẫn |
| :--- | :--- | :--- | :--- |
| **T1** | **Dookki Vincom Đồng Khởi** | Tầng B3, 72 Lê Thánh Tôn, Quận 1 | Buffet lẩu Tokbokki Hàn Quốc: tự pha sốt lẩu, gà rán sốt cay ngọt, chả cá xiên, cơm nắm cá ngừ và vòng phô mai béo ngậy. |
| **T2** | **Hoang Yen Vietnamese Cuisine** *(Hoặc hệ thống Hoàng Yến)* | 07 Ngô Đức Kế, Quận 1 (Ngay phố đi bộ Nguyễn Huệ) | Không gian sang trọng ngay lõi Quận 1, thực đơn món Việt tinh tế từ ba miền, hải sản, gỏi cuốn và các món tráng miệng truyền thống. |
| **T3** | **D'Maris** *(Buffet Quốc Tế Cao Cấp)* | Tầng 6, Cantavil Premier, Số 1 Song Hành Xa Lộ Hà Nội, An Phú, Quận 2 | Hơn 200 món Á – Âu thượng hạng: Sashimi cá hồi, Sushi, Bò bít tết, Hải sản nướng và quầy bánh ngọt cực kỳ hoành tráng (rất tiện đường nếu sáng đi Picnic ở Quận 9 hoặc Thủ Thiêm về). |
| **T4** | **Haidilao Huoguo Bitexco** | Tầng 2, TTTM Bitexco, Số 2 Hải Triều, Quận 1 | Lẩu 4 ngăn nổi tiếng, xem múa mì tại bàn, quầy kem/trái cây đa dạng và dịch vụ chăm sóc tận răng như công chúa. |

---

### 🎨 Màn hình 4: Buổi Chiều (14:00 – 17:00) | *Trốn Nắng & Trải Nghiệm*
*Câu hỏi hiển thị:* **"Chiều mát mẻ mình trốn nắng đi đâu nè? Bbi thích gì nhất?"**  
*(Các hoạt động trải nghiệm vui vẻ, mát mẻ để trốn nắng 🌸. Mỗi thẻ đều có hình ảnh minh họa chân thực và nút link 'Xem thêm ↗' góc dưới bên phải mở Google xem thông tin trực tiếp!)*

| Mã | Hoạt động & Trải nghiệm | Điểm hấp dẫn (Ngắn gọn) |
| :--- | :--- | :--- |
| **C1** | 📚 **Dạo Đường Sách Nguyễn Văn Bình & Cafe Chill** | Con đường rợp bóng cây cổ thụ Q1, chọn sách & nhâm nhi cafe |
| **C2** | ⛸️ **Trượt Băng Trong Nhà Vincom Thảo Điền** | Lướt trên sân băng mát lạnh, xả stress cực đã |
| **C3** | 🏛️ **Bảo Tàng Mỹ Thuật TP.HCM** | Kiến trúc Pháp cổ, góc check-in siêu đẹp |
| **C4** | 🧖‍♀️ **Couple Spa & Massage Thư Giãn** | Phòng spa tinh dầu thảo mộc, thư giãn & phục hồi năng lượng |
| **C5** | 🎡 **Công Viên Văn Hóa Đầm Sen** | Vòng quay khổng lồ trên cao, đạp vịt và dạo quanh hồ nước |
| **C7** | 🏺 **Làm Gốm Thủ Công Bàn Xoay** | Tự chuốt gốm, nặn cốc đĩa khắc tên riêng |
| **C8** | 🎨 **Tô Tượng & Cafe Chill** | Tô tượng Capybara, Labubu màu pastel |
| **C9** | 🕯️ **Làm Nến Thơm & Sáp Hoa Khô** | Phối hương tinh dầu & gắn hoa khô cốc nến |
| **C10** | 🌸 **Pha Chế Nước Hoa Signature** | Sáng tạo mùi hương độc bản yêu thích |
| **C11** | 🍰 **Trang Trí Bánh Kem Bento Mini** | Tự vẽ kem, trang trí chiếc bánh bento xinh xắn |

---

### 🌙 Màn hình 5: Buổi Tối (17:30 – 22:30) | *Phố Ăn Vặt & Xem Phim Đêm*

#### Phần 5A: Ăn tối bằng Food Tour Ăn Vặt Sài Gòn (17:30 – 19:30)
*Câu hỏi hiển thị:* **"Tối nay tụi mình đi càn quét con phố ăn vặt nào đây ta?"**

1. **🍢 Đường Ẩm Thực Hồ Thị Kỷ** *(Đường Hồ Thị Kỷ, Quận 10 – Giáp Quận 3, cách khu workshop ~10 phút)*: Thiên đường xiên nướng, gà nướng phô mai, súp cua, bánh tráng nướng, bò nướng sả và chè Campuchia.
2. **🌯 Đường Nguyễn Thượng Hiền** *(Quận 3 – Ngay sát Quận 1, cách ~5 phút)*: Nổi tiếng với bánh tráng trộn, khoai mỡ chiên, gỏi cuốn, ốc, nem nướng và trà trái cây vỉa hè.
3. **🥟 Đường Vạn Kiếp** *(Bình Thạnh – Giáp Quận 1, cách ~10 phút)*: Con phố dài tấp nập với đủ món phá lấu, bánh canh, sủi cảo, xiên que nướng, chè và đá bào.
4. **🍮 Khu ẩm thực chợ 200, Quận 4** *(C200/23 Xóm Chiếu, Quận 4 – Qua cầu Calmette sát vách Quận 1)*: Thiên đường ốc tô, phá lấu bò, súp cua, bánh tráng cuốn và bánh flan.

#### Phần 5B: Xem Phim Cuối Ngày (20:00 – 22:30) – *Lịch chiếu thực tế ngày 25/10/2026*
*Câu hỏi hiển thị:* **"Chốt hạ ngày hẹn hò bằng một bộ phim ngoài rạp nha! Các phim đang chiếu ngày 25/10/2026 nè:"**

| Mã | Tên Phim (Khởi chiếu trước 25/10/2026 tại CGV) | Ngày khởi chiếu | Thể loại & Tóm tắt nhanh cho bồ dễ chọn | Link CGV intro |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | 🎬 **Mẹ Mìn** | `23/10/2026` | **Kỳ ảo, Giật gân, Rùng rợn** (Minh Hằng & Jack Carry On) | `https://www.cgv.vn/default/me-min.html` |
| **P2** | 🎬 **Án Mạng Xém Hoàn Hảo** | `09/10/2026` | **Hài hước, Trinh thám** (Anh Tú Atus & DJ Mie) | `https://www.cgv.vn/default/the-almost-perfect-murder.html` |
| **P3** | 🎬 **Verity: Bí Mật Bị Chôn Vùi** | `16/10/2026` | **Tâm lý, Giật gân** (Anne Hathaway & Dakota Johnson) | `https://www.cgv.vn/default/verity.html` |
| **P4** | 🎬 **Người Mẹ Khác (Other Mommy)** | `09/10/2026` | **Kinh dị, Giật gân** (Blumhouse & James Wan) | `https://www.cgv.vn/default/other-mommy.html` |
| **P5** | 🎬 **Blue Lock: Cuộc Chiến Của Những Tiền Đạo** | `09/10/2026` | **Anime, Hành động, Thể thao** kịch tính | `https://www.cgv.vn/default/blue-lock.html` |
| **P6** | 🎬 **Trại Buôn Người** | `25/09/2026` | **Hành động, Hồi hộp** | `https://www.cgv.vn/default/trai-buon-nguoi.html` |

---

### 💌 Màn hình 6: Bảng Tổng Kết Timeline (Summary Ticket)
Sau khi bạn nữ bấm nút **"Chốt Lịch Hẹn Hò Cùng Anh Yêu 💖"**, trang web sẽ tự động tổng hợp dữ liệu đã chọn và hiển thị một chiếc **"Vé Hẹn Hò (Date Ticket)"** có viền răng cưa màu hồng kèm bảng tổng kết:

#### 📅 BẢNG TỔNG KẾT TIMELINE HẸN HÒ (25/10/2026)
> **Kỷ niệm:** 1 Năm Yêu Nhau (`15/10/2025` ❤️)  
> **Ngày khởi hành:** Chủ Nhật, `25/10/2026`  
> 💡 *Lưu ý tinh tế:* Toàn bộ địa chỉ chi tiết/chi nhánh trên các thẻ lựa chọn đã được ẩn khỏi giao diện. Bạn gái chỉ cần chọn món/hoạt động yêu thích, còn địa điểm cụ thể và việc đặt bàn/đón đưa sẽ do bạn trai chu đáo chuẩn bị!

| Khung giờ | Buổi | Hoạt động chính | Kế hoạch bồ đã chọn (Render động) | Ghi chú / Chuẩn bị |
| :--- | :--- | :--- | :--- | :--- |
| **07:30 – 10:30** | ☀️ **Sáng** | Đi Picnic & Chụp ảnh | `[Món ăn sáng & Nơi dạo mát]` | `[Các món phụ kiện/đồ ăn picnic đã chọn]` |
| **11:30 – 13:30** | 🍲 **Trưa** | Ăn trưa tại Trung tâm | `[Tên nhà hàng Buffet / Ẩm thực đã chọn]` | Anh sẽ đặt bàn chu đáo trước |
| **14:00 – 17:00** | 🎨 **Chiều** | Hoạt động đôi thú vị | `[Tên hoạt động chiều đã chọn]` | Anh đưa đón, mang kỷ niệm đôi về nhà |
| **17:30 – 19:30** | 🍢 **Tối (P1)** | Càn quét Phố Ăn Vặt | `[Tên con phố ăn vặt đã chọn]` | Chuẩn bị chiếc bụng đói đi ăn vặt |
| **20:00 – 22:30** | 🎬 **Tối (P2)** | Xem phim rạp ghế đôi | Phim: **`[Tên phim đã chọn]`** tại `[Tên rạp]` | Anh đặt vé ghế đôi Sweetbox + bắp nước |

* **Ô nhập thêm của bạn gái:** *"Lời nhắn nhủ cho anh người yêu (Màu đồ đôi muốn mặc, giờ đón, món muốn ăn thêm...)"*
* **Các nút chức năng cuối trang:**
  1. 📸 **Tải Vé Hẹn Hò Về Máy** (Sử dụng thư viện `html2canvas` để xuất bảng timeline thành ảnh PNG hồng xinh xắn cho bồ lưu về điện thoại rồi gửi cho bạn).
  2. 🔄 **Chọn Lại Từ Đầu** (Nếu bồ muốn đổi ý địa điểm nào đó).

---

## 4. 🛠️ Kiến Trúc Kỹ Thuật & Hướng Dẫn Đưa Lên `smp-math`

1. **Đóng gói 1 File Duy Nhất (`love.html`):**
   * Toàn bộ giao diện HTML5, CSS (TailwindCSS + Custom Pink Theme) và JavaScript xử lý mật khẩu `15/10/2025` + xuất bảng tổng kết sẽ được đóng gói gọn trong **1 file `love.html` duy nhất**.
2. **Thư viện CDN tích hợp sẵn trong file:**
   * `Tailwind CSS`: Tạo giao diện bo tròn, màu hồng pastel chuẩn responsive trên điện thoại.
   * `canvas-confetti`: Hiệu ứng bắn pháo hoa trái tim màu hồng khi nhập đúng mật khẩu `15/10/2025`.
   * `html2canvas`: Giúp bạn nữ bấm 1 nút là tải được ảnh **Bảng Tổng Kết Timeline** về máy.
   * `Google Fonts`: Nhúng bộ font `Quicksand` & `Pacifico`.
3. **Các bước đưa lên `smp-math`:**
   * **Bước 1:** Đặt file `love.html` (hoặc tạo thư mục `love/index.html`) vào thư mục gốc của project `smp-math`.
   * **Bước 2:** Giữ nguyên các trang hiện tại của `smp-math`, không thêm bất kỳ thẻ `<a>` nào trỏ tới `/love`.
   * **Bước 3:** Push code lên hosting (GitHub Pages / Vercel / Netlify). Khi đi chơi hoặc khi muốn tạo bất ngờ, chỉ cần bảo bồ gõ thêm chữ `/love` vào đuôi link `smp-math` và nhập mật khẩu ngày kỷ niệm `15/10/2025` là vào thẳng thế giới màu hồng của hai bạn!