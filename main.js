const WHATSAPP_NUMBER_1 = "5493472580898";
const WHATSAPP_NUMBER_2 = "5493537568271";

const DEFAULT_COORDS = [-32.4075, -63.2402];
const DEFAULT_ZOOM = 7;

const map = L.map("map").setView(DEFAULT_COORDS, DEFAULT_ZOOM);

// ===== CAPAS =====
const mapa = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
});

const satelite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 19,
        attribution: "© Esri"
    }
);

// satélite por defecto
satelite.addTo(map);

L.control.layers(
    {
        "Satélite": satelite,
        "Mapa": mapa
    },
    {},
    {
        collapsed: false
    }
).addTo(map);

// ===== ELEMENTOS DESKTOP =====
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const fieldNameInput = document.getElementById("fieldName");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const gpsBtn = document.getElementById("gpsBtn");
const searchStatus = document.getElementById("searchStatus");
const coordsBox = document.getElementById("coordsBox");

const waBtn1 = document.getElementById("waBtn1");
const waBtn2 = document.getElementById("waBtn2");
const clearBtn = document.getElementById("clearBtn");

// ===== ELEMENTOS MOBILE =====
const nameInputMobile = document.getElementById("nameMobile");
const phoneInputMobile = document.getElementById("phoneMobile");
const fieldNameInputMobile = document.getElementById("fieldNameMobile");

const searchInputMobile = document.getElementById("searchInputMobile");
const searchBtnMobile = document.getElementById("searchBtnMobile");

const gpsBtnMobile = document.getElementById("gpsBtnMobile");
const searchStatusMobile = document.getElementById("searchStatusMobile");

const waBtn1Mobile = document.getElementById("waBtn1Mobile");
const waBtn2Mobile = document.getElementById("waBtn2Mobile");
const clearBtnMobile = document.getElementById("clearBtnMobile");

// ===== ESTADO =====
let points = [];
let markers = [];
let userMarker = null;

// ===== HELPERS =====
function isMobileView() {
    return window.innerWidth <= 900;
}

function getActiveName() {
    if (isMobileView() && nameInputMobile) {
        return (nameInputMobile.value || "").trim() || (nameInput?.value || "").trim();
    }
    return (nameInput?.value || "").trim() || (nameInputMobile?.value || "").trim();
}

function getActivePhone() {
    if (isMobileView() && phoneInputMobile) {
        return (phoneInputMobile.value || "").trim() || (phoneInput?.value || "").trim();
    }
    return (phoneInput?.value || "").trim() || (phoneInputMobile?.value || "").trim();
}

function getActiveFieldName() {
    if (isMobileView() && fieldNameInputMobile) {
        return (fieldNameInputMobile.value || "").trim() || (fieldNameInput?.value || "").trim();
    }
    return (fieldNameInput?.value || "").trim() || (fieldNameInputMobile?.value || "").trim();
}

function setStatus(message) {
    if (searchStatus) searchStatus.textContent = message;
    if (searchStatusMobile) searchStatusMobile.textContent = message;
}

function syncInputs(source, target) {
    if (!source || !target) return;
    target.value = source.value;
}

function createNumberedIcon(number) {
    return L.divIcon({
        className: "",
        html: `<div class="custom-number-icon">${number}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

// ===== RENDER =====
function renderPoints() {
    markers.forEach((marker) => map.removeLayer(marker));
    markers = [];

    points.forEach((point, index) => {
        const marker = L.marker([point.lat, point.lng], {
            icon: createNumberedIcon(index + 1)
        }).addTo(map);

        const popupHtml = `
      <div style="min-width: 170px;">
        <strong>Punto ${index + 1}</strong><br>
        Lat: ${point.lat.toFixed(6)}<br>
        Lng: ${point.lng.toFixed(6)}<br><br>
        <button
          type="button"
          onclick="removePoint(${index})"
          style="
            background:#dc2626;
            color:#fff;
            border:none;
            border-radius:8px;
            padding:8px 10px;
            font-weight:700;
            cursor:pointer;
            width:100%;
          "
        >
          Borrar este punto
        </button>
      </div>
    `;

        marker.bindPopup(popupHtml);
        markers.push(marker);
    });

    updatePointsPanel();
    updateWhatsAppLinks();
}

function updatePointsPanel() {
    if (!coordsBox) return;

    if (points.length === 0) {
        coordsBox.innerHTML = "Todavía no hay puntos marcados.";
        return;
    }

    let html = `<strong>Total de puntos:</strong> ${points.length}`;
    html += `<ol class="points-list">`;

    points.forEach((point, index) => {
        html += `
      <li>
        <strong>Punto ${index + 1}:</strong><br>
        Lat: ${point.lat.toFixed(6)}<br>
        Lng: ${point.lng.toFixed(6)}
      </li>
    `;
    });

    html += `</ol>`;
    coordsBox.innerHTML = html;
}

// ===== LÓGICA =====
function addPoint(latlng) {
    points.push({
        lat: latlng.lat,
        lng: latlng.lng
    });

    renderPoints();
}

function buildMessage() {
    const name = getActiveName();
    const phone = getActivePhone();
    const fieldName = getActiveFieldName();

    const lines = [
        "Hola, les envío la ubicación de tanques de agua.",
        "",
        `Nombre: ${name || "-"}`,
        `Teléfono: ${phone || "-"}`,
        `Campo: ${fieldName || "-"}`,
        `Cantidad de puntos: ${points.length}`,
        "",
        "Puntos marcados:"
    ];

    points.forEach((point, index) => {
        const mapsLink = `https://www.google.com/maps?q=${point.lat},${point.lng}`;
        lines.push(
            `Punto ${index + 1}: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`,
            `Google Maps punto ${index + 1}: ${mapsLink}`,
            ""
        );
    });

    return lines.join("\n");
}

