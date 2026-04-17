from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import date
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "sqlite:///./habits.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class HabitModel(Base):
    __tablename__ = "habits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String, default="General")
    time_of_day = Column(String, default="Morning")
    difficulty = Column(String, default="Medium")
    done = Column(Boolean, default=False)
    streak = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)
    last_done = Column(String, nullable=True)
    completion_log = Column(Text, default="")

Base.metadata.create_all(bind=engine)

QUOTES = [
    "Small daily improvements lead to stunning results.",
    "You don't have to be extreme, just consistent.",
    "The secret of your future is hidden in your daily routine.",
    "Motivation gets you started. Habit keeps you going.",
    "One day or day one. You decide.",
    "Don't count the days, make the days count.",
    "Progress, not perfection.",
    "You are what you repeatedly do.",
    "Show up every day, no matter what.",
]

DIFFICULTY_POINTS = {"Easy": 1, "Medium": 2, "Hard": 3}

TIPS = {
    "Health": {
        "Easy": [
            "Pair this habit with something you already do, like drinking water after brushing teeth.",
            "Keep it visible — put your vitamins next to your coffee maker.",
            "Track it for 7 days straight to build momentum.",
        ],
        "Medium": [
            "Schedule it like a meeting — block time in your calendar.",
            "Lay out your gear the night before to remove friction.",
            "Find an accountability partner to check in with weekly.",
        ],
        "Hard": [
            "Break it into a 2-minute starter version — just show up, even briefly.",
            "Focus on the identity: 'I am someone who exercises' not 'I have to exercise'.",
            "Remove one obstacle tonight that stops you from doing this tomorrow.",
        ],
    },
    "Work": {
        "Easy": [
            "Do this first thing before checking email or messages.",
            "Set a recurring reminder so it never slips your mind.",
            "Batch it with similar tasks to stay in the zone.",
        ],
        "Medium": [
            "Use time-blocking — protect 30 mins in your calendar for this daily.",
            "Turn off notifications while doing this to protect your focus.",
            "Review your progress weekly to stay motivated.",
        ],
        "Hard": [
            "Use the 2-minute rule — start with just the first tiny step.",
            "Identify your biggest blocker and solve just that one thing.",
            "Reward yourself immediately after completing it to reinforce the loop.",
        ],
    },
    "Learning": {
        "Easy": [
            "Listen to podcasts or audiobooks during commutes or chores.",
            "Keep your book or notes on your pillow as a reminder.",
            "Even 10 minutes a day compounds into mastery over a year.",
        ],
        "Medium": [
            "Use active recall — after reading, close the book and write what you remember.",
            "Teach what you learn to someone else to solidify it.",
            "Space your sessions out — daily short sessions beat weekend marathons.",
        ],
        "Hard": [
            "Break the skill into micro-skills and master one at a time.",
            "Find a mentor or community working on the same thing.",
            "Set a specific goal like 'finish chapter 3 by Friday' instead of 'study more'.",
        ],
    },
    "Personal": {
        "Easy": [
            "Anchor this to your morning or evening routine for consistency.",
            "Journal about how this habit makes you feel to stay motivated.",
            "Share your goal with one person who will cheer you on.",
        ],
        "Medium": [
            "Identify your 'why' — write it down and put it somewhere visible.",
            "Design your environment so the good choice is the easy choice.",
            "Celebrate small wins — don't wait until you've 'made it'.",
        ],
        "Hard": [
            "Be compassionate with yourself — missing one day doesn't break the habit.",
            "Scale down the habit until it feels easy, then slowly increase.",
            "Ask yourself: what would this look like if it were simple?",
        ],
    },
    "General": {
        "Easy": [
            "Stack this habit onto an existing one you already do reliably.",
            "Set a specific time and place — vague plans fail, specific ones stick.",
            "Track your streak to make consistency feel rewarding.",
        ],
        "Medium": [
            "Focus on showing up, not on being perfect.",
            "Remove friction — make the habit easier to start than to skip.",
            "Review your habits every Sunday and adjust what isn't working.",
        ],
        "Hard": [
            "Start absurdly small — 1 minute, 1 rep, 1 sentence. Just begin.",
            "Figure out what's making this hard and solve that specific problem.",
            "Give yourself grace on bad days — the goal is consistency, not perfection.",
        ],
    },
}

class HabitIn(BaseModel):
    name: str
    category: str = "General"
    time_of_day: str = "Morning"
    difficulty: str = "Medium"

class TipRequest(BaseModel):
    habit_name: str
    difficulty: str
    category: str

def habit_to_dict(h):
    return {
        "id": h.id, "name": h.name, "category": h.category,
        "time_of_day": h.time_of_day, "difficulty": h.difficulty,
        "done": h.done, "streak": h.streak, "best_streak": h.best_streak,
        "last_done": h.last_done,
        "completion_log": h.completion_log.split(",") if h.completion_log else [],
        "points": DIFFICULTY_POINTS.get(h.difficulty, 1)
    }

@app.get("/quote")
def get_quote():
    return {"quote": random.choice(QUOTES)}

@app.get("/habits")
def get_habits():
    db = SessionLocal()
    habits = db.query(HabitModel).all()
    db.close()
    return [habit_to_dict(h) for h in habits]

@app.post("/habits")
def create_habit(habit: HabitIn):
    db = SessionLocal()
    h = HabitModel(
        name=habit.name, category=habit.category,
        time_of_day=habit.time_of_day, difficulty=habit.difficulty
    )
    db.add(h)
    db.commit()
    db.refresh(h)
    db.close()
    return habit_to_dict(h)

@app.patch("/habits/{habit_id}/toggle")
def toggle_habit(habit_id: int):
    db = SessionLocal()
    h = db.query(HabitModel).filter(HabitModel.id == habit_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    today = str(date.today())
    if not h.done:
        h.done = True
        if h.last_done != today:
            h.streak += 1
            h.last_done = today
            if h.streak > h.best_streak:
                h.best_streak = h.streak
        log = h.completion_log.split(",") if h.completion_log else []
        if today not in log:
            log.append(today)
        h.completion_log = ",".join(filter(None, log))
    else:
        h.done = False
    db.commit()
    db.refresh(h)
    result = habit_to_dict(h)
    db.close()
    return result

@app.delete("/habits/{habit_id}")
def delete_habit(habit_id: int):
    db = SessionLocal()
    h = db.query(HabitModel).filter(HabitModel.id == habit_id).first()
    if h:
        db.delete(h)
        db.commit()
    db.close()
    return {"message": "Deleted"}

@app.post("/tip")
def get_tip(req: TipRequest):
    category_tips = TIPS.get(req.category, TIPS["General"])
    difficulty_tips = category_tips.get(req.difficulty, category_tips["Medium"])
    tip = random.choice(difficulty_tips)
    return {"tip": tip}

@app.get("/calendar")
def get_calendar():
    db = SessionLocal()
    habits = db.query(HabitModel).all()
    db.close()
    calendar_data = {}
    for h in habits:
        if h.completion_log:
            for d in h.completion_log.split(","):
                if d:
                    if d not in calendar_data:
                        calendar_data[d] = []
                    calendar_data[d].append(h.name)
    return calendar_data