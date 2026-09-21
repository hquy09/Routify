# LifeOS - Hệ Thống Quản Lý Học Tập, Năng Suất & Sức Khỏe Toàn Diện 🚀

**LifeOS** là một ứng dụng web toàn diện (All-in-One Personal Operating System) được thiết kế để giúp bạn tối ưu hóa thời gian, quản lý lộ trình học tập, theo dõi các mục tiêu đếm ngược quan trọng và cân bằng sức khỏe tinh thần chống kiệt sức (Burnout).

---

## ✨ Tính Năng Nổi Bật

### 1. 📊 Bảng Điều Khiển Tổng Quan (Dashboard)
- **Thống kê thời gian thực**: Tổng số giờ học tập, tỷ lệ hoàn thành công việc, số chu kỳ Pomodoro và điểm sức khỏe tinh thần.
- **Biểu đồ & Bản đồ nhiệt (Activity Heatmap)**: Trực quan hóa tần suất hoạt động học tập mỗi ngày trong tuần/tháng.
- **Chế độ Toàn màn hình (Full View Mode)**: Bấm `[⛶ Toàn màn hình]` (hoặc phím `ESC` để thoát) giúp ẩn thanh bên và mở rộng 100% diện tích làm việc tập trung.

### 2. 📅 Lịch Biểu Thông Minh (Calendar & Time-Blocking)
- Phân bổ lịch trình tuần theo phương pháp **Time-blocking** khoa học.
- Tích hợp trực tiếp bộ đếm thời gian **Pomodoro** để học sâu (Deep Work).
- Banner đếm ngược sự kiện quan trọng chạy trực tiếp trên đầu trang lịch với 3 chế độ xem: **Vòng tròn**, **Dấu chấm**, và **Thẻ số điện tử**.

### 3. ⏳ Đếm Ngược Mục Tiêu & Cover Studio (Countdowns)
- **5 Phong cách Bìa Nghệ Thuật**:
  - 🏷️ **Thẻ cơ bản (Default)**: Tùy chỉnh màu sắc chủ đạo qua bảng màu Palette và mã Hex.
  - 🎨 **Fonty Typo**: Đổ dốc Gradient 2 màu rực rỡ, chữ Typography phong cách, tự động cân bằng tương phản sáng/tối.
  - 🇨🇭 **Swiss Style**: Phong cách tối giản tương phản cao, đồng hồ đo tiến độ hình vòng cung SVG xoay thuận/nghịch chiều kim đồng hồ.
  - ▦ **Grid Matrix**: Lưới các ô vuông/chấm tròn thể hiện trạng thái bài học (Tô đặc / Viền ngoài).
  - ⚪ **Minimal**: Tối giản, thanh lịch, đường nét tinh gọn.
- **Phân bố màu thông minh khi ghim thẻ**: Ghim thẻ (`Pin`) giữ trọn vẹn phong cách bìa bạn đã chọn, đồng thời gắn dải ruy băng viền vàng hoàng gia (`Golden Ribbon`) và huy hiệu `[📌 ĐÃ GHIM]` nổi bật.
- **Chế độ đếm thời gian**: Chuyển đổi linh hoạt giữa đếm số ngày to trọng tâm và đếm chi tiết `D:H:M:S` chính xác đến từng giây.

### 4. 🎓 Khóa Học & Lộ Trình Kiến Thức (Courses)
- **Cây bài học đa cấp độ**: Tổ chức chương/phần/bài học phân nhánh trực quan.
- **⚔️ Chế độ Cày Cuốc Gamification (10 Bậc Danh Hiệu)**:
  - Tích lũy điểm EXP sau mỗi bài học hoàn thành.
  - Thăng hạng từ 🛡️ *Tập Sự*, ⚔️ *Chiến Thần Học Thuật* đến 🌌 *Tuyệt Đối Thần Vương*.
  - Nút bật/tắt cày cuốc 1-chạm ngay trên thanh tiêu đề.
- **Ma trận Rủi ro Kiệt sức (Burnout Risk Matrix)**: Phân tích khối lượng học tập dự kiến theo ngày so với hạn chót thi cử để cảnh báo nguy cơ quá tải.

### 5. ✅ Quản Lý Công Việc & Ghi Chú (Tasks & Notes)
- Phân loại công việc theo ma trận ưu tiên (Eisenhower Matrix).
- Trình soạn thảo ghi chú hỗ trợ định dạng Markdown, danh sách việc cần làm (Checklist) và đính kèm tài liệu.

### 6. 🧘 Sức Khỏe Tinh Thần & Chống Burnout (Wellbeing Management)
- Theo dõi chỉ số tâm trạng (Mood), thời lượng giấc ngủ và mức độ căng thẳng.
- Đưa ra lời khuyên nghỉ ngơi và cảnh báo kịp thời khi cường độ học tập vượt ngưỡng an toàn.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

- **Frontend**:
  - React 19 + TypeScript
  - Vite (Siêu nhanh, tối ưu build production)
  - Tailwind CSS (Thiết kế hiện đại, hỗ trợ Dark Mode hoàn hảo)
  - Lucide React Icons
- **Backend**:
  - Python 3.10+
  - FastAPI (REST API hiệu năng cao)
  - SQLModel / SQLAlchemy + Alembic (Quản lý database & migration)
  - SQLite (Lưu trữ cục bộ nhanh gọn, không cần cấu hình phức tạp)
  - Uvicorn ASGI Server

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Cách 1: Khởi động nhanh 1-Click (Khuyên dùng trên Windows)
Chỉ cần nhấp đúp chuột vào file:
```bash
start.bat
```
*Script sẽ tự động khởi chạy cả Backend (port 8000) và Frontend (port 5173).*  
Để dừng ứng dụng, chạy file `stop.bat`.

---

### Cách 2: Khởi chạy thủ công bằng dòng lệnh

#### 1. Khởi chạy Backend:
```bash
cd backend
python -m venv .venv
# Kích hoạt virtual environment:
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Khởi chạy Frontend:
Mở một cửa sổ dòng lệnh khác:
```bash
cd frontend
npm install
npm run dev
```

Sau đó mở trình duyệt tại: **http://localhost:5173**

---

## 📄 Bản Quyền (License)
Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
