import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, getDocs, setDoc, doc } 
  from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ========= DOM ========= */
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const phoneEl = document.getElementById("phone");
const rollEl = document.getElementById("roll");

const inchargeSelect = document.getElementById("inchargeSelect");
const hodSelect = document.getElementById("hodSelect");
const hodForIncharge = document.getElementById("hodForIncharge");

const studentFields = document.getElementById("studentFields");
const inchargeFields = document.getElementById("inchargeFields");
const phoneBox = document.getElementById("phoneBox");

const registerBtn = document.getElementById("registerBtn");
const statusEl = document.getElementById("status");
const loadingEl = document.getElementById("loading");
const roleLabel = document.getElementById("roleLabel");

/* ========= ROLE ========= */
const role = localStorage.getItem("loginRole");
if (!role) {
  alert("Select role first");
  location.href = "index.html";
}
roleLabel.innerText = role.toUpperCase();

/* ========= UI RESET ========= */
studentFields.style.display = "none";
inchargeFields.style.display = "none";
phoneBox.style.display = "none";

/* ========= ROLE UI ========= */
if (role === "student") {
  phoneBox.style.display = "block";
  studentFields.style.display = "block";
}
else if (role === "incharge") {
  phoneBox.style.display = "block";
  inchargeFields.style.display = "block";
}
else if (role === "hod") {
  phoneBox.style.display = "block";
}

/* ========= LOAD USERS ========= */
async function loadUsers() {
  const snap = await getDocs(collection(db, "users"));
  snap.forEach(d => {
    const u = d.data();
    if (u.role === "incharge" && u.approved && inchargeSelect)
      inchargeSelect.innerHTML += `<option value="${d.id}">${u.name}</option>`;
    if (u.role === "hod" && u.approved) {
      if (hodSelect) hodSelect.innerHTML += `<option value="${d.id}">${u.name}</option>`;
      if (hodForIncharge) hodForIncharge.innerHTML += `<option value="${d.id}">${u.name}</option>`;
    }
  });
}
if (role === "student" || role === "incharge") loadUsers();

/* ========= HELPERS ========= */
function showError(msg) {
  statusEl.innerText = msg;
  statusEl.style.color = "red";
}
function showLoading(msg = "Creating account...") {
  loadingEl.innerText = msg;
  loadingEl.style.display = "block";
}
function hideLoading() {
  loadingEl.style.display = "none";
}

/* ========= REGISTER ========= */
registerBtn.onclick = async () => {
  statusEl.innerText = "";

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const pass = passwordEl.value;
  const phone = phoneEl ? phoneEl.value.trim() : "";

  if (!name || !email || !pass) {
    showError("Name, email and password are required");
    return;
  }

  if (
    role !== "admin" &&
    role !== "principal" &&
    (!phone || phone.length < 10)
  ) {
    showError("Valid phone number required");
    return;
  }

  showLoading();
  registerBtn.disabled = true;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    const base = {
      uid: cred.user.uid,
      name,
      email,
      role,
      createdAt: new Date()
    };

    if (role === "student") {
      if (!rollEl.value || !inchargeSelect.value || !hodSelect.value)
        throw new Error("Student details missing");

      await setDoc(doc(db, "users", cred.user.uid), {
        ...base,
        phone,
        roll: rollEl.value,
        inchargeId: inchargeSelect.value,
        hodId: hodSelect.value,
        approved: true
      });
    }
    else if (role === "incharge") {
      if (!hodForIncharge.value)
        throw new Error("Select supervising HOD");

      await setDoc(doc(db, "users", cred.user.uid), {
        ...base,
        phone,
        hodId: hodForIncharge.value,
        approved: false
      });
    }
    else if (role === "hod") {
      await setDoc(doc(db, "users", cred.user.uid), {
        ...base,
        phone,
        approved: false
      });
    }
    else if (role === "principal") {
      await setDoc(doc(db, "users", cred.user.uid), {
        ...base,
        approved: false
      });
    }
    else if (role === "admin") {
      await setDoc(doc(db, "users", cred.user.uid), {
        ...base,
        approved: true
      });
    }

    alert("Registration successful");
    location.href = "login.html";

  } catch (e) {
    showError(e.message);
    registerBtn.disabled = false;
    hideLoading();
  }
};
