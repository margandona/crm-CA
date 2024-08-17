import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { getFirestore, addDoc, collection, serverTimestamp, getDocs, deleteDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Inicializar Auth, Firestore y Storage
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Verificar si el usuario está autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario autenticado: ", user.uid);
  } else {
    console.log("Usuario no autenticado");
    window.location.href = 'index.html';  // Redirige al login si no está autenticado
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

// Editar producto
$(document).on('click', '.btn-edit', async function () {
  try {
    const id = $(this).data('id');
    const docRef = doc(db, "products", id);
    const productDoc = await getDoc(docRef);

    if (productDoc.exists()) {
      const product = productDoc.data();
      $('#editProductTitle').val(product.title);
      $('#editProductName').val(product.name);
      $('#editProductAge').val(product.age);
      $('#editProductServices').val(product.services.join(', '));
      $('#editProductCategory').val(product.category);
      $('#editProductState').prop('checked', product.state);
      $('#editProductDescription').val(product.description);
      $('#editProductId').val(id);  // Guardar el ID en un campo oculto

      const imageContainer = $('#editProductImagesContainer');
      imageContainer.empty();
      product.images.forEach((image, index) => {
        const imgElement = $(`<img src="${image.url}" class="img-thumbnail ${image.isMain ? 'selected' : ''}" style="width: 50px; height: 50px; cursor: pointer;" data-index="${index}">`);
        imgElement.on('click', function () {
          $('#editProductImagesContainer img').removeClass('selected');
          imgElement.addClass('selected');
        });
        imageContainer.append(imgElement);
      });

      $('#editProductModal').modal('show');
    }
  } catch (error) {
    console.error("Error editando el producto:", error);
  }
});

// Guardar cambios del producto editado
$('#editProductForm').submit(async function (event) {
  event.preventDefault();

  const id = $('#editProductId').val();
  const title = $('#editProductTitle').val();
  const name = $('#editProductName').val();
  const age = $('#editProductAge').val();
  const services = $('#editProductServices').val().split(',').map(service => service.trim());
  const category = $('#editProductCategory').val();
  const state = $('#editProductState').is(':checked');
  const description = $('#editProductDescription').val();

  const images = [];
  $('#editProductImagesContainer img').each(function () {
    images.push({
      url: $(this).attr('src'),
      isMain: $(this).hasClass('selected')
    });
  });

  const docRef = doc(db, "products", id);
  await updateDoc(docRef, { title, name, age, services, category, state, description, images });

  $('#editProductModal').modal('hide');
  loadProducts();
});

// Agregar mensaje
$('#addMessageForm').submit(async function (event) {
  event.preventDefault();

  const nombre = $('#messageName').val();
  const email = $('#messageEmail').val();
  const telefono = $('#messagePhone').val();
  const titulo = $('#messageTitle').val();
  const mensaje = $('#messageContent').val();

  await addDoc(collection(db, "mensajesCRM"), {
    nombre,
    email,
    telefono,
    titulo,
    mensaje,
    fecha: serverTimestamp()
  });

  $('#addMessageForm')[0].reset();
  $('#addMessageModal').modal('hide');
  loadMessages();
});

// Editar mensaje
$(document).on('click', '.btn-edit-message', async function () {
  try {
    const id = $(this).data('id');
    const docRef = doc(db, "mensajesCRM", id);
    const messageDoc = await getDoc(docRef);

    if (messageDoc.exists()) {
      const message = messageDoc.data();
      $('#editMessageName').val(message.nombre);
      $('#editMessageEmail').val(message.email);
      $('#editMessagePhone').val(message.telefono);
      $('#editMessageTitle').val(message.titulo);
      $('#editMessageContent').val(message.mensaje);
      $('#editMessageId').val(id);

      $('#editMessageModal').modal('show');
    }
  } catch (error) {
    console.error("Error editando el mensaje:", error);
  }
});

// Guardar cambios del mensaje editado
$('#editMessageForm').submit(async function (event) {
  event.preventDefault();

  const id = $('#editMessageId').val();
  const nombre = $('#editMessageName').val();
  const email = $('#editMessageEmail').val();
  const telefono = $('#editMessagePhone').val();
  const titulo = $('#editMessageTitle').val();
  const mensaje = $('#editMessageContent').val();

  const docRef = doc(db, "mensajesCRM", id);
  await updateDoc(docRef, { nombre, email, telefono, titulo, mensaje });

  $('#editMessageModal').modal('hide');
  loadMessages();
});

// Confirmar eliminación y eliminar el elemento
$(document).on('click', '.btn-delete', function () {
  const id = $(this).data('id');
  const collectionType = $(this).closest('ul').attr('id') === 'messagesList' ? 'mensajesCRM' : 'products';
  confirmAndDelete(id, collectionType);
});

// Cargar mensajes y productos al inicio
$(document).ready(() => {
  loadMessages();
  loadProducts();
});

// Manejo de la carga de imágenes y selección de la imagen principal en el formulario de agregar producto
let selectedMainImage = null;
let imageFiles = [];

$('#productImages').on('change', function (event) {
  const files = event.target.files;
  imageFiles = Array.from(files);

  const imagePreviewContainer = $('#imagePreviewContainer');
  imagePreviewContainer.empty();

  imageFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imgElement = $(`<img src="${e.target.result}" data-index="${index}" alt="Product Image" class="img-thumbnail" style="width: 50px; height: 50px; cursor: pointer;">`);
      imgElement.on('click', function () {
        $('#imagePreviewContainer img').removeClass('selected');
        imgElement.addClass('selected');
        selectedMainImage = index;
      });
      imagePreviewContainer.append(imgElement);
    };
    reader.readAsDataURL(file);
  });
});

// Manejo del formulario de productos
$('#addProductForm').submit(async function (event) {
  event.preventDefault();

  const title = $('#productTitle').val();
  const name = $('#productName').val();
  const age = $('#productAge').val();
  const services = $('#productServices').val().split(',').map(service => service.trim());
  const category = $('#productCategory').val();
  const state = $('#productState').is(':checked');
  const description = $('#productDescription').val();

  if (imageFiles.length === 0) {
    alert('Por favor, selecciona al menos una imagen.');
    return;
  }

  if (selectedMainImage === null) {
    alert('Por favor, selecciona una imagen principal.');
    return;
  }

  const imageUrls = [];

  // Cargar imágenes a Firebase Storage
  for (const [index, file] of imageFiles.entries()) {
    try {
      const storageRef = ref(storage, `products/${title}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      imageUrls.push({
        url: downloadURL,
        isMain: index === selectedMainImage
      });
    } catch (error) {
      console.error("Error al subir la imagen:", error.message);
      alert("No tienes permisos para subir esta imagen. Verifica tu autenticación o contacta al administrador.");
      return; // Detener el proceso si ocurre un error
    }
  }

  // Guardar producto en Firestore
  await addDoc(collection(db, "products"), {
    title,
    name,
    age,
    services,
    category,
    state,
    description,
    images: imageUrls,
    createdAt: serverTimestamp()
  });

  // Resetear formulario y cerrar modal
  $('#addProductForm')[0].reset();
  $('#imagePreviewContainer').empty();
  $('#addProductModal').modal('hide');

  // Recargar la lista de productos
  loadProducts();
});

// Inicializar las pestañas de Bootstrap
$(document).ready(function () {
  $('#myTab a').on('click', function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  $('#myTab a[href="#messages"]').tab('show');
  $('#myTab a[href="#products"]').tab('show');
});
    