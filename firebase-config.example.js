// TEMPLATE DE CONFIGURAÇÃO DO FIREBASE
// Copie este arquivo para "firebase-config.js" e preencha com as suas
// credenciais reais do console do Firebase (https://console.firebase.google.com).
//
// O arquivo "firebase-config.js" resultante está listado no .gitignore e NUNCA
// será commitado, então suas chaves seguras ficam apenas no seu computador.

const firebaseConfig = {
  apiKey: "COLOQUE_SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};

// Inicializa usando os SDKs compat carregados via script no HTML
if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expor globalmente para script.js
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;