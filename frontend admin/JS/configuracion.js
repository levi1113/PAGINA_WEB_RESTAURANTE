// frontend_admin/JS/configuracion.js

// (El script 'auth.js' ya se está ejecutando desde el <head>)

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('configForm');
  if (!form) return;

  // 1. Cargar los datos actuales al abrir la página
  cargarConfiguracion(form);

  // 2. Añadir el evento para guardar
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Convertir los datos del formulario a un objeto
    const formData = new FormData(form);
    const settings = Object.fromEntries(formData.entries());

    // Llamar a la función de guardar
    guardarConfiguracion(settings);
  });
});

async function cargarConfiguracion(form) {
  const token = localStorage.getItem('adminToken');
  try {
    const response = await fetch('http://localhost:3000/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      if (response.status === 401) logout();
      throw new Error('Error al cargar la configuración.');
    }

    const settings = await response.json();

    // Rellenar cada campo del formulario con los datos de la BD
    for (const key in settings) {
      if (form.elements[key]) {
        form.elements[key].value = settings[key];
      }
    }

  } catch (error) {
    console.error(error.message);
    alert(error.message);
  }
}

async function guardarConfiguracion(settings) {
  const token = localStorage.getItem('adminToken');
  try {
    const response = await fetch('http://localhost:3000/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar');
    }

    alert(data.message); // "Configuración guardada exitosamente"

  } catch (error) {
    console.error(error.message);
    alert(error.message);
  }
}