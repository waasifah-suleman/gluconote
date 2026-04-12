from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/visits", response_model=list[schemas.DoctorVisitResponse])
def get_all_visits(db: Session = Depends(get_db)):
    visits = db.query(models.DoctorVisit).all()

    return visits

@router.post("/visits", response_model=schemas.DoctorVisitResponse)
def create_visit(visit: schemas.DoctorVisitCreate, db: Session = Depends(get_db)):
    new_visit = models.DoctorVisit(
        visit_date=visit.visit_date,
        doctor_name=visit.doctor_name,
        notes=visit.notes,
        follow_up_date=visit.follow_up_date
    )

    db.add(new_visit)
    db.commit()
    db.refresh(new_visit)

    return new_visit

@router.put("/visits/{visit_id}", response_model=schemas.DoctorVisitResponse)
def update_visit(visit_id: int, visit: schemas.DoctorVisitCreate, db: Session = Depends(get_db)):
    existing = db.query(models.DoctorVisit).filter(
        models.DoctorVisit.id == visit_id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    existing.visit_date = visit.visit_date
    existing.doctor_name = visit.doctor_name
    existing.notes = visit.notes
    existing.follow_up_date = visit.follow_up_date

    db.commit()
    db.refresh(existing)

    return existing

@router.delete("/visits/{visit_id}")
def delete_visit(visit_id: int, db: Session = Depends(get_db)):
    visit = db.query(models.DoctorVisit).filter(
        models.DoctorVisit.id == visit_id
    ).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    db.delete(visit)
    db.commit()

    return {"message": "Visit deleted successfully"}