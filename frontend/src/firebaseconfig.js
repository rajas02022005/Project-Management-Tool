
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASVdhvGvt3169sQ2OC_8ze6mLHicz2Ays",
  authDomain: "projectsmanager-1234.firebaseapp.com",
  databaseURL: "https://projectsmanager-1234-default-rtdb.firebaseio.com",
  projectId: "projectsmanager-1234",
  storageBucket: "projectsmanager-1234.firebasestorage.app",
  messagingSenderId: "203628941304",
  appId: "1:203628941304:web:dfd841930b0a199f68d00d"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };