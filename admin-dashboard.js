import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, getDocs, getDoc, doc,
  setDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ================= TOAST ================= */
function showToast(msg, type="success"){
  const c=document.getElementById("toast-container");
  const t=document.createElement("div");
  t.className=`toast ${type}`;
  t.innerText=msg;
  c.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}

/* ================= MENU ================= */
menuBtn.onclick=()=>sidebar.classList.toggle("hidden");
logout.onclick=()=>signOut(auth).then(()=>location.href="login.html");

document.querySelectorAll("[data-sec]").forEach(d =>
  d.onclick=()=>show(d.dataset.sec)
);

function show(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  sidebar.classList.add("hidden");

  if(id==="staff") loadStaff();
  if(id==="settings") loadSettings();
  if(id==="attendance") loadAttendance();
  if(id==="permissions") loadPermissions();
}

/* ================= AUTH ================= */
let me=null, records=[];

onAuthStateChanged(auth, async user=>{
  if(!user) return location.href="login.html";

  const snap=await getDoc(doc(db,"users",user.uid));
  if(!snap.exists()) return location.href="login.html";

  me=snap.data();
  if(!["admin","principal"].includes(me.role))
    return location.href="login.html";

  welcome.innerText=`Welcome, ${me.name}`;
  roleLabel.innerText=me.role.toUpperCase();
  pName.innerText=me.name;
  pEmail.innerText=me.email;
  pRole.innerText=me.role.toUpperCase();

  if(me.role==="principal"){
    document.querySelectorAll("button").forEach(b=>b.disabled=true);
  }
});

/* ================= STAFF ================= */
async function loadStaff(){
  hodTable.innerHTML="";
  inchargeTable.innerHTML="";
  const snap=await getDocs(collection(db,"users"));

  snap.forEach(d=>{
    const u=d.data();
    if(u.role==="hod"){
      hodTable.innerHTML+=`
        <tr><td>${u.name}</td><td>${u.email}</td>
        <td>${u.approved?"Approved":"Pending"}</td></tr>`;
    }
    if(u.role==="incharge"){
      inchargeTable.innerHTML+=`
        <tr><td>${u.name}</td><td>${u.email}</td>
        <td>${u.canApproveStudents?"Granted":"No"}</td></tr>`;
    }
  });
}

/* ================= SETTINGS ================= */
async function loadSettings(){
  const s=await getDoc(doc(db,"settings","attendance"));
  if(!s.exists()) return;
  const d=s.data();
  fnStart.value=d.fnStart||"";
  fnEnd.value=d.fnEnd||"";
  anStart.value=d.anStart||"";
  anEnd.value=d.anEnd||"";
  lat.value=d.lat||"";
  lng.value=d.lng||"";
  radius.value=d.radius||"";
}

saveTiming.onclick=async()=>{
  await setDoc(doc(db,"settings","attendance"),{
    fnStart:fnStart.value,
    fnEnd:fnEnd.value,
    anStart:anStart.value,
    anEnd:anEnd.value
  },{merge:true});
  showToast("Timing saved");
};

saveGps.onclick=async()=>{
  await setDoc(doc(db,"settings","attendance"),{
    lat:lat.value,
    lng:lng.value,
    radius:radius.value
  },{merge:true});
  showToast("GPS settings saved");
};

/* ================= HOLIDAYS ================= */
addHoliday.onclick=async()=>{
  await setDoc(doc(collection(db,"holidays")),{
    date:holidayDate.value,
    reason:holidayReason.value
  });
  showToast("Holiday added");
  loadSettings();
};

window.removeHoliday=async id=>{
  await deleteDoc(doc(db,"holidays",id));
  showToast("Holiday removed","info");
  loadSettings();
};

/* ================= ATTENDANCE ================= */
async function loadAttendance(){
  records=[];
  const snap=await getDocs(collection(db,"attendance"));
  snap.forEach(d=>records.push(d.data()));
  renderAttendance();
}

function renderAttendance(){
  attTable.innerHTML="";
  const today=new Date().toLocaleDateString();
  let data=[...records];

  if(attType.value==="today")
    data=data.filter(r=>r.date===today);

  const q=searchAtt.value.toLowerCase();
  if(q)
    data=data.filter(r=>
      r.studentName.toLowerCase().includes(q) ||
      r.roll.toLowerCase().includes(q)
    );

  data.forEach(r=>{
    attTable.innerHTML+=`
      <tr>
        <td>${r.date}</td>
        <td>${r.studentName}</td>
        <td>${r.roll}</td>
        <td>${r.year}</td>
        <td>${r.session}</td>
        <td>${r.status}</td>
      </tr>`;
  });
}

attType.onchange=renderAttendance;
searchAtt.onkeyup=renderAttendance;

downloadAtt.onclick=()=>{
  let csv="Date,Name,Roll,Year,Session,Status\n";
  records.forEach(r=>{
    csv+=`${r.date},${r.studentName},${r.roll},${r.year},${r.session},${r.status}\n`;
  });
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([csv]));
  a.download="attendance.csv";
  a.click();
  showToast("Attendance downloaded","info");
};

/* ================= PERMISSIONS ================= */
async function loadPermissions(){
  permTable.innerHTML="";
  const snap=await getDocs(collection(db,"permissionRequests"));
  snap.forEach(d=>{
    permTable.innerHTML+=`
      <tr>
        <td>${d.data().role}</td>
        <td>${d.data().status}</td>
        <td>
          <button onclick="grant('${d.id}')">Grant</button>
        </td>
      </tr>`;
  });
}

window.grant=async id=>{
  await updateDoc(doc(db,"permissionRequests",id),{status:"approved"});
  showToast("Permission granted");
  loadPermissions();
};
