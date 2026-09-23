import unittest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base
from app.models.course import Course, CourseNode
from app.schemas.course import CourseNodeCreate, CourseNodeUpdate
from app.services.course_service import CourseService

class TestCourseGamificationAndExploit(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite:///:memory:')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Create a test course
        self.course = Course(
            title="Luyện thi Toán Chuyên",
            color="#10b981",
            mastery_points=0,
            mastery_level=1
        )
        self.db.add(self.course)
        self.db.commit()
        self.db.refresh(self.course)

        # Create a lesson node (duration 30 mins -> 30 EXP)
        self.node = CourseNode(
            course_id=self.course.id,
            title="Bài 1: Khảo sát hàm số",
            type="LESSON",
            duration=30,
            status="NOT_STARTED",
            progress=0.0,
            order_index=1
        )
        self.db.add(self.node)
        self.db.commit()
        self.db.refresh(self.node)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(self.engine)

    def test_tick_and_untick_idempotence(self):
        # 1. Complete node
        CourseService.update_node(self.db, self.node.id, CourseNodeUpdate(status="COMPLETED"))
        self.db.refresh(self.course)
        self.assertEqual(self.course.mastery_points, 30)

        # 2. Untick node (back to NOT_STARTED)
        CourseService.update_node(self.db, self.node.id, CourseNodeUpdate(status="NOT_STARTED"))
        self.db.refresh(self.course)
        self.assertEqual(self.course.mastery_points, 0)

        # 3. Repeated toggling 10 times
        for _ in range(10):
            CourseService.update_node(self.db, self.node.id, CourseNodeUpdate(status="COMPLETED"))
            self.db.refresh(self.course)
            self.assertEqual(self.course.mastery_points, 30)

            CourseService.update_node(self.db, self.node.id, CourseNodeUpdate(status="NOT_STARTED"))
            self.db.refresh(self.course)
            self.assertEqual(self.course.mastery_points, 0)

    def test_rank_11_threshold(self):
        # Set points to 60,050
        self.course.mastery_points = 60050
        CourseService.update_course_mastery_level(self.course)
        self.assertEqual(self.course.mastery_level, 11)

    def test_reset_course_mastery(self):
        self.course.mastery_points = 45000
        self.course.mastery_level = 10
        self.db.commit()

        CourseService.reset_course_mastery(self.db, self.course.id)
        self.db.refresh(self.course)
        self.assertEqual(self.course.mastery_points, 0)
        self.assertEqual(self.course.mastery_level, 1)

if __name__ == '__main__':
    unittest.main()
