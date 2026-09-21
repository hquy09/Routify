# Routify / LifeOS 

Routify (LifeOS) là hệ thống web cục bộ (Local-first Web Application) hỗ trợ quản lý toàn diện lịch biểu, mục tiêu, lộ trình khóa học, nhiệm vụ hằng ngày, và hơn thể nữa.

Ứng dụng được thiết kế ưu tiên quyền riêng tư, lưu trữ toàn bộ dữ liệu trực tiếp trên máy của bạn và có thể hoạt động độc lập không cần kết nối Internet.
> [!NOTE]
> **Lưu ý về phiên bản thử nghiệm (Beta):**  
> Dự án hiện đang trong giai đoạn phát triển **Beta**, do đó có thể phát sinh một số lỗi hoặc hành vi chưa hoàn thiện trong quá trình sử dụng. Rất mong nhận được sự thông cảm và đóng góp ý kiến, phản hồi báo lỗi từ cộng đồng qua mục **Issues** trên GitHub để dự án ngày càng hoàn thiện hơn.
---

## 1. Yêu Cầu Hệ Thống (Prerequisites)

Trước khi cài đặt, hãy đảm bảo máy tính của bạn đã cài sẵn 2 công cụ nền tảng:

1. **Python 3.10 trở lên**:
   - Tải tại: [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - *Lưu ý quan trọng khi cài đặt:* Đánh dấu tích vào ô **"Add Python to PATH"** ở bước đầu tiên.
2. **Node.js (phiên bản LTS 18.x hoặc 20.x trở lên)**:
   - Tải tại: [https://nodejs.org/](https://nodejs.org/) (chọn bản Recommended for Most Users).
   - Kiểm tra cài đặt bằng cách mở cửa sổ lệnh (Command Prompt hoặc PowerShell) và gõ:
     ```bash
     python --version
     node --version
     npm --version
     ```

---

## 2. Hướng Dẫn Cài Đặt Lần Đầu Cho Người Mới (Quick Setup)

### Bước 1: Tải mã nguồn về máy
- Nếu dùng Git:
  ```bash
  git clone <URL_REPOSITORY_CUA_BAN>
  cd lifeos
  ```
- Hoặc tải file `.zip` từ GitHub về máy và giải nén vào thư mục bạn muốn.

### Bước 2: Cài đặt thư viện phụ thuộc (Chỉ cần làm 1 lần đầu)

Mở cửa sổ dòng lệnh tại thư mục gốc của dự án:

#### 1. Cài đặt thư viện Backend (Python):
```bash
cd backend
pip install -r requirements.txt
cd ..
```
*(Nếu muốn dùng môi trường ảo riêng: chạy `python -m venv .venv`, kích hoạt bằng `.venv\Scripts\activate` trên Windows rồi mới chạy lệnh `pip install`)*.

#### 2. Cài đặt thư viện Frontend (Node.js):
```bash
cd frontend
npm install
cd ..
```

---

## 3. Cách Khởi Động Ứng Dụng

Sau khi đã hoàn tất cài đặt ở Mục 2, bạn có các lựa chọn khởi động thuận tiện sau:

### Cách 1: Khởi động 1-click (Khuyên dùng trên Windows)
Nhấp đúp chuột vào file:
```text
start.bat
```
- Script sẽ tự động kiểm tra cổng mạng, khởi chạy Backend (cổng 8000), Frontend (cổng 5173) và mở trình duyệt web cho bạn.
- Màn hình console sẽ hiển thị nhật ký hoạt động để bạn theo dõi.

### Cách 2: Khởi động chế độ ẩn console (Chạy ngầm)
Nếu bạn không muốn hiển thị các cửa sổ màn hình đen CMD trên màn hình:
Nhấp đúp chuột vào file:
```text
start_hidden.bat
```
- Cả Backend và Frontend sẽ được kích hoạt chạy ngầm hoàn toàn. Trình duyệt tự động mở tại địa chỉ `http://localhost:5173`.

### Cách 3: Khởi động bằng Python Unified Launcher
Mở terminal tại thư mục gốc và chạy:
```bash
python run.py
```

### Cách 4: Khởi động thủ công bằng 2 terminal độc lập
Nếu bạn là lập trình viên muốn debug chi tiết:

- **Terminal 1 (Backend):**
  ```bash
  cd backend
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
  ```
- **Terminal 2 (Frontend):**
  ```bash
  cd frontend
  npm run dev
  ```
- Truy cập giao diện tại: `http://localhost:5173`
- Tài liệu API (Swagger UI): `http://127.0.0.1:8000/docs`

---

## 4. Cách Dừng / Tắt Ứng Dụng

Khi không còn sử dụng hoặc cần tắt toàn bộ tiến trình:
- **Nếu chạy qua file `.bat` hoặc chạy ngầm:** Nhấp đúp vào file `stop.bat`. Script sẽ tự động giải phóng sạch sẽ cổng 8000 và 5173.
- **Nếu chạy thủ công trên terminal:** Nhấn tổ hợp phím `Ctrl + C` trên từng cửa sổ terminal.

---

## 5. Lưu Ý Quan Trọng Về Việc Chạy Cục Bộ (Local Notes & Privacy)

### 1. Cơ sở dữ liệu lưu cục bộ (Local Database)
- Ứng dụng sử dụng cơ sở dữ liệu SQLite đặt tại đường dẫn: `backend/lifeos.db`.
- Toàn bộ dữ liệu bài học, nhiệm vụ, thói quen và thông tin cá nhân chỉ nằm duy nhất trên máy tính của bạn, không bị tải lên máy chủ ngoài.

### 2. Tính năng chạy Offline 100%
- Toàn bộ thư viện giao diện, icon và phông chữ đều được đóng gói cục bộ.
- Bạn hoàn toàn có thể khởi chạy và sử dụng toàn bộ tính năng của Routify ngay cả khi thiết bị ngắt kết nối Internet.

### 3. Quản lý cổng mạng (Port Usage)
- **Backend:** Cổng mặc định `8000`.
- **Frontend:** Cổng mặc định `5173`.
- Nếu gặp thông báo lỗi không thể kết nối hoặc cổng đang bị chiếm dụng bởi ứng dụng khác, hãy chạy file `stop.bat` để tự động dọn dẹp tiến trình treo trước khi khởi động lại.

### 4. Sao lưu và an toàn dữ liệu (Backup & Restore)
- Bạn có thể chủ động sao lưu dữ liệu bất kỳ lúc nào bằng 2 cách:
  - **Cách 1:** Truy cập trang **Cài đặt (Settings)** trên giao diện web và chọn **Xuất gói sao lưu (Export Backup Bundle)**. Hệ thống sẽ tạo một file nén zip an toàn trong thư mục `backend/storage/backups/`.
  - **Cách 2:** Copy trực tiếp file `backend/lifeos.db` ra nơi lưu trữ an toàn (ổ cứng gắn ngoài, USB, v.v.).

---

## 6. Cấu Trúc Thư Mục Dự Án

```text
lifeos/
├── start.bat               # Khởi động ứng dụng (có hiển thị console)
├── start_hidden.bat        # Khởi động ứng dụng chạy ngầm (ẩn console)
├── stop.bat                # Tắt toàn bộ dịch vụ backend & frontend
├── run.py                  # Script khởi động hợp nhất bằng Python
├── README.md               # Hướng dẫn sử dụng và tài liệu kỹ thuật
├── LICENSE                 # Giấy phép mã nguồn mở MIT
├── .gitignore              # Bộ quy tắc loại trừ file rác và dữ liệu cá nhân
│
├── backend/                # Mã nguồn Backend (Python FastAPI)
│   ├── app/                # Logic xử lý API, models, schemas, services
│   ├── alembic/            # Cấu hình migration database
│   ├── requirements.txt    # Danh sách thư viện Python cần cài đặt
│   ├── storage/            # Thư mục chứa tệp đính kèm và bản sao lưu nội bộ
│   └── tests/              # Bộ kiểm thử tự động (Unit tests)
│
└── frontend/               # Mã nguồn Frontend (React 19, TypeScript, Vite)
    ├── src/                # Toàn bộ components, pages, hooks, utils
    ├── public/             # Tệp tĩnh, favicon, icons
    ├── package.json        # Danh sách thư viện Node.js
    └── tailwind.config.js  # Cấu hình hệ thống giao diện Tailwind CSS
```

---

## 7. Giấy Phép Sử Dụng (License)

Dự án được phân phối dưới giấy phép mã nguồn mở [MIT License](LICENSE).  
Bản quyền thuộc về © 2026 Huu Quy. Bạn được phép sử dụng, sửa đổi và phân phối lại với điều kiện giữ nguyên thông báo bản quyền và nguồn tác giả ban đầu.

