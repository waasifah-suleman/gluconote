from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from typing import List

router = APIRouter()

@router.get("/search")
def search(q: str, db: Session = Depends(get_db)): # searching acrross tables and return all that matches
    readings = db.query(models.GlucoseReading).filter(
        models.GlucoseReading.context.ilike(f"%{q}%") |
        models.GlucoseReading.notes.ilike(f"%{q}%")
    ).all()

    medications = db.query(models.Medication).filter(
        models.Medication.name.ilike(f"%{q}%") |
        models.Medication.prescribing_doctor.ilike(f"%{q}%")
    ).all()

    visits = db.query(models.DoctorVisit).filter(
        models.DoctorVisit.doctor_name.ilike(f"%{q}%") |
        models.DoctorVisit.notes.ilike(f"%{q}%")
    ).all()

    notes = db.query(models.Note).filter(
        models.Note.content.ilike(f"%{q}%") |
        models.Note.tags.ilike(f"%{q}%")
    ).all()

    return {
        "query": q,
        "results": {
            "readings": [{
                "id": r.id, "value": r.value, "context": r.context, "reading_time": r.reading_time} for r in readings],
            "medications": [{"id": m.id, "name": m.name, "dosage": m.dosage, "start_date": m.start_date} for m in medications],
            "visits": [{"id": v.id, "doctor_name": v.doctor_name, "visit_date": v.visit_date} for v in visits],
            "notes": [{"id": n.id, "content": n.content, "tags": n.tags} for n in notes]
        }
    }