import { useEffect, useState } from 'react';
import { sucursalesApi } from '../api/sucursales';
import Tabla from './Tabla';
import './GestionSucursales.css';

const FORM_VACIO = {
  codigo: '',
  nombre: '',
  direccion: '',
  departamento: '',
  ciudad: '',
  telefono: '',
  email: '',
  estado: 'ACTIVA',
};

export default function GestionSucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);

  const cargar = async () => {
  try {
    setCargando(true);
    const data = await sucursalesApi.listar();
    setSucursales(Array.isArray(data) ? data : []);
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Error al cargar');
  } finally {
    setCargando(false);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setExito(null);
  try {
    if (editandoId) {
      await sucursalesApi.actualizar(editandoId, form);
      setExito('Sucursal actualizada correctamente.');
    } else {
      await sucursalesApi.crear(form);
      setExito('Sucursal creada correctamente.');
    }
    setForm(FORM_VACIO);
    setEditandoId(null);
    cargar();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Error al guardar');
  }
};

const handleEliminar = async (id) => {
  if (!window.confirm('¿Desactivar esta sucursal?')) return;
  setError(null);
  setExito(null);
  try {
    await sucursalesApi.eliminar(id);
    setExito('Sucursal desactivada.');
    cargar();
  } catch (e) {
    setError(e.response?.data?.error || e.message || 'Error al desactivar');
  }
};

  useEffect(() => { cargar(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  
  const handleEditar = (s) => {
    setForm({
      codigo: s.codigo,
      nombre: s.nombre,
      direccion: s.direccion,
      departamento: s.departamento,
      ciudad: s.ciudad,
      telefono: s.telefono || '',
      email: s.email || '',
      estado: s.estado,
    });
    setEditandoId(s.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setError(null);
  };
 
  const columnas = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'ciudad', label: 'Ciudad' },
    { key: 'departamento', label: 'Departamento' },
    {
      key: 'telefono',
      label: 'Teléfono',
      render: (fila) => fila.telefono || '—',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (fila) => (
        <span className={fila.estado === 'ACTIVA' ? 'badge activo' : 'badge inactivo'}>
          {fila.estado}
        </span>
      ),
    },
  ];


  return (
    <div className="gestion-sucursales">
      <h2>Gestión de Sucursales</h2>

      {error && <div className="alerta error">{error}</div>}
      {exito && <div className="alerta exito">{exito}</div>}

      <form onSubmit={handleSubmit} className="form-sucursal">
        <h3>{editandoId ? 'Editar Sucursal' : 'Nueva Sucursal'}</h3>

        <div className="form-grid">
          <input name="codigo" placeholder="Código *" required maxLength={20}
            value={form.codigo} onChange={handleChange} />
          <input name="nombre" placeholder="Nombre *" required maxLength={150}
            value={form.nombre} onChange={handleChange} />
          <input name="direccion" placeholder="Dirección *" required maxLength={255}
            value={form.direccion} onChange={handleChange} />
          <input name="departamento" placeholder="Departamento *" required maxLength={100}
            value={form.departamento} onChange={handleChange} />
          <input name="ciudad" placeholder="Ciudad *" required maxLength={100}
            value={form.ciudad} onChange={handleChange} />
          <input name="telefono" placeholder="Teléfono" maxLength={20}
            value={form.telefono} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" maxLength={150}
            value={form.email} onChange={handleChange} />
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option value="ACTIVA">ACTIVA</option>
            <option value="INACTIVA">INACTIVA</option>
          </select>
        </div>

        <div className="form-botones">
          <button type="submit" className="btn-primario">
            {editandoId ? 'Actualizar' : 'Crear'}
          </button>
          {editandoId && (
            <button type="button" onClick={handleCancelar} className="btn-secundario">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h3>Listado de Sucursales</h3>

      <Tabla
        columnas={columnas}
        datos={sucursales}
        cargando={cargando}
        sinDatosMensaje="No hay sucursales registradas."
        busquedaActiva={true}
        camposBusqueda={['codigo', 'nombre', 'ciudad', 'departamento']}
        filtros={[
          {
            key: 'estado',
            label: 'Todos los estados',
            opciones: [
              { value: 'ACTIVA', label: 'Activas' },
              { value: 'INACTIVA', label: 'Inactivas' },
            ],
          },
        ]}
        paginacionActiva={true}       
        porPaginaInicial={10}         
        acciones={(s) => (
          <>
            <button onClick={() => handleEditar(s)} className="btn-editar">
              Editar
            </button>
            {s.estado === 'ACTIVA' && (
              <button onClick={() => handleEliminar(s.id)} className="btn-eliminar">
                Desactivar
              </button>
            )}
          </>
        )}
      />
    </div>
  );
}