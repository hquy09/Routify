# Routify / LifeOS - Nền Tảng Quản Lý Năng Suất & Lộ Trình Học Tập Cá Nhân

Routify (LifeOS) là một hệ thống web cục bộ (Local-first Web Application) toàn diện, kết hợp quản lý thời gian, lộ trình khóa học, nhiệm vụ hằng ngày, mục tiêu đếm ngược và kiểm soát tải nhận thức chống kiệt sức (Burnout).

Hệ thống hoạt động theo nguyên tắc **Privacy by Design**: toàn bộ dữ liệu lưu trữ trực tiếp trên máy tính cá nhân của người dùng, không phụ thuộc máy chủ bên ngoài và có khả năng vận hành hoàn toàn Offline.

---

## 1. Chi Tiết Các Phân Hệ Chức Năng & Hướng Dẫn Sử Dụng

### 1.1. Bảng Điều Khiển Tổng Quan (Dashboard)
Phân hệ Dashboard cung cấp góc nhìn toàn cảnh về hiệu suất và trạng thái sinh hoạt trong ngày/tuần:

- **Các chỉ số telemetry thời gian thực**:
  - Chuỗi ngày kỷ luật (Current Streak & Best Streak).
  - Tải nhận thức (Cognitive Load / Tension): Đo lường tổng thời lượng học tập và mức độ căng thẳng thần kinh trong ngày.
  - Chỉ số Nhất quán & Thực thi (Consistency Index): Đo lường độ ổn định kỷ luật trên thang điểm 10 dựa trên phương sai thống kê đa ngày.
  - Nhiệm vụ hoặc tiết học tiếp theo kèm trạng thái đếm ngược phút.
- **Bản đồ nhiệt hoạt động (Activity Heatmap)**: Trực quan hóa tần suất hoàn thành bài học và nhiệm vụ trong 6 tháng gần nhất (tương tự commit graph trên GitHub).
- **Biểu đồ cột phân bổ thời gian (Daily Bar Chart)**: Thống kê chi tiết khối lượng giờ học theo ngày, tuần, tháng hoặc năm.
- **Chế độ Toàn màn hình (Full View Mode)**: Bấm nút **Toàn màn hình** ở góc phải (hoặc nhấn phím `ESC` để thoát) để ẩn thanh điều hướng bên trái, mở rộng 100% diện tích làm việc tập trung.
- **Bộ tìm kiếm nhanh toàn hệ thống (Command Palette)**: Nhấn tổ hợp phím tắt `Ctrl + K` ở bất kỳ đâu để tra cứu tức thì nhiệm vụ, môn học, ghi chú hoặc sự kiện lịch.
- **Tổng kết tuần (Weekly Review)**: Ghi nhận bài học thành công, điểm chưa hoàn thành và đặt mục tiêu ưu tiên cho tuần tiếp theo.

---

### 1.2. Lịch Biểu & Phân Bổ Khung Giờ (Calendar & Time-Blocking)
Quản lý thời gian theo phương pháp Time-blocking khoa học:

- **3 Chế độ xem linh hoạt**:
  - **Dòng thời gian ngày (Daily Timeline)**: Trục thời gian 24 giờ trực quan, cho phép kéo xem luồng sự kiện chi tiết trong ngày.
  - **Lịch tuần (Weekly Timeline)**: Phân bố khung giờ học tập, làm việc và nghỉ ngơi của 7 ngày trong tuần.
  - **Lịch tháng (Monthly Calendar)**: Xem tổng thể sự kiện, bài kiểm tra và deadline trong tháng.
- **Quản lý lịch cố định (Fixed Schedules / Timetable)**:
  - Thiết lập thời khóa biểu trường học, ca làm thêm, ca tập thể thao định kỳ theo các ngày trong tuần.
  - Hỗ trợ gán mã màu, phòng học/địa điểm, ghi chú và biểu tượng nhận diện.
  - **School Timetable Preset Modal**: Công cụ hỗ trợ tạo nhanh toàn bộ thời khóa biểu tuần theo tiết học tiêu chuẩn chỉ với một vài thao tác.
- **Banner đếm ngược gắn đỉnh lịch (Calendar Countdown Banner)**:
  - Ghim sự kiện thi cử hoặc hạn chót quan trọng nhất lên đầu trang lịch biểu.
  - Hỗ trợ 3 kiểu hiển thị: **Vòng tròn tiến độ** (Circular Progress), **Thanh thu gọn** (Collapsed Bar), và **Thẻ số điện tử** (Digital Flip Cards với hiệu ứng đếm giây thực tế).
