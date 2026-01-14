// src/App.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db, auth } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import "./App.css";

function App() {
  // --- Auth ---
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  // --- Focus Session ---
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [ended, setEnded] = useState(false);
  const timerRef = useRef(null);

  // --- Session History ---
  const [history, setHistory] = useState([]);

  // ----------------- AUTH STATE LISTENER -----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Reset timer state on any auth change
      clearInterval(timerRef.current);
      setSession(null);
      setTimeLeft(0);
      setEnded(false);
      
      if (currentUser) {
        setUser(currentUser);
        fetchHistory(currentUser.uid);
      } else {
        setUser(null);
        setHistory([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ----------------- AUTH FUNCTIONS -----------------
  const signup = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      // Reset timer for new account
      setSession(null);
      setTimeLeft(0);
      setEnded(false);
      fetchHistory(res.user.uid);
    } catch (err) {
      console.error("Signup error:", err.message);
    }
  };

  const login = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      // Reset timer on login
      setSession(null);
      setTimeLeft(0);
      setEnded(false);
      fetchHistory(res.user.uid);
    } catch (err) {
      console.error("Login error:", err.message);
    }
  };

  const logout = async () => {
    clearInterval(timerRef.current);
    await signOut(auth);
    setUser(null);
    setSession(null);
    setTimeLeft(0);
    setEnded(false);
    setHistory([]);
  };

  // ----------------- TIMER & SESSION -----------------
  const startFocus = async () => {
    if (!user) return alert("Please login first");

    const res = await axios.post("http://localhost:8000/sessions/start", {
      duration: 25
    });
    setSession(res.data);
    setTimeLeft(res.data.duration * 60); // convert minutes → seconds
    setEnded(false);
  };

  const endFocus = async () => {
    if (!session) return;

    clearInterval(timerRef.current);
    await axios.put(`http://localhost:8000/sessions/end/${session.session_id}`);
    setEnded(true);

    try {
      // Save session to Firestore per user
      await addDoc(collection(db, "sessions"), {
        userId: user.uid,
        session_id: session.session_id,
        start_time: session.start_time,
        end_time: new Date().toISOString(),
        duration: session.duration
      });
      fetchHistory(user.uid); // refresh history
    } catch (err) {
      console.error("Firebase error:", err);
    }
  };

  // Timer countdown logic
  useEffect(() => {
    if (timeLeft <= 0 || ended) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, ended]);

  // Auto-end session when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && session && !ended) {
      endFocus();
    }
  }, [timeLeft]);

  // ----------------- FETCH SESSION HISTORY -----------------
  const fetchHistory = async (uid) => {
    const q = query(collection(db, "sessions"), where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    const userSessions = querySnapshot.docs.map(doc => doc.data());
    setHistory(userSessions);
  };

  // ----------------- HELPER -----------------
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ----------------- UI -----------------
  if (loading) {
    return (
      <div className="auth-container">
        <h1>🍅 Focus Timer</h1>
        <p className="auth-subtitle">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <h1>🍅 Focus Timer</h1>
        <p className="auth-subtitle">Stay focused, be productive</p>
        <div className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="auth-buttons">
            <button className="btn btn-secondary" onClick={signup}>Sign Up</button>
            <button className="btn btn-primary" onClick={login}>Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>🍅 <span>Focus</span> Timer</h1>
        <div className="user-info">
          <span className="user-email">{user.email}</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className={`timer-card ${session && !ended ? 'timer-active' : ''}`}>
        <p className="timer-label">
          {!session ? 'Ready to focus?' : ended ? 'Great work!' : 'Stay focused'}
        </p>
        <div className="timer-display">
          {formatTime(timeLeft || 25 * 60)}
        </div>

        {!session && (
          <button className="btn-start" onClick={startFocus}>
            Start Focus Session
          </button>
        )}

        {session && !ended && (
          <button className="btn-end" onClick={endFocus}>
            End Session
          </button>
        )}

        {ended && (
          <div className="session-complete">
            <span className="icon">✅</span>
            Session completed!
          </div>
        )}
      </div>

      <div className="history-section">
        <h2>Session History</h2>
        {history.length === 0 ? (
          <p className="empty-history">No sessions yet. Start your first focus session!</p>
        ) : (
          <ul className="history-list">
            {history.map((s, i) => (
              <li key={i} className="history-item">
                <div className="history-item-info">
                  <span className="history-item-date">
                    {new Date(s.start_time).toLocaleDateString()} at {new Date(s.start_time).toLocaleTimeString()}
                  </span>
                  <span className="history-item-id">ID: {s.session_id.slice(0, 8)}...</span>
                </div>
                <span className="history-item-duration">{s.duration} min</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
