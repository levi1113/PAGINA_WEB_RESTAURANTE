// backend/routes/cliente.routes.js

import express from 'express';
import pool from '../utils/db.js'; // Importamos el pool de DB

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

// --- RUTA PARA CREAR UNA RESERVACIÓN ---
// POST /api/reservar
router.post('/reservar', async (req, res) => {
  try {
    // 1. Obtenemos los datos del formulario del cliente 
    const { 
      nombre, email, telefono, 
      fecha, hora, personas, 
      experiencia, comentarios 
    } = req.body;

    // 2. Validamos datos básicos
    if (!nombre || !email || !fecha || !hora || !personas) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    // 3. Obtenemos una conexión del pool
    const connection = await pool.getConnection();

    try {
      // 4. Verificamos si el cliente ya existe
      let [clients] = await connection.query(
        'SELECT id FROM clients WHERE email = ?',
        [email]
      );

      let clientId;

      if (clients.length > 0) {
        // 5a. Si existe, usamos su ID
        clientId = clients[0].id;
        // (Opcional: podrías actualizar su teléfono si es diferente)
      } else {
        // 5b. Si no existe, lo creamos
        const [newClient] = await connection.query(
          'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
          [nombre, email, telefono]
        );
        clientId = newClient.insertId;
      }

      // 6. Insertamos la reservación en la tabla 'reservations'
      await connection.query(
        `INSERT INTO reservations (client_id, reservation_date, reservation_time, num_guests, experience_type, comments) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [clientId, fecha, hora, personas, experiencia, comentarios]
      );

      // 7. Devolvemos la conexión al pool
      connection.release();

      // 8. Enviamos respuesta de éxito
      res.status(201).json({ message: 'Reservación creada exitosamente. Un miembro del equipo la confirmará pronto.' });

    } catch (dbError) {
      connection.release(); // Asegúrate de soltar la conexión si hay un error
      throw dbError; // Pasa el error al catch principal
    }

  } catch (error) {
    console.error('Error al crear la reservación:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ¡Esta es la línea que arregla el error de antes!
export default router;