- **Bộ đếm thời gian tập trung (Pomodoro Timer)**: Khởi chạy trực tiếp các phiên làm việc sâu (Deep Work 25 phút / 50 phút) ngay trên lịch biểu.

---

### 1.3. Đếm Ngược Mục Tiêu & Studio Thiết Kế Bìa (Countdowns & Cover Studio)
Tạo động lực hành động qua hệ thống thẻ đếm ngược cá nhân hóa:

- **5 Phong cách bìa chuyên nghiệp (Cover Styles)**:
  1. **Thẻ cơ bản (Default)**: Hiển thị màu nhận diện chủ đạo, dễ nhìn, tinh giản.
  2. **Fonty Typo**: Đổ dốc Gradient 2 màu sắc nét, kết hợp typography nghệ thuật. Hệ thống tự động đo độ chói (perceived luminance) để đảo màu chữ sang đen hoặc trắng, đảm bảo không bị chìm chữ khi chọn màu nền sáng.
  3. **Phong cách Thụy Sĩ (Swiss Style)**: Thiết kế tối giản tương phản cao, tích hợp thước đo tiến độ vòng cung SVG chuyển động mượt mà.
  4. **Lưới ma trận (Grid Matrix)**: Thể hiện tiến độ hoàn thành các mốc bài học/chặng đường qua hệ thống lưới ô vuông trực quan.
  5. **Tối giản (Minimal)**: Đường nét mảnh, màu nền dịu nhẹ phù hợp người thích phong cách đơn sắc.
- **Cơ chế Ghim thẻ thông minh (Pinned Card System)**:
  - Khi bật ghim thẻ (`is_pinned`), thẻ **không bị ép thành màu đen** mà giữ nguyên 100% phong cách bìa và màu chủ đạo bạn đã thiết kế.
  - Hệ thống tự động bổ sung dải ruy băng viền vàng kim trên đỉnh thẻ (`Golden Ribbon`), hiệu ứng ánh kim hổ phách và huy hiệu `[ĐÃ GHIM]` trang trọng.
- **Đa dạng chế độ hiển thị thời gian**:
  - Chế độ số ngày lớn trọng tâm (`Còn X ngày`).
  - Chế độ chi tiết từng giây (`D : H : M : S`).
  - Tự động cảnh báo đỏ khi sự kiện đã kết thúc hoặc quá hạn.

---

### 1.4. Lộ Trình Khóa Học & Hệ Thống Cày Cuốc (Courses & Gamification)
Cấu trúc kiến thức bài bản và tạo cảm hứng học tập dài hạn:

- **Cây bài học đa tầng (Multi-level Course Tree)**:
  - Phân nhánh kiến thức: Khóa học -> Chương/Mục -> Bài học chi tiết.
  - Đánh dấu trạng thái: Chưa học, Đang học, Hoàn thành.
  - Tự động tính toán tỷ lệ phần trăm tiến độ tổng của toàn khóa.
- **Hệ thống Cày Cuốc Gamification (10 Bậc Danh Hiệu)**:
  - Tích lũy điểm kinh nghiệm (EXP) sau mỗi bài học hoàn thành dựa trên độ khó.
  - Hệ thống thăng cấp gồm 10 bậc danh hiệu: Từ *Tập Sự*, *Học Giả*, *Chiến Thần Học Thuật* đến *Tuyệt Đối Thần Vương*.
  - Có công tắc bật/tắt chế độ cày cuốc trực tiếp trên giao diện nếu bạn muốn học tập theo phong cách nghiêm túc truyền thống.
- **Ma trận Rủi ro Kiệt sức (Burnout Risk Analysis)**:
  - Tính toán số lượng bài học còn lại chia cho số ngày còn lại đến hạn thi.
  - Cảnh báo các mức rủi ro: **An toàn** (Optimal), **Căng thẳng** (Moderate), **Nguy cơ kiệt sức** (Burnout Risk) để người học chủ động dàn trải lại lịch học.
- **Sinh nhiệm vụ tự động (Task Integration)**: Bấm 1 nút để tạo ngay nhiệm vụ học tập cho bài học vào danh sách việc cần làm trong ngày.

---

### 1.5. Quản Lý Nhiệm Vụ & Kiểm Tra Xung Đột (Tasks & Conflict Detection)
Quản lý công việc hằng ngày hiệu quả:

