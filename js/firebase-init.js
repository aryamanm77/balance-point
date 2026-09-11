import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAhlDb5qzuB-c5jWiwofm14FtY5d4cxIBE",
  authDomain: "balance-point-88dd3.firebaseapp.com",
  projectId: "balance-point-88dd3",
  storageBucket: "balance-point-88dd3.firebasestorage.app",
  messagingSenderId: "288782420792",
  appId: "1:288782420792:web:a26a8d34ef52dcd8780fcd"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
var firebase_init_default = app;
export {
  auth,
  db,
  firebase_init_default as default
};
