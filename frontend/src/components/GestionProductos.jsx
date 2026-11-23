import { useEffect, useState } from 'react';
import Tabla from './Tabla';
import { productosApi } from '../api/productos';
import './GestionProductos.css';

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  presentacion: '',
  descripcion: '',
  categoria_nombre: '',
  laboratorio_nombre: '',
  requiere_receta: false,
};

export default function GestionProductos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);

  const cargar = async () => {
    try {
      setCargando(true);
      const prod = await productosApi.listar();
      setProductos(prod || []);
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
      };

      if (editandoId) {
        await productosApi.actualizar(editandoId, payload);
        setExito('Producto actualizado correctamente.');
      } else {
        await productosApi.crear(payload);
        setExito('Producto creado correctamente.');
      }
      
      // Limpiamos el formulario SIEMPRE al terminar con éxito
      setForm(FORM_VACIO);
      setEditandoId(null);
      cargar();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar el producto');
    }
  };

  const handleEditar = (p) => {
    // 👇 BLINDAJE: Detecta si el ID viene como id_producto o como id
    const idReal = p.id_producto || p.id; 

    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      presentacion: p.presentacion || '',
      descripcion: p.descripcion || '',
      categoria_nombre: p.categoria_nombre || '',
      laboratorio_nombre: p.laboratorio_nombre || '',
      requiere_receta: p.requiere_receta === 1 || p.requiere_receta === true,
    });
    
    setEditandoId(idReal);
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

  const columnas = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'presentacion', label: 'Presentación' },
    { key: 'categoria_nombre', label: 'Categoría', render: (p) => p.categoria_nombre || '—' },
    { key: 'laboratorio_nombre', label: 'Laboratorio', render: (p) => p.laboratorio_nombre || '—' },
    {
      key: 'precio_venta',
      label: 'P. Venta',
      render: (p) => p.precio_venta ? `Bs. ${Number(p.precio_venta).toFixed(2)}` : '—',
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

      {error && <div className="alerta error">{error}</div>}
      {exito && <div className="alerta exito">{exito}</div>}

      <form onSubmit={handleSubmit} className="form-producto">
        <h3>{editandoId ? 'Editar Producto' : 'Nuevo Producto'}</h3>

        <div className="form-grid">
          <input name="codigo" placeholder="Código *" required maxLength={50}
            value={form.codigo} onChange={handleChange} className="input-mayusculas" />
          <input name="nombre" placeholder="Nombre *" required maxLength={200}
            value={form.nombre} onChange={handleChange} className="input-mayusculas" />
          <input name="presentacion" placeholder="Presentación (ej: X 100 TABLETAS)"
            value={form.presentacion} onChange={handleChange} className="input-mayusculas" />

          <input name="categoria_nombre" placeholder="Categoría (ej: Analgésico) *" required
            value={form.categoria_nombre} onChange={handleChange} className="input-mayusculas" />

          <input name="laboratorio_nombre" placeholder="Laboratorio / Proveedor *" required
            value={form.laboratorio_nombre} onChange={handleChange} className="input-mayusculas" />

          <label className="checkbox-label">
            <input type="checkbox" name="requiere_receta"
              checked={form.requiere_receta} onChange={handleChange} />
            Requiere receta
          </label>
        </div>

        <textarea name="descripcion" placeholder="Descripción" rows="2"
          value={form.descripcion} onChange={handleChange} className="input-mayusculas" />

        <div className="form-botones">
          <button type="submit" className="btn-primario">
            {editandoId ? 'Actualizar Producto' : 'Crear Producto'}
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
            <button type="button" onClick={() => handleEditar(p)} className="btn-editar">Editar</button>
            {p.estado === 'activo' && (
              <button type="button" onClick={() => handleEliminar(p.id_producto || p.id)} className="btn-eliminar">
                Desactivar
              </button>
            )}
          </>
        )}
      />
    </div>
  );
}