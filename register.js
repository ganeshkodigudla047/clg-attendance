import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword } from
"https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, getDocs, setDoc, doc } from
"https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const safe=v=>v&&v.trim()?v.trim():"";

role.onchange=()=>{
  studentFields.style.display=role.value==="student"?"block":"none";
  staffFields.style.display=role.value==="student"?"none":"block";
};

async function loadStaff(){
  const snap=await getDocs(collection(db,"users"));
  snap.forEach(d=>{
    const u=d.data();
    if(u.approved && u.role==="incharge")
      inchargeSelect.innerHTML+=`<option value="${d.id}">${u.name}</option>`;
    if(u.approved && u.role==="hod")
      hodSelect.innerHTML+=`<option value="${d.id}">${u.name}</option>`;
  });
}
loadStaff();

registerBtn.onclick=async()=>{
  if(!navigator.onLine){ status.innerText="No internet"; return; }
  showLoading("Creating account...");
  try{
    const cred=await createUserWithEmailAndPassword(auth,email.value,password.value);
    const base={
      uid:cred.user.uid,
      name:safe(name.value),
      email:safe(email.value),
      role:role.value,
      createdAt:new Date()
    };
    if(role.value==="student"){
      if(!inchargeSelect.value||!hodSelect.value){
        status.innerText="Select Incharge & HOD"; hideLoading(); return;
      }
      await setDoc(doc(db,"users",cred.user.uid),{
        ...base,
        roll:safe(roll.value),
        inchargeId:inchargeSelect.value,
        hodId:hodSelect.value,
        approved:true
      });
    }else{
      await setDoc(doc(db,"users",cred.user.uid),{
        ...base,
        phone:safe(phone.value),
        approved:false
      });
    }
    alert("Registered successfully");
    location.href="login.html";
  }catch(e){
    status.innerText=e.message;
  }
  hideLoading();
};
