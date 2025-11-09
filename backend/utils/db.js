// backend/utils/db.js

import mysql from 'mysql2/promise';

// Creamos un "pool" de conexiones.
// nueva para cada consulta de la base de datos.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE, // <--- leerá 'parrilla_db' .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Mensaje de prueba para ver si la conexión funciona
try {
  // Pedimos una conexión del pool solo para probar
  const connection = await pool.getConnection(); 
  console.log(' Conexión exitosa a la base de datos MySQL (parrilla_db)');
  // Devolvemos la conexión al pool para que otros la usen
  connection.release(); 
} catch (error) {
  console.error(' Error al conectar a la base de datos:', error.message);
}

// Exportamos el pool para usarlo en nuestras rutas
export default pool;