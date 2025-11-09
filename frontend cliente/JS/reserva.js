document.addEventListener('DOMContentLoaded', () => {
  
  // Capturamos el formulario de reservación 
  const formReservacion = document.querySelector('#formulario form');
  if (formReservacion) {
    formReservacion.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // 1. Recolectar los datos del formulario
      const data = {
        nombre: e.target.querySelector('input[placeholder="Ingrese su nombre"]').value,
        email: e.target.querySelector('input[placeholder="su@email.com"]').value,
        telefono: '', // (No vi campo de teléfono en tu form, puedes añadirlo)
        fecha: e.target.querySelector('input[type="date"]').value,
        hora: e.target.querySelector('select[required]').options[e.target.querySelector('select[required]').selectedIndex].text,
        
        // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
        personas: parseInt(e.target.querySelectorAll('select[required]')[1].options[e.target.querySelectorAll('select[required]')[1].selectedIndex].text),
        
        experiencia: e.target.querySelectorAll('select')[2].options[e.target.querySelectorAll('select')[2].selectedIndex].text,
        comentarios: e.target.querySelector('textarea').value
      };

      try {
        // 2. Enviar al backend
        const response = await fetch('http://localhost:3000/api/reservar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Error desconocido');
        }

        // 3. ¡Éxito!
        alert(result.message);
        formReservacion.reset(); // Limpia el formulario

      } catch (error) {
        console.error('Error en el formulario:', error.message);
        alert(`Error al enviar su reservación: ${error.message}`);
      }
    });
  }
});