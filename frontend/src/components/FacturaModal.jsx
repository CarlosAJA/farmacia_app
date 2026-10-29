import React from 'react';
import './Factura.css';

export default function FacturaModal({ venta, onClose }) {
  if (!venta) return null;

  const handlePrint = () => {
    window.print();
  };

  const fecha = new Date(venta.fecha_venta).toLocaleString('es-BO');

  return (
    <div className="factura-overlay">
      <div className="factura-acciones no-print">
        <button onClick={handlePrint} className="btn-imprimir">🖨️ Imprimir / Guardar PDF</button>
        <button onClick={onClose} className="btn-cerrar">Cerrar</button>
      </div>

      <div className="factura-imprimible">
        <div className="ticket-header">
          <h1>💊 FarmaApp</h1>
          <p>Farmacia y Droguería</p>
          <p>NIT: 123456789-01</p>
          <p>Av. Principal #123 - Santa Cruz</p>
          <p>Tel: 33445566</p>
        </div>

        {/* DATOS GENERALES (SIN RECIBIDO NI CAMBIO) */}
        <div className="ticket-info">
          <p><strong>Factura:</strong> {venta.numero_factura}</p>
          <p><strong>Fecha:</strong> {fecha}</p>
          <p><strong>Vendedor:</strong> {venta.usuario_nombre}</p>
          
          {venta.cliente_nombre && (
            <div style={{ marginTop: '8px', borderTop: '1px dotted #ccc', paddingTop: '8px' }}>
              <p><strong>Razón Social:</strong> {venta.cliente_nombre}</p>
              <p><strong>NIT/CI:</strong> {venta.cliente_nit}</p>
            </div>
          )}
        </div>

        {/* LISTA DE PRODUCTOS */}
        <table className="ticket-tabla">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Producto</th>
              <th className="text-right">Precio</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venta.detalles && venta.detalles.map((detalle) => (
              <tr key={detalle.id_detalle}>
                <td>{detalle.cantidad}</td>
                <td>{detalle.producto_nombre}</td>
                <td className="text-right">{Number(detalle.precio_unitario).toFixed(2)}</td>
                <td className="text-right">{Number(detalle.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALES Y FORMA DE PAGO (AQUÍ MOVEMOS EL RECIBIDO Y CAMBIO) */}
        <div className="ticket-totales">
          <div className="linea">
            <span>Subtotal:</span>
            <span>Bs. {Number(venta.subtotal).toFixed(2)}</span>
          </div>
          
          {Number(venta.descuento) > 0 && (
            <div className="linea descuento">
              <span>Descuento:</span>
              <span>- Bs. {Number(venta.descuento).toFixed(2)}</span>
            </div>
          )}
          
          <div className="linea total" style={{ marginBottom: '10px' }}>
            <span>TOTAL:</span>
            <span>Bs. {Number(venta.total).toFixed(2)}</span>
          </div>

          {/* DETALLE DE PAGO EFECTIVO */}
          {venta.metodo_pago === 'efectivo' && Number(venta.monto_recibido) > 0 && (
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '8px', fontSize: '13px' }}>
              <div className="linea">
                <span>Recibido:</span>
                <span>Bs. {Number(venta.monto_recibido).toFixed(2)}</span>
              </div>
              <div className="linea" style={{ fontWeight: 'bold' }}>
                <span>Cambio:</span>
                <span>Bs. {Number(venta.monto_cambio).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* DETALLE DE PAGO MIXTO */}
          {venta.metodo_pago === 'mixto' && (
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '8px', fontSize: '13px' }}>
              <div className="linea">
                <span>Efectivo:</span>
                <span>Bs. {Number(venta.monto_efectivo).toFixed(2)}</span>
              </div>
              <div className="linea">
                <span>Tarjeta:</span>
                <span>Bs. {Number(venta.monto_tarjeta).toFixed(2)}</span>
              </div>
              <div className="linea">
                <span>QR:</span>
                <span>Bs. {Number(venta.monto_qr).toFixed(2)}</span>
              </div>
              {Number(venta.monto_cambio) > 0 && (
                <div className="linea" style={{ fontWeight: 'bold', marginTop: '4px' }}>
                  <span>Cambio:</span>
                  <span>Bs. {Number(venta.monto_cambio).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ticket-footer">
          <p>¡Gracias por su compra!</p>
          <p>Conserve su factura para cualquier reclamo.</p>
          <p>www.farmaapp.com</p>
        </div>
      </div>
    </div>
  );
}