- **Phân loại nhiệm vụ khoa học**:
  - Ma trận mức độ ưu tiên: Khẩn cấp (Urgent), Cao (High), Trung bình (Medium), Thấp (Low).
  - Đánh giá độ khó từ 1 đến 5 sao.
  - Hỗ trợ ghi chú chi tiết định dạng Markdown, danh sách việc cần làm con (Subtasks / Checklist), tệp đính kèm.
- **Thuật toán Kiểm tra xung đột thời gian (Conflict Warning System)**:
  - Khi người dùng lên lịch làm một nhiệm vụ vào khung giờ đã có tiết học hoặc lịch cố định, hệ thống lập tức hiển thị bảng cảnh báo xung đột (Conflict Warning Modal).
  - Đưa ra giải pháp đề xuất: Tiếp tục lưu, dời khung giờ nhiệm vụ hoặc chọn khung giờ trống tối ưu tiếp theo.

---

### 1.6. Sức Khỏe Tinh Thần & Cân Bằng Nhịp Sống (Mental Health & Wellbeing)
Theo dõi và điều chỉnh sức khỏe tinh thần:

- Ghi nhận nhật ký tâm trạng (Mood Tracker), thời lượng giấc ngủ và mức độ áp lực hằng ngày.
- Phân tích chỉ số **Tải nhận thức (Tension Level)** kết hợp giữa số giờ ngồi học/làm việc liên tục và độ khó của các đầu việc.
- Đưa ra khuyến nghị chủ động: Nghỉ ngơi ngắn, dời bớt việc không quan trọng khi biểu hiện căng thẳng kéo dài liên tục trên 3 ngày.

---

### 1.7. Thời Gian Sử Dụng & Chỉ Số Nhất Quán (Screen Time & Consistency)
Đo lường kỷ luật cá nhân dựa trên số liệu thực tế:

- Ghi nhận thời gian tiếp xúc thiết bị kỹ thuật số phục vụ học tập so với giải trí.
- **Chỉ số Nhất quán (Consistency Index)**: Sử dụng phương pháp tính độ lệch chuẩn và độ ổn định thực thi công việc qua nhiều tuần, không chỉ tính tỷ lệ hoàn thành đơn thuần mà đánh giá tính bền bỉ của thói quen.

---

### 1.8. Bot Thông Báo Telegram Tự Động (Telegram Integration)
Kết nối trợ lý ảo gửi thông báo trực tiếp về điện thoại/máy tính của bạn:

- **Tính năng**:
  - Tự động gửi tin nhắn nhắc nhở trước 15 phút (hoặc tùy chỉnh) khi một tiết học hoặc hạn chót nhiệm vụ sắp diễn ra.
  - Báo cáo tóm tắt lịch trình buổi sáng (Daily Briefing) liệt kê toàn bộ lịch cố định và các đầu việc cần làm trong ngày.
- **Bảo mật**: Bot Token và Chat ID được lưu trữ nội bộ trong database SQLite cục bộ và được che giấu (`masked_token`) khi hiển thị trên giao diện, không bị lộ ra ngoài.

---

### 1.9. Sao Lưu, Phục Hồi & Kho Lưu Trữ (Backup, Restore & Archive)
Bảo vệ toàn vẹn dữ liệu cá nhân:

- **Kho lưu trữ (Archive)**: Chuyển các khóa học đã thi xong hoặc nhiệm vụ cũ vào kho lưu trữ để giữ giao diện luôn gọn gàng mà không làm mất lịch sử dữ liệu.
- **Xuất gói sao lưu di động (Export Backup Bundle)**: Đóng gói toàn bộ cơ sở dữ liệu `lifeos.db`, toàn bộ tệp đính kèm và file `manifest.json` vào 1 tệp `.zip` duy nhất đặt trong thư mục `backend/storage/backups/`.
- **Phục hồi an toàn (Restore Bundle)**: Trước khi giải nén phục hồi dữ liệu từ file zip, hệ thống tự động tạo bản sao lưu khẩn cấp đề phòng rủi ro.

---

## 2. Yêu Cầu Hệ Thống (Prerequisites)

Trước khi cài đặt, hãy đảm bảo máy tính của bạn đã cài đặt 2 công cụ nền tảng sau:

1. **Python 3.10 trở lên**:
   - Tải bộ cài chính thức tại: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - *Lưu ý quan trọng khi cài đặt trên Windows:* Ở màn hình cài đặt đầu tiên, bắt buộc tích chọn ô **"Add Python to PATH"** trước khi nhấn Install Now.
