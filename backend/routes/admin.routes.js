// backend/routes/admin.routes.js

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../utils/db.js'; // Importamos nuestro pool de conexión

const router = express.Router();

// --- FUNCIÓN GUARDIANA (MIDDLEWARE) ---
// Esta función revisará el token en CADA ruta de admin que la use.
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token.' });
  }

  try {
    const token = authHeader.split(' ')[1]; // Obtiene el token después de "Bearer "
    
    // Verifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unaClaveSecretaDeRespaldo');
    
    // Adjuntamos los datos del usuario (del token) al objeto 'req'
    // para que las siguientes rutas puedan usarlo si es necesario.
    req.user = decoded; 
    
    next(); // ¡Permiso concedido! Pasa a la siguiente función (la ruta)
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

// --- RUTA DE LOGIN: POST /api/admin/login ---
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validar que el usuario y contraseña vengan
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
    }

    // 2. Buscar al usuario en la base de datos
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    const user = rows[0];

    // 3. Si el usuario no existe, enviar error
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    // 4. Comparar la contraseña enviada con el hash guardado
    const isMatch = await bcrypt.compare(password, user.password_hash);

    // 5. Si la contraseña no coincide, enviar error
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas.' });
    }

    // 6. ¡Éxito! Crear un Token (JWT)
    // Este token es el "gafete" que el admin usará para
    // acceder a otras rutas protegidas.
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'unaClaveSecretaDeRespaldo', // ¡Deberías añadir JWT_SECRET a tu .env!
      { expiresIn: '1h' } // El token expira en 1 hora
    );

    // 7. Enviar el token de vuelta al frontend
    res.json({
      message: 'Login exitoso',
      token: token
    });

  } catch (error) {
    console.error('Error en el login:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- RUTA PARA VER TODAS LAS RESERVACIONES (¡PROTEGIDA!) ---
// GET /api/admin/reservas
router.get('/reservas', protect, async (req, res) => {
  // Si llegas aquí, es porque el middleware 'protect' dijo que sí.
  
  try {
    // Consultamos la BD, uniendo las tablas para obtener el nombre del cliente
    const [reservas] = await pool.query(
      `SELECT 
         r.id, r.reservation_date, r.reservation_time, r.num_guests, r.status,
         r.experience_type, r.comments,
         c.name AS client_name, c.email AS client_email, c.phone AS client_phone
       FROM reservations r
       JOIN clients c ON r.client_id = c.id
       ORDER BY r.reservation_date DESC, r.reservation_time DESC`
    );

    res.json(reservas);

  } catch (error) {
    console.error('Error al obtener las reservaciones:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- RUTA PARA ACTUALIZAR ESTADO DE RESERVA (¡PROTEGIDA!) ---
// PATCH /api/admin/reservas/:id
router.patch('/reservas/:id', protect, async (req, res) => {
  try {
    const { id } = req.params; // El ID de la reservación
    const { status } = req.body; // El nuevo estado (ej. "confirmed" o "cancelled")

    // 1. Validar que el estado sea uno de los permitidos
    if (!['confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Estado no válido.' });
    }

    // 2. Actualizar la base de datos
    const [result] = await pool.query(
      'UPDATE reservations SET status = ? WHERE id = ?',
      [status, id]
    );

    // 3. Verificar si algo se actualizó
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reservación no encontrada.' });
    }

    // 4. Enviar respuesta de éxito
    res.json({ message: `Reservación marcada como ${status}` });

  } catch (error) {
    console.error('Error al actualizar la reservación:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- RUTA PARA ESTADÍSTICAS DEL DASHBOARD (¡PROTEGIDA!) ---
// GET /api/admin/dashboard-stats
router.get('/dashboard-stats', protect, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // 1. Contar reservas de hoy (que no estén canceladas)
    const [reservasHoy] = await connection.query(
      "SELECT COUNT(*) as total FROM reservations WHERE DATE(reservation_date) = CURDATE() AND status != 'cancelled'"
    );

    // 2. Contar clientes nuevos (registrados en los últimos 30 días)
    const [nuevosClientes] = await connection.query(
      "SELECT COUNT(*) as total FROM clients WHERE created_at >= CURDATE() - INTERVAL 30 DAY"
    );

    // 3. Contar total de reservas pendientes
    const [pendientes] = await connection.query(
      "SELECT COUNT(*) as total FROM reservations WHERE status = 'pending'"
    );

    // 4. Contar el total histórico de clientes
    const [totalClientes] = await connection.query(
      "SELECT COUNT(*) as total FROM clients"
    );

    // 5. Obtener las 5 próximas reservas pendientes (para la lista central)
    const [proximasReservas] = await connection.query(
      `SELECT r.id, r.reservation_time, r.num_guests, c.name as client_name
       FROM reservations r
       JOIN clients c ON r.client_id = c.id
       WHERE r.status = 'pending' AND r.reservation_date >= CURDATE()
       ORDER BY r.reservation_date ASC, r.reservation_time ASC
       LIMIT 5`
    );

    // --- NUEVAS CONSULTAS PARA NOTIFICACIONES ---

    // 6. Alertas amarillas (Solo no leídas)
    const [notifReservas] = await connection.query(
      `SELECT r.id, c.name, r.reservation_time, 'reserva' as tipo 
      FROM reservations r 
      JOIN clients c ON r.client_id = c.id 
      WHERE r.status = 'pending' AND r.is_read = 0
      ORDER BY r.created_at DESC LIMIT 5`
    );

    // 7. Alertas verdes (Solo no leídos)
    const [notifClientes] = await connection.query(
      `SELECT id, name, 'cliente' as tipo 
      FROM clients 
      WHERE is_read = 0
      ORDER BY created_at DESC LIMIT 5`
    );

    // Liberar la conexión al pool
    connection.release();

    // Enviar respuesta completa al frontend
    res.json({
      stats: {
        reservasHoy: reservasHoy[0].total,
        nuevosClientes: nuevosClientes[0].total,
        pendientes: pendientes[0].total,
        totalClientes: totalClientes[0].total,
      },
      proximasReservas: proximasReservas,
      // Combinamos ambos tipos de notificaciones en un solo arreglo
      notificaciones: [...notifReservas, ...notifClientes]
    });

  } catch (error) {
    console.error('Error al obtener stats del dashboard:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- RUTA PARA OBTENER TODOS LOS CLIENTES (¡PROTEGIDA!) ---
// GET /api/admin/clientes
router.get('/clientes', protect, async (req, res) => {
  try {
    // Esta consulta usa LEFT JOIN y GROUP BY para contar las visitas
    // y encontrar la última fecha de reservación para CADA cliente.
    const [clientes] = await pool.query(
      `SELECT 
         c.id, 
         c.name, 
         c.email, 
         c.phone,
         COUNT(r.id) AS total_visitas,
         MAX(r.reservation_date) AS ultima_visita_fecha,
         MAX(r.reservation_time) AS ultima_visita_hora
       FROM clients c
       LEFT JOIN reservations r ON c.id = r.client_id
       GROUP BY c.id, c.name, c.email, c.phone
       ORDER BY total_visitas DESC, c.name ASC`
    );

    res.json(clientes);

  } catch (error) {
    console.error('Error al obtener los clientes:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- RUTA PARA OBTENER LA CONFIGURACIÓN (¡PROTEGIDA!) ---
// GET /api/admin/settings
router.get('/settings', protect, async (req, res) => {
  try {
    // Siempre leemos la fila con id=1
    const [rows] = await pool.query(
      'SELECT * FROM restaurant_settings WHERE id = 1'
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }
    
    res.json(rows[0]); // Enviamos el objeto de configuración

  } catch (error) {
    console.error('Error al obtener la configuración:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// --- RUTA PARA ACTUALIZAR LA CONFIGURACIÓN (¡PROTEGIDA!) ---
// PUT /api/admin/settings
router.put('/settings', protect, async (req, res) => {
  try {
    // Obtenemos todos los datos del formulario del admin
    const {
      restaurant_name, phone, email, address,
      hours_weekday, hours_friday, hours_saturday, hours_sunday,
      max_reservation_time_hours, min_anticipation_hours, max_guests_per_reservation,
      notifications_email
    } = req.body;

    // Actualizamos la fila donde id=1
    await pool.query(
      `UPDATE restaurant_settings SET 
         restaurant_name = ?, phone = ?, email = ?, address = ?,
         hours_weekday = ?, hours_friday = ?, hours_saturday = ?, hours_sunday = ?,
         max_reservation_time_hours = ?, min_anticipation_hours = ?, max_guests_per_reservation = ?,
         notifications_email = ?
       WHERE id = 1`,
      [
        restaurant_name, phone, email, address,
        hours_weekday, hours_friday, hours_saturday, hours_sunday,
        max_reservation_time_hours, min_anticipation_hours, max_guests_per_reservation,
        notifications_email
      ]
    );

    res.json({ message: 'Configuración guardada exitosamente' });

  } catch (error) {
    console.error('Error al actualizar la configuración:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/clear-notifications
router.put('/clear-notifications', protect, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Marcamos todas las notificaciones actuales como leídas
    await connection.query("UPDATE reservations SET is_read = 1 WHERE status = 'pending'");
    await connection.query("UPDATE clients SET is_read = 1");
    connection.release();
    res.json({ message: 'Notificaciones limpiadas' });
  } catch (error) {
    res.status(500).json({ error: 'Error al limpiar notificaciones' });
  }
});

export default router;