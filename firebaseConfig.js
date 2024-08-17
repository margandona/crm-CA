// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBssh0Gy2h3GMo_254FOwdgUKZ6hsyJxyU",
  authDomain: "casi-angeles-3605f.firebaseapp.com",
  projectId: "casi-angeles-3605f",
  storageBucket: "casi-angeles-3605f.appspot.com",
  messagingSenderId: "174828884341",
  appId: "1:174828884341:web:7e4486d5484f17ad23833c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
