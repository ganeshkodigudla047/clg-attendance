import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ================= ROLE ================= */
  const role = localStorage.getItem("userRole");
  if (!role) {
    window.location.href = "index.html";
    return;
  }

  /* ================= HEADER ================= */
  document.getElementById("who").innerText =
    `Registering as: ${role.toUpperCase()}`;

  /* ================= SECTIONS ================= */
  const sections = {
    student: document.getElementById("student"),
    incharge: document.getElementById("incharge"),
    hod: document.getElementById("hod"),
    admin: document.getElementById("authority"),
    principal: document.getElementById("authority")
  };

  Object.values(sections).forEach(s => s.classList.add("hidden"));
  sections[role].classList.remove("hidden");

  /* ================= COMMON FIELDS ================= */
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const password = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");

  /* ================= STUDENT ================= */
  const studentId = document.getElementById("studentId");
  const studentDept = document.getElementById("studentDept");
  const year = document.getElementById("year");
  const inchargeId = document.getElementById("inchargeId");

  /* ================= INCHARGE ================= */
  const staffIdIncharge = document.getElementById("staffIdIncharge");
  const deptIncharge = document.getElementById("deptIncharge");
  const hodId = document.getElementById("hodId");

  /* ================= HOD ================= */
  const staffIdHod = document.getElementById("staffIdHod");
  const deptHod = document.getElementById("deptHod");

  /* ================= ADMIN / PRINCIPAL ================= */
  const staffIdAuth = document.getElementById("staffIdAuth");
  const invite = document.getElementById("invite");

  /* ======================================================
     LOAD HODS WHEN INCHARGE SELECTS DEPARTMENT
     ====================================================== */
  if (deptIncharge) {
    deptIncharge.onchange = async () => {
      hodId.innerHTML = `<option value="">Select HOD</option>`;
      if (!deptIncharge.value) return;

      const snap = await getDocs(collection(db, "users"));
      snap.forEach(d => {
        const u = d.data();
        if (
          u.role === "hod" &&
          u.department === deptIncharge.value &&
          u.approved === true
        ) {
          hodId.innerHTML +=
            `<option value="${d.id}">${u.name}</option>`;
        }
      });
    };
  }

  /* ======================================================
     LOAD INCHARGES WHEN STUDENT SELECTS DEPARTMENT
     ====================================================== */
  if (studentDept) {
    studentDept.onchange = async () => {
      inchargeId.innerHTML = `<option value="">Select Incharge</option>`;
      if (!studentDept.value) return;

      const snap = await getDocs(collection(db, "users"));
      snap.forEach(d => {
        const u = d.data();
        if (
          u.role === "incharge" &&
          u.department === studentDept.value &&
          u.approved === true
        ) {
          inchargeId.innerHTML +=
            `<option value="${d.id}">${u.name}</option>`;
        }
      });
    };
  }

  /* ================= REGISTER ================= */
  registerBtn.onclick = async () => {
    try {
      if (!name.value || !email.value || !phone.value || !password.value)
        return;

      let userData = {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        role,
        approved: false,
        canMarkAttendance: false,
        createdAt: serverTimestamp()
      };

      /* -------- STUDENT -------- */
      if (role === "student") {
        if (!studentId.value || !studentDept.value || !year.value)
          return;

        userData.studentId = studentId.value.trim();
        userData.department = studentDept.value;
        userData.year = year.value;
        userData.inchargeId = inchargeId.value || null;
      }

      /* -------- INCHARGE -------- */
      if (role === "incharge") {
        if (!staffIdIncharge.value || !deptIncharge.value)
          return;

        userData.staffId = staffIdIncharge.value.trim();
        userData.department = deptIncharge.value;
        userData.hodId = hodId.value || null;
      }

      /* -------- HOD -------- */
      if (role === "hod") {
        if (!staffIdHod.value || !deptHod.value)
          return;

        userData.staffId = staffIdHod.value.trim();
        userData.department = deptHod.value;
      }

      /* -------- ADMIN / PRINCIPAL -------- */
      if (role === "admin" || role === "principal") {
        if (!staffIdAuth.value || invite.value !== "COLLEGE-2025")
          return;

        userData.staffId = staffIdAuth.value.trim();
      }

      /* -------- AUTH -------- */
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );

      /* -------- FIRESTORE -------- */
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        ...userData
      });

      localStorage.removeItem("userRole");
      window.location.href = "login.html";

    } catch (err) {
      console.error(err);
    }
  };

});
