from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.api.deps import get_database
from app.models.course import CourseNode
from app.schemas.course import (
    CourseCreate, CourseUpdate, CourseOut, CourseDetailOut,
    CourseNodeCreate, CourseNodeUpdate, CourseNodeOut, CreateStudyTaskRequest,
    BurnoutAnalysisOut, BurnoutCustomConfig
)
from app.schemas.task import TaskOut
from app.services.course_service import CourseService

router = APIRouter()

@router.get("", response_model=List[CourseOut])
def list_courses(db: Session = Depends(get_database)):
    return CourseService.list_courses(db)

@router.get("/all-nodes", response_model=List[CourseNodeOut])
def list_all_course_nodes(db: Session = Depends(get_database)):
    """Return all course nodes with course_title to allow direct task association."""
    nodes = db.query(CourseNode).options(joinedload(CourseNode.course)).order_by(CourseNode.course_id, CourseNode.order_index).all()
    out: List[CourseNodeOut] = []
    for n in nodes:
        node_out = CourseNodeOut.model_validate(n)
        node_out.course_title = n.course.title if n.course else None
        out.append(node_out)
    return out

@router.post("", response_model=CourseOut)
def create_course(course_in: CourseCreate, db: Session = Depends(get_database)):
    course = CourseService.create_course(db, course_in)
    return CourseService.get_course_detail(db, course.id)

@router.get("/{course_id}", response_model=CourseDetailOut)
def get_course_detail(course_id: int, db: Session = Depends(get_database)):
    detail = CourseService.get_course_detail(db, course_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Course not found")
    return detail

@router.put("/{course_id}", response_model=CourseDetailOut)
def update_course(course_id: int, course_in: CourseUpdate, db: Session = Depends(get_database)):
    course = CourseService.update_course(db, course_id, course_in)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseService.get_course_detail(db, course_id)

@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_database)):
    success = CourseService.delete_course(db, course_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted successfully"}

@router.post("/nodes", response_model=CourseNodeOut)
def create_node(node_in: CourseNodeCreate, db: Session = Depends(get_database)):
    node = CourseService.create_node(db, node_in)
    return CourseNodeOut.model_validate(node)

@router.put("/nodes/{node_id}", response_model=CourseNodeOut)
def update_node(node_id: int, node_in: CourseNodeUpdate, db: Session = Depends(get_database)):
    node = CourseService.update_node(db, node_id, node_in)
    if not node:
        raise HTTPException(status_code=404, detail="Course node not found")
    return CourseNodeOut.model_validate(node)

@router.delete("/nodes/{node_id}")
def delete_node(node_id: int, db: Session = Depends(get_database)):
    success = CourseService.delete_node(db, node_id)
    if not success:
        raise HTTPException(status_code=404, detail="Course node not found")
    return {"message": "Node deleted successfully"}

@router.post("/create-task", response_model=TaskOut)
def create_study_task(req: CreateStudyTaskRequest, db: Session = Depends(get_database)):
    task = CourseService.create_study_task_from_lesson(db, req)
    if not task:
        raise HTTPException(status_code=404, detail="Course lesson node not found")
    return task

@router.get("/{course_id}/burnout-analysis", response_model=BurnoutAnalysisOut)
def get_burnout_analysis(course_id: int, db: Session = Depends(get_database)):
    try:
        return CourseService.analyze_burnout_risk(db, course_id, None)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{course_id}/burnout-analysis", response_model=BurnoutAnalysisOut)
def analyze_burnout_risk_custom(
    course_id: int,
    config: Optional[BurnoutCustomConfig] = Body(default=None),
    db: Session = Depends(get_database)
):
    try:
        return CourseService.analyze_burnout_risk(db, course_id, config)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{course_id}/calibrate-burnout", response_model=BurnoutCustomConfig)
def calibrate_burnout(course_id: int, db: Session = Depends(get_database)):
    try:
        return CourseService.calibrate_burnout(db, course_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-all-ranks")
def reset_all_ranks(db: Session = Depends(get_database)):
    """Reset mastery points and levels of all courses to 0 / Level 1."""
    count = CourseService.reset_all_course_mastery(db)
    return {"message": f"Successfully reset mastery rank for {count} courses", "count": count}

@router.post("/{course_id}/reset-mastery", response_model=CourseDetailOut)
def reset_course_mastery(course_id: int, db: Session = Depends(get_database)):
    """Reset mastery points and level of a specific course."""
    course = CourseService.reset_course_mastery(db, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseService.get_course_detail(db, course_id)

