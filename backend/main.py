from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid
from models import Session
from firebase import db

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://YOUR_FRONTEND_URL.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
def ping():
    return {"message": "Backend is connected"}


@app.post("/sessions/start")
def start_session(task: str, duration: int):
    session_id = str(uuid.uuid4())

    session_data = {
        "user_id": "anonymous",
        "task": task,
        "duration": duration,
        "started_at": datetime.utcnow(),
        "ended_at": None
    }

    db.collection("sessions").document(session_id).set(session_data)

    return {
        "message": "Session started",
        "session_id": session_id,
        "session": session_data
    }


@app.put("/sessions/end/{session_id}")
def end_session(session_id: str):
    session_ref = db.collection("sessions").document(session_id)
    session_ref.update({
        "ended_at": datetime.utcnow()
    })

    return {
        "message": "Session ended",
        "session_id": session_id
    }


@app.get("/sessions")
def get_sessions():
    sessions = []
    docs = db.collection("sessions").stream()

    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        sessions.append(data)

    return sessions

