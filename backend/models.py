from pydantic import BaseModel
from datetime import datetime

class Session(BaseModel):
    user_id: str
    task: str
    duration: int
    started_at: datetime
    ended_at: datetime