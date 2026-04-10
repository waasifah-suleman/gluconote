from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProfileBase(BaseModel):
    first_name: str
    last_name: str
    age: int
    weight: float
    diagnosis: str
    sex: str

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GlucoseReadingBase(BaseModel):
    value: float
    reading_time: datetime
    context: str
    notes: Optional[str] = None

class GlucoseReadingCreate(GlucoseReadingBase):
    pass

class GlucoseReadingResponse(GlucoseReadingBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    name: str
    dosage: str
    frequency: str
    start_date: datetime
    end_date: Optional[datetime] = None
    prescribing_doctor: Optional[str] = None

class MedicationCreate(MedicationBase):
    pass

class MedicationResponse(MedicationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorVisitBase(BaseModel):
    visit_date: datetime
    doctor_name: str
    notes: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class DoctorVisitCreate(DoctorVisitBase):
    pass

class DoctorVisitResponse(DoctorVisitBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    content: str
    tags: Optional[str] = None

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True