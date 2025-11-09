// frontend_admin/JS/clientes.js

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Obtener el token (el script 'auth.js' ya lo validó)
  const token = localStorage.getItem('adminToken');

  // 2. Buscar en el backend la lista de clientes
  try {
    const response = await fetch('http://localhost:3000/api/admin/clientes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        logout(); // Llama a la función global de auth.js
      }
      throw new Error('Error al cargar los clientes.');
    }

    const clientes = await response.json();
    
    // 3. Llamar a la función para dibujar la tabla
    pintarTablaClientes(clientes);

  } catch (error) {
    console.error(error.message);
  }
});

function pintarTablaClientes(clientes) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  tbody.innerHTML = ''; // Limpiamos el "Cargando..."

  if (clientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-400">Aún no hay clientes registrados.</td></tr>';
    return;
  }

  // 4. Creamos una fila (<tr>) por cada cliente
  clientes.forEach(cliente => {
    
    let ultimaVisita = 'N/A';
    if (cliente.ultima_visita_fecha) {
      // Formatear la fecha (MySQL la da como YYYY-MM-DD)
      const fecha = new Date(cliente.ultima_visita_fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      ultimaVisita = `${fecha} ${cliente.ultima_visita_hora.substring(0, 5)}`;
    }

    // Crear las iniciales (ej. María González -> MG) [cite: 450]
    const iniciales = cliente.name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    const filaHtml = `
      <tr class="hover:bg-[#1a1a1a] transition-colors">
        
        <td class="py-4 px-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-[#d4af37] rounded-full flex items-center justify-center text-black font-bold">
              ${iniciales}
            </div>
            <div>
              <div class="text-white font-medium">${cliente.name}</div>
              <div class="text-gray-400 text-sm">${cliente.total_visitas > 5 ? 'Cliente Premium' : 'Cliente Regular'}</div>
            </div>
          </div>
        </td>

        <td class="py-4 px-6">
          <div class="text-white">${cliente.email}</div>
          <div class="text-gray-400 text-sm">${cliente.phone || 'N/A'}</div>
        </td>

        <td class="py-4 px-6">
          <span class="text-white font-medium">${cliente.total_visitas}</span>
          <span class="text-gray-400 text-sm"> veces</span>
        </td>

        <td class="py-4 px-6">
          <div class="text-white">${ultimaVisita.split(' ')[0]}</div>
          <div class="text-gray-400 text-sm">${ultimaVisita.split(' ')[1] || ''}</div>
        </td>

        <td class="py-4 px-6">
          <span class="text-[#d4af37] font-medium">$0</span> </td>

        <td class="py-4 px-6">
          <div class="flex flex-wrap gap-1">
            </div>
        </td>

        <td class="py-4 px-6">
          <button class="text-[#d4af37] hover:text-[#f5d67b] transition-colors text-sm font-medium">
            Ver Detalles
          </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += filaHtml;
  });
}