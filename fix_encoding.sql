-- Cambiamos a utf8mb4 para procesar
SET NAMES utf8mb4;

-- 1. Arreglar Almacenes
UPDATE almacenes 
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    ubicacion = CONVERT(CAST(CONVERT(ubicacion USING latin1) AS BINARY) USING utf8mb4);

-- 2. Arreglar Categorías
UPDATE categorias 
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    descripcion = CONVERT(CAST(CONVERT(descripcion USING latin1) AS BINARY) USING utf8mb4);

-- 3. Arreglar Laboratorios
UPDATE laboratorios 
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    pais = CONVERT(CAST(CONVERT(pais USING latin1) AS BINARY) USING utf8mb4);

-- 4. Arreglar Proveedores
UPDATE proveedores 
SET nombre_empresa = CONVERT(CAST(CONVERT(nombre_empresa USING latin1) AS BINARY) USING utf8mb4),
    contacto = CONVERT(CAST(CONVERT(contacto USING latin1) AS BINARY) USING utf8mb4);

-- 5. Arreglar Sucursales
UPDATE sucursales 
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    direccion = CONVERT(CAST(CONVERT(direccion USING latin1) AS BINARY) USING utf8mb4),
    departamento = CONVERT(CAST(CONVERT(departamento USING latin1) AS BINARY) USING utf8mb4),
    ciudad = CONVERT(CAST(CONVERT(ciudad USING latin1) AS BINARY) USING utf8mb4);

-- 6. Arreglar Productos
UPDATE productos 
SET nombre = CONVERT(CAST(CONVERT(nombre USING latin1) AS BINARY) USING utf8mb4),
    presentacion = CONVERT(CAST(CONVERT(presentacion USING latin1) AS BINARY) USING utf8mb4),
    descripcion = CONVERT(CAST(CONVERT(descripcion USING latin1) AS BINARY) USING utf8mb4);