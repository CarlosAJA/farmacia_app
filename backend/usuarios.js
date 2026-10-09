const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./src/config/db');
const { verificarToken, permitirRoles } = require('./authMiddleware');

// 1. INICIAR SESIÓN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND estado = "activo"',
            [email]
        );
        if (rows.length === 0) {
            return res.status(400).json({ ok: false, error: 'Usuario no encontrado o inactivo.' });
        }

        const usuario = rows[0];
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(400).json({ ok: false, error: 'Contraseña incorrecta.' });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            ok: true,
            data: {
                token,
                usuario: {
                    id: usuario.id_usuario,
                    nombre: usuario.nombre,
                    rol: usuario.rol,
                },
            },
        });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 2. REGISTRO / ALTA DE USUARIO
router.post('/registro', verificarToken, permitirRoles('admin'), async (req, res) => {
    const { nombre, email, password, rol, sucursal_id } = req.body;
    try {
        const ROLES_VALIDOS = ['admin', 'vendedor', 'farmaceutico', 'almacenero'];
        const rolBD = ROLES_VALIDOS.includes(rol) ? rol : 'vendedor';
        const hash = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO usuarios
                (nombre, apellido, email, password, telefono, direccion, rol, estado, sucursal_id)
             VALUES (?, "", ?, ?, "", "", ?, "activo", ?)`,
            [nombre, email, hash, rolBD, sucursal_id || null]
        );
        res.status(201).json({ ok: true, mensaje: 'Usuario registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: 'Error al registrar: ' + err.message });
    }
});

// 3. LISTAR USUARIOS
router.get('/', verificarToken, permitirRoles('admin'), async (req, res) => {
    try {
        const [usuarios] = await db.query(`
            SELECT
                u.id_usuario,
                u.nombre,
                u.email,
                u.rol,
                u.estado,
                u.sucursal_id,
                s.nombre AS sucursal_nombre,
                s.codigo AS sucursal_codigo
            FROM usuarios u
            LEFT JOIN sucursales s ON u.sucursal_id = s.id
            ORDER BY u.id_usuario
        `);
        res.json({ ok: true, data: usuarios });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 4. BAJA LÓGICA DE USUARIO
router.put('/baja/:id', verificarToken, permitirRoles('admin'), async (req, res) => {
    try {
        await db.query(
            'UPDATE usuarios SET estado = "inactivo" WHERE id_usuario = ?',
            [req.params.id]
        );
        res.json({ ok: true, mensaje: 'Usuario dado de baja correctamente.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;