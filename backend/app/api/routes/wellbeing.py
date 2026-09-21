from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.api.deps import get_database
from app.schemas.wellbeing import (
    GlobalWellbeingAnalysis,
    WellbeingCustomConfig,
    TensionSummary,
)
from app.services.wellbeing_service import WellbeingService

router = APIRouter()

@router.get("/analysis", response_model=GlobalWellbeingAnalysis)
def get_global_wellbeing_analysis(db: Session = Depends(get_database)):
    try:
        return WellbeingService.get_global_wellbeing_analysis(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis", response_model=GlobalWellbeingAnalysis)
def calculate_custom_wellbeing_analysis(
    config: Optional[WellbeingCustomConfig] = Body(default=None),
    db: Session = Depends(get_database)
):
    try:
        return WellbeingService.get_global_wellbeing_analysis(db, config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calibrate", response_model=WellbeingCustomConfig)
def calibrate_wellbeing(db: Session = Depends(get_database)):
    try:
        return WellbeingService.calibrate_wellbeing(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/settings")
def save_wellbeing_settings(
    config: WellbeingCustomConfig,
    db: Session = Depends(get_database)
):
    try:
        WellbeingService.save_wellbeing_settings(db, config)
        return {"ok": True, "message": "Đã lưu cài đặt sức khỏe tinh thần thành công"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tension-summary", response_model=TensionSummary)
def get_tension_summary(db: Session = Depends(get_database)):
    try:
        analysis = WellbeingService.get_global_wellbeing_analysis(db)
        return analysis.tension
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
