const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verificarToken, permitirRoles } = require('./authMiddleware');

// 1. INICIAR SESIÓN (Actualizado con tus columnas)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // CORRECCIÓN: Se cambió 'activo = 1' por 'estado = "activo"'
        const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND estado = "activo"', [email]);
        if (rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado o inactivo.' });

        const usuario = rows[0];
        
        // Validación temporal en texto plano (como lo tienes configurado actualmente)
        const passwordValido = (password === usuario.password);
        if (!passwordValido) return res.status(400).json({ error: 'Contraseña incorrecta.' });

        // Guardamos el id_usuario y mapeamos el rol 'admin' a 'Administrador' para el frontend
        const rolFormateado = usuario.rol === 'admin' ? 'Administrador' : usuario.rol;
        const token = jwt.sign({ id: usuario.id_usuario, rol: rolFormateado }, process.env.JWT_SECRET, { expiresIn: '8h' });
        
        res.json({ token, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, rol: rolFormateado } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. REGISTRO / ALTA DE USUARIO (Actualizado con tus columnas)
router.post('/registro', verificarToken, permitirRoles('Administrador'), async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    try {
        // Ajustamos las columnas para insertar los valores mínimos requeridos por tu tabla
        const rolBD = rol === 'Administrador' ? 'admin' : rol.toLowerCase();
        
        await db.query(
            'INSERT INTO usuarios (nombre, apellido, email, password, telefono, direccion, rol, estado) VALUES (?, "", ?, ?, "", "", ?, "activo")',
            [nombre, email, password, rolBD]
        );
        res.status(201).json({ mensaje: 'Usuario registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ error: 'Error al registrar: ' + err.message });
    }
});

// 3. LISTAR USUARIOS (Actualizado con tus columnas)
router.get('/', verificarToken, permitirRoles('Administrador'), async (req, res) => {
    try {
        // Seleccionamos tus columnas reales
        const [usuarios] = await db.query('SELECT id_usuario, nombre, email, rol, estado FROM usuarios');
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. BAJA LÓGICA DE USUARIO (Actualizado con tus columnas)
router.put('/baja/:id', verificarToken, permitirRoles('Administrador'), async (req, res) => {
    try {
        // CORRECCIÓN: Se cambia 'activo = 0' por 'estado = "inactivo"' e 'id' por 'id_usuario'
        await db.query('UPDATE usuarios SET estado = "inactivo" WHERE id_usuario = ?', [req.params.id]);
        res.json({ mensaje: 'Usuario dado de baja correctamente.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;