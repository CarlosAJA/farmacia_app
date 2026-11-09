SELECT * FROM farmacia_db.usuarios;
USE farmacia_db;

-- 1. Arreglar nombres de usuarios (pasar a mayúsculas)
UPDATE usuarios SET nombre = UPPER(nombre);

-- 2. Arreglar correos (pasar a minúsculas)
UPDATE usuarios SET email = LOWER(email);

-- 3. Arreglar sucursales
UPDATE sucursales SET 
    nombre = UPPER(nombre),
    direccion = UPPER(direccion),
    departamento = UPPER(departamento),
    ciudad = UPPER(ciudad),
    codigo = UPPER(codigo);

-- 4. Arreglar clientes
UPDATE clientes SET razon_social = UPPER(razon_social);

-- 5. Arreglar productos (si los has creado)
UPDATE productos SET 
    nombre = UPPER(nombre),
    presentacion = UPPER(presentacion);