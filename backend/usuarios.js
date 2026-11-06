const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./src/config/db');
const { verificarToken, permitirRoles } = require('./authMiddleware');

// Función para generar Usuario y Contraseña automáticos
const generarCredenciales = async (nombreCompleto) => {
  // Separamos el nombre por espacios
  const palabras = nombreCompleto.trim().split(/\s+/);
  
  let n1 = palabras[0] || '';
  let n2 = (palabras.length > 2) ? palabras[1] : '';
  let a1 = (palabras.length > 2) ? palabras[palabras.length - 2] : (palabras[1] || '');
  let a2 = (palabras.length > 2) ? palabras[palabras.length - 1] : '';

  n1 = n1.toLowerCase();
  n2 = n2.toLowerCase();
  a1 = a1.toLowerCase();
  a2 = a2.toLowerCase();

  // Opción 1: Inicial del nombre + primer apellido (ej. cjustiniano)
  let base = n1.charAt(0) + a1;
  let usuario = base;
  let contador = 1;

  // Bucle para verificar si ya existe en la BD y aplicar las reglas
  while (true) {
    const [existe] = await db.query('SELECT id_usuario FROM usuarios WHERE email = ?', [`${usuario}@farmacia.com`]);
    
    if (existe.length === 0) {
      break; // El usuario está libre, salimos del bucle
    }

    if (contador === 1 && n2) {
      usuario = n1.charAt(0) + n2.charAt(0) + a1; // Opción 2: c + a + justiniano
    } else if (contador <= 2 && a2) {
      usuario = n1.charAt(0) + a1 + a2.charAt(0); // Opción 3: c + justiniano + a
    } else {
      usuario = base + contador; // Opción 4: cjustiniano1, cjustiniano2...
    }
    contador++;
  }

  return {
    email: `${usuario}@farmacia.com`,
    passwordPlano: usuario // La contraseña inicial es igual al usuario
  };
};


// 1. INICIAR SESIÓN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // 👇 LA MAGIA: Si no tiene @, le agregamos el dominio por defecto
    let emailABuscar = email;
    if (!emailABuscar.includes('@')) {
        emailABuscar = `${emailABuscar}@farmacia.com`;
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM usuarios WHERE email = ? AND estado = "activo"',
            [emailABuscar]
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
            { id: usuario.id_usuario, rol: usuario.rol, sucursal_id: usuario.sucursal_id },
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
                    sucursal_id: usuario.sucursal_id
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

        // 👇 FORZAMOS MAYÚSCULAS Y MINÚSCULAS
        const nombreUpper = nombre.trim().toUpperCase();
        const emailLower = email.trim().toLowerCase();

        await db.query(
            `INSERT INTO usuarios
                (nombre, apellido, email, password, telefono, direccion, rol, estado, sucursal_id)
             VALUES (?, "", ?, ?, "", "", ?, "activo", ?)`,
            [nombreUpper, emailLower, hash, rolBD, sucursal_id || null]
        );
        res.status(201).json({ ok: true, mensaje: 'Usuario registrado exitosamente.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: 'Error al registrar: ' + err.message });
    }
});
// 6. CAMBIAR CONTRASEÑA (Para cualquier usuario logueado)
router.put('/change-password', verificarToken, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const id_usuario = req.usuario.id; // Obtenemos el ID del token JWT

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ ok: false, error: 'Debes enviar la contraseña actual y la nueva.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    try {
        // 1. Buscar al usuario
        const [rows] = await db.query('SELECT password FROM usuarios WHERE id_usuario = ?', [id_usuario]);
        if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });

        const usuario = rows[0];

        // 2. Verificar que la contraseña actual sea correcta
        const passwordValido = await bcrypt.compare(oldPassword, usuario.password);
        if (!passwordValido) {
            return res.status(400).json({ ok: false, error: 'La contraseña actual es incorrecta.' });
        }

        // 3. Encriptar y guardar la nueva
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hash, id_usuario]);

        res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: 'Error al cambiar la contraseña: ' + err.message });
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

// 1. RESETEAR CONTRASEÑA (Debe ir primero para no chocar con /:id)
router.put('/:id/reset-password', verificarToken, permitirRoles('admin'), async (req, res) => {
    try {
        const [users] = await db.query('SELECT email FROM usuarios WHERE id_usuario = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

        const emailParts = users[0].email.split('@');
        const nuevaPasswordPlano = emailParts[0];
        
        const hash = await bcrypt.hash(nuevaPasswordPlano, 10);
        await db.query('UPDATE usuarios SET password = ? WHERE id_usuario = ?', [hash, req.params.id]);
        
        res.json({ ok: true, mensaje: `Contraseña reseteada correctamente.`, nuevaPassword: nuevaPasswordPlano });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// 2. ACTUALIZAR DATOS DEL USUARIO (Va después)
router.put('/:id', verificarToken, permitirRoles('admin'), async (req, res) => {
    const { nombre, ci, direccion, telefono, email_personal, sucursal_id, rol, estado } = req.body;
    try {
        await db.query(
            `UPDATE usuarios SET nombre = ?, ci = ?, direccion = ?, telefono = ?, email_personal = ?, sucursal_id = ?, rol = ?, estado = ? WHERE id_usuario = ?`,
            [nombre, ci, direccion, telefono, email_personal, sucursal_id || null, rol, estado, req.params.id]
        );
        res.json({ ok: true, mensaje: 'Datos del usuario actualizados correctamente.' });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});


module.exports = router;