from datetime import datetime, date, timedelta
from app.database.session import SessionLocal, engine
from app.models import Base
from app.models.goal import Goal, Project
from app.models.task import Task, Subtask
from app.models.fixed_schedule import FixedSchedule
from app.models.course import Course, CourseNode
from app.models.calendar_note import CalendarNote
from app.services.course_service import CourseService

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if data already exists
    if db.query(Goal).first():
        print("Database already contains data. Skipping seed.")
        db.close()
        return

    print("Seeding Personal Life OS database...")

    now = datetime.utcnow()
    today = now.date()

    # 1. Goals & Projects
    goal_uni = Goal(
        title="Đỗ Đại học 2027",
        description="Mục tiêu xét tuyển khối A00 / A01 điểm số cao vào trường top",
        category="ACADEMIC",
        target_date=datetime(2027, 7, 1),
        status="ACTIVE"
    )
    db.add(goal_uni)
    db.flush()

    proj_math = Project(
        goal_id=goal_uni.id,
        title="Toán học",
        description="Chinh phục 9.0+ môn Toán: Giải tích, Hình học không gian",
        color="#3b82f6",
        status="ACTIVE"
    )
    proj_phy = Project(
        goal_id=goal_uni.id,
        title="Vật lý",
        description="Chinh phục 9.0+ môn Vật lý: Dao động, Sóng, Điện xoay chiều",
        color="#8b5cf6",
        status="ACTIVE"
    )
    proj_code = Project(
        goal_id=goal_uni.id,
        title="Lập trình & Kỹ năng",
        description="Phát triển Personal Life OS & tư duy phần mềm",
        color="#10b981",
        status="ACTIVE"
    )
    db.add_all([proj_math, proj_phy, proj_code])
    db.flush()

    # 2. Courses Hierarchy
    course_math = Course(
        title="Toán Thầy Đức",
        description="Chương trình luyện thi Toán Đại học chuyên sâu",
        instructor="Thầy Đức",
        color="#3b82f6"
    )
    db.add(course_math)
    db.flush()

    # Course -> Khoa T
    node_khoa_t = CourseNode(
        course_id=course_math.id,
        parent_id=None,
        title="Khóa T — Toàn diện",
        type="SECTION",
        description="Lộ trình học nền tảng và nâng cao",
        order_index=1,
        status="IN_PROGRESS",
        progress=25.0
    )
    db.add(node_khoa_t)
    db.flush()

    # Khoa T -> Chuong T1
    node_chuong_t1 = CourseNode(
        course_id=course_math.id,
        parent_id=node_khoa_t.id,
        title="Chương T1 — Nguyên hàm & Tích phân",
        type="CHAPTER",
        description="Lý thuyết và các dạng toán tích phân 8+",
        order_index=1,
        status="IN_PROGRESS",
        progress=50.0
    )
    db.add(node_chuong_t1)
    db.flush()

    # Chuong T1 -> Lessons
    lesson_1 = CourseNode(
        course_id=course_math.id,
        parent_id=node_chuong_t1.id,
        title="Bài 1: Nguyên hàm cơ bản & Bảng nguyên hàm",
        type="LESSON",
        description="Nắm vững định nghĩa vi phân và công thức nguyên hàm cơ bản",
        video_url="https://youtube.com/watch?v=sample1",
        document_url="https://drive.google.com/sample_doc1.pdf",
        duration=45,
        estimated_study_time=60,
        difficulty=2,
        status="COMPLETED",
        progress=100.0,
        order_index=1
    )
    lesson_2 = CourseNode(
        course_id=course_math.id,
        parent_id=node_chuong_t1.id,
        title="Bài 2: Phương pháp đổi biến số trong tích phân",
        type="LESSON",
        description="Kỹ thuật đặt ẩn phụ loại 1 và loại 2",
        video_url="https://youtube.com/watch?v=sample2",
        duration=50,
        estimated_study_time=75,
        difficulty=3,
        status="IN_PROGRESS",
        progress=50.0,
        order_index=2
    )
    lesson_3 = CourseNode(
        course_id=course_math.id,
        parent_id=node_chuong_t1.id,
        title="Bài 3: Tích phân từng phần (Nhất lô, nhì đa...)",
        type="LESSON",
        description="Phương pháp múa cột và công thức tích phân từng phần",
        duration=55,
        estimated_study_time=90,
        difficulty=4,
        status="NOT_STARTED",
        progress=0.0,
        order_index=3
    )
    lesson_4 = CourseNode(
        course_id=course_math.id,
        parent_id=node_chuong_t1.id,
        title="Bài 4: Ứng dụng tích phân tính diện tích hình phẳng",
        type="LESSON",
        description="Các dạng toán đồ thị và diện tích giới hạn",
        duration=60,
        estimated_study_time=90,
        difficulty=4,
        status="NOT_STARTED",
        progress=0.0,
        order_index=4
    )
    db.add_all([lesson_1, lesson_2, lesson_3, lesson_4])
    db.flush()

    # Recalculate course progress
    CourseService._recalculate_parent_progress(db, lesson_1.parent_id)

    # 3. Fixed Schedules (Lịch cố định - recurring weekly)
    # Mon-Fri: School 07:00 - 11:30
    for day_idx in range(5):  # 0 to 4
        db.add(FixedSchedule(
            title="🏫 Học ở trường",
            description="Lịch học chính khóa tại trường THPT",
            day_of_week=day_idx,
            start_time="07:00",
            end_time="11:30",
            repeat_rule="WEEKLY",
            category="SCHOOL",
            color="#3b82f6",
            location="Phòng học 12A1"
        ))

    # Mon & Thu: Math Class 15:00 - 17:00
    db.add(FixedSchedule(
        title="📐 Học Toán Thầy Đức",
        description="Lớp học trực tiếp chuyên đề Giải tích",
        day_of_week=0,  # Monday
        start_time="15:00",
        end_time="17:00",
        repeat_rule="WEEKLY",
        category="STUDY",
        color="#8b5cf6",
        location="Trung tâm bồi dưỡng"
    ))
    db.add(FixedSchedule(
        title="📐 Học Toán Thầy Đức",
        description="Lớp học trực tiếp chuyên đề Giải tích",
        day_of_week=3,  # Thursday
        start_time="15:00",
        end_time="17:00",
        repeat_rule="WEEKLY",
        category="STUDY",
        color="#8b5cf6",
        location="Trung tâm bồi dưỡng"
    ))

    # Tue & Fri: Physics Class 18:00 - 20:00
    db.add(FixedSchedule(
        title="⚛ Học Vật lý Thầy Tuấn",
        description="Chuyên đề Sóng cơ và Dao động",
        day_of_week=1,  # Tuesday
        start_time="18:00",
        end_time="20:00",
        repeat_rule="WEEKLY",
        category="STUDY",
        color="#ec4899",
        location="Online Zoom"
    ))
    db.add(FixedSchedule(
        title="⚛ Học Vật lý Thầy Tuấn",
        description="Chuyên đề Sóng cơ và Dao động",
        day_of_week=4,  # Friday
        start_time="18:00",
        end_time="20:00",
        repeat_rule="WEEKLY",
        category="STUDY",
        color="#ec4899",
        location="Online Zoom"
    ))

    # Gym: Mon, Wed, Fri 17:30 - 18:30
    for day_idx in [0, 2, 4]:
        db.add(FixedSchedule(
            title="🏃 Tập Gym & Thể thao",
            description="Rèn luyện thể lực và sức bền",
            day_of_week=day_idx,
            start_time="17:30",
            end_time="18:30",
            repeat_rule="WEEKLY",
            category="EXERCISE",
            color="#10b981",
            location="Phòng gym"
        ))

    db.flush()

    # 4. Tasks & Subtasks
    # Historical transferred pair: Task A (yesterday, transferred) -> Task B (today, TODO)
    yesterday_due = datetime(now.year, now.month, now.day, 21, 0) - timedelta(days=1)
    task_a = Task(
        title="Ôn 50 câu tích phân",
        description="Bài tập luyện đề mức độ vận dụng",
        goal_id=goal_uni.id,
        project_id=proj_math.id,
        course_node_id=lesson_2.id,
        due_datetime=yesterday_due,
        difficulty=4,
        priority="HIGH",
        status="TRANSFERRED",
        created_at=yesterday_due - timedelta(days=1)
    )
    db.add(task_a)
    db.flush()

    today_due = datetime(now.year, now.month, now.day, 21, 0)
    task_b = Task(
        title="Ôn 50 câu tích phân",
        description="Được chuyển giao từ ngày hôm qua vì bận lịch học thêm",
        goal_id=goal_uni.id,
        project_id=proj_math.id,
        course_node_id=lesson_2.id,
        due_datetime=today_due,
        difficulty=4,
        priority="HIGH",
        status="TODO",
        transferred_from_id=task_a.id,
        created_at=now
    )
    db.add(task_b)
    db.flush()
    task_a.transferred_to_id = task_b.id

    # Subtasks for Task B
    subtasks_b = [
        Subtask(task_id=task_b.id, title="Làm 20 câu đầu (cơ bản)", is_completed=True, order_index=0),
        Subtask(task_id=task_b.id, title="Làm 20 câu tiếp (vận dụng)", is_completed=False, order_index=1),
        Subtask(task_id=task_b.id, title="Làm 10 câu khó (vận dụng cao)", is_completed=False, order_index=2),
        Subtask(task_id=task_b.id, title="So sánh đáp án và tổng kết lỗi", is_completed=False, order_index=3),
    ]
    db.add_all(subtasks_b)

    # Study task linked to Lesson 1 (completed)
    task_study = Task(
        title="Học Bài 1 — Nguyên hàm cơ bản",
        description="Hoàn thành video lý thuyết và 10 câu trắc nghiệm",
        goal_id=goal_uni.id,
        project_id=proj_math.id,
        course_node_id=lesson_1.id,
        due_datetime=today_due - timedelta(hours=5),
        completed_datetime=now - timedelta(hours=4),
        difficulty=3,
        priority="HIGH",
        status="COMPLETED"
    )
    db.add(task_study)

    # Another task: Physics
    task_phy = Task(
        title="Luyện 30 bài tập Sóng dừng",
        description="Tập trung bài toán hai đầu cố định và một đầu tự do",
        goal_id=goal_uni.id,
        project_id=proj_phy.id,
        due_datetime=today_due + timedelta(days=1),
        difficulty=3,
        priority="MEDIUM",
        status="TODO"
    )
    db.add(task_phy)

    # Completed coding task
    task_code = Task(
        title="Khởi tạo kiến trúc Life OS Backend",
        description="FastAPI + SQLAlchemy + SQLite + Alembic + Schemas",
        goal_id=goal_uni.id,
        project_id=proj_code.id,
        due_datetime=today_due - timedelta(hours=2),
        completed_datetime=now - timedelta(hours=1),
        difficulty=5,
        priority="URGENT",
        status="COMPLETED"
    )
    db.add(task_code)

    # 5. Calendar note
    db.add(CalendarNote(
        note_date=today,
        content="📝 Nhớ mang máy tính Casio fx-580VNX và tài liệu đề tích phân tới lớp học."
    ))

    db.commit()
    db.close()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
