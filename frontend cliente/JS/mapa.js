// frontend_cliente/JS/mapa.js

// 1. Coordenadas del restaurante
// (Reemplaza esto con las coordenadas reales de tu restaurante)
const MI_UBICACION = { lat: 19.432608, lng: -99.133209 }; // (Ejemplo: Zócalo CDMX)

// 2. Esta función se llamará cuando el script de Google Maps esté listo
function initMap() {
  // Crea el mapa
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 16, // Nivel de zoom (más alto = más cerca)
    center: MI_UBICACION, // Centra el mapa en tu ubicación
  });

  // Crea un marcador (el pin rojo)
  const marker = new google.maps.Marker({
    position: MI_UBICACION,
    map: map,
    title: "Parrilla 3 Elementos",
  });
}

// 3. Esta función carga dinámicamente el script de Google Maps
async function loadMapScript() {
  try {
    // 3a. Pide la clave de API a nuestro backend
    const response = await fetch('http://localhost:3000/api/config/maps-key');
    if (!response.ok) {
      throw new Error('No se pudo obtener la clave de API del backend.');
    }
    
    const config = await response.json();
    const apiKey = config.key;

    // 3b. Crea la etiqueta <script> dinámicamente
    const script = document.createElement('script');
    
    // 3c. Añade la URL de Google Maps, incluyendo nuestra clave
    // y el parámetro 'callback=initMap'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // 3d. Añade el script al <head> del HTML
    document.head.appendChild(script);

  } catch (error) {
    console.error('Error al cargar el mapa:', error.message);
    document.getElementById("map").innerHTML = "Error al cargar el mapa.";
  }
}

// 4. Llama a la función principal para iniciar todo el proceso
loadMapScript();

// 5. IMPORTANTE: Hacemos que initMap sea global
// El script de Google que cargamos buscará 'window.initMap'
window.initMap = initMap;