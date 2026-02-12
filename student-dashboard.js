import { auth, db } from "./firebase.js"

import {
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

import {
doc,
getDoc,
collection,
getDocs,
addDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


const video=document.getElementById("video")

let referenceDescriptor=null

let gpsVerified=false


menuBtn.onclick=()=>{
sidebar.classList.toggle("hidden")
}


document.querySelectorAll("[data-sec]").forEach(btn=>{
btn.onclick=()=>{
document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"))
document.getElementById(btn.dataset.sec).classList.add("active")
}
})


logoutBtn.onclick=()=>{
logoutModal.classList.remove("hidden")
}

cancelLogout.onclick=()=>{
logoutModal.classList.add("hidden")
}

confirmLogout.onclick=async()=>{
await signOut(auth)
location="login.html"
}


onAuthStateChanged(auth,async user=>{

if(!user){
location="login.html"
return
}

const snap=await getDoc(doc(db,"users",user.uid))
const data=snap.data()

studentName.innerText=data.name+" ("+data.role+")"

profilePic.src=data.photoURL

profileInfo.innerHTML=`
Name: ${data.name}<br>
Email: ${data.email}<br>
Department: ${data.department}<br>
Year: ${data.year}
`

setWish()

await loadModels()
await startCamera()
await loadReference(data.photoURL)

loadAttendance()

})


function setWish(){

const h=new Date().getHours()

if(h<12) wish.innerText="Good Morning"
else if(h<17) wish.innerText="Good Afternoon"
else wish.innerText="Good Evening"

}


async function loadModels(){

await faceapi.nets.tinyFaceDetector.loadFromUri("models")
await faceapi.nets.faceLandmark68Net.loadFromUri("models")
await faceapi.nets.faceRecognitionNet.loadFromUri("models")

}


async function startCamera(){

const stream=await navigator.mediaDevices.getUserMedia({video:true})
video.srcObject=stream

}


async function loadReference(photoURL){

const img=await faceapi.fetchImage(photoURL)

const detection=await faceapi
.detectSingleFace(img,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptor()

referenceDescriptor=detection.descriptor

}


startBtn.onclick=()=>{

navigator.geolocation.getCurrentPosition(

()=>{
gpsVerified=true
gpsStatus.innerHTML="GPS: ✓ verified"
},

()=>{
gpsVerified=false
gpsStatus.innerHTML="GPS: ❌ failed"
}

)

}


captureBtn.onclick=async()=>{

if(!gpsVerified){
alert("GPS not verified")
return
}

const detection=await faceapi
.detectSingleFace(video,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptor()

if(!detection){
faceStatus.innerHTML="Face: ❌ no face"
manualBtn.classList.remove("hidden")
return
}

const distance=faceapi.euclideanDistance(
referenceDescriptor,
detection.descriptor
)

if(distance<0.5){

faceStatus.innerHTML="Face: ✓ verified"

await addDoc(collection(db,"attendanceRecords"),{

studentId:auth.currentUser.uid,
date:new Date().toISOString().slice(0,10),
session:"FN",
status:"present",
method:"face"

})

loadAttendance()

}else{

faceStatus.innerHTML="Face: ❌ failed"
manualBtn.classList.remove("hidden")

}

}


async function loadAttendance(){

const snap=await getDocs(collection(db,"attendanceRecords"))

let total=0
let present=0

let today=new Date().toISOString().slice(0,10)

todayFN.innerHTML="○"
todayAN.innerHTML="○"

recordTable.innerHTML=""

snap.forEach(d=>{

const r=d.data()

if(r.studentId===auth.currentUser.uid){

total++

if(r.status==="present") present++

if(r.date===today){

if(r.session==="FN"){
todayFN.innerHTML='<span class="green">✓</span>'
}

if(r.session==="AN"){
todayAN.innerHTML='<span class="green">✓</span>'
}

}

recordTable.innerHTML+=`
<tr>
<td>${r.date}</td>
<td>${r.session==="FN"?"✓":"✗"}</td>
<td>${r.session==="AN"?"✓":"✗"}</td>
<td>${r.status}</td>
<td>${r.method}</td>
</tr>
`

}

})

totalDays.innerText=total
presentDays.innerText=present
absentDays.innerText=total-present
percent.innerText=Math.round((present/total)*100)||0

}
