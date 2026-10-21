const express = require('express');
const cors = require('cors');
const db = require('./src/config/db');
require('dotenv').config();

const app = express();

// Middlewares obligatorios
app.use(cors());
app.use(express.json());

// Enrutamiento de usuarios (Login, Altas, Bajas)
app.use('/api/usuarios', require('./usuarios'));
app.use('/api/sucursales', require('./src/modules/sucursales'));
app.use('/api/inventario', require('./src/modules/inventario'));
app.use('/api/compras', require('./src/modules/compras'));
app.use('/api/catalogos', require('./src/modules/catalogos'));
// ✨ Nuevas rutas del módulo de productos
app.use('/api/categorias', require('./src/modules/categorias'));
app.use('/api/laboratorios', require('./src/modules/laboratorios'));
app.use('/api/proveedores', require('./src/modules/proveedores'));
app.use('/api/productos', require('./src/modules/productos'));
app.use('/api/ventas', require('./src/modules/ventas'));
app.use('/api/reportes', require('./src/modules/reportes'));

// Ruta base de prueba
app.get('/', (req, res) => {
    res.send('Servidor de la farmacia funcionando perfectamente');
});

// Verificación de conexión con la base de datos MySQL
async function testDatabaseConnection() {
    try {
        await db.query('SELECT 1');
        console.log('¡Conexión exitosa a la base de datos MySQL!');
    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
    }
}

// Inicialización del puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    testDatabaseConnection();
});