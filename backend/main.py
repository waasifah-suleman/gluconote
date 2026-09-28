from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base
from . import models
from .routers import readings, medications, visits, notes, profile, search, summary
from .seed import seed_demo_data

Base.metadata.create_all(bind=engine)

# Adds sample data only when the database is empty (e.g. a fresh deploy on Render)
seed_demo_data()

app = FastAPI(title="GlucoNote")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(readings.router)
app.include_router(medications.router)
app.include_router(visits.router)
app.include_router(notes.router)
app.include_router(profile.router)
app.include_router(search.router)
app.include_router(summary.router)


@app.get("/health")
def health():
    return {"status": "GlucoNote API is running"}


# Serve the frontend (index.html, style.css, app.js) from the same server.
# This is mounted last so the API routes above always take priority.
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
