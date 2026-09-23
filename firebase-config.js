const firebaseConfig = {
  "apiKey": "AIzaSyCzNOxPuzIksu4bsxBxAXMszTPVN6ZqOLg",
  "authDomain": "builds-e8237.firebaseapp.com",
  "projectId": "builds-e8237",
  "storageBucket": "builds-e8237.firebasestorage.app",
  "messagingSenderId": "538800210352",
  "appId": "1:538800210352:web:638049156928fca09b9675",
  "measurementId": "G-QNJWD4DXYD"
};

if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
