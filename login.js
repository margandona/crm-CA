// login.js
import { auth } from './firebaseConfig.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

$(document).ready(function () {
  $("#loginForm").submit(function (e) {
    e.preventDefault();
    
    const email = $("#email").val();
    const password = $("#password").val();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Login exitoso
        window.location.href = 'dashboard.html'; // Redirige al dashboard
      })
      .catch((error) => {
        const errorMessage = error.message;
        $("#loginError").text(errorMessage).show();
      });
  });
});
