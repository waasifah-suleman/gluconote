from fastapi import FastAPI
from .database import engine, Base
import backend.models

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def root():
    return {"status": "GlucoNote API is running"}