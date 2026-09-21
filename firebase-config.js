// Firebase Config (compat - via <script> no HTML)
const firebaseConfig = {
  apiKey: "REMOVED_KEY",
  authDomain: "builds-4213e.firebaseapp.com",
  projectId: "builds-4213e",
  storageBucket: "builds-4213e.firebasestorage.app",
  messagingSenderId: "612728705593",
  appId: "1:612728705593:web:2091b8a995c1d04de273e8",
  measurementId: "G-9PCPQ90CKS"
};

// Inicializa usando os SDKs compat carregados via <script>
if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expor globalmente para script.js
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
