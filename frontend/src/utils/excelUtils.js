import * as XLSX from 'xlsx';

/**
 * Exporta un array de datos a un archivo Excel.
 * @param {Array} datos - Array de objetos a exportar.
 * @param {Array} columnas - Definición de columnas (key, label, exportValue).
 * @param {String} nombreArchivo - Nombre del archivo sin extensión.
 */
export const exportarAExcel = (datos, columnas, nombreArchivo) => {
  if (!datos || datos.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }

  // 1. Formatear los datos según las columnas definidas
  const datosFormateados = datos.map((item) => {
    const fila = {};
    columnas.forEach((col) => {
      // Si la columna tiene una función especial de exportación, la usamos
      if (col.exportValue) {
        fila[col.label] = col.exportValue(item);
      } else {
        fila[col.label] = item[col.key];
      }
    });
    return fila;
  });

  // 2. Crear la hoja y el libro
  const hoja = XLSX.utils.json_to_sheet(datosFormateados);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');

  // 3. Ajustar el ancho de las columnas automáticamente
  const anchoColumnas = columnas.map((col) => ({
    wch: col.label.length + 5, // Ajuste básico
  }));
  hoja['!cols'] = anchoColumnas;

  // 4. Generar y descargar el archivo
  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(libro, `${nombreArchivo}_${fecha}.xlsx`);
};