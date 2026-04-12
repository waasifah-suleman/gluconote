from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models
from ..database import get_db
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    thirty_days_ago = datetime.now() - timedelta(days=30)

    all_readings = db.query(models.GlucoseReading).filter(
        models.GlucoseReading.reading_time >= thirty_days_ago
    ).all()

    if all_readings:
        values = [r.value for r in all_readings]
        average = round(sum(values) / len(values), 2)
        highest = max(values)
        lowest = min(values)
        total_readings = len(values)
    else:
        average = None
        highest = None
        lowest = None
        total_readings = 0
        
    active_medications = db.query(models.Medication).filter(
        models.Medication.end_date == None
    ).all()

    recent_visits = db.query(models.DoctorVisit).order_by(
        models.DoctorVisit.visit_date.desc()
    ).limit(3).all()

    recent_notes = db.query(models.Note).order_by(
        models.Note.created_at.desc()
    ).limit(5).all()

    profile = db.query(models.Profile).first()

    return {
        "patient": {
            "name": f"{profile.first_name} {profile.last_name}" if profile else "Unknown",
            "age": profile.age if profile else None,
            "diagnosis": profile.diagnosis if profile else None
        },
        "glucose_summary": {
            "period": "last 30 days",
            "total_readings": total_readings,
            "average": average,
            "highest": highest,
            "lowest": lowest
        },
        "active_medications": [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency} for m in active_medications
        ],
        "recent_visits": [
            {"doctor": v.doctor_name, "date": v.visit_date, "notes": v.notes} for v in recent_visits
        ],
        "recent_notes": [
            {"content": n.content, "tags": n.tags, "date": n.created_at} for n in recent_notes
        ]
    }