from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api.deps import get_database
from app.models.goal import Goal, Project
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut, ProjectCreate, ProjectUpdate, ProjectOut

router = APIRouter()

@router.get("", response_model=List[GoalOut])
def list_goals(db: Session = Depends(get_database)):
    return db.query(Goal).options(joinedload(Goal.projects)).all()

@router.post("", response_model=GoalOut)
def create_goal(goal_in: GoalCreate, db: Session = Depends(get_database)):
    goal = Goal(**goal_in.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(goal_id: int, goal_in: GoalUpdate, db: Session = Depends(get_database)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, val in goal_in.model_dump(exclude_unset=True).items():
        setattr(goal, field, val)
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_database)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}

# Projects
@router.get("/projects", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_database)):
    return db.query(Project).all()

@router.post("/projects", response_model=ProjectOut)
def create_project(proj_in: ProjectCreate, db: Session = Depends(get_database)):
    project = Project(**proj_in.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, proj_in: ProjectUpdate, db: Session = Depends(get_database)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, val in proj_in.model_dump(exclude_unset=True).items():
        setattr(project, field, val)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/projects/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_database)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