2. **Node.js (phiên bản LTS 18.x hoặc 20.x trở lên)**:
   - Tải bộ cài tại: [https://nodejs.org/](https://nodejs.org/) (chọn bản Recommended for Most Users).
   - Kiểm tra cài đặt bằng cách mở Command Prompt / PowerShell và chạy:
     ```bash
     python --version
     node --version
     npm --version
     ```

---

## 3. Hướng Dẫn Cài Đặt Lần Đầu Cho Người Mới (Setup Guide)

### Bước 1: Tải mã nguồn về máy tính
- **Cách 1 (Dùng Git):**
  ```bash
  git clone <URL_REPOSITORY_CUA_BAN>
  cd lifeos
  ```
- **Cách 2 (Không dùng Git):** Tải file `.zip` từ kho lưu trữ GitHub, giải nén vào thư mục bạn muốn làm việc (ví dụ: `C:\Users\TenBan\lifeos`).

### Bước 2: Cài đặt thư viện phụ thuộc (Chỉ thực hiện 1 lần đầu)

Mở cửa sổ dòng lệnh tại thư mục gốc của dự án và chạy lần lượt:

#### 1. Cài đặt thư viện Backend (Python):
```bash
cd backend
pip install -r requirements.txt
cd ..
```
*(Tùy chọn: Nếu muốn dùng môi trường ảo riêng biệt, bạn có thể gõ `python -m venv .venv`, kích hoạt bằng `.venv\Scripts\activate` trên Windows rồi mới chạy lệnh `pip install`)*.

#### 2. Cài đặt thư viện Frontend (Node.js):
```bash
cd frontend
npm install
cd ..
```

---

## 4. Các Phương Thức Khởi Động Ứng Dụng

Sau khi hoàn tất bước cài đặt thư viện ở Mục 3, bạn có thể lựa chọn 1 trong các cách khởi động sau:

### Cách 1: Khởi động 1-Click (Khuyên dùng trên Windows)
Nhấp đúp chuột vào file:
```text
start.bat
```
- Script tự động kiểm tra giải phóng cổng, kích hoạt Backend (port 8000), Frontend (port 5173) và mở trình duyệt web.
- Hai cửa sổ console của Backend và Frontend sẽ hiển thị nhật ký để bạn tiện theo dõi.

### Cách 2: Khởi động chế độ chạy ngầm (Ẩn toàn bộ cửa sổ CMD)
Nếu bạn muốn hệ thống khởi chạy âm thầm không để lại cửa sổ màu đen nào trên màn hình làm việc:
Nhấp đúp chuột vào file:
```text
start_hidden.bat
```
- Cả Backend và Frontend chạy ngầm hoàn toàn dưới nền. Trình duyệt tự động mở tại địa chỉ `http://localhost:5173`.

### Cách 3: Khởi động hợp nhất bằng Python
Mở cửa sổ dòng lệnh tại thư mục gốc và chạy:
```bash
python run.py
```
- Script hợp nhất sẽ quản lý vòng đời của cả 2 tiến trình, tự động mở trình duyệt và tự dọn dẹp khi bạn nhấn `Ctrl + C`.

### Cách 4: Khởi động thủ công cho lập trình viên (Manual Run)
Mở 2 cửa sổ dòng lệnh riêng biệt:

- **Terminal 1 (Backend FastAPI):**
  ```bash
  cd backend
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Terminal 2 (Frontend Vite + React):**
  ```bash
  cd frontend
  npm run dev
  ```
- Giao diện người dùng: `http://localhost:5173`
- Tài liệu kiểm thử API (Swagger UI): `http://127.0.0.1:8000/docs`

---

## 5. Cách Dừng / Tắt Toàn Bộ Ứng Dụng

Khi bạn muốn tắt hệ thống hoặc kết thúc buổi làm việc:
- **Nếu đang chạy bằng file `.bat` hoặc chạy ngầm:** Nhấp đúp chuột vào file:
  ```text
  stop.bat
  ```
  Script sẽ tự động tìm kiếm các tiến trình đang chiếm cổng 8000 và 5173 để tắt sạch sẽ, an toàn.
- **Nếu đang chạy trên cửa sổ console thủ công:** Nhấn tổ hợp phím `Ctrl + C` trên từng cửa sổ lệnh.

---

## 6. Lưu Ý Quan Trọng Khi Vận Hành Cục Bộ (Local-First Notes & Data Privacy)

### 6.1. Cơ sở dữ liệu lưu cục bộ (Local SQLite Database)
- Toàn bộ cơ sở dữ liệu hệ thống được lưu trữ trong một tệp duy nhất tại: `backend/lifeos.db`.
- Dữ liệu nhiệm vụ, khóa học, ghi chú cá nhân của bạn **không gửi đến bất kỳ máy chủ đám mây nào**.
- Quy tắc trong [.gitignore](.gitignore) đã được cấu hình chặt chẽ để tự động bỏ qua file `lifeos.db` cũng như toàn bộ thư mục `backend/storage/backups/`. Bạn hoàn toàn yên tâm đưa mã nguồn lên GitHub công khai (Public Repo) mà không lo bị lộ dữ liệu cá nhân.

### 6.2. Hoạt động ngoại tuyến 100% (Offline Capability)
- Ứng dụng không phụ thuộc vào CDN bên ngoài. Toàn bộ mã nguồn giao diện, phông chữ và bộ icon đều được đóng gói sẵn trong dự án.
- Bạn có thể bật máy tính và sử dụng đầy đủ mọi tính năng kể cả khi không có kết nối mạng Internet.

### 6.3. Quản lý cổng mạng & Xử lý xung đột cổng (Port Management)
- Hệ thống sử dụng 2 cổng mạng mặc định:
  - **Cổng 8000:** Dành cho Backend API (FastAPI).
  - **Cổng 5173:** Dành cho Frontend Web (Vite Dev Server).
- Nếu bạn gặp lỗi không mở được web hoặc thông báo cổng đang bận, hãy nhấp đúp file `stop.bat` để tắt các tiến trình treo ngầm, sau đó khởi động lại bằng `start.bat`.

### 6.4. Sao lưu & An toàn dữ liệu phòng rủi ro (Backup Strategy)
- Mặc dù hệ thống chạy ổn định, bạn nên định kỳ sao lưu dữ liệu bằng 1 trong 2 cách:
  - **Cách 1:** Mở trang **Cài đặt** -> chọn **Xuất gói sao lưu** để tạo file `.zip` chứa cả database và file đính kèm.
  - **Cách 2:** Sao chép tệp `backend/lifeos.db` sang thư mục lưu trữ khác (như Google Drive, OneDrive hoặc USB).

---

## 7. Cấu Trúc Thư Mục Dự Án

```text
lifeos/
├── start.bat               # File khởi động nhanh có console (Windows)
├── start_hidden.bat        # File khởi động chạy ngầm ẩn CMD (Windows)
├── stop.bat                # File tắt sạch toàn bộ tiến trình ứng dụng
├── run.py                  # Script Python khởi động hợp nhất
├── README.md               # Tài liệu hướng dẫn sử dụng và kỹ thuật
├── LICENSE                 # Giấy phép mã nguồn mở chuẩn MIT
├── .gitignore              # Bộ quy tắc bỏ qua file rác và bảo vệ database
│
├── backend/                # Mã nguồn máy chủ Backend (FastAPI, Python)
│   ├── app/                # Các module nghiệp vụ (api, core, models, schemas, services)
│   ├── alembic/            # Cấu hình quản lý phiên bản database
│   ├── storage/            # Thư mục chứa file đính kèm và file backup nội bộ
│   ├── tests/              # Bộ kiểm thử tự động
│   ├── requirements.txt    # Danh sách các thư viện Python
│   └── lifeos.db           # File cơ sở dữ liệu SQLite cục bộ (sinh ra khi chạy)
│
└── frontend/               # Mã nguồn giao diện Frontend (React 19, TypeScript, Vite)
    ├── src/
    │   ├── components/     # Các thành phần UI (calendar, countdown, courses, dashboard, tasks...)
    │   ├── pages/          # Các trang nghiệp vụ chính
    │   ├── services/       # Module gọi API kết nối backend
    │   ├── types/          # Định nghĩa kiểu dữ liệu TypeScript
    │   └── utils/          # Các tiện ích tính toán ngày tháng, màu sắc, gamification
    ├── public/             # Tài nguyên tĩnh (favicon, icon)
    ├── package.json        # Danh mục thư viện Node.js
    └── tailwind.config.js  # Cấu hình giao diện Tailwind CSS
```

---

## 8. Giấy Phép Bản Quyền (License)

Dự án được phân phối dưới giấy phép mã nguồn mở [MIT License](LICENSE).  
Bản quyền tác giả thuộc về **© 2026 Huu Quy**. Bạn có toàn quyền sử dụng, sửa đổi và mở rộng dự án với điều kiện duy trì nguyên vẹn thông tin bản quyền của tác giả gốc.
