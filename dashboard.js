import { getAuth, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, deleteDoc, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Inicializar Auth, Firestore y Storage
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Verificar si el usuario está autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadUserProfile(user.uid); // Cargar perfil si el usuario está autenticado
    loadMessages();
    loadProducts();
  } else {
    window.location.href = 'index.html';  // Redirige al login si no está autenticado
  }
});

// Cargar datos del perfil del usuario
async function loadUserProfile(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    $('#profileEmail').text(userData.email || auth.currentUser.email);
    $('#profileFirstName').text(userData.firstName);
    $('#profileLastName').text(userData.lastName);
    $('#profileBirthdate').text(userData.birthdate);
    $('#profileAddress').text(userData.address);
    $('#profileCity').text(userData.city);
    $('#profileCountry').text(userData.country);
    $('#profileGender').text(userData.gender);
    $('#profileNationality').text(userData.nationality);
  }
}

// Editar perfil
$('#editProfileBtn').on('click', async function () {
  const user = auth.currentUser;
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    $('#editFirstName').val(userData.firstName);
    $('#editLastName').val(userData.lastName);
    $('#editBirthdate').val(userData.birthdate);
    $('#editAddress').val(userData.address);
    $('#editCity').val(userData.city);
    $('#editCountry').val(userData.country);
    $('#editGender').val(userData.gender);
    $('#editNationality').val(userData.nationality);
    $('#editEmail').val(auth.currentUser.email);
  }
  $('#editProfileModal').modal('show');
});

// Guardar cambios del perfil
$('#editUserForm').on('submit', async function (e) {
  e.preventDefault();

  const user = auth.currentUser;
  const firstName = $('#editFirstName').val().trim();
  const lastName = $('#editLastName').val().trim();
  const birthdate = $('#editBirthdate').val().trim();
  const address = $('#editAddress').val().trim();
  const city = $('#editCity').val().trim();
  const country = $('#editCountry').val().trim();
  const gender = $('#editGender').val();
  const nationality = $('#editNationality').val().trim();

  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      firstName,
      lastName,
      birthdate,
      address,
      city,
      country,
      gender,
      nationality
    });
    loadUserProfile(user.uid);
    $('#editProfileModal').modal('hide');
  } catch (error) {
    alert('Error al actualizar los datos: ' + error.message);
  }
});

// Cambiar contraseña
$('#changePasswordBtn').on('click', function () {
  $('#changePasswordModal').modal('show');
});

$('#savePasswordChanges').on('click', async function () {
  const user = auth.currentUser;
  const oldPassword = $('#changePasswordOld').val().trim();
  const newPassword = $('#changePasswordNew').val().trim();
  const newPasswordConfirm = $('#changePasswordNewConfirm').val().trim();

  if (!oldPassword || !newPassword || !newPasswordConfirm) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  if (newPassword !== newPasswordConfirm) {
    alert('Las nuevas contraseñas no coinciden.');
    return;
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, oldPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    alert('Contraseña actualizada exitosamente.');
    $('#changePasswordModal').modal('hide');
  } catch (error) {
    alert('Error al actualizar la contraseña: ' + error.message);
  }
});

// Confirmación antes de eliminar
async function confirmAndDelete(id, collectionType) {
  if (confirm("¿Estás seguro de que deseas eliminar este elemento?")) {
    await deleteDoc(doc(db, collectionType, id));
    collectionType === 'mensajesCRM' ? loadMessages() : loadProducts();
  }
}

// Cargar mensajes
async function loadMessages() {
  const messagesList = $('#messagesList');
  messagesList.empty();  // Limpiar la lista de mensajes

  const querySnapshot = await getDocs(collection(db, "mensajesCRM"));
  querySnapshot.forEach((doc) => {
    const message = doc.data();
    const messageItem = `
      <li class="list-group-item">
        <strong>${message.nombre}</strong> - ${message.email} - ${message.telefono}
        <p>${message.titulo}: ${message.mensaje}</p>
        <span class="text-muted">Fecha: ${new Date(message.fecha.seconds * 1000).toLocaleString()}</span>
        <i class="fas fa-trash-alt text-danger btn-delete" data-id="${doc.id}" style="cursor: pointer; margin-left: 10px;"></i>
        <i class="fas fa-edit text-warning btn-edit-message" data-id="${doc.id}" style="cursor: pointer; margin-left: 10px;"></i>
      </li>`;
    messagesList.append(messageItem);
  });
}

// Cargar productos
async function loadProducts() {
  const productsList = $('#productsList');
  productsList.empty();  // Limpiar la lista de productos

  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((doc) => {
    const product = doc.data();
    const mainImage = product.images.find(img => img.isMain)?.url || '';  // Obtener la imagen principal
    const productItem = `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <img src="${mainImage}" alt="Imagen Principal" style="width: 50px; height: 50px; margin-right: 10px;">
        <span>${product.name}</span>
        <span>${product.description}</span>
        <span>${product.category}</span>
        <span>${product.state ? 'Activo' : 'Inactivo'}</span>
        <span>
          <i class="fas fa-trash-alt text-danger btn-delete" data-id="${doc.id}" style="cursor: pointer;"></i>
          <i class="fas fa-eye text-info btn-show" data-id="${doc.id}" style="cursor: pointer; margin-left: 10px;"></i>
          <i class="fas fa-edit text-warning btn-edit" data-id="${doc.id}" style="cursor: pointer; margin-left: 10px;"></i>
        </span>
      </li>`;
    productsList.append(productItem);
  });
}

// Mostrar detalles del producto
$(document).on('click', '.btn-show', async function () {
  try {
    const id = $(this).data('id');
    const docRef = doc(db, "products", id);
    const productDoc = await getDoc(docRef);

    if (productDoc.exists()) {
      const product = productDoc.data();
      $('#showProductTitle').text(product.title);
      $('#showProductDescription').text(product.description);
      $('#showProductCategory').text(product.category);
      $('#showProductState').text(product.state ? 'Activo' : 'Inactivo');

      const imageContainer = $('#showProductImage');
      imageContainer.empty();
      product.images.forEach(image => {
        const imgElement = $(`<img src="${image.url}" class="${image.isMain ? 'img-thumbnail' : ''}" style="width: 100%; height: auto; margin-bottom: 10px;">`);
        imageContainer.append(imgElement);
      });

      $('#showProductModal').modal('show');
    }
  } catch (error) {
    console.error("Error mostrando el producto:", error);
  }
});

// Editar producto y otras funciones existentes para mensajes, agregar productos, etc.

// Cargar mensajes y productos al inicio
$(document).ready(() => {
  loadMessages();
  loadProducts();
});
