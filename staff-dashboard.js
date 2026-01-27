import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut }
from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

/* ========= TOAST ========= */
function toast(msg){
  const t=document.createElement("div");
  t.className="toast";
  t.innerText=msg;
  document.getElementById("toast-container").appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

/* ========= GLOBAL ========= */
let me=null;
let approved=[], pending=[], attendance=[];
let canApprove=false;

/* ========= MENU ========= */
menuBtn.onclick=()=>sidebar.classList.toggle("hidden");
logout.onclick=()=>logoutConfirm.classList.remove("hidden");
cancelLogout.onclick=()=>logoutConfirm.classList.add("hidden");
confirmLogout.onclick=()=>signOut(auth).then(()=>location.href="login.html");

document.querySelectorAll("[data-sec]").forEach(d=>{
  d.onclick=()=>show(d.dataset.sec);
});

function show(id){
  document.querySelectorAll(".section").forEach(s=>s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  sidebar.classList.add("hidden");

  if(id==="approval"){ checkPermission(); loadPending(); }
  if(id==="students") loadStudents();
  if(id==="attendance") loadAttendance();
}

/* ========= BACK GUARD ========= */
history.pushState(null,"",location.href);
window.onpopstate=()=>{
  logoutConfirm.classList.remove("hidden");
  history.pushState(null,"",location.href);
};

/* ========= AUTH ========= */
onAuthStateChanged(auth, async user=>{
  if(!user) location.href="login.html";
  const snap=await getDoc(doc(db,"users",user.uid));
  if(!snap.exists()) location.href="login.html";

  me=snap.data();
  welcome.innerText=`Welcome, ${me.name}`;
  pName.innerText=me.name;
  pEmail.innerText=me.email;
  pPhone.innerText=me.phone||"-";
  pDept.innerText=me.department||"-";
  pRole.innerText=me.role;
});

/* ========= PERMISSION ========= */
async function checkPermission(){
  canApprove=false;
  requestPerm.disabled=false;

  const snap=await getDoc(doc(db,"permissionRequests",auth.currentUser.uid));
  if(!snap.exists()){
    permStatus.innerText="Admin permission required";
    return;
  }

  const d=snap.data();
  if(d.status==="pending"){
    permStatus.innerText="Waiting for admin approval";
    requestPerm.disabled=true;
    return;
  }

  if(d.expiresAt && Date.now()<d.expiresAt.toMillis()){
    canApprove=true;
    permStatus.innerText="Permission active";
    requestPerm.style.display="none";
  }else{
    permStatus.innerText="Permission expired";
  }
}

requestPerm.onclick=async()=>{
  await setDoc(doc(db,"permissionRequests",auth.currentUser.uid),{
    role:"incharge",
    status:"pending",
    requestedAt:new Date()
  });
  toast("Permission request sent");
  requestPerm.disabled=true;
};

/* ========= PENDING ========= */
async function loadPending(){
  pending=[];
  pendingTable.innerHTML="";
  const snap=await getDocs(collection(db,"users"));
  snap.forEach(d=>{
    const u=d.data();
    if(u.role==="student" && !u.approved && u.inchargeId===auth.currentUser.uid){
      pending.push({uid:d.id,...u});
    }
  });
  renderPending();
}

function renderPending(){
  pendingTable.innerHTML="";
  let q=searchPending.value.toLowerCase();
  pending
    .filter(s=>s.name.toLowerCase().includes(q)||s.studentId.toLowerCase().includes(q))
    .forEach(s=>{
      pendingTable.innerHTML+=`
        <tr>
          <td>${s.name}</td>
          <td>${s.studentId}</td>
          <td>${s.year}</td>
          <td>${canApprove?`<button data-id="${s.uid}">Approve</button>`:"Permission required"}</td>
        </tr>`;
    });
}

searchPending.onkeyup=renderPending;

pendingTable.onclick=async(e)=>{
  if(e.target.tagName!=="BUTTON") return;
  if(!canApprove){ toast("Permission required"); return; }
  await updateDoc(doc(db,"users",e.target.dataset.id),{approved:true});
  toast("Student approved");
  loadPending();
};

/* ========= STUDENTS ========= */
async function loadStudents(){
  approved=[];
  studentTable.innerHTML="";
  const snap=await getDocs(collection(db,"users"));
  snap.forEach(d=>{
    const u=d.data();
    if(u.role==="student" && u.approved && u.inchargeId===auth.currentUser.uid){
      approved.push({uid:d.id,...u});
    }
  });
  renderStudents();
}

function renderStudents(){
  studentTable.innerHTML="";
  let q=searchStudent.value.toLowerCase();
  let y=yearFilter.value;

  approved
    .filter(s=>(!y||s.year==y)&&(s.name.toLowerCase().includes(q)||s.studentId.toLowerCase().includes(q)))
    .forEach((s,i)=>{
      studentTable.innerHTML+=`
        <tr data-index="${i}">
          <td class="student-name">${s.name}</td>
          <td>${s.studentId}</td>
          <td>${s.year}</td>
        </tr>`;
    });
}

searchStudent.onkeyup=renderStudents;
yearFilter.onchange=renderStudents;

/* ========= STUDENT POPUP ========= */
studentTable.onclick=async(e)=>{
  const row=e.target.closest("tr");
  if(!row) return;
  const s=approved[row.dataset.index];

  mName.innerText=s.name;
  mId.innerText=s.studentId;
  mEmail.innerText=s.email;
  mPhone.innerText=s.phone||"-";
  mDept.innerText=s.department;
  mYear.innerText=s.year;

  studentAttTable.innerHTML="";
  let total=0,present=0;

  const snap=await getDocs(collection(db,"attendanceRecords"));
  snap.forEach(d=>{
    const a=d.data();
    if(a.studentUid!==s.uid) return;
    total++; if(a.status==="Present") present++;
    studentAttTable.innerHTML+=`
      <tr>
        <td>${a.date}</td>
        <td>${a.session}</td>
        <td>${a.method}</td>
        <td>${a.gpsVerified?"✔":"✖"}</td>
        <td>${a.status}</td>
      </tr>`;
  });

  mPercent.innerText=total?Math.round(present/total*100)+"%":"0%";
  studentModal.classList.remove("hidden");
};

closeModal.onclick=()=>studentModal.classList.add("hidden");

/* ESC */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    studentModal.classList.add("hidden");
    logoutConfirm.classList.add("hidden");
  }
});

