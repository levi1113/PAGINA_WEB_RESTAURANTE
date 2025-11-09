// backend/index.js

// Importaciones de librerías
import express from 'express';
import cors from 'cors';
// (dotenv se carga automáticamente gracias al script de package.json)

// Importa el pool de la base de datos.
import pool from './utils/db.js';

// Importación de nuestras rutas
import iaRoutes from './routes/ia.routes.js';
import adminRoutes from './routes/admin.routes.js';
import clienteRoutes from './routes/cliente.routes.js';

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 3000; // Usará el puerto 3000 por defecto

// Middlewares
app.use(cors()); // Habilita CORS para tus frontends
app.use(express.json()); // Habilita el parseo de JSON

// Usar las rutas
// Le decimos a Express qué rutas usar para cada URL base
app.use('/api', iaRoutes);       // Todas las rutas de IA estarán en /api/chat
app.use('/api', clienteRoutes);  // Todas las rutas de cliente estarán en /api/...
app.use('/api/admin', adminRoutes); // Todas las rutas de admin en /api/admin/...

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor del restaurante escuchando en http://localhost:${port}`);
});