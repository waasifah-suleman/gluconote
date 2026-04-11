from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/readings", response_model=List[schemas.GlucoseReadingResponse])
def get_all_readings(db: Session = Depends(get_db)):
    readings = db.query(models.GlucoseReading).all()

    return readings

@router.post("/readings", response_model=schemas.GlucoseReadingResponse)
def create_reading(reading: schemas.GlucoseReadingCreate, db: Session = Depends(get_db)):
    new_reading = models.GlucoseReading(
        value=reading.value,
        reading_time=reading.reading_time,
        context=reading.context,
        notes=reading.notes
    )

    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)

    return new_reading

@router.get("/readings/{reading_id}", response_model=schemas.GlucoseReadingResponse)
def get_one_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.query(models.GlucoseReading).filter(
        models.GlucoseReading.id == reading_id
    ).first()

    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    return reading

@router.delete("/readings/{reading_id}")
def delete_reading(reading_id: int, db: Session = Depends(get_db)):
    reading = db.query(models.GlucoseReading).filter(
        models.GlucoseReading.id == reading_id
    ).first()

    if not reading:
        raise HTTPException(status_code=404, detail="Reading not found")
    
    db.delete(reading)
    db.commit()

    return {"message": "Reading deleted successfully"}