from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Dict, Any, List
from app.api.deps import get_database
from app.models.task import Task
from app.models.goal import Goal, Project
from app.models.course import Course, CourseNode
from app.models.calendar_note import CalendarNote
from app.models.attachment import Attachment
from app.services.task_service import TaskService

router = APIRouter()

@router.get("")
def global_search(q: str = Query(..., min_length=1), db: Session = Depends(get_database)) -> Dict[str, Any]:
    pat = f"%{q}%"

    # Tasks
    tasks = db.query(Task).filter(
        or_(Task.title.ilike(pat), Task.description.ilike(pat))
    ).limit(10).all()
    tasks_out = [TaskService._format_task_out(t) for t in tasks]

    # Goals
    goals = db.query(Goal).filter(
        or_(Goal.title.ilike(pat), Goal.description.ilike(pat))
    ).limit(5).all()
    goals_out = [{"id": g.id, "title": g.title, "category": g.category} for g in goals]

    # Projects
    projects = db.query(Project).filter(
        or_(Project.title.ilike(pat), Project.description.ilike(pat))
    ).limit(5).all()
    projects_out = [{"id": p.id, "title": p.title, "color": p.color} for p in projects]

    # Courses
    courses = db.query(Course).filter(
        or_(Course.title.ilike(pat), Course.description.ilike(pat))
    ).limit(5).all()
    courses_out = [{"id": c.id, "title": c.title, "color": c.color} for c in courses]

    # Course Nodes / Lessons
    nodes = db.query(CourseNode).filter(
        or_(CourseNode.title.ilike(pat), CourseNode.description.ilike(pat))
    ).limit(10).all()
    nodes_out = [{"id": n.id, "course_id": n.course_id, "title": n.title, "type": n.type, "progress": n.progress} for n in nodes]

    # Notes
    notes = db.query(CalendarNote).filter(
        CalendarNote.content.ilike(pat)
    ).limit(5).all()
    notes_out = [{"id": n.id, "date": n.note_date.isoformat(), "content": n.content} for n in notes]

    return {
        "query": q,
        "tasks": tasks_out,
        "goals": goals_out,
        "projects": projects_out,
        "courses": courses_out,
        "course_nodes": nodes_out,
        "calendar_notes": notes_out
    }