/* ========= ATTENDANCE ========= */
async function loadAttendance(){
  attendance=[];
  const snap=await getDocs(collection(db,"attendanceRecords"));
  snap.forEach(d=>{
    const a=d.data();
    if(a.inchargeId===auth.currentUser.uid) attendance.push(a);
  });
  renderAttendance();
}

function renderAttendance(){
  attTable.innerHTML="";
  let q=searchAtt.value.toLowerCase();
  let data=[...attendance];

  if(sortAtt.value==="name"){
    data.sort((a,b)=>a.studentName.localeCompare(b.studentName));
  }else{
    data.sort((a,b)=>new Date(a.date)-new Date(b.date));
  }

  data
    .filter(a=>a.studentName.toLowerCase().includes(q)||a.studentId.toLowerCase().includes(q))
    .forEach(a=>{
      attTable.innerHTML+=`
        <tr>
          <td>${a.studentName}</td>
          <td>${a.studentId}</td>
          <td>${a.gpsVerified?"✔":"✖"}</td>
          <td>${a.method==="facial"?"✔":"✖"}</td>
          <td>${a.method==="manual"?"✔":"✖"}</td>
          <td>${a.status}</td>
        </tr>`;
    });
}

searchAtt.onkeyup=renderAttendance;
sortAtt.onchange=renderAttendance;

/* ========= EXCEL ========= */
downloadExcel.onclick=()=>{
  let csv="Name,ID,GPS,Facial,Manual,Status\n";
  attendance.forEach(a=>{
    csv+=`${a.studentName},${a.studentId},${a.gpsVerified},${a.method==="facial"},${a.method==="manual"},${a.status}\n`;
  });
  const link=document.createElement("a");
  link.href=URL.createObjectURL(new Blob([csv]));
  link.download="attendance.xlsx";
  link.click();
};
