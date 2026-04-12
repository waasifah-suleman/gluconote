from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/medications", response_model=List[schemas.MedicationResponse])
def get_all_medications(db: Session = Depends(get_db)):
    medications = db.query(models.Medication).all()

    return medications

@router.post("/medications", response_model=schemas.MedicationResponse)
def create_medication(medication: schemas.MedicationCreate, db: Session = Depends(get_db)):
    new_medication = models.Medication(
        name=medication.name,
        dosage=medication.dosage,
        frequency=medication.frequency,
        start_date=medication.start_date,
        end_date=medication.end_date,
        prescribing_doctor=medication.prescribing_doctor
    )

    db.add(new_medication)
    db.commit()
    db.refresh(new_medication)

    return new_medication

@router.put("/medications/{medication_id}", response_model=schemas.MedicationResponse)
def update_medication(medication_id: int, medication: schemas.MedicationCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Medication).filter(
        models.Medication.id == medication_id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    existing.name = medication.name
    existing.dosage = medication.dosage
    existing.frequency = medication.frequency
    existing.start_date = medication.start_date
    existing.end_date = medication.end_date
    existing.prescribing_doctor = medication.prescribing_doctor

    db.commit()
    db.refresh(existing)
    
    return existing

@router.delete("/medications/{medication_id}")
def delete_medication(medication_id: int, db: Session = Depends(get_db)):
    medication = db.query(models.Medication).filter(
        models.Medication.id == medication_id
    ).first()

    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    db.delete(medication)
    db.commit()

    return {"message": "Medication deleted successfully"}
