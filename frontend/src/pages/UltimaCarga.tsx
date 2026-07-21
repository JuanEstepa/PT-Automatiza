import { useEffect, useRef, useState } from 'react';
import { get, uploadFile } from '../api/client';
import type { IngestionSummary } from '../api/types';
import Badge from '../components/Badge';

export default function UltimaCarga() {
  const [resumen, setResumen] = useState<IngestionSummary | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [soloProblemas, setSoloProblemas] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    get<IngestionSummary | null>('/ingestion/batches/latest')
      .then(setResumen)
      .catch(() => setResumen(null))
      .finally(() => setCargandoInicial(false));
  }, []);

  async function subir(file: File) {
    setSubiendo(true);
    setError(null);
    try {
      const data = await uploadFile<IngestionSummary>('/ingestion/upload', file);
      setResumen(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo procesar el archivo');
    } finally {
      setSubiendo(false);
    }
  }

  const filas = resumen?.filas ?? [];
  const filasVisibles = soloProblemas ? filas.filter((f) => f.estado !== 'OK') : filas;
  const filasAdvertencia = resumen?.filasAdvertencia ?? 0;

  return (
    <div>
      <div className="ca-card" style={{ marginBottom: 18 }}>
        <div className="ca-card-header">
          <h2>Cargar archivo de Talento Humano</h2>
          <span className="ca-muted" style={{ fontSize: 12 }}>RF-07 · RF-08 · RF-09 · RF-10</span>
        </div>
        <div className="ca-card-body">
          <div
            className={`ca-dropzone${arrastrando ? ' ca-dropzone-active' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              const file = e.dataTransfer.files?.[0];
              if (file) subir(file);
            }}
          >
            {subiendo ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="ca-spinner ca-spinner-dark" /> Procesando archivo…
              </span>
            ) : (
              <>
                <strong style={{ color: 'var(--navy-900)' }}>Arrastra el Excel aquí</strong> o haz clic para
                seleccionarlo
                <div style={{ fontSize: 12, marginTop: 4 }}>Hojas esperadas: "Sedes" y "Empleados" (.xlsx)</div>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) subir(file);
                e.target.value = '';
              }}
            />
          </div>
          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>
          )}
        </div>
      </div>

      {cargandoInicial ? (
        <div className="ca-card">
          <div className="ca-empty">Buscando la última carga…</div>
        </div>
      ) : !resumen ? (
        <div className="ca-card">
          <div className="ca-empty">Todavía no se ha cargado ningún archivo.</div>
        </div>
      ) : (
        <>
          <div className="ca-stat-grid">
            <div className="ca-stat">
              <div className="ca-stat-label">Total de filas</div>
              <div className="ca-stat-value ca-numeric">{resumen.totalFilas}</div>
              <div className="ca-stat-sub">{resumen.nombreArchivo.split('/').pop()}</div>
            </div>
            <div className="ca-stat" style={{ animationDelay: '40ms' }}>
              <div className="ca-stat-label">Cargadas OK</div>
              <div className="ca-stat-value ca-numeric" style={{ color: 'var(--success)' }}>
                {resumen.filasOk}
              </div>
            </div>
            <div className="ca-stat" style={{ animationDelay: '80ms' }}>
              <div className="ca-stat-label">Con advertencia</div>
              <div className="ca-stat-value ca-numeric" style={{ color: 'var(--warning)' }}>
                {filasAdvertencia}
              </div>
              <div className="ca-stat-sub">Se cargaron igual (RF-10)</div>
            </div>
            <div className="ca-stat" style={{ animationDelay: '120ms' }}>
              <div className="ca-stat-label">Rechazadas</div>
              <div className="ca-stat-value ca-numeric" style={{ color: 'var(--danger)' }}>
                {resumen.filasRechazadas}
              </div>
              <div className="ca-stat-sub">Faltó un dato crítico</div>
            </div>
          </div>

          <div className="ca-card">
            <div className="ca-card-header">
              <h2>Detalle fila por fila</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={soloProblemas}
                  onChange={(e) => setSoloProblemas(e.target.checked)}
                />
                Mostrar solo advertencias y rechazos
              </label>
            </div>
            <div className="ca-table-wrap">
              <table className="ca-table">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Código empleado</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filasVisibles.map((f) => (
                    <tr key={f.fila}>
                      <td className="ca-numeric ca-muted">{f.fila}</td>
                      <td className="ca-numeric">{f.codigoEmpleado ?? '—'}</td>
                      <td>
                        <Badge estado={f.estado} />
                      </td>
                      <td style={{ whiteSpace: 'normal', minWidth: 320 }}>{f.motivo ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filasVisibles.length === 0 && (
                <div className="ca-empty">
                  {soloProblemas ? 'Ninguna fila con advertencia o rechazo. ' : 'Sin filas para mostrar.'}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
