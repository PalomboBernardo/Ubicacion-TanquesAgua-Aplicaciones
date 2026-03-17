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

// ===== ELEMENTOS =====
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const fieldNameInput = document.getElementById("fieldName");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const searchInputMobile = document.getElementById("searchInputMobile");
const searchBtnMobile = document.getElementById("searchBtnMobile");

const gpsBtn = document.getElementById("gpsBtn");
const gpsBtnMobile = document.getElementById("gpsBtnMobile");

const searchStatus = document.getElementById("searchStatus");
const coordsBox = document.getElementById("coordsBox");

const waBtn1 = document.getElementById("waBtn1");
const waBtn2 = document.getElementById("waBtn2");

const clearBtn = document.getElementById("clearBtn");

// ===== ESTADO =====
let points = [];
let markers = [];
let userMarker = null;

// ===== FUNCIONES =====
function createNumberedIcon(number) {
    return L.divIcon({
        className: "",
        html: `<div class="custom-number-icon">${number}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

function renderPoints() {
    // borrar marcadores viejos
    markers.forEach((marker) => map.removeLayer(marker));
    markers = [];

    // volver a dibujar todos con numeración actualizada
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

function addPoint(latlng) {
    points.push({
        lat: latlng.lat,
        lng: latlng.lng
    });

    renderPoints();
}

function updatePointsPanel() {
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

function buildMessage() {
    const name = (nameInput.value || "").trim();
    const phone = (phoneInput.value || "").trim();
    const fieldName = (fieldNameInput.value || "").trim();

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
    if (points.length === 0) {
        [waBtn1, waBtn2].forEach((btn) => {
            btn.style.pointerEvents = "none";
            btn.style.opacity = ".5";
            btn.href = "#";
        });
        return;
    }

    const message = buildMessage();

    waBtn1.href = `https://wa.me/${WHATSAPP_NUMBER_1}?text=${encodeURIComponent(message)}`;
    waBtn2.href = `https://wa.me/${WHATSAPP_NUMBER_2}?text=${encodeURIComponent(message)}`;

    [waBtn1, waBtn2].forEach((btn) => {
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
        searchStatus.textContent = "Escribí una ubicación para buscar.";
        return;
    }

    searchStatus.textContent = "Buscando ubicación...";

    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, {
        headers: {
            Accept: "application/json"
        }
    })
        .then((response) => response.json())
        .then((data) => {
            if (!data.length) {
                searchStatus.textContent = "No encontré esa ubicación. Probá con otro nombre.";
                return;
            }

            const result = data[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);

            map.setView([lat, lon], 16);
            searchStatus.textContent = "Ubicación encontrada. Ahora marcá todos los puntos que quieras.";
        })
        .catch(() => {
            searchStatus.textContent = "Hubo un error al buscar la ubicación.";
        });
}

function goToUserLocation() {
    if (!navigator.geolocation) {
        searchStatus.textContent = "Tu dispositivo no permite geolocalización.";
        return;
    }

    searchStatus.textContent = "Buscando tu ubicación actual...";

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

            searchStatus.textContent = "Ubicación actual encontrada. Ahora marcá los puntos en el mapa.";
        },
        () => {
            searchStatus.textContent = "No se pudo obtener tu ubicación. Podés buscar el campo manualmente.";
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// función global para el botón del popup
window.removePoint = function (index) {
    points.splice(index, 1);
    renderPoints();
};

// ===== EVENTOS =====
map.on("click", function (e) {
    addPoint(e.latlng);
});

searchBtn.addEventListener("click", () => {
    searchLocation(searchInput.value);
});

searchBtnMobile.addEventListener("click", () => {
    searchLocation(searchInputMobile.value);
});

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchLocation(searchInput.value);
});

searchInputMobile.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchLocation(searchInputMobile.value);
});

gpsBtn.addEventListener("click", goToUserLocation);
gpsBtnMobile.addEventListener("click", goToUserLocation);

[nameInput, phoneInput, fieldNameInput].forEach((input) => {
    input.addEventListener("input", updateWhatsAppLinks);
});

clearBtn.addEventListener("click", clearAllPoints);

// intentar ubicar automáticamente al abrir
window.addEventListener("load", () => {
    setTimeout(() => {
        goToUserLocation();
    }, 800);
});