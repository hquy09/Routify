import pytest
from datetime import datetime, date, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.models.task import Task, Subtask
from app.models.course import Course, CourseNode
from app.models.fixed_schedule import FixedSchedule
from app.services.task_service import TaskService
from app.services.schedule_service import ScheduleService
from app.services.course_service import CourseService
from app.services.analytics_service import AnalyticsService
from app.schemas.task import TaskTransferRequest, ConflictCheckRequest

@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_task_transfer_system(test_db):
    """
    Requirement #7: TASK TRANSFER SYSTEM
    - Do not simply edit the old deadline!
    - Old task -> status = TRANSFERRED
    - New task -> status = TODO, transferred_from_id = old_task.id
    """
    old_due = datetime(2026, 9, 8, 21, 0)
    task_a = Task(
        title="Ôn 50 câu tích phân",
        description="Luyện đề mức độ vận dụng",
        due_datetime=old_due,
        difficulty=4,
        status="TODO"
    )
    test_db.add(task_a)
    test_db.commit()
    test_db.refresh(task_a)

    # Transfer task
    new_due = datetime(2026, 9, 9, 21, 0)
    result = TaskService.transfer_task(test_db, task_a.id, TaskTransferRequest(
        new_due_datetime=new_due,
        keep_subtasks=True,
        notes="Bận lịch đột xuất"
    ))

    assert result is not None
    old_task_out = result["old_task"]
    new_task_out = result["new_task"]

    # Old task checks
    assert old_task_out.status == "TRANSFERRED"
    assert old_task_out.due_datetime == old_due  # Deadline kept intact!

    # New task checks
    assert new_task_out.status == "TODO"
    assert new_task_out.due_datetime == new_due
    assert new_task_out.transferred_from_id == task_a.id
    assert new_task_out.transferred_from_title == "Ôn 50 câu tích phân"

def test_subtask_progress_calculation(test_db):
    """
    Requirement #8: Subtask progress display and partial completion
    """
    task = Task(title="Ôn nguyên hàm", status="TODO", difficulty=3)
    test_db.add(task)
    test_db.commit()

    s1 = TaskService.add_subtask(test_db, task.id, "Học lý thuyết")
    s2 = TaskService.add_subtask(test_db, task.id, "Làm 20 câu")
    s3 = TaskService.add_subtask(test_db, task.id, "Chữa bài")
    s4 = TaskService.add_subtask(test_db, task.id, "Ghi lại lỗi sai")

    # Initially 0%
    task_out = TaskService.get_task_by_id(test_db, task.id)
    assert task_out.subtasks_count == 4
    assert task_out.subtasks_completed_count == 0
    assert task_out.subtask_progress == 0.0

    # Complete 3 out of 4
    TaskService.toggle_subtask(test_db, s1.id)
    TaskService.toggle_subtask(test_db, s2.id)
    TaskService.toggle_subtask(test_db, s3.id)

    task_out = TaskService.get_task_by_id(test_db, task.id)
    assert task_out.subtasks_completed_count == 3
    assert task_out.subtask_progress == 75.0
    assert task_out.status == "PARTIAL"

def test_fixed_schedule_conflict_detection(test_db):
    """
    Requirement #50: Time Conflict Detection between Task and Fixed Schedule
    """
    # Fixed schedule on Monday (0) from 15:00 to 17:00
    sched = FixedSchedule(
        title="Học Toán",
        day_of_week=0,
        start_time="15:00",
        end_time="17:00",
        category="STUDY"
    )
    test_db.add(sched)
    test_db.commit()

    # Check overlapping task: Monday 15:30 to 17:00 (e.g. 2026-09-07 is Monday)
    monday = datetime(2026, 9, 7, 15, 30)
    monday_end = datetime(2026, 9, 7, 17, 0)

    conflict_res = ScheduleService.check_conflict(test_db, monday, monday_end)
    assert conflict_res.has_conflict is True
    assert len(conflict_res.conflicts) == 1
    assert conflict_res.conflicts[0].title == "Học Toán"

    # Non-overlapping task on Monday morning 08:00 - 09:00
    no_conflict_start = datetime(2026, 9, 7, 8, 0)
    no_conflict_end = datetime(2026, 9, 7, 9, 0)
    res_clean = ScheduleService.check_conflict(test_db, no_conflict_start, no_conflict_end)
    assert res_clean.has_conflict is False

def test_course_progress_bubbling(test_db):
    """
    Requirement #16: Course progress auto-aggregation from leaves to parents
    """
    course = Course(title="Toán Thầy Đức")
    test_db.add(course)
    test_db.commit()

    chapter = CourseNode(
        course_id=course.id,
        title="Chương 3",
        type="CHAPTER",
        status="NOT_STARTED"
    )
    test_db.add(chapter)
    test_db.commit()

    b1 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 1", status="NOT_STARTED", progress=0.0)
    b2 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 2", status="NOT_STARTED", progress=0.0)
    b3 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 3", status="NOT_STARTED", progress=0.0)
    b4 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 4", status="NOT_STARTED", progress=0.0)
    test_db.add_all([b1, b2, b3, b4])
    test_db.commit()

    # Complete 3 out of 4 lessons
    CourseService.update_node(test_db, b1.id, CourseNode(status="COMPLETED", progress=100.0, title="Bài 1"))
    CourseService.update_node(test_db, b2.id, CourseNode(status="COMPLETED", progress=100.0, title="Bài 2"))
    CourseService.update_node(test_db, b3.id, CourseNode(status="COMPLETED", progress=100.0, title="Bài 3"))

    test_db.refresh(chapter)
    assert chapter.progress == 75.0
    assert chapter.status == "IN_PROGRESS"

def test_completion_rate_formula(test_db):
    """
    Requirement #5, #24: Completion rate formula
    Formula: completed / (completed + incomplete + delayed) * 100%
    Cancelled tasks excluded. Transferred tasks not counted as completed.
    """
    now = datetime.utcnow()
    # 2 completed
    test_db.add(Task(title="Task 1", status="COMPLETED", completed_datetime=now, difficulty=3))
    test_db.add(Task(title="Task 2", status="COMPLETED", completed_datetime=now, difficulty=4))
    # 1 delayed
    test_db.add(Task(title="Task 3", status="DELAYED", due_datetime=now, difficulty=2))
    # 1 todo (incomplete)
    test_db.add(Task(title="Task 4", status="TODO", due_datetime=now, difficulty=1))
    # 1 transferred (not completed)
    test_db.add(Task(title="Task 5", status="TRANSFERRED", due_datetime=now, difficulty=2))
    # 1 cancelled (excluded)
    test_db.add(Task(title="Task 6", status="CANCELLED", due_datetime=now, difficulty=5))
    test_db.commit()

    stats = AnalyticsService.get_dashboard_stats(test_db)
    # completed = 2
    # denom = completed(2) + incomplete/transferred(2) + delayed(1) = 5
    # rate = 2 / 5 = 40.0%
    assert stats.tasks_completed == 2
    assert stats.tasks_delayed == 1
    # total difficulty points from completed tasks: 3 + 4 = 7
    assert stats.total_difficulty_points == 7
