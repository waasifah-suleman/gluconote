from fastapi import FastAPI
from .database import engine, Base
import backend.models
from backend.routers import readings, medications, visits, notes, profile, search, summary

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(readings.router)
app.include_router(medications.router)
app.include_router(visits.router)
app.include_router(notes.router)
app.include_router(profile.router)
app.include_router(search.router)
app.include_router(summary.router)

@app.get("/")
def root():
    return {"status": "GlucoNote API is running"}