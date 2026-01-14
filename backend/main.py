from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uuid

from models import Session
from storage import sessions


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
    session = Session(
        user_id="anonymous",
        task=task,
        duration=duration,
        started_at=datetime.utcnow(),
        ended_at=datetime.utcnow(),  # temporary
    )

    session_id = str(uuid.uuid4())

    sessions.append({
        "id": session_id,
        "session": session
    })

    return {
        "message": "Session started",
        "session_id": session_id,
        "session": session
    }


@app.put("/sessions/end/{session_id}")
def end_session(session_id: str):
    for item in sessions:
        if item["id"] == session_id:
            item["session"].ended_at = datetime.utcnow()
            return {
                "message": "Session ended",
                "session": item["session"]
            }

    return {"error": "Session not found"}


@app.get("/sessions")
def get_sessions():
    return sessions
