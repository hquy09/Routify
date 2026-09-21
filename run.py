import os
import sys
import time
import signal
import subprocess
import webbrowser
from threading import Thread

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

def open_browser():
    time.sleep(3)
    webbrowser.open("http://localhost:5173/")

def main():
    print("=" * 60)
    print("      🚀 LIFEOS - KHỞI ĐỘNG HỆ THỐNG (UNIFIED LAUNCHER)")
    print("=" * 60)

    # 1. Khởi động Backend
    print("[*] Đang khởi chạy Backend (FastAPI - Port 8000)...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"]
    backend_proc = subprocess.Popen(backend_cmd, cwd=BACKEND_DIR)

    # 2. Khởi động Frontend
    print("[*] Đang khởi chạy Frontend (Vite - Port 5173)...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=FRONTEND_DIR, shell=(os.name == "nt"))

    # 3. Mở trình duyệt sau 3 giây
    Thread(target=open_browser, daemon=True).start()

    print("\n[✅] Hệ thống LifeOS đang chạy:")
    print(" - Frontend: http://localhost:5173/")
    print(" - Backend : http://127.0.0.1:8000/docs")
    print("\n👉 Nhấn CTRL+C trong terminal này để dừng cả 2 server bất kỳ lúc nào.\n")

    try:
        while True:
            time.sleep(1)
            # Nếu 1 trong 2 tiến trình bị dừng đột ngột
            if backend_proc.poll() is not None or frontend_proc.poll() is not None:
                break
    except KeyboardInterrupt:
        print("\n[*] Đang tắt các tiến trình...")
    finally:
        for proc in (backend_proc, frontend_proc):
            try:
                if proc.poll() is None:
                    if os.name == "nt":
                        subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
                    else:
                        proc.terminate()
            except Exception:
                pass
        print("[✅] Đã tắt sạch các dịch vụ LifeOS. Tạm biệt!")

if __name__ == "__main__":
    main()