function updateWhatsAppLinks() {
    const allButtons = [waBtn1, waBtn2, waBtn1Mobile, waBtn2Mobile].filter(Boolean);

    if (points.length === 0) {
        allButtons.forEach((btn) => {
            btn.style.pointerEvents = "none";
            btn.style.opacity = ".5";
            btn.href = "#";
        });
        return;
    }

    const message = buildMessage();

    const link1 = `https://wa.me/${WHATSAPP_NUMBER_1}?text=${encodeURIComponent(message)}`;
    const link2 = `https://wa.me/${WHATSAPP_NUMBER_2}?text=${encodeURIComponent(message)}`;

    if (waBtn1) waBtn1.href = link1;
    if (waBtn2) waBtn2.href = link2;
    if (waBtn1Mobile) waBtn1Mobile.href = link1;
    if (waBtn2Mobile) waBtn2Mobile.href = link2;

    allButtons.forEach((btn) => {
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
    });
}

function clearAllPoints() {
    points = [];
    renderPoints();
}

function searchLocation(query) {
    const q = (query || "").trim();

    if (!q) {
        setStatus("Escribí una ubicación para buscar.");
        return;
    }

    setStatus("Buscando ubicación...");

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
        headers: {
            Accept: "application/json"
        }
    })
        .then((response) => response.json())
        .then((data) => {
            if (!data.length) {
                setStatus("No encontré esa ubicación. Probá con otro nombre.");
                return;
            }

            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);

            map.setView([lat, lon], 16);
            setStatus("Ubicación encontrada. Ahora marcá todos los puntos que quieras.");
        })
        .catch(() => {
            setStatus("Hubo un error al buscar la ubicación.");
        });
}

function goToUserLocation() {
    if (!navigator.geolocation) {
        setStatus("Tu dispositivo no permite geolocalización.");
        return;
    }

    setStatus("Buscando tu ubicación actual...");

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 18);

            if (userMarker) {
                map.removeLayer(userMarker);
            }

            userMarker = L.circleMarker([lat, lng], {
                radius: 8,
                color: "#2563eb",
                fillColor: "#60a5fa",
                fillOpacity: 0.9
            }).addTo(map);

            userMarker.bindPopup("Tu ubicación actual").openPopup();

            setStatus("Ubicación actual encontrada. Ahora marcá los puntos en el mapa.");
        },
        () => {
            setStatus("No se pudo obtener tu ubicación. Podés buscar el campo manualmente.");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// ===== ACCIÓN GLOBAL PARA POPUP =====
window.removePoint = function (index) {
    points.splice(index, 1);
    renderPoints();
};

// ===== EVENTOS MAPA =====
map.on("click", function (e) {
    addPoint(e.latlng);
});

// ===== EVENTOS BÚSQUEDA =====
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        searchLocation(searchInput.value);
    });
}

if (searchBtnMobile) {
    searchBtnMobile.addEventListener("click", () => {
        searchLocation(searchInputMobile.value);
    });
}

if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchLocation(searchInput.value);
    });
}

if (searchInputMobile) {
    searchInputMobile.addEventListener("keydown", (e) => {
        if (e.key === "Enter") searchLocation(searchInputMobile.value);
    });
}

// ===== EVENTOS GPS =====
if (gpsBtn) gpsBtn.addEventListener("click", goToUserLocation);
if (gpsBtnMobile) gpsBtnMobile.addEventListener("click", goToUserLocation);

// ===== EVENTOS BORRAR TODO =====
if (clearBtn) clearBtn.addEventListener("click", clearAllPoints);
if (clearBtnMobile) clearBtnMobile.addEventListener("click", clearAllPoints);

// ===== SINCRONIZACIÓN DE INPUTS =====
if (nameInput && nameInputMobile) {
    nameInput.addEventListener("input", () => {
        syncInputs(nameInput, nameInputMobile);
        updateWhatsAppLinks();
    });

    nameInputMobile.addEventListener("input", () => {
        syncInputs(nameInputMobile, nameInput);
        updateWhatsAppLinks();
    });
}

if (phoneInput && phoneInputMobile) {
    phoneInput.addEventListener("input", () => {
        syncInputs(phoneInput, phoneInputMobile);
        updateWhatsAppLinks();
    });

    phoneInputMobile.addEventListener("input", () => {
        syncInputs(phoneInputMobile, phoneInput);
        updateWhatsAppLinks();
    });
}

if (fieldNameInput && fieldNameInputMobile) {
    fieldNameInput.addEventListener("input", () => {
        syncInputs(fieldNameInput, fieldNameInputMobile);
        updateWhatsAppLinks();
    });

    fieldNameInputMobile.addEventListener("input", () => {
        syncInputs(fieldNameInputMobile, fieldNameInput);
        updateWhatsAppLinks();
    });
}

// ===== CARGA INICIAL =====
window.addEventListener("load", () => {
    setTimeout(() => {
        goToUserLocation();
    }, 800);

    updatePointsPanel();
    updateWhatsAppLinks();
});