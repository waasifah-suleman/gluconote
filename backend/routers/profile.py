from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/profile", response_model=schemas.ProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(models.Profile).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return profile

@router.post("/profile", response_model=schemas.ProfileResponse)
def create_profile(profile: schemas.ProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Profile).first()

    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists, use PUT to update")
    new_profile = models.Profile(
        first_name=profile.first_name,
        last_name=profile.last_name,
        age=profile.age,
        weight=profile.weight,
        diagnosis=profile.diagnosis,
        sex=profile.sex
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile

@router.put("/profile", response_model=schemas.ProfileResponse)
def update_profile(profile: schemas.ProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Profile).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    existing.first_name = profile.first_name
    existing.last_name = profile.last_name
    existing.age = profile.age
    existing.weight = profile.weight
    existing.diagnosis = profile.diagnosis
    existing.sex = profile.sex

    db.commit()
    db.refresh(existing)

    return existing