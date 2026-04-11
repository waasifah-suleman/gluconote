from fastapi import FastAPI
from .database import engine, Base
import backend.models
from backend.routers import readings

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(readings.router)

@app.get("/")
def root():
    return {"status": "GlucoNote API is running"}