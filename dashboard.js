import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, getDocs, updateDoc, deleteDoc, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* MENU */
menuBtn.onclick = () => {
  sidebar.style.display = sidebar.style.display === "block" ? "none" : "block";
};

document.querySelectorAll(".sidebar div[data-sec]").forEach(d => {
  d.onclick = () => show(d.dataset.sec);
});

logout.onclick = () => signOut(auth).then(() => location.href="login.html");

function show(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  sidebar.style.display = "none";
  if (id === "approvals") loadApprovals();
  if (id === "attendance") loadAttendance();
}

/* AUTH */
onAuthStateChanged(auth, async user => {
  if (!user) location.href="login.html";
  const snap = await getDoc(doc(db,"users",user.uid));
  if (!snap.exists() || snap.data().role !== "admin")
    location.href="login.html";
});

/* APPROVALS */
async function loadApprovals() {
  staffTable.innerHTML = studentTable.innerHTML = permTable.innerHTML = "";
  const snap = await getDocs(collection(db,"users"));

  snap.forEach(d => {
    const u = d.data();

    if (!u.approved && ["hod","incharge","principal"].includes(u.role)) {
      staffTable.innerHTML += `
        <tr><td>${u.name}</td><td>${u.role}</td>
        <td>
          <button onclick="approve('${d.id}')">✔</button>
          <button onclick="reject('${d.id}')">✖</button>
        </td></tr>`;
    }

    if (!u.approved && u.role==="student") {
      studentTable.innerHTML += `
        <tr><td>${u.name}</td><td>${u.roll||"-"}</td>
        <td><button onclick="approve('${d.id}')">✔</button></td></tr>`;
    }

    if (["hod","incharge"].includes(u.role)) {
      permTable.innerHTML += `
        <tr><td>${u.name}</td><td>${u.role}</td>
        <td><input type="checkbox"
        ${u.canApproveStudents?"checked":""}
        onchange="togglePerm('${d.id}',this.checked)"></td></tr>`;
    }
  });
}

window.approve = uid =>
  updateDoc(doc(db,"users",uid),{approved:true}).then(loadApprovals);
window.reject = uid =>
  deleteDoc(doc(db,"users",uid)).then(loadApprovals);
window.togglePerm = (uid,val) =>
  updateDoc(doc(db,"users",uid),{canApproveStudents:val});

/* ATTENDANCE */
let records = [];

async function loadAttendance() {
  records = [];
  attTable.innerHTML = "";
  const snap = await getDocs(collection(db,"attendanceRecords"));
  snap.forEach(d => records.push(d.data()));
  render(records);
}

function render(data) {
  attTable.innerHTML = "";
  data.forEach(r=>{
    attTable.innerHTML += `
      <tr><td>${r.date}</td><td>${r.studentName}</td>
      <td>${r.roll}</td><td>${r.session}</td><td>${r.status}</td></tr>`;
  });
}

search.onkeyup = () => {
  const q = search.value.toLowerCase();
  render(records.filter(r =>
    r.studentName.toLowerCase().includes(q) ||
    r.roll.toLowerCase().includes(q)
  ));
};

session.onchange = () => {
  render(session.value==="All" ? records :
    records.filter(r=>r.session===session.value));
};

download.onclick = () => {
  let csv="Date,Name,Roll,Session,Status\n";
  records.forEach(r=>{
    csv+=`${r.date},${r.studentName},${r.roll},${r.session},${r.status}\n`;
  });
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv]));
  a.download="attendance.csv";
  a.click();
};
