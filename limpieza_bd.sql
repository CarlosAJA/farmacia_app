-- Desactivar validación de llaves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Limpiar tablas transaccionales (Kardex, Ventas, Compras, Cajas)
TRUNCATE TABLE movimientos_inventario;
TRUNCATE TABLE detalle_venta;
TRUNCATE TABLE ventas;
TRUNCATE TABLE detalle_compra;
TRUNCATE TABLE compras;
TRUNCATE TABLE sesiones_caja;

-- 2. Limpiar Clientes de prueba (Conservamos el NIT '0' para consumidor final)
DELETE FROM clientes WHERE nit_ci != '0';

-- 3. Reiniciar contadores de facturación y órdenes
ALTER TABLE ventas AUTO_INCREMENT = 1;
ALTER TABLE compras AUTO_INCREMENT = 1;
ALTER TABLE sesiones_caja AUTO_INCREMENT = 1;

-- 4. (Opcional) Resetear el stock del inventario a 0 
-- Si quieres que el usuario ingrese su stock real desde cero, descomenta la siguiente línea:
-- UPDATE inventario SET cantidad = 0;

-- Reactivar validación de llaves foráneas
SET FOREIGN_KEY_CHECKS = 1;