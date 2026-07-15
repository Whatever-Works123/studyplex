// Import modern Firebase v11 modules via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  push, 
  remove, 
  onValue 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

// ================= 1. FIREBASE INITIALIZATION =================
const firebaseConfig = {
  apiKey: "AIzaSyCaCId50ks98SIJmG6lIxAezTJss0acPhQ",
  authDomain: "studyplex-5cd2a.firebaseapp.com",
  databaseURL: "https://studyplex-5cd2a-default-rtdb.firebaseio.com",
  projectId: "studyplex-5cd2a",
  storageBucket: "studyplex-5cd2a.firebasestorage.app",
  messagingSenderId: "522351203818",
  appId: "1:522351203818:web:df99a2dbcaa08222d78e93",
  measurementId: "G-BWENCXH22K"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;

// ================= 2. DOM ELEMENTS =================
const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const userInfo = document.getElementById("user-info");
const userEmailSpan = document.getElementById("user-email");
const authError = document.getElementById("auth-error");

// ================= 3. AUTHENTICATION LOGIC =================
// Sign In
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  authError.textContent = "";
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authError.textContent = error.message.replace("Firebase: ", "");
  }
});

// Create Account
document.getElementById("signup-btn").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  authError.textContent = "";
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    authError.textContent = error.message.replace("Firebase: ", "");
  }
});

// Sign Out
document.getElementById("logout-btn").addEventListener("click", () => signOut(auth));

// Manage View Transitions on Auth State Changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    userEmailSpan.textContent = user.email;
    userInfo.classList.remove("hidden");
    authSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    
    loadUserData();
  } else {
    currentUser = null;
    userInfo.classList.add("hidden");
    authSection.classList.remove("hidden");
    dashboardSection.classList.add("hidden");
  }
});

// ================= 4. TAB NAVIGATION =================
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    
    btn.classList.add("active");
    const targetId = btn.getAttribute("data-target");
    document.getElementById(targetId).classList.add("active");
  });
});

// ================= 5. DATA FETCHING (REALTIME) =================
function loadUserData() {
  if (!currentUser) return;
  const userId = currentUser.uid;

  // Sync Notes
  const notesRef = ref(db, `users/${userId}/notes`);
  onValue(notesRef, (snapshot) => {
    const list = document.getElementById("notes-list");
    list.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const id = childSnapshot.key;
        const data = childSnapshot.val();
        list.innerHTML += `
          <div class="note-card">
            <div>
              <h4>${data.title || "Untitled Note"}</h4>
              <p>${data.body || ""}</p>
            </div>
            <button class="btn btn-delete" onclick="window.deleteItem('notes', '${id}')">Delete</button>
          </div>
        `;
      });
    }
  });

  // Sync Reminders
  const remindersRef = ref(db, `users/${userId}/reminders`);
  onValue(remindersRef, (snapshot) => {
    const list = document.getElementById("reminders-list");
    list.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const id = childSnapshot.key;
        const data = childSnapshot.val();
        const formattedDate = data.date ? new Date(data.date).toLocaleString() : "No Date Set";
        list.innerHTML += `
          <div class="list-item">
            <div class="list-item-details">
              <h4>${data.text}</h4>
              <span>⏰ ${formattedDate}</span>
            </div>
            <button class="btn btn-delete" onclick="window.deleteItem('reminders', '${id}')">Done</button>
          </div>
        `;
      });
    }
  });

  // Sync Schedule
  const scheduleRef = ref(db, `users/${userId}/schedule`);
  onValue(scheduleRef, (snapshot) => {
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const id = childSnapshot.key;
        const data = childSnapshot.val();
        list.innerHTML += `
          <div class="list-item">
            <div class="list-item-details">
              <h4>${data.title}</h4>
              <span>📅 ${data.date || "TBD"} at ${data.time || "TBD"}</span>
            </div>
            <button class="btn btn-delete" onclick="window.deleteItem('schedule', '${id}')">Remove</button>
          </div>
        `;
      });
    }
  });
}

// ================= 6. DATA CREATION & DELETION =================
// Write New Note
document.getElementById("add-note-btn").addEventListener("click", () => {
  const title = document.getElementById("note-title");
  const body = document.getElementById("note-body");
  if (!body.value.trim() && !title.value.trim()) return;

  push(ref(db, `users/${currentUser.uid}/notes`), {
    title: title.value,
    body: body.value,
    timestamp: Date.now()
  });
  title.value = "";
  body.value = "";
});

// Write New Reminder
document.getElementById("add-reminder-btn").addEventListener("click", () => {
  const text = document.getElementById("reminder-text");
  const date = document.getElementById("reminder-date");
  if (!text.value.trim()) return;

  push(ref(db, `users/${currentUser.uid}/reminders`), {
    text: text.value,
    date: date.value || null,
    timestamp: Date.now()
  });
  text.value = "";
  date.value = "";
});

// Write New Schedule Event
document.getElementById("add-schedule-btn").addEventListener("click", () => {
  const title = document.getElementById("schedule-title");
  const date = document.getElementById("schedule-date");
  const time = document.getElementById("schedule-time");
  if (!title.value.trim()) return;

  push(ref(db, `users/${currentUser.uid}/schedule`), {
    title: title.value,
    date: date.value,
    time: time.value,
    timestamp: Date.now()
  });
  title.value = "";
  date.value = "";
  time.value = "";
});

// Globally accessible handling for targeting deletions natively out of generated elements
window.deleteItem = (category, id) => {
  if (!currentUser) return;
  remove(ref(db, `users/${currentUser.uid}/${category}/${id}`));
};
