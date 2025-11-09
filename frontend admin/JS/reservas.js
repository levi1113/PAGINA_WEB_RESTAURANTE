// frontend_admin/JS/reservas.js

document.addEventListener('DOMContentLoaded', () => {
  cargarReservas();
});

// --- FUNCIÓN PRINCIPAL PARA CARGAR RESERVAS ---
async function cargarReservas() {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    alert('Acceso denegado. Por favor, inicie sesión.');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/admin/reservas', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        alert('Su sesión ha expirado. Por favor, inicie sesión de nuevo.');
        window.location.href = 'login.html';
      }
      throw new Error('Error al cargar las reservas.');
    }

    const reservas = await response.json();
    pintarTablaReservas(reservas);

  } catch (error) {
    console.error(error.message);
  }
}

// --- FUNCIÓN PARA "PINTAR" LA TABLA ---
function pintarTablaReservas(reservas) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = ''; 

  if (reservas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">No hay reservaciones para mostrar.</td></tr>';
    return;
  }

  reservas.forEach(reserva => {
    const fecha = new Date(reserva.reservation_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let estadoClass = '';
    let estadoTexto = '';
    switch (reserva.status) {
      case 'confirmed':
        estadoClass = 'bg-green-100 text-green-800';
        estadoTexto = 'Confirmada';
        break;
      case 'pending':
        estadoClass = 'bg-yellow-100 text-yellow-800';
        estadoTexto = 'Pendiente';
        break;
      case 'cancelled':
        estadoClass = 'bg-red-100 text-red-800';
        estadoTexto = 'Cancelada';
        break;
    }

    const filaHtml = `
      <tr class="hover:bg-gray-50 transition-colors" data-id="${reserva.id}">
        <td class="py-4 px-6">
          <div>
            <div class="font-medium text-gray-900">${reserva.client_name}</div>
            <div class="text-sm text-gray-500">${reserva.client_email}</div>
          </div>
        </td>
        <td class="py-4 px-6 text-gray-700">${fecha}</td>
        <td class="py-4 px-6 text-gray-700">${reserva.reservation_time}</td>
        <td class="py-4 px-6 text-gray-700">${reserva.num_guests}</td>
        <td class="py-4 px-6 text-gray-700">${reserva.client_phone || 'N/A'}</td>
        <td class="py-4 px-6">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${estadoClass}">
            ${estadoTexto}
          </span>
        </td>
        <td class="py-4 px-6">
          <div class="flex gap-2">
            
            <button 
              class="btn-confirmar text-green-600 hover:text-green-800 transition-colors" 
              title="Confirmar"
              ${reserva.status === 'confirmed' ? 'disabled' : ''}>✅</button>
            
            <button 
              class="btn-cancelar text-red-600 hover:text-red-800 transition-colors" 
              title="Cancelar"
              ${reserva.status === 'cancelled' ? 'disabled' : ''}>❌</button>
            
            <button class="text-gray-600 hover:text-gray-800 transition-colors" title="Ver detalles">👁️</button>
          
          </div>
        </td>
      </tr>
    `;
    tbody.innerHTML += filaHtml;
  });

  // --- ¡AÑADIMOS LOS EVENT LISTENERS! ---
  // Una vez que todas las filas están en el HTML, añadimos los eventos
  agregarEventosBotones();
}

// --- FUNCIÓN PARA AÑADIR EVENTOS A LOS BOTONES ---
function agregarEventosBotones() {
  
  // Botones de Confirmar
  document.querySelectorAll('.btn-confirmar').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.closest('tr').dataset.id; // Obtiene el ID de la fila
      actualizarEstadoReserva(id, 'confirmed');
    });
  });

  // Botones de Cancelar
  document.querySelectorAll('.btn-cancelar').forEach(button => {
    button.addEventListener('click', () => {
      if (confirm('¿Está seguro de que desea cancelar esta reservación?')) {
        const id = button.closest('tr').dataset.id; // Obtiene el ID de la fila
        actualizarEstadoReserva(id, 'cancelled');
      }
    });
  });
}

// --- FUNCIÓN PARA LLAMAR AL BACKEND Y ACTUALIZAR ---
async function actualizarEstadoReserva(id, nuevoEstado) {
  const token = localStorage.getItem('adminToken');
  try {
    const response = await fetch(`http://localhost:3000/api/admin/reservas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: nuevoEstado })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar');
    }

    // ¡Éxito! Recargamos la tabla para mostrar el cambio
    cargarReservas();

  } catch (error) {
    console.error(error.message);
    alert(`Error: ${error.message}`);
  }
}