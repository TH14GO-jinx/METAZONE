// Gera o arquivo "firebase-config.js" a partir de variáveis de ambiente.
// Uso: node gerar-firebase-config.js
//
// As credenciais são lidas do arquivo .env (gitignored) e NUNCA entram no repositório.
// Crie um .env local com:
//   FIREBASE_API_KEY=...
//   FIREBASE_AUTH_DOMAIN=...
//   FIREBASE_PROJECT_ID=...
//   FIREBASE_STORAGE_BUCKET=...
//   FIREBASE_MESSAGING_SENDER_ID=...
//   FIREBASE_APP_ID=...
//   FIREBASE_MEASUREMENT_ID=...

const fs = require('fs');
const path = require('path');

function carregarEnv() {
  const caminhoEnv = path.join(__dirname, '.env');
  const env = {};
  if (fs.existsSync(caminhoEnv)) {
    const linhas = fs.readFileSync(caminhoEnv, 'utf-8').split('\n');
    for (const linha of linhas) {
      const idx = linha.indexOf('=');
      if (idx > -1) {
        const chave = linha.slice(0, idx).trim();
        const valor = linha.slice(idx + 1).trim();
        if (chave && valor && !chave.startsWith('#')) env[chave] = valor;
      }
    }
  }
  return env;
}

const env = carregarEnv();
const necessarios = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
  'FIREBASE_MEASUREMENT_ID'
];

const faltando = necessarios.filter(c => !env[c]);
if (faltando.length) {
  console.error('❌ Faltando no .env:', faltando.join(', '));
  console.error('   Crie um arquivo .env com essas variáveis (veja .env.example).');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID
};

const conteudo = `// Firebase Config (compat - via <script> no HTML)
// Este arquivo é GERADO AUTOMATICAMENTE por gerar-firebase-config.js
// a partir do .env local. NUNCA commit este arquivo no repositório.
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

// Inicializa usando os SDKs compat carregados via <script>
if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expor globalmente para script.js
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const auth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
`;

const saida = path.join(__dirname, 'firebase-config.js');
fs.writeFileSync(saida, conteudo, 'utf-8');
console.log('✅ firebase-config.js gerado com sucesso a partir do .env');