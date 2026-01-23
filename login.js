import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from
"https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

loginBtn.onclick = async () => {
  if(!navigator.onLine){ status.innerText="No internet"; return; }
  showLoading("Logging in...");
  try{
    await signInWithEmailAndPassword(auth,email.value,password.value);
    location.href="dashboard.html";
  }catch(e){
    status.innerText=e.message;
  }
  hideLoading();
};
