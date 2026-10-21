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

      {/* Contenedor que se va a imprimir */}
      <div className="factura-imprimible">
        <div className="ticket-header">
          <h1>💊 FarmaApp</h1>
          <p>Farmacia y Droguería</p>
          <p>NIT: 123456789-01</p>
          <p>Av. Principal #123 - Santa Cruz</p>
          <p>Tel: 33445566</p>
        </div>

        <div className="ticket-info">
          <p><strong>Factura:</strong> {venta.numero_factura}</p>
          <p><strong>Fecha:</strong> {fecha}</p>
          <p><strong>Vendedor:</strong> {venta.usuario_nombre}</p>
          <p><strong>Pago:</strong> {venta.metodo_pago.toUpperCase()}</p>
        </div>

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
            {venta.detalles.map((d) => (
              <tr key={d.id_detalle}>
                <td>{d.cantidad}</td>
                <td>{d.producto_nombre}</td>
                <td className="text-right">{Number(d.precio_unitario).toFixed(2)}</td>
                <td className="text-right">{Number(d.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ticket-totales">
          <div className="linea">
            <span>Subtotal:</span>
            <span>Bs. {Number(venta.subtotal).toFixed(2)}</span>
          </div>
          <div className="linea">
            <span>IVA (13%):</span>
            <span>Bs. {Number(venta.iva).toFixed(2)}</span>
          </div>
          {Number(venta.descuento) > 0 && (
            <div className="linea descuento">
              <span>Descuento:</span>
              <span>- Bs. {Number(venta.descuento).toFixed(2)}</span>
            </div>
          )}
          <div className="linea total">
            <span>TOTAL:</span>
            <span>Bs. {Number(venta.total).toFixed(2)}</span>
          </div>
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