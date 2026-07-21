import { Fragment, useCallback, useEffect, useState } from 'react';
import { get, post } from '../api/client';
import type { OccupancyDetailEmployee, OccupancySite } from '../api/types';

const REFRESCO_MS = 20_000;

function claseProgreso(porcentaje: number | null): string {
  if (porcentaje === null) return 'ca-progress-fill';
  if (porcentaje >= 100) return 'ca-progress-fill ca-progress-full';
  if (porcentaje >= 80) return 'ca-progress-fill ca-progress-high';
  return 'ca-progress-fill';
}

export default function Aforo() {
  const [sitios, setSitios] = useState<OccupancySite[] | null>(null);
  const [actualizando, setActualizando] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sedeAbierta, setSedeAbierta] = useState<number | null>(null);
  const [detalle, setDetalle] = useState<OccupancyDetailEmployee[] | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargar = useCallback(async (mostrarSpinner = false) => {
    if (mostrarSpinner) setActualizando(true);
    try {
      const data = await get<OccupancySite[]>('/occupancy');
      setSitios(data);
      setUltimaActualizacion(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el aforo');
    } finally {
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(() => cargar(), REFRESCO_MS);
    return () => clearInterval(id);
  }, [cargar]);

  async function regenerarEventos() {
    setSimulando(true);
    try {
      await post('/biostar/simulate?dias=7');
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo regenerar la simulación');
    } finally {
      setSimulando(false);
    }
  }

  async function alternarSede(siteId: number) {
    if (sedeAbierta === siteId) {
      setSedeAbierta(null);
      setDetalle(null);
      return;
    }
    setSedeAbierta(siteId);
    setCargandoDetalle(true);
    try {
      const data = await get<OccupancyDetailEmployee[]>(`/occupancy/${siteId}`);
      setDetalle(data);
    } catch {
      setDetalle([]);
    } finally {
      setCargandoDetalle(false);
    }
  }

  const totalPersonas = sitios?.reduce((acc, s) => acc + s.ocupacionActual, 0) ?? 0;
  const sedeMasOcupada = sitios && sitios.length > 0
    ? [...sitios].sort((a, b) => b.ocupacionActual - a.ocupacionActual)[0]
    : null;
  const sedeMasCritica = sitios && sitios.length > 0
    ? [...sitios].filter((s) => s.porcentaje !== null).sort((a, b) => (b.porcentaje ?? 0) - (a.porcentaje ?? 0))[0]
    : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
          <span className="ca-live-dot" />
          {ultimaActualizacion
            ? `Actualizado ${ultimaActualizacion.toLocaleTimeString('es-CO')}`
            : 'Cargando…'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ca-btn ca-btn-outline" onClick={() => cargar(true)} disabled={actualizando}>
            {actualizando ? <span className="ca-spinner ca-spinner-dark" /> : '↻'} Actualizar
          </button>
          <button className="ca-btn ca-btn-accent" onClick={regenerarEventos} disabled={simulando}>
            {simulando && <span className="ca-spinner" />} Regenerar eventos simulados
          </button>
        </div>
      </div>

      {error && (
        <div className="ca-card" style={{ padding: 14, marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="ca-stat-grid">
        <div className="ca-stat">
          <div className="ca-stat-label">Personas adentro ahora</div>
          <div className="ca-stat-value ca-numeric">{totalPersonas}</div>
          <div className="ca-stat-sub">En las 6 sedes activas</div>
        </div>
        <div className="ca-stat" style={{ animationDelay: '40ms' }}>
          <div className="ca-stat-label">Sede con más ocupación</div>
          <div className="ca-stat-value">{sedeMasOcupada ? sedeMasOcupada.ocupacionActual : '—'}</div>
          <div className="ca-stat-sub">{sedeMasOcupada?.nombre ?? 'Sin datos'}</div>
        </div>
        <div className="ca-stat" style={{ animationDelay: '80ms' }}>
          <div className="ca-stat-label">Mayor % de aforo</div>
          <div className="ca-stat-value ca-numeric">
            {sedeMasCritica?.porcentaje !== undefined && sedeMasCritica?.porcentaje !== null
              ? `${sedeMasCritica.porcentaje}%`
              : '—'}
          </div>
          <div className="ca-stat-sub">{sedeMasCritica?.nombre ?? 'Sin datos'}</div>
        </div>
      </div>

      <div className="ca-card">
        <div className="ca-card-header">
          <h2>Ocupación por sede</h2>
          <span className="ca-muted" style={{ fontSize: 12 }}>
            IN sin OUT desde medianoche (RF-13) · clic en una sede para ver quién está adentro
          </span>
        </div>
        <div className="ca-card-body" style={{ padding: 0 }}>
          {!sitios ? (
            <div className="ca-empty">Cargando aforo…</div>
          ) : (
            <div className="ca-table-wrap">
              <table className="ca-table">
                <thead>
                  <tr>
                    <th>Sede</th>
                    <th>Ciudad</th>
                    <th>Ocupación</th>
                    <th style={{ width: 220 }}>Aforo</th>
                  </tr>
                </thead>
                <tbody>
                  {sitios.map((s) => (
                    <Fragment key={s.siteId}>
                      <tr
                        onClick={() => alternarSede(s.siteId)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 600 }}>{s.nombre}</td>
                        <td className="ca-muted">{s.ciudad}</td>
                        <td className="ca-numeric">
                          {s.ocupacionActual}
                          {s.aforoMaximo ? ` / ${s.aforoMaximo}` : ''}
                        </td>
                        <td>
                          {s.aforoMaximo ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="ca-progress-track" style={{ flex: 1 }}>
                                <div
                                  className={claseProgreso(s.porcentaje)}
                                  style={{ width: `${Math.min(s.porcentaje ?? 0, 100)}%` }}
                                />
                              </div>
                              <span className="ca-numeric" style={{ fontSize: 12, width: 34 }}>
                                {s.porcentaje}%
                              </span>
                            </div>
                          ) : (
                            <span className="ca-muted">—</span>
                          )}
                        </td>
                      </tr>
                      {sedeAbierta === s.siteId && (
                        <tr>
                          <td colSpan={4} style={{ background: '#fafbfc', padding: 0 }}>
                            <div style={{ padding: '12px 14px 16px' }}>
                              {cargandoDetalle ? (
                                <span className="ca-muted" style={{ fontSize: 13 }}>Cargando detalle…</span>
                              ) : detalle && detalle.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  {detalle.map((e) => (
                                    <span
                                      key={e.id}
                                      className="ca-badge ca-badge-neutral"
                                      title={`${e.cargo ?? ''} ${e.area ? '· ' + e.area : ''}`}
                                    >
                                      {e.primerNombre} {e.primerApellido}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="ca-muted" style={{ fontSize: 13 }}>
                                  Nadie registrado adentro en este momento.
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
