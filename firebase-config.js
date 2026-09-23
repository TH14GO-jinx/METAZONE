const firebaseConfig = {
  "apiKey": "AIzaSyBzHirzo51eHB5trIvbAGk81ECC5tgzCdw",
  "authDomain": "builds-4213e.firebaseio.com",
  "projectId": "builds-4213e",
  "storageBucket": "builds-4213e.firebasestorage.app",
  "messagingSenderId": "612728705593",
  "appId": "1:612728705593:web:2091b8a995c1d04de273e8",
  "measurementId": "G-9PCPQ90CKS"
};

if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
