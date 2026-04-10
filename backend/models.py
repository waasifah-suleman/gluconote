from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from .database import Base

class Profile(Base):
    __tablename__ = "profile"

    id = Column(Integer, primary_key=True)

    first_name = Column(String(50))
    last_name = Column(String(50))
    age = Column(Integer)
    weight = Column(Float)
    diagnosis = Column(String)
    sex = Column(String)
    created_at = Column(DateTime, default=func.now())

class GlucoseReading(Base):
    __tablename__ = "glucose_readings"

    id = Column(Integer, primary_key=True)

    value = Column(Float)
    reading_time = Column(DateTime, default=func.now())
    context = Column(String)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True)

    name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    prescribing_doctor = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

class DoctorVisit(Base):
    __tablename__ = "doctor_visits"

    id = Column(Integer, primary_key=True)

    visit_date = Column(DateTime)
    doctor_name = Column(String)
    notes = Column(String, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

class Note(Base):
    __tablename__ = "general_notes"

    id = Column(Integer, primary_key=True)
    
    content = Column(String)
    tags = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())