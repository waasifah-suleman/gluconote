from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/notes", response_model=list[schemas.NoteResponse])
def get_all_notes(db: Session = Depends(get_db)):
    notes = db.query(models.Note).all()

    return notes

@router.post("/notes", response_model=schemas.NoteResponse)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    new_note = models.Note(
        content=note.content,
        tags=note.tags
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note

@router.delete("/notes/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(
        models.Note.id == note_id
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()

    return {"message": "Note deleted successfully"}