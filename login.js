import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyAFUziq6QGKCwujtiTL-4Rk823FE12ZDGU",
  authDomain: "markattnedance.firebaseapp.com",
  projectId: "markattnedance"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= DOM ================= */
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const status = document.getElementById("status");
const loading = document.getElementById("loading");

/* ================= HELPERS ================= */
function showError(msg) {
  status.innerText = msg;
  status.style.color = "red";
}

function showLoading(msg = "Logging in...") {
  loading.innerText = msg;
  loading.style.display = "block";
}

function hideLoading() {
  loading.style.display = "none";
}

/* ================= LOGIN ================= */
loginBtn.onclick = async () => {
  status.innerText = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Please enter email and password");
    return;
  }

  loginBtn.disabled = true;
  showLoading();

  try {
    /* 🔐 AUTHENTICATE USER */
    const cred = await signInWithEmailAndPassword(auth, email, password);

    /* 🔍 FETCH USER PROFILE */
    const snap = await getDoc(doc(db, "users", cred.user.uid));

    if (!snap.exists()) {
      throw new Error("User profile not found");
    }

    const user = snap.data();
    const role = user.role;

    /* 🚦 ROLE → DASHBOARD REDIRECT */
    switch (role) {
      case "student":
        window.location.href = "student-dashboard.html";
        break;

      case "incharge":
      case "hod":
        window.location.href = "staff-dashboard.html";
        break;

      case "admin":
      case "principal":
        window.location.href = "admin-dashboard.html";
        break;

      default:
        throw new Error("Invalid user role");
    }

  } catch (err) {
    loginBtn.disabled = false;
    hideLoading();

    switch (err.code) {
      case "auth/user-not-found":
        showError("User not found. Please register.");
        break;

      case "auth/wrong-password":
        showError("Wrong password.");
        break;

      case "auth/invalid-email":
        showError("Invalid email format.");
        break;

      case "auth/network-request-failed":
        showError("Network error. Check your internet.");
        break;

      default:
        showError(err.message);
    }
  }
};
