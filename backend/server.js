const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();

// Middlewares obligatorios
app.use(cors());
app.use(express.json());

// Enrutamiento de usuarios (Login, Altas, Bajas)
app.use('/api/usuarios', require('./usuarios'));

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