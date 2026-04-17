"use client";
import { useState, useEffect, useRef } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";

const CATEGORIES = ["Health", "Work", "Learning", "Personal", "General"];
const TIMES = ["Morning", "Evening"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const DIFFICULTY_COLORS = { Easy: "#4ade80", Medium: "#f59e0b", Hard: "#f87171" };
const CATEGORY_COLORS = {
  Health: "#4ade80", Work: "#60a5fa", Learning: "#f59e0b",
  Personal: "#e879f9", General: "#94a3b8"
};
const QUOTES = [
  "Small daily improvements lead to stunning results.",
  "You don't have to be extreme, just consistent.",
  "The secret of your future is hidden in your daily routine.",
  "Motivation gets you started. Habit keeps you going.",
  "One day or day one. You decide.",
  "Don't count the days, make the days count.",
  "Progress, not perfection.",
  "You are what you repeatedly do.",
  "Show up every day, no matter what.",
];
const DURATIONS = [5, 10, 15, 25, 45, 60];
const TIMER_THEMES = [
  {
    name: "Focus", emoji: "🎯",
    grad: "radial-gradient(ellipse at top, #302b63 0%, #0f0c29 70%)",
    accent: "#818cf8", text: "#e0e7ff",
    quote: "Deep work is the superpower of the 21st century.",
    genre: "Lofi Hip Hop", youtubeId: "jfKfPfyJRdk",
  },
  {
    name: "Breathe", emoji: "🌊",
    grad: "radial-gradient(ellipse at top, #164e63 0%, #0a1628 70%)",
    accent: "#38bdf8", text: "#e0f2fe",
    quote: "Inhale calm. Exhale the rest.",
    genre: "Rain & Ocean Sounds", youtubeId: "q76bMs-NwRk",
  },
  {
    name: "Power", emoji: "⚡",
    grad: "radial-gradient(ellipse at top, #7c2d12 0%, #1a0500 70%)",
    accent: "#f97316", text: "#fff7ed",
    quote: "Pain is temporary. Quitting lasts forever.",
    genre: "Motivational Hip Hop", youtubeId: "tgbNymZ7vqY",
  },
  {
    name: "Zen", emoji: "🍃",
    grad: "radial-gradient(ellipse at top, #14532d 0%, #071a0f 70%)",
    accent: "#4ade80", text: "#f0fdf4",
    quote: "Peace is not the absence of noise, but the presence of calm.",
    genre: "Piano & Classical", youtubeId: "77ZozI0rw7w",
  },
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [page, setPage] = useState("home"); // "home" | "calendar"
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [timeOfDay, setTimeOfDay] = useState("Morning");
  const [difficulty, setDifficulty] = useState("Medium");
  const [showForm, setShowForm] = useState(false);
  const [focusHabit, setFocusHabit] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(TIMER_THEMES[0]);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [tips, setTips] = useState({});
  const [loadingTip, setLoadingTip] = useState(null);
  const [calendarData, setCalendarData] = useState({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setQuoteIndex(i => (i + 1) % QUOTES.length); setFade(true); }, 400);
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (user) {
      fetch("http://localhost:8000/habits").then(r => r.json()).then(setHabits);
      fetch("http://localhost:8000/calendar").then(r => r.json()).then(setCalendarData);
    }
  }, [user]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current); setTimerRunning(false); return 0; }
          return s - 1;
        });
      }, 1000);
    } else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const fetchTip = async (habit) => {
    if (tips[habit.id]) return;
    setLoadingTip(habit.id);
    const res = await fetch("http://localhost:8000/tip", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_name: habit.name, difficulty: habit.difficulty, category: habit.category }),
    });
    const data = await res.json();
    setTips(t => ({ ...t, [habit.id]: data.tip }));
    setLoadingTip(null);
  };

  const setThemeAndReset = (theme) => {
    setSelectedTheme(theme); setTimerSeconds(customMinutes * 60);
    setTimerRunning(false); setShowMusic(false);
  };

  const setDuration = (mins) => {
    const m = Math.max(1, Math.min(180, mins));
    setCustomMinutes(m); setTimerSeconds(m * 60); setTimerRunning(false);
  };

  const openFocus = (habit) => {
    setFocusHabit(habit); setTimerSeconds(customMinutes * 60);
    setTimerRunning(false); setShowMusic(false);
  };

  const closeFocus = () => {
    setFocusHabit(null); setTimerRunning(false);
    setShowMusic(false); clearInterval(intervalRef.current);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const totalSecs = customMinutes * 60;
  const pct = totalSecs > 0 ? ((totalSecs - timerSeconds) / totalSecs) * 100 : 0;
  const rr = 100, circ = 2 * Math.PI * rr;

  const login = useGoogleLogin({
    onSuccess: async (res) => {
      const info = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${res.access_token}` }
      }).then(r => r.json());
      setUser(info);
    }
  });

  const addHabit = async () => {
    if (!name.trim()) return;
    const res = await fetch("http://localhost:8000/habits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, time_of_day: timeOfDay, difficulty }),
    });
    const saved = await res.json();
    setHabits([...habits, saved]);
    setName(""); setShowForm(false);
  };

  const toggleHabit = async (id) => {
    const res = await fetch(`http://localhost:8000/habits/${id}/toggle`, { method: "PATCH" });
    const updated = await res.json();
    setHabits(habits.map(h => h.id === id ? updated : h));
    fetch("http://localhost:8000/calendar").then(r => r.json()).then(setCalendarData);
  };

  const deleteHabit = async (id) => {
    await fetch(`http://localhost:8000/habits/${id}`, { method: "DELETE" });
    setHabits(habits.filter(h => h.id !== id));
    setTips(t => { const n = { ...t }; delete n[id]; return n; });
  };

  const done = habits.filter(h => h.done).length;
  const total = habits.length;
  const scorePct = total ? Math.round((done / total) * 100) : 0;
  const morning = habits.filter(h => h.time_of_day === "Morning");
  const evening = habits.filter(h => h.time_of_day === "Evening");

  const font = { fontFamily: "'DM Sans', sans-serif" };
  const serif = { fontFamily: "'DM Serif Display', serif" };
  const selectStyle = { ...font, flex: 1, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "0.88rem", color: "#475569", outline: "none", background: "#fff" };
  const inputStyle = { ...font, width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box", outline: "none", color: "#0f172a", background: "#fff" };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return { first, days };
  };

  const formatDate = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  if (!user) return (
    <div style={{ ...font, minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>🌱</div>
        <h1 style={{ ...serif, fontSize: "3rem", fontWeight: "400", margin: "0 0 10px 0", color: "#f8fafc" }}>Daily Habits</h1>
        <p style={{ color: "#475569", marginBottom: "40px" }}>Build the life you want, one day at a time.</p>
        <button onClick={() => login()} style={{
          ...font, background: "#fff", color: "#1e293b", border: "none", borderRadius: "12px",
          padding: "14px 32px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "10px", margin: "0 auto"
        }}>
          <img src="https://www.google.com/favicon.ico" width="18" height="18" />
          Sign in with Google
        </button>
      </div>
    </div>
  );

  const HabitCard = ({ habit }) => (
    <div style={{
      background: habit.done ? "#f0fdf4" : "#fff",
      border: `1px solid ${habit.done ? "#bbf7d0" : "#f1f5f9"}`,
      borderRadius: "14px", padding: "18px 22px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)", ...font
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", flex: 1 }} onClick={() => toggleHabit(habit.id)}>
          <div style={{
            width: "24px", height: "24px", borderRadius: "50%",
            border: `2px solid ${habit.done ? "#4ade80" : "#e2e8f0"}`,
            background: habit.done ? "#4ade80" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "all 0.2s"
          }}>
            {habit.done && <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: "700" }}>✓</span>}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <p style={{ margin: 0, fontSize: "0.98rem", fontWeight: "500", textDecoration: habit.done ? "line-through" : "none", color: habit.done ? "#86efac" : "#0f172a" }}>{habit.name}</p>
              <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: "99px", fontWeight: "700", background: DIFFICULTY_COLORS[habit.difficulty] + "22", color: DIFFICULTY_COLORS[habit.difficulty] }}>{habit.difficulty}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
              <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "99px", fontWeight: "600", background: CATEGORY_COLORS[habit.category] + "18", color: CATEGORY_COLORS[habit.category] }}>{habit.category}</span>
              {habit.streak > 0 && <span style={{ fontSize: "0.75rem", color: "#f97316" }}>🔥 {habit.streak} day streak</span>}
              {habit.best_streak > 1 && <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>· best: {habit.best_streak}</span>}
              <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>· {habit.points}pt{habit.points > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => openFocus(habit)} style={{
            ...font, background: "#f8fafc", border: "1px solid #e2e8f0",
            borderRadius: "8px", padding: "6px 14px", cursor: "pointer",
            fontSize: "0.78rem", color: "#64748b", fontWeight: "500"
          }}>⏱ Focus</button>
          <button onClick={() => fetchTip(habit)} style={{
            ...font, background: tips[habit.id] ? "#fef3c7" : "#f8fafc",
            border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 14px",
            cursor: "pointer", fontSize: "0.78rem", color: tips[habit.id] ? "#92400e" : "#64748b", fontWeight: "500"
          }}>{loadingTip === habit.id ? "..." : "💡 Tip"}</button>
          <button onClick={() => deleteHabit(habit.id)} style={{
            background: "none", border: "1px solid #f1f5f9", cursor: "pointer",
            color: "#cbd5e1", fontSize: "0.85rem", padding: "6px 10px", borderRadius: "8px"
          }}>✕</button>
        </div>
      </div>
      {tips[habit.id] && (
        <div style={{ marginTop: "14px", padding: "12px 16px", background: "#fffbeb", borderRadius: "8px", borderLeft: "3px solid #f59e0b" }}>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#78350f", lineHeight: "1.6" }}>💡 {tips[habit.id]}</p>
        </div>
      )}
    </div>
  );

  const Section = ({ label, list }) => list.length === 0 ? null : (
    <div style={{ marginBottom: "36px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <h2 style={{ ...font, fontSize: "0.7rem", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>{label}</h2>
        <span style={{ background: "#f1f5f9", color: "#94a3b8", fontSize: "0.7rem", padding: "2px 7px", borderRadius: "99px" }}>{list.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {list.map(h => <HabitCard key={h.id} habit={h} />)}
      </div>
    </div>
  );

  const CalendarPage = () => {
    const { first, days } = getDaysInMonth(calendarMonth);
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const blanks = Array(first).fill(null);
    const dayNums = Array.from({ length: days }, (_, i) => i + 1);
    const today = new Date();

    return (
      <div style={{ flex: 1, padding: "40px 52px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px" }}>
          <h2 style={{ ...serif, margin: 0, fontSize: "2rem", fontWeight: "400", color: "#0f172a" }}>Calendar</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button onClick={() => setCalendarMonth(new Date(year, month - 1))} style={{ ...font, background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", color: "#475569" }}>←</button>
            <span style={{ ...font, fontWeight: "600", color: "#0f172a", fontSize: "0.95rem" }}>
              {calendarMonth.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
            </span>
            <button onClick={() => setCalendarMonth(new Date(year, month + 1))} style={{ ...font, background: "#f1f5f9", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", color: "#475569" }}>→</button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "8px" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ ...font, textAlign: "center", fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8", letterSpacing: "0.08em" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
          {blanks.map((_, i) => <div key={`b${i}`} />)}
          {dayNums.map(day => {
            const dateStr = formatDate(year, month, day);
            const completedHabits = calendarData[dateStr] || [];
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const intensity = completedHabits.length === 0 ? 0 : Math.min(completedHabits.length / Math.max(total, 1), 1);
            const bg = completedHabits.length === 0 ? "#f8fafc" : `rgba(99, 102, 241, ${0.15 + intensity * 0.75})`;

            return (
              <div key={day} title={completedHabits.length > 0 ? completedHabits.join(", ") : "No habits"} style={{
                background: bg,
                border: isToday ? "2px solid #6366f1" : "1px solid #f1f5f9",
                borderRadius: "10px", padding: "10px 8px", textAlign: "center", cursor: "pointer",
                transition: "all 0.2s", minHeight: "60px", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-start", gap: "4px"
              }}>
                <span style={{ ...font, fontSize: "0.82rem", fontWeight: isToday ? "700" : "500", color: completedHabits.length > 0 ? "#fff" : "#94a3b8" }}>{day}</span>
                {completedHabits.length > 0 && (
                  <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>{completedHabits.length} ✓</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "28px" }}>
          <span style={{ ...font, fontSize: "0.75rem", color: "#94a3b8" }}>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <div key={v} style={{ width: "20px", height: "20px", borderRadius: "4px", background: v === 0 ? "#f8fafc" : `rgba(99,102,241,${0.15 + v * 0.75})`, border: "1px solid #f1f5f9" }} />
          ))}
          <span style={{ ...font, fontSize: "0.75rem", color: "#94a3b8" }}>More</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", ...font }}>

      {/* Focus Modal */}
      {focusHabit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: selectedTheme.grad, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: "28px", display: "flex", gap: "8px" }}>
            {TIMER_THEMES.map(t => (
              <button key={t.name} onClick={() => setThemeAndReset(t)} style={{
                ...font, background: selectedTheme.name === t.name ? selectedTheme.accent : "rgba(255,255,255,0.07)",
                border: "none", borderRadius: "99px", padding: "7px 18px", cursor: "pointer",
                color: selectedTheme.name === t.name ? "#fff" : "rgba(255,255,255,0.35)",
                fontSize: "0.8rem", fontWeight: "600", transition: "all 0.3s"
              }}>{t.emoji} {t.name}</button>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px", marginTop: 0 }}>focusing on</p>
          <p style={{ ...serif, color: selectedTheme.text, fontSize: "1.3rem", margin: "0 0 32px 0", fontWeight: "400" }}>{focusHabit.name}</p>
          <div style={{ position: "relative", marginBottom: "28px" }}>
            <svg width="240" height="240" viewBox="0 0 240 240">
              <circle cx="120" cy="120" r={rr} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="120" cy="120" r={rr} fill="none" stroke={selectedTheme.accent} strokeWidth="8"
                strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
                strokeLinecap="round" transform="rotate(-90 120 120)"
                style={{ transition: "stroke-dashoffset 1s linear" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ ...serif, fontSize: "3.2rem", color: selectedTheme.text, fontWeight: "400", lineHeight: 1 }}>{fmt(timerSeconds)}</div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.7rem", marginTop: "6px", letterSpacing: "0.1em" }}>REMAINING</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                ...font, background: customMinutes === d ? selectedTheme.accent : "rgba(255,255,255,0.08)",
                border: "none", borderRadius: "8px", padding: "6px 14px", cursor: "pointer",
                color: customMinutes === d ? "#fff" : "rgba(255,255,255,0.4)", fontSize: "0.82rem", fontWeight: "600"
              }}>{d}m</button>
            ))}
            <input type="number" min="1" max="180" value={customMinutes}
              onChange={e => setDuration(Number(e.target.value))}
              style={{ ...font, width: "58px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", padding: "6px 10px", color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", textAlign: "center", outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            <button onClick={() => setTimerRunning(r => !r)} style={{
              ...font, background: selectedTheme.accent, color: "#fff", border: "none",
              borderRadius: "12px", padding: "14px 44px", fontSize: "1rem", fontWeight: "600", cursor: "pointer"
            }}>{timerRunning ? "⏸ Pause" : timerSeconds === 0 ? "✓ Done" : "▶ Start"}</button>
            <button onClick={() => { setTimerSeconds(customMinutes * 60); setTimerRunning(false); }} style={{
              ...font, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
              border: "none", borderRadius: "12px", padding: "14px 20px", fontSize: "1.1rem", cursor: "pointer"
            }}>↺</button>
            <button onClick={() => setShowMusic(m => !m)} style={{
              ...font, background: showMusic ? selectedTheme.accent + "33" : "rgba(255,255,255,0.08)",
              border: `1px solid ${showMusic ? selectedTheme.accent : "transparent"}`,
              color: showMusic ? selectedTheme.accent : "rgba(255,255,255,0.4)",
              borderRadius: "12px", padding: "14px 20px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600"
            }}>🎵 Music</button>
          </div>
          {showMusic && (
            <div style={{ marginBottom: "20px", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", marginBottom: "10px" }}>🎵 {selectedTheme.genre} — click play below</p>
              <iframe key={selectedTheme.youtubeId} width="280" height="80"
                src={`https://www.youtube.com/embed/${selectedTheme.youtubeId}?autoplay=0&controls=1`}
                style={{ borderRadius: "10px", border: "none" }} allow="autoplay; encrypted-media" />
            </div>
          )}
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.8rem", fontStyle: "italic", margin: "0 0 4px 0", maxWidth: "380px", textAlign: "center", lineHeight: "1.7" }}>"{selectedTheme.quote}"</p>
          <button onClick={closeFocus} style={{
            ...font, position: "absolute", bottom: "28px", background: "none",
            border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.25)",
            borderRadius: "8px", padding: "8px 22px", cursor: "pointer", fontSize: "0.82rem"
          }}>✕ Close</button>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: "260px", minHeight: "100vh", background: "#1e293b", padding: "36px 24px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={user.picture} width="36" height="36" style={{ borderRadius: "50%", border: "2px solid #334155" }} />
          <div>
            <p style={{ color: "#f8fafc", fontSize: "0.85rem", fontWeight: "600", margin: 0 }}>{user.name}</p>
            <p style={{ color: "#475569", fontSize: "0.7rem", margin: 0 }}>{user.email}</p>
          </div>
        </div>

        <div>
          <h1 style={{ ...serif, color: "#f8fafc", fontSize: "1.6rem", fontWeight: "400", margin: "0 0 4px 0" }}>Daily Habits</h1>
          <p style={{ color: "#475569", fontSize: "0.78rem", margin: 0 }}>
            {new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {[{ id: "home", label: "🏠 Home" }, { id: "calendar", label: "📅 Calendar" }].map(({ id, label }) => (
            <button key={id} onClick={() => setPage(id)} style={{
              ...font, background: page === id ? "#0f172a" : "none",
              border: "none", borderRadius: "8px", padding: "9px 14px",
              cursor: "pointer", textAlign: "left", color: page === id ? "#f8fafc" : "#475569",
              fontSize: "0.85rem", fontWeight: page === id ? "600" : "400", transition: "all 0.2s"
            }}>{label}</button>
          ))}
        </div>

        <div style={{ background: "#0f172a", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
          <div style={{ ...serif, fontSize: "2.2rem", fontWeight: "400", color: scorePct === 100 ? "#4ade80" : "#f8fafc" }}>{scorePct}%</div>
          <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "2px" }}>Today's score</div>
          <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "6px" }}>{done} of {total} completed</div>
          <div style={{ background: "#1e293b", borderRadius: "99px", height: "5px", marginTop: "14px" }}>
            <div style={{ background: scorePct === 100 ? "#4ade80" : "#6366f1", width: `${scorePct}%`, height: "5px", borderRadius: "99px", transition: "width 0.5s ease" }} />
          </div>
        </div>

        <div>
          <p style={{ color: "#334155", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "700", margin: "0 0 12px 0" }}>Categories</p>
          {CATEGORIES.map(c => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: CATEGORY_COLORS[c], flexShrink: 0 }} />
              <span style={{ color: "#64748b", fontSize: "0.82rem" }}>{c}</span>
              <span style={{ color: "#334155", fontSize: "0.72rem", marginLeft: "auto", fontWeight: "600" }}>{habits.filter(h => h.category === c).length}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "auto", borderTop: "1px solid #0f172a", paddingTop: "20px" }}>
          <p style={{ color: "#475569", fontSize: "0.78rem", fontStyle: "italic", margin: "0 0 14px 0", lineHeight: "1.7", opacity: fade ? 1 : 0, transition: "opacity 0.4s ease" }}>
            "{QUOTES[quoteIndex]}"
          </p>
          <button onClick={() => { googleLogout(); setUser(null); }} style={{
            ...font, background: "none", border: "1px solid #1e293b", color: "#334155",
            borderRadius: "8px", padding: "7px 14px", fontSize: "0.75rem", cursor: "pointer"
          }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      {page === "calendar" ? <CalendarPage /> : (
        <div style={{ flex: 1, padding: "40px 52px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
            <div>
              <h2 style={{ ...serif, margin: 0, fontSize: "2rem", fontWeight: "400", color: "#0f172a" }}>
                {["Hello", "Hi there", "Hey", "Welcome back"][Math.floor(Date.now() / 10000) % 4]} 👋
              </h2>
              <p style={{ margin: "6px 0 0 0", color: "#94a3b8", fontSize: "0.9rem" }}>
                {total === 0 ? "Add your first habit below" : scorePct === 100 ? "🎉 All done — great work today!" : `${total - done} habit${total - done !== 1 ? "s" : ""} left for today`}
              </p>
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{
              ...font, background: showForm ? "#f1f5f9" : "#0f172a", color: showForm ? "#64748b" : "#fff",
              border: "none", borderRadius: "10px", padding: "11px 22px", cursor: "pointer",
              fontSize: "0.88rem", fontWeight: "600", transition: "all 0.2s"
            }}>{showForm ? "✕ Cancel" : "+ New Habit"}</button>
          </div>

          {showForm && (
            <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: "16px", padding: "28px", marginBottom: "36px", boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}>
              <h3 style={{ ...serif, margin: "0 0 22px 0", fontSize: "1.2rem", fontWeight: "400", color: "#0f172a" }}>New Habit</h3>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="What habit do you want to build?" onKeyDown={e => e.key === "Enter" && addHabit()} style={{ ...inputStyle, marginBottom: "14px" }} />
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} style={selectStyle}>
                  {TIMES.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <button onClick={addHabit} style={{ ...font, background: "#0f172a", color: "#fff", border: "none", borderRadius: "10px", padding: "12px 28px", cursor: "pointer", fontSize: "0.92rem", fontWeight: "600" }}>Add Habit</button>
            </div>
          )}

          <Section label="🌅 Morning" list={morning} />
          <Section label="🌙 Evening" list={evening} />

          {habits.length === 0 && !showForm && (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
              <p style={{ fontSize: "3rem", margin: "0 0 14px 0" }}>🌱</p>
              <p style={{ ...serif, color: "#cbd5e1", fontSize: "1.3rem", fontWeight: "400" }}>No habits yet</p>
              <p style={{ color: "#94a3b8", fontSize: "0.88rem", marginTop: "6px" }}>Click <strong>New Habit</strong> to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}