import unittest
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
from app.schemas.task import TaskTransferRequest

class TestLifeOSCore(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:", echo=False)
        Base.metadata.create_all(bind=self.engine)
        self.Session = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.Session()

    def tearDown(self):
        self.db.close()

    def test_task_transfer_system(self):
        old_due = datetime(2026, 9, 8, 21, 0)
        task_a = Task(
            title="Ôn 50 câu tích phân",
            description="Luyện đề mức độ vận dụng",
            due_datetime=old_due,
            difficulty=4,
            status="TODO"
        )
        self.db.add(task_a)
        self.db.commit()
        self.db.refresh(task_a)

        new_due = datetime(2026, 9, 9, 21, 0)
        result = TaskService.transfer_task(self.db, task_a.id, TaskTransferRequest(
            new_due_datetime=new_due,
            keep_subtasks=True,
            notes="Bận lịch đột xuất"
        ))

        self.assertIsNotNone(result)
        old_task_out = result["old_task"]
        new_task_out = result["new_task"]

        # 1. Old task status is TRANSFERRED and old deadline unchanged
        self.assertEqual(old_task_out.status, "TRANSFERRED")
        self.assertEqual(old_task_out.due_datetime, old_due)

        # 2. New task is TODO, linked with transferred_from_id
        self.assertEqual(new_task_out.status, "TODO")
        self.assertEqual(new_task_out.due_datetime, new_due)
        self.assertEqual(new_task_out.transferred_from_id, task_a.id)
        self.assertEqual(new_task_out.transferred_from_title, "Ôn 50 câu tích phân")

    def test_subtask_progress_calculation(self):
        task = Task(title="Ôn nguyên hàm", status="TODO", difficulty=3)
        self.db.add(task)
        self.db.commit()

        s1 = TaskService.add_subtask(self.db, task.id, "Học lý thuyết")
        s2 = TaskService.add_subtask(self.db, task.id, "Làm 20 câu")
        s3 = TaskService.add_subtask(self.db, task.id, "Chữa bài")
        s4 = TaskService.add_subtask(self.db, task.id, "Ghi lại lỗi sai")

        # 3 of 4 completed
        TaskService.toggle_subtask(self.db, s1.id)
        TaskService.toggle_subtask(self.db, s2.id)
        TaskService.toggle_subtask(self.db, s3.id)

        task_out = TaskService.get_task_by_id(self.db, task.id)
        self.assertEqual(task_out.subtasks_completed_count, 3)
        self.assertEqual(task_out.subtask_progress, 75.0)
        self.assertEqual(task_out.status, "PARTIAL")

    def test_fixed_schedule_conflict_detection(self):
        sched = FixedSchedule(
            title="Học Toán",
            day_of_week=0,  # Monday
            start_time="15:00",
            end_time="17:00",
            category="STUDY"
        )
        self.db.add(sched)
        self.db.commit()

        # Monday 15:30 to 17:00 (overlapping)
        monday_overlap_start = datetime(2026, 9, 7, 15, 30)
        monday_overlap_end = datetime(2026, 9, 7, 17, 0)
        conflict = ScheduleService.check_conflict(self.db, monday_overlap_start, monday_overlap_end)
        self.assertTrue(conflict.has_conflict)
        self.assertEqual(len(conflict.conflicts), 1)
        self.assertEqual(conflict.conflicts[0].title, "Học Toán")

        # Monday 08:00 to 09:00 (no overlap)
        monday_clean_start = datetime(2026, 9, 7, 8, 0)
        monday_clean_end = datetime(2026, 9, 7, 9, 0)
        clean = ScheduleService.check_conflict(self.db, monday_clean_start, monday_clean_end)
        self.assertFalse(clean.has_conflict)

    def test_course_progress_bubbling(self):
        course = Course(title="Toán Thầy Đức")
        self.db.add(course)
        self.db.commit()

        chapter = CourseNode(course_id=course.id, title="Chương 3", type="CHAPTER", status="NOT_STARTED")
        self.db.add(chapter)
        self.db.commit()

        b1 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 1", status="NOT_STARTED", progress=0.0)
        b2 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 2", status="NOT_STARTED", progress=0.0)
        b3 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 3", status="NOT_STARTED", progress=0.0)
        b4 = CourseNode(course_id=course.id, parent_id=chapter.id, title="Bài 4", status="NOT_STARTED", progress=0.0)
        self.db.add_all([b1, b2, b3, b4])
        self.db.commit()

        # Update 3 nodes to COMPLETED
        from app.schemas.course import CourseNodeUpdate
        CourseService.update_node(self.db, b1.id, CourseNodeUpdate(status="COMPLETED"))
        CourseService.update_node(self.db, b2.id, CourseNodeUpdate(status="COMPLETED"))
        CourseService.update_node(self.db, b3.id, CourseNodeUpdate(status="COMPLETED"))

        self.db.refresh(chapter)
        self.assertEqual(chapter.progress, 75.0)
        self.assertEqual(chapter.status, "IN_PROGRESS")

    def test_completion_rate_and_difficulty_points(self):
        now = datetime.utcnow()
        self.db.add(Task(title="Task 1", status="COMPLETED", completed_datetime=now, difficulty=3))
        self.db.add(Task(title="Task 2", status="COMPLETED", completed_datetime=now, difficulty=4))
        self.db.add(Task(title="Task 3", status="DELAYED", due_datetime=now, difficulty=2))
        self.db.add(Task(title="Task 4", status="TODO", due_datetime=now, difficulty=1))
        self.db.add(Task(title="Task 5", status="TRANSFERRED", due_datetime=now, difficulty=2))
        self.db.add(Task(title="Task 6", status="CANCELLED", due_datetime=now, difficulty=5))
        self.db.commit()

        stats = AnalyticsService.get_dashboard_stats(self.db)
        self.assertEqual(stats.tasks_completed, 2)
        self.assertEqual(stats.tasks_delayed, 1)
        self.assertEqual(stats.total_difficulty_points, 7)

if __name__ == "__main__":
    unittest.main()
