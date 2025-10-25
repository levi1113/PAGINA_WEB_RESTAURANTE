// backend/routes/cliente.routes.js

import express from 'express';
const router = express.Router();

// (Aquí pondremos las rutas de cliente (reservas) más adelante)


// --- RUTA PARA EL MAPA DE GOOGLE ---
// Esta ruta envía la clave de API de forma segura al frontend
router.get('/config/maps-key', (req, res) => {
  try {
    // Leemos la clave desde el archivo .env
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('La clave de API de Google Maps no está configurada');
    }
    // Enviamos la clave al frontend
    res.json({ key: apiKey });

  } catch (error) {
    console.error('Error al enviar la clave de Google Maps:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});


// ¡Esta es la línea que arregla el error de antes!
export default router;