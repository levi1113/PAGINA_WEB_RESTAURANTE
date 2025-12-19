// frontend_admin/JS/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
  cargarEstadisticas();
  actualizarHora();
  setInterval(actualizarHora, 1000);
});

async function cargarEstadisticas() {
  const token = localStorage.getItem('adminToken');
  try {
    const response = await fetch('http://localhost:3000/api/admin/dashboard-stats', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401) logout();
      throw new Error('Error al cargar estadísticas.');
    }
    const data = await response.json();

    // 1. Pintar las tarjetas de estadísticas
    document.getElementById('stats-reservas-hoy').textContent = data.stats.reservasHoy;
    document.getElementById('stats-nuevos-clientes').textContent = data.stats.nuevosClientes;
    document.getElementById('stats-pendientes').textContent = data.stats.pendientes;
    document.getElementById('stats-total-clientes').textContent = data.stats.totalClientes;

    // 2. Pintar la lista de próximas reservas
    const listaReservas = document.getElementById('lista-proximas-reservas');
    if (listaReservas) {
      listaReservas.innerHTML = ''; 
      if (data.proximasReservas.length === 0) {
        listaReservas.innerHTML = '<p class="text-gray-400 text-sm p-4 text-center">No hay reservaciones pendientes.</p>';
      } else {
        data.proximasReservas.forEach(reserva => {
          listaReservas.innerHTML += `
            <div class="reserva-item bg-[#1a1a1a] rounded-xl p-4 border border-gray-800">
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <span class="bg-[#d4af37] text-black px-2 py-1 rounded text-xs font-medium">${reserva.reservation_time.substring(0, 5)}</span>
                    <span class="text-white font-medium">${reserva.client_name}</span>
                    <span class="text-gray-400 text-sm">${reserva.num_guests} personas</span>
                  </div>
                  <p class="text-gray-400 text-sm">Estado: Pendiente</p>
                </div>
                <a href="reservas.html" class="text-[#d4af37] text-sm hover:underline">Ver</a>
              </div>
            </div>
          `;
        });
      }
    }

    // 3. Pintar las NOTIFICACIONES (Nuevo)
    const contenedorNotif = document.getElementById('contenedor-notificaciones');
    if (contenedorNotif) {
      contenedorNotif.innerHTML = ''; 
      if (!data.notificaciones || data.notificaciones.length === 0) {
        contenedorNotif.innerHTML = '<p class="text-gray-400 text-sm text-center py-2">No hay notificaciones nuevas</p>';
      } else {
        data.notificaciones.forEach(notif => {
          if (notif.tipo === 'reserva') {
            contenedorNotif.innerHTML += `
              <div class="flex items-start gap-3 p-3 bg-yellow-500 bg-opacity-10 rounded-lg">
                <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p class="text-white text-sm">Reserva pendiente por confirmar</p>
                  <p class="text-gray-400 text-xs">${notif.name} - ${notif.reservation_time.substring(0, 5)}</p>
                </div>
              </div>
            `;
          } else {
            contenedorNotif.innerHTML += `
              <div class="flex items-start gap-3 p-3 bg-green-500 bg-opacity-10 rounded-lg">
                <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p class="text-white text-sm">Nuevo cliente registrado</p>
                  <p class="text-gray-400 text-xs">${notif.name}</p>
                </div>
              </div>
            `;
          }
        });
      }
    }

  } catch (error) {
    console.error(error.message);
  }
}

function actualizarHora() {
  const ahora = new Date();
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const fechaEl = document.getElementById('fechaActual');
  const horaEl = document.getElementById('horaActual');
  if (fechaEl) fechaEl.textContent = ahora.toLocaleDateString('es-ES', opciones);
  if (horaEl) horaEl.textContent = ahora.toLocaleTimeString('es-ES');
}

async function limpiarNotificaciones() {
  const token = localStorage.getItem('adminToken');
  
  if (!confirm('¿Deseas marcar todas las notificaciones como leídas?')) return;

  try {
    const response = await fetch('http://localhost:3000/api/admin/clear-notifications', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      // Recargamos las estadísticas para que la lista se vea vacía
      cargarEstadisticas();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}