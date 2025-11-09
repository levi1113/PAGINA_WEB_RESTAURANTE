// frontend_admin/JS/auth.js

// 1. Obtenemos el token de localStorage
const token = localStorage.getItem('adminToken');

// 2. Verificamos el token
// Esto se ejecuta ANTES de que la página se cargue
if (!token) {
  // Si NO hay token, no dejamos cargar la página y redirigimos al login
  alert('Acceso denegado. Por favor, inicie sesión.');
  
  // Asumiendo que todos los HTML están en la misma carpeta
  window.location.href = 'login.html'; 
}

// 3. Función de Logout Global
// Hacemos esta función global para que todos los botones de "Cerrar Sesión" la usen
function logout() {
  if (confirm('¿Está seguro de que desea cerrar sesión?')) {
    localStorage.removeItem('adminToken'); // Borramos el token
    window.location.href = 'login.html';
  }
}