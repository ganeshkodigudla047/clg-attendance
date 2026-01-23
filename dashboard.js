import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================= DOM ================= */
const dashboardTitle = document.getElementById("dashboardTitle");
const logoutBtn = document.getElementById("logoutBtn");

/* ================= SECTION CONTROL ================= */
window.showSection = function (id) {
  document.querySelectorAll(".section")
    .forEach(sec => sec.classList.add("hidden"));

  document.getElementById(id).classList.remove("hidden");
};

/* ================= AUTH CHECK ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.href = "login.html";
    return;
  }

  // get logged-in user data
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    alert("User data not found");
    location.href = "login.html";
    return;
  }

  const u = snap.data();

  // block unapproved users
  if (u.approved === false) {
    alert("Account not approved yet");
    signOut(auth);
    location.href = "login.html";
    return;
  }

  setupDashboard(u);
});

/* ================= DASHBOARD SETUP ================= */
function setupDashboard(user) {

  dashboardTitle.innerText =
    user.role.toUpperCase() + " DASHBOARD";

  // fill profile
  document.getElementById("pName").innerText = user.name || "-";
  document.getElementById("pRole").innerText = user.role;
  document.getElementById("pPhone").innerText = user.phone || "-";

  // hide all menu buttons first
  document.querySelectorAll(".sidebar button")
    .forEach(btn => btn.style.display = "none");

  // show common buttons
  showMenuByRole("all");

  // STUDENT
  if (user.role === "student") {
    showMenuByRole("student");
    showSection("overview");
  }

  // INCHARGE
  if (user.role === "incharge") {
    showMenuByRole("staff");

    if (user.canApproveStudents === true) {
      showMenuByRole("approver");
    }

    showSection("overview");
  }

  // HOD
  if (user.role === "hod") {
    showMenuByRole("staff");

    if (user.canApproveStudents === true) {
      showMenuByRole("approver");
    }

    showSection("overview");
  }

  // PRINCIPAL
  if (user.role === "principal") {
    showMenuByRole("staff");
    showSection("overview");
  }

  // ADMIN
  if (user.role === "admin") {
    showMenuByRole("admin");
    showMenuByRole("staff");
    showMenuByRole("approver");
    showSection("overview");
  }
}

/* ================= MENU VISIBILITY ================= */
function showMenuByRole(roleTag) {
  document.querySelectorAll(
    `.sidebar button[data-role="${roleTag}"]`
  ).forEach(btn => btn.style.display = "block");
}

/* ================= LOGOUT ================= */
logoutBtn.onclick = () => {
  signOut(auth);
  location.href = "login.html";
};
