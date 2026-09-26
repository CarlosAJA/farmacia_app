const mysql = require('mysql2');
require('dotenv').config();

// Crear el grupo (pool) de conexiones usando las variables de entorno
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Exportar la versión del pool que soporta Promesas (async/await)
module.exports = pool.promise();