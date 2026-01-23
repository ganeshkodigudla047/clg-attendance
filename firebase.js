import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from
"https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from
"https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFUziq6QGKCwujtiTL-4Rk823FE12ZDGU",
  authDomain: "markattnedance.firebaseapp.com",
  projectId: "markattnedance",
  storageBucket: "markattnedance.appspot.com",
  messagingSenderId: "567833614914",
  appId: "1:567833614914:web:2599bccb0f14e228ccebdb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
