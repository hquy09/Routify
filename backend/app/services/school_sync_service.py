import re
import json
import base64
import time
import urllib.request
from typing import List, Dict, Any, Optional
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

# Encryption keys extracted from THPT Ngô Gia Tự SmartScheduler bundle
AES_KEY_B64 = "ffbYSkJKl8oQLYZaGxnds6ki1K0G7U1q1k/VaokAtRs="
AES_IV_B64 = "uS5vTdYjiNu4NxJFc1VNBw=="
BASE_URL = "https://thpt-ngogiatu-daklak.edu.vn/tkb/"

class SchoolSyncService:
    _cached_data: Optional[Dict[str, Any]] = None
    _last_fetched_ts: float = 0.0
    _CACHE_TTL_SECONDS: float = 1800.0  # 30 minutes in-memory cache

    @classmethod
    def _decrypt_tkb_payload(cls, cipher_b64: str) -> Dict[str, Any]:
        key = base64.b64decode(AES_KEY_B64)
        iv = base64.b64decode(AES_IV_B64)
        cipher_bytes = base64.b64decode(cipher_b64)

        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded = decryptor.update(cipher_bytes) + decryptor.finalize()

        # Remove PKCS7 padding
        pad_len = padded[-1]
        raw_bytes = padded[:-pad_len]
        return json.loads(raw_bytes.decode("utf-8"))

    @classmethod
    def get_full_school_data(cls) -> Dict[str, Any]:
        """
        Fetches the encrypted timetable bundle from THPT Ngô Gia Tự website,
        decrypts it with AES-256-CBC, and caches in memory.
        """
        now = time.time()
        if cls._cached_data and (now - cls._last_fetched_ts < cls._CACHE_TTL_SECONDS):
            return cls._cached_data

        try:
            # 1. Fetch index.html to find the active bundle hash
            req = urllib.request.Request(
                BASE_URL,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LifeOS/1.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                html_text = resp.read().decode("utf-8", "ignore")

            # Look for all script tags, checking from bottom to top (data script is placed at bottom)
            scripts = re.findall(r'src=["\']([a-f0-9]+\.js)["\']', html_text)
            if not scripts:
                scripts = ["d7b8d7e16398.js"]
            else:
                scripts.reverse()

            cipher_b64 = None
            for bundle_filename in scripts:
                bundle_url = f"{BASE_URL}{bundle_filename}"
                req_bundle = urllib.request.Request(
                    bundle_url,
                    headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LifeOS/1.0"}
                )
                try:
                    with urllib.request.urlopen(req_bundle, timeout=15) as resp_bundle:
                        js_content = resp_bundle.read().decode("utf-8", "ignore")
                    tkb_match = re.search(r"___TKB___=['\"]([^'\"]+)['\"]", js_content)
                    if tkb_match:
                        cipher_b64 = tkb_match.group(1)
                        break
                except Exception:
                    continue

            if not cipher_b64:
                raise ValueError("Không tìm thấy chuỗi dữ liệu ___TKB___ trong các script của trường")

            parsed_data = cls._decrypt_tkb_payload(cipher_b64)

            cls._cached_data = parsed_data
            cls._last_fetched_ts = now
            return parsed_data
        except Exception as e:
            if cls._cached_data:
                return cls._cached_data
            raise RuntimeError(f"Lỗi kết nối hoặc giải mã TKB trường THPT Ngô Gia Tự: {str(e)}")

    @classmethod
    def get_classes_list(cls) -> List[Dict[str, Any]]:
        """
        Returns list of all available classes grouped and sorted by grade.
        """
        data = cls.get_full_school_data()
        factors = data.get("FactorList", [])

        # FactorType == 1 represents Classes
        classes = []
        for f in factors:
            if f.get("FactorType") == 1:
                code = f.get("FactorCode", "")
                name = f.get("FactorName", code)
                fid = f.get("FactorID")
                shift = f.get("Shift", 1)  # 1 = Morning, 2 = Afternoon

                # Extract Grade (10, 11, 12)
                grade = 10
                if code.startswith("11"):
                    grade = 11
                elif code.startswith("12"):
                    grade = 12

                classes.append({
                    "id": fid,
                    "code": code,
                    "name": name,
                    "grade": grade,
                    "shift": "MORNING" if shift == 1 else "AFTERNOON"
                })

        # Sort by grade then by code
        classes.sort(key=lambda c: (c["grade"], c["code"]))
        return classes

    @classmethod
    def get_class_timetable_grid(cls, class_code: str) -> Dict[str, Any]:
        """
        Decodes timetable for a specific class code (e.g. 10A01, 12B01).
        Returns metadata and grid format ready for Routify table:
        grid: { "0_1": "Toán - T12", "0_2": "Văn - V8", ... }
        """
        data = cls.get_full_school_data()
        factors = data.get("FactorList", [])
        timetable_entries = data.get("TimeTable", [])
        info = data.get("Info", {})

        target_factor = None
        for f in factors:
            if f.get("FactorType") == 1 and f.get("FactorCode") == class_code:
                target_factor = f
                break

        if not target_factor:
            raise ValueError(f"Không tìm thấy lớp {class_code} trong hệ thống TKB của trường")

        target_fid = target_factor["FactorID"]
        grid: Dict[str, str] = {}
        slots: List[Dict[str, Any]] = []

        for item in timetable_entries:
            key = item.get("Key", 0)
            fid = key // 1000
            if fid == target_fid:
                # Key encoding formula:
                # session = (key % 1000) // 100 (1=Morning, 2=Afternoon)
                # dayOfWeek = (key % 100) // 10 (0=Monday...5=Saturday)
                # period = key % 10 (0=Tiết 1...4=Tiết 5)
                session = (key % 1000) // 100
                dow = (key % 100) // 10
                p_idx = key % 10
                period_num = p_idx + 1 if session == 1 else p_idx + 6

                val = item.get("Value", "").strip()
                if val:
                    grid_key = f"{dow}_{period_num}"
                    grid[grid_key] = val
                    slots.append({
                        "day_of_week": dow,
                        "period": period_num,
                        "session": "MORNING" if session == 1 else "AFTERNOON",
                        "raw_value": val
                    })

        return {
            "school_name": info.get("School", {}).get("Name", "THPT Ngô Gia Tự"),
            "academic_year": info.get("TimeTable", {}).get("SchoolYear", 2026),
            "term": info.get("TimeTable", {}).get("Term", 1),
            "effective_date": info.get("TimeTable", {}).get("Date", ""),
            "class_code": class_code,
            "class_id": target_fid,
            "grid": grid,
            "slots_count": len(slots)
        }
