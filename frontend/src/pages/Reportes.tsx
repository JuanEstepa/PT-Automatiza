import { useEffect, useState } from 'react';
import { downloadFile, get } from '../api/client';
import type { AuditRow, Site } from '../api/types';
import Badge from '../components/Badge';

function hoyMenos(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

const HOY = new Date().toISOString().slice(0, 10);

export default function Reportes() {
  const [sedes, setSedes] = useState<Site[]>([]);
  const [desde, setDesde] = useState(hoyMenos(7));
  const [hasta, setHasta] = useState(HOY);
  const [sedeId, setSedeId] = useState('');
  const [filas, setFilas] = useState<AuditRow[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState<'xlsx' | 'csv' | null>(null);

  useEffect(() => {
    get<Site[]>('/sites').then(setSedes).catch(() => setSedes([]));
  }, []);

  function queryParams(): string {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    if (sedeId) params.set('siteId', sedeId);
    return params.toString();
  }

  async function buscar() {
    setCargando(true);
    try {
      const data = await get<AuditRow[]>(`/reports/audit?${queryParams()}`);
      setFilas(data);
    } catch {
      setFilas([]);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function exportar(formato: 'xlsx' | 'csv') {
    setExportando(formato);
    try {
      await downloadFile(
        `/reports/audit/export?formato=${formato}&${queryParams()}`,
        `auditoria-accesos.${formato}`,
      );
    } finally {
      setExportando(null);
    }
  }

  return (
    <div>
      <div className="ca-card" style={{ marginBottom: 18 }}>
        <div className="ca-card-header">
          <h2>Auditoría de accesos</h2>
          <span className="ca-muted" style={{ fontSize: 12 }}>RF-16 · RF-17</span>
        </div>
        <div className="ca-card-body">
          <div className="ca-filters">
            <div className="ca-field">
              <label>Desde</label>
              <input type="date" className="ca-input" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="ca-field">
              <label>Hasta</label>
              <input type="date" className="ca-input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="ca-field" style={{ minWidth: 200 }}>
              <label>Sede</label>
              <select className="ca-select" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
                <option value="">Todas las sedes</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <button className="ca-btn ca-btn-primary" onClick={buscar} disabled={cargando}>
              {cargando && <span className="ca-spinner" />} Filtrar
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button className="ca-btn ca-btn-outline" onClick={() => exportar('csv')} disabled={exportando !== null}>
                {exportando === 'csv' && <span className="ca-spinner ca-spinner-dark" />} Exportar CSV
              </button>
              <button className="ca-btn ca-btn-accent" onClick={() => exportar('xlsx')} disabled={exportando !== null}>
                {exportando === 'xlsx' && <span className="ca-spinner" />} Exportar Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="ca-card">
        <div className="ca-card-header">
          <h2>Resultados</h2>
          <span className="ca-muted" style={{ fontSize: 12 }}>{filas?.length ?? 0} eventos</span>
        </div>
        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Dirección</th>
                <th>Código</th>
                <th>Empleado</th>
                <th>Sede</th>
                <th>Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {(filas ?? []).map((f, i) => (
                <tr key={i}>
                  <td className="ca-numeric ca-muted">
                    {new Date(f.fecha).toLocaleString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    <Badge estado={f.direccion} texto={f.direccion} />
                  </td>
                  <td className="ca-numeric ca-muted">{f.codigoEmpleado}</td>
                  <td style={{ fontWeight: 600 }}>{f.empleado}</td>
                  <td>{f.sede}</td>
                  <td className="ca-muted">{f.dispositivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && filas && filas.length === 0 && (
            <div className="ca-empty">No hay eventos de acceso en el rango seleccionado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
