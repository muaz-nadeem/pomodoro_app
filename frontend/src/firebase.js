// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpBw0P9TEaEHd87-N5EJMJh7gEyr7i7Ug",
  authDomain: "pomodoro-20ae4.firebaseapp.com",
  projectId: "pomodoro-20ae4",
  storageBucket: "pomodoro-20ae4.firebasestorage.app",
  messagingSenderId: "511207029172",
  appId: "1:511207029172:web:deddfe9d51011a0b6ddae1",
  measurementId: "G-DPGLBVLPEG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
