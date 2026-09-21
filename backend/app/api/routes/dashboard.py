from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_database
from app.schemas.analytics import (
    DashboardStatsResponse, HeatmapDay, BarChartResponse,
    WeeklyReviewCreate, WeeklyReviewOut
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_database)):
    return AnalyticsService.get_dashboard_stats(db)

@router.get("/heatmap", response_model=List[HeatmapDay])
def get_heatmap(days: int = Query(180, ge=30, le=365), db: Session = Depends(get_database)):
    return AnalyticsService.get_heatmap_data(db, days)

@router.get("/barchart", response_model=BarChartResponse)
def get_barchart(period: str = Query("DAY", pattern="^(DAY|WEEK|MONTH|YEAR)$"), db: Session = Depends(get_database)):
    return AnalyticsService.get_bar_chart_data(db, period)

@router.get("/weekly-review", response_model=Optional[WeeklyReviewOut])
def get_weekly_review(year: int = Query(...), week_number: int = Query(...), db: Session = Depends(get_database)):
    return AnalyticsService.get_weekly_review(db, year, week_number)

@router.post("/weekly-review", response_model=WeeklyReviewOut)
def save_weekly_review(review_in: WeeklyReviewCreate, db: Session = Depends(get_database)):
    return AnalyticsService.save_weekly_review(db, review_in)

@router.get("/header-summary")
def get_header_summary(db: Session = Depends(get_database)):
    """Retrieve combined header stats: streak, discipline rating, and upcoming task/schedule."""
    return AnalyticsService.get_header_summary(db)
