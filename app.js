import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore();

// Función para cargar productos desde Firebase
async function loadProducts() {
    const productsCollection = collection(db, "products");
    const querySnapshot = await getDocs(productsCollection);

    const headerProducts = [];
    const vipProducts = [];
    const gridProducts = [];
    const generalProducts = [];
    const asideProducts = [];

    querySnapshot.forEach((doc) => {
        const product = doc.data();
        if (product.state) {  // Mostrar solo productos activos
            switch (product.category) {
                case "header":
                    headerProducts.push(product);
                    break;
                case "vip":
                    vipProducts.push(product);
                    break;
                case "grid":
                    gridProducts.push(product);
                    break;
                case "general":
                    generalProducts.push(product);
                    break;
                case "aside":
                    asideProducts.push(product);
                    break;
            }
        }
    });

    renderHeroSection(asideProducts);
    renderHeaderCarousel(headerProducts);
    renderVipSection(vipProducts);
    renderGridSection(gridProducts);
    renderGeneralSection(generalProducts);
}

// Función para mostrar la sección Hero con productos de la categoría "aside"
function renderHeroSection(asideProducts) {
    if (asideProducts.length > 0) {
        const randomProduct = asideProducts[Math.floor(Math.random() * asideProducts.length)];
        $(".hero-section__img").attr("src", randomProduct.images[0].url);
        $(".hero-section__motto").text(randomProduct.title);
    }
}

// Función para mostrar el carrusel de la categoría "header"
function renderHeaderCarousel(headerProducts) {
    const carouselInner = $(".carousel-inner");
    carouselInner.empty();

    headerProducts.forEach((product, index) => {
        const activeClass = index === 0 ? "active" : "";
        const carouselItem = `
            <div class="carousel-item ${activeClass}">
                <img src="${product.images[0].url}" class="d-block w-100" alt="${product.title}">
                <div class="carousel-caption d-none d-md-block">
                    <h5>${product.title}</h5>
                    <p>${product.description}</p>
                </div>
            </div>`;
        carouselInner.append(carouselItem);
    });
}

// Función para mostrar la sección VIP con un carrusel de productos
function renderVipSection(vipProducts) {
    const vipContainer = $(".vip-section");
    vipContainer.empty();

    vipProducts.forEach(product => {
        const vipCard = `
            <div class="card mb-4 shadow-sm">
                <img src="${product.images[0].url}" class="card__img card-img-top" alt="${product.title}">
                <div class="card__body card-body">
                    <p class="card__text card-text">${product.description}</p>
                    <button type="button" class="card__btn btn btn-sm btn-outline-secondary" data-toggle="tooltip" title="Ver Detalles">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>`;
        vipContainer.append(vipCard);
    });
}

// Función para mostrar la sección de categoría "grid"
function renderGridSection(gridProducts) {
    const gridContainer = $(".grid-section");
    gridContainer.empty();

    gridProducts.forEach(product => {
        const gridItem = `
            <div class="card mb-4 shadow-sm">
                <img src="${product.images[0].url}" class="card__img card-img-top" alt="${product.title}">
                <div class="card__body card-body">
                    <p class="card__text card-text">${product.description}</p>
                    <button type="button" class="card__btn btn btn-sm btn-outline-secondary" data-toggle="tooltip" title="Ver Detalles">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>`;
        gridContainer.append(gridItem);
    });
}

// Función para mostrar la sección de categoría "general"
function renderGeneralSection(generalProducts) {
    const generalContainer = $(".general-section");
    generalContainer.empty();

    generalProducts.forEach(product => {
        const generalItem = `
            <div class="card mb-4 shadow-sm">
                <img src="${product.images[0].url}" class="card__img card-img-top" alt="${product.title}">
                <div class="card__body card-body">
                    <p class="card__text card-text">${product.description}</p>
                    <button type="button" class="card__btn btn btn-sm btn-outline-secondary" data-toggle="tooltip" title="Ver Detalles">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </div>`;
        generalContainer.append(generalItem);
    });
}

// Manejo del formulario de mensajes
$("#messageForm").submit(async function (event) {
    event.preventDefault();

    const nombre = $("#name").val();
    const email = $("#email").val();
    const telefono = $("#telefono").val();
    const titulo = $("#title").val();
    const mensaje = $("#mensaje").val();

    await addDoc(collection(db, "mensajesCRM"), {
        nombre,
        email,
        telefono,
        titulo,
        mensaje,
        fecha: serverTimestamp()
    });

    alert("Mensaje enviado correctamente.");
    $("#messageForm")[0].reset();
});

// Cargar los productos al cargar la página
$(document).ready(function () {
    loadProducts();
});
