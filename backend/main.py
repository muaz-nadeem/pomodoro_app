from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uuid


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", 
                   "https://YOUR_FRONTEND_URL.vercel.app"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"message": "Backend is connected"}

class StartSessionRequest(BaseModel):
    duration: int  # minutes

@app.post("/sessions/start")
def start_session(data: StartSessionRequest):
    session_id = str(uuid.uuid4())
    start_time = datetime.utcnow()

    return {
        "session_id": session_id,
        "start_time": start_time,
        "duration": data.duration
    }

@app.put("/sessions/end/{session_id}")
def end_session(session_id: str):
    end_time = datetime.utcnow()

    # TEMP: Since no DB yet, we fake duration
    return {
        "session_id": session_id,
        "end_time": end_time,
        "status": "completed"
    }
