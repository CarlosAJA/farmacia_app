import { useEffect, useState } from 'react';
import Tabla from './Tabla';
import { productosApi } from '../api/productos';
import { catalogosApi } from '../api/catalogos';
import './GestionProductos.css';

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  presentacion: '',
  descripcion: '',
  categoria_nombre: '',
  laboratorio_nombre: '',
  proveedor_nombre: '',
  precio_compra: '',
  precio_venta: '',
  stock_minimo: 0,
  requiere_receta: false,
  fecha_vencimiento: '',
};

export default function GestionProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [laboratorios, setLaboratorios] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [alertas, setAlertas] = useState({ stockBajo: [], porVencer: [], vencidos: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);

  const cargar = async () => {
    try {
      setCargando(true);
      const [prod, al] = await Promise.all([
        productosApi.listar(),
        productosApi.alertas(),
      ]);
      setProductos(prod || []);
      setAlertas(al || { stockBajo: [], porVencer: [], vencidos: [] });
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar productos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);
    try {
      const payload = {
        ...form,
        precio_compra: Number(form.precio_compra) || 0,
        precio_venta: Number(form.precio_venta) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        fecha_vencimiento: form.fecha_vencimiento || null,
      };

      if (editandoId) {
        await productosApi.actualizar(editandoId, payload);
        setExito('Producto actualizado correctamente.');
      } else {
        await productosApi.crear(payload);
        setExito('Producto creado correctamente.');
      }
      setForm(FORM_VACIO);
      setEditandoId(null);
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar');
    }
  };

    const handleEditar = (p) => {
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      presentacion: p.presentacion || '',
      descripcion: p.descripcion || '',
      categoria_nombre: p.categoria_nombre || '',       // 👈 Tomamos el nombre
      laboratorio_nombre: p.laboratorio_nombre || '',   // 👈 Tomamos el nombre
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      stock_minimo: p.stock_minimo,
      requiere_receta: p.requiere_receta === 1 || p.requiere_receta === true,
      fecha_vencimiento: p.fecha_vencimiento?.split('T')[0] || '',
    });
    setEditandoId(p.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setError(null);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Desactivar este producto?')) return;
    setError(null);
    setExito(null);
    try {
      await productosApi.eliminar(id);
      setExito('Producto desactivado.');
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al desactivar');
    }
  };

  const calcularVencimiento = (fecha) => {
    if (!fecha) return { texto: '—', clase: '' };
    const hoy = new Date();
    const venc = new Date(fecha);
    const dias = Math.floor((venc - hoy) / (1000 * 60 * 60 * 24));

    if (dias < 0) return { texto: 'VENCIDO', clase: 'badge-vencido' };
    if (dias <= 30) return { texto: `${dias}d`, clase: 'badge-por-vencer' };
    if (dias <= 90) return { texto: `${dias}d`, clase: 'badge-proximo' };
    return { texto: 'OK', clase: 'badge-ok' };
  };

  const columnas = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'presentacion', label: 'Presentación' },
    {
      key: 'categoria_nombre',
      label: 'Categoría',
      render: (p) => p.categoria_nombre || '—',
    },
    {
      key: 'laboratorio_nombre',
      label: 'Laboratorio',
      render: (p) => p.laboratorio_nombre || '—',
    },
    {
      key: 'precio_venta',
      label: 'P. Venta',
      render: (p) => `Bs. ${Number(p.precio_venta).toFixed(2)}`,
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vence',
      render: (p) => {
        const v = calcularVencimiento(p.fecha_vencimiento);
        return (
          <span className={`badge-vencimiento ${v.clase}`}>
            {v.texto}
          </span>
        );
      },
    },
    {
      key: 'requiere_receta',
      label: 'Receta',
      render: (p) => (p.requiere_receta ? '🔒 Sí' : 'No'),
    },
  ];

  return (
    <div className="gestion-productos">
      <h1>💊 Gestión de Productos</h1>
      <p className="subtitle">Administra el catálogo de medicamentos y productos de la farmacia.</p>

      {(alertas.stockBajo.length > 0 || alertas.porVencer.length > 0 || alertas.vencidos.length > 0) && (
        <div className="panel-alertas">
          {alertas.stockBajo.length > 0 && (
            <div className="alerta-card alerta-stock">
              <span className="alerta-icon">📉</span>
              <div>
                <strong>{alertas.stockBajo.length}</strong> productos con stock bajo
              </div>
            </div>
          )}
          {alertas.porVencer.length > 0 && (
            <div className="alerta-card alerta-por-vencer">
              <span className="alerta-icon">⏰</span>
              <div>
                <strong>{alertas.porVencer.length}</strong> productos por vencer (90 días)
              </div>
            </div>
          )}
          {alertas.vencidos.length > 0 && (
            <div className="alerta-card alerta-vencido">
              <span className="alerta-icon">❌</span>
              <div>
                <strong>{alertas.vencidos.length}</strong> productos vencidos
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="alerta error">{error}</div>}
      {exito && <div className="alerta exito">{exito}</div>}

      <form onSubmit={handleSubmit} className="form-producto">
        <h3>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h3>

                <div className="form-grid">
          <input name="codigo" placeholder="Código *" required maxLength={50} className="input-mayusculas"
            value={form.codigo} onChange={handleChange} />
          <input name="nombre" placeholder="Nombre *" required maxLength={200} className="input-mayusculas"
            value={form.nombre} onChange={handleChange} />
          <input name="presentacion" placeholder="Presentación (ej: X 100 TABLETAS)" className="input-mayusculas"
            value={form.presentacion} onChange={handleChange} />

          {/* 👇 CATEGORÍA POR TECLADO */}
          <input name="categoria_nombre" placeholder="Categoría (ej: Analgésico) *" required className="input-mayusculas"
            value={form.categoria_nombre} onChange={handleChange} />

          {/* 👇 LABORATORIO Y PROVEEDOR UNIFICADOS */}
          <input name="laboratorio_nombre" placeholder="Laboratorio / Proveedor *" required className="input-mayusculas"
            value={form.laboratorio_nombre} onChange={handleChange} />

          <input name="precio_compra" type="number" step="0.01" placeholder="Precio compra"
            value={form.precio_compra} onChange={handleChange} />
          <input name="precio_venta" type="number" step="0.01" placeholder="Precio venta"
            value={form.precio_venta} onChange={handleChange} />
          <input name="stock_minimo" type="number" placeholder="Stock mínimo"
            value={form.stock_minimo} onChange={handleChange} />

          {/* 👇 SOLO FECHA DE VENCIMIENTO */}
          <div className="form-group-fecha">
            <label>Fecha de Vencimiento</label>
            <input name="fecha_vencimiento" type="date"
              value={form.fecha_vencimiento} onChange={handleChange} />
          </div>

          <label className="checkbox-label">
            <input type="checkbox" name="requiere_receta"
              checked={form.requiere_receta} onChange={handleChange} />
            Requiere receta
          </label>
        </div>

        <textarea name="descripcion" placeholder="Descripción" rows="2"
          value={form.descripcion} onChange={handleChange} />

        <div className="form-botones">
          <button type="submit" className="btn-primario">
            {editandoId ? 'Actualizar' : 'Crear Producto'}
          </button>
          {editandoId && (
            <button type="button" onClick={handleCancelar} className="btn-secundario">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h3>Catálogo de Productos</h3>
      <Tabla
        columnas={columnas}
        datos={productos}
        cargando={cargando}
        sinDatosMensaje="No hay productos registrados."
        busquedaActiva={true}
        camposBusqueda={['codigo', 'nombre', 'presentacion']}
        filtros={[
          {
            key: 'id_categoria',
            label: 'Todas las categorías',
            opciones: categorias.map((c) => ({ value: c.id, label: c.nombre })),
          },
          {
            key: 'estado',
            label: 'Todos los estados',
            opciones: [
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Inactivos' },
            ],
          },
        ]}
        paginacionActiva={true}
        porPaginaInicial={10}
        acciones={(p) => (
          <>
            <button onClick={() => handleEditar(p)} className="btn-editar">Editar</button>
            {p.estado === 'activo' && (
              <button onClick={() => handleEliminar(p.id)} className="btn-eliminar">Desactivar</button>
            )}
          </>
        )}
      />
    </div>
  );
}