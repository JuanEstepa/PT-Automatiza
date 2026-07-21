// Carga del Excel de Talento Humano + resumen de carga (RF-07..RF-11).
export default function Upload() {
  return (
    <section>
      <h2>Cargar archivo de Talento Humano</h2>
      <input type="file" accept=".xlsx" />
      {/* TODO: POST /api/ingestion y mostrar resumen (OK / rechazados / motivo) */}
    </section>
  );
}
