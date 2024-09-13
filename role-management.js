import { getFirestore, collection, doc, getDocs, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Inicializar Firebase Auth y Firestore
const auth = getAuth();
const db = getFirestore();

// Definir el email del superadministrador
const adminEmail = "m.argando@gmail.com";

// Chequear el estado de autenticación del usuario actual
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Si el usuario está autenticado, verificar su rol
    checkUserRole(user);
  } else {
    // Si el usuario no está autenticado, redirigir al login
    console.log("Usuario no autenticado");
    window.location.href = 'login.html';  // Redirigir a la página de login
  }
});

// Función para verificar el rol del usuario
async function checkUserRole(user) {
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Si es admin o el email es del superadmin, mostrar el panel de administración
      if (userData.role === "admin" || user.email === adminEmail) {
        showAdminPanel();
      } else {
        // Mostrar el panel para el rol del usuario actual
        showUserPanel(userData.role);
      }
    } else {
      // Si no existe el documento del usuario, crear un nuevo documento con rol "usuario autenticado"
      await setDoc(userRef, {
        email: user.email,
        role: "usuario autenticado"  // Asignar rol inicial como "usuario autenticado"
      });
      console.log("Usuario creado como 'usuario autenticado'");
      showUserPanel("usuario autenticado");
    }
  } catch (error) {
    console.error("Error obteniendo rol del usuario:", error);
    alert("Ocurrió un error al verificar el rol del usuario.");
  }
}

// Función para mostrar el panel de usuarios según su rol
function showUserPanel(role) {
  const roleElement = document.getElementById("user-role");
  if (roleElement) {
    roleElement.innerText = `Rol actual: ${role}`;
  }
  if (role === "admin") {
    showAdminPanel();  // Mostrar el panel de administración si es admin
  }
}

// Función para mostrar el panel de administración
function showAdminPanel() {
  const adminPanel = document.getElementById("admin-panel");
  if (adminPanel) {
    adminPanel.style.display = "block";  // Mostrar el panel de administración
    loadAllUsers();  // Cargar todos los usuarios para que el administrador los gestione
  }
}

// Función para cargar todos los usuarios desde Firestore
async function loadAllUsers() {
  try {
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    const userList = document.getElementById("user-list");
    if (userList) {
      userList.innerHTML = "";  // Limpiar la lista de usuarios

      querySnapshot.forEach((doc) => {
        const user = doc.data();
        const listItem = `
          <li>
            <span>Email: ${user.email}</span> | 
            <span>Rol: ${user.role}</span> 
            <button onclick="editUserRole('${doc.id}', '${user.role}')">Editar Rol</button>
          </li>`;
        userList.innerHTML += listItem;  // Agregar usuarios a la lista
      });
    }
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    alert("Error al cargar la lista de usuarios.");
  }
}

// Función para editar el rol de un usuario
async function editUserRole(userId, currentRole) {
  const newRole = prompt("Ingresa el nuevo rol para el usuario:", currentRole);
  if (newRole && newRole !== currentRole) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      loadAllUsers();  // Recargar la lista de usuarios después de la actualización
      alert("Rol actualizado con éxito.");
    } catch (error) {
      console.error("Error actualizando el rol del usuario:", error);
      alert("Error al actualizar el rol del usuario.");
    }
  }
}

// Función para agregar un nuevo usuario
window.addUser = async function () {
  const email = prompt("Ingresa el email del nuevo usuario:");
  const password = prompt("Ingresa una contraseña para el nuevo usuario:");

  if (email && password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Guardar el usuario en Firestore con el rol "usuario autenticado"
      await setDoc(doc(db, "users", newUser.uid), {
        email: newUser.email,
        role: "usuario autenticado"
      });

      // Enviar email de verificación
      await sendEmailVerification(newUser);
      alert("Usuario creado y se envió un correo de verificación.");
      loadAllUsers();  // Recargar la lista de usuarios

    } catch (error) {
      console.error("Error creando el usuario:", error);
      alert("Error al crear el usuario.");
    }
  }
};



// Función para proteger el acceso basado en roles
function authorizeRole(requiredRole) {
  return (userRole) => {
    if (userRole !== requiredRole) {
      alert("No tienes permisos para acceder a esta sección.");
      window.location.href = 'index.html';  // Redirigir si no tiene permisos
    }
  };
}
// Función para manejar el cierre de sesión
window.logout = function () {
  auth.signOut().then(() => {
    window.location.href = "index.html";  // Redirigir al login después de cerrar sesión
  }).catch((error) => {
    console.error("Error al cerrar sesión:", error);
    alert("Error al cerrar sesión.");
  });
}
// Exportar funciones para que puedan ser usadas en otros archivos
export { logout, editUserRole, authorizeRole, addUser };
