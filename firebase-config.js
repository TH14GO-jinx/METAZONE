// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCkR3L5oy2WkWKCtLwXvl8XrkstGpsV0ng",
  authDomain: "builds-4213e.firebaseapp.com",
  projectId: "builds-4213e",
  storageBucket: "builds-4213e.firebasestorage.app",
  messagingSenderId: "612728705593",
  appId: "1:612728705593:web:2091b8a995c1d04de273e8",
  measurementId: "G-9PCPQ90CKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
