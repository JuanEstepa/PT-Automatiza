import { useEffect, useMemo, useState } from 'react';
import { get } from '../api/client';
import type { Employee, Site } from '../api/types';
import Badge from '../components/Badge';

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Employee[] | null>(null);
  const [sedes, setSedes] = useState<Site[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [estado, setEstado] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    get<Site[]>('/sites').then(setSedes).catch(() => setSedes([]));
  }, []);

  useEffect(() => {
    setCargando(true);
    const params = new URLSearchParams();
    if (busqueda.trim()) params.set('q', busqueda.trim());
    if (sedeId) params.set('siteId', sedeId);
    if (estado) params.set('estado', estado);

    const timeout = setTimeout(() => {
      get<Employee[]>(`/employees?${params.toString()}`)
        .then(setEmpleados)
        .catch(() => setEmpleados([]))
        .finally(() => setCargando(false));
    }, 250);

    return () => clearTimeout(timeout);
  }, [busqueda, sedeId, estado]);

  const total = empleados?.length ?? 0;
  const activos = useMemo(() => empleados?.filter((e) => e.estado === 'ACTIVO').length ?? 0, [empleados]);

  return (
    <div>
      <div className="ca-stat-grid">
        <div className="ca-stat">
          <div className="ca-stat-label">Empleados encontrados</div>
          <div className="ca-stat-value ca-numeric">{total}</div>
          <div className="ca-stat-sub">Según filtros aplicados</div>
        </div>
        <div className="ca-stat" style={{ animationDelay: '40ms' }}>
          <div className="ca-stat-label">Activos</div>
          <div className="ca-stat-value ca-numeric">{activos}</div>
          <div className="ca-stat-sub">De {total} en pantalla</div>
        </div>
        <div className="ca-stat" style={{ animationDelay: '80ms' }}>
          <div className="ca-stat-label">Sedes en catálogo</div>
          <div className="ca-stat-value ca-numeric">{sedes.length}</div>
          <div className="ca-stat-sub">RF-06</div>
        </div>
      </div>

      <div className="ca-card">
        <div className="ca-card-header">
          <h2>Directorio de empleados</h2>
        </div>
        <div className="ca-card-body" style={{ paddingBottom: 12 }}>
          <div className="ca-filters">
            <div className="ca-field" style={{ minWidth: 220 }}>
              <label>Buscar</label>
              <input
                className="ca-input"
                placeholder="Nombre, apellido o código"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="ca-field">
              <label>Sede</label>
              <select className="ca-select" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
                <option value="">Todas</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="ca-field">
              <label>Estado</label>
              <select className="ca-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
        <div className="ca-table-wrap">
          <table className="ca-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>País</th>
                <th>Documento</th>
                <th>Sede principal</th>
                <th>Cargo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(empleados ?? []).map((e) => {
                const sedePrincipal = e.sites.find((s) => s.esSedePrincipal)?.site ?? e.sites[0]?.site;
                const doc = e.documents[0];
                return (
                  <tr key={e.id}>
                    <td className="ca-numeric ca-muted">{e.codigoEmpleado}</td>
                    <td style={{ fontWeight: 600 }}>
                      {e.primerNombre} {e.primerApellido}
                    </td>
                    <td>{e.country.nombre}</td>
                    <td className="ca-muted">
                      {doc ? `${doc.documentType.codigo} ${doc.numeroNormalizado}` : '—'}
                    </td>
                    <td>{sedePrincipal?.nombre ?? <span className="ca-muted">Sin asignar</span>}</td>
                    <td className="ca-muted">{e.cargo ?? '—'}</td>
                    <td>
                      <Badge estado={e.estado} texto={e.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!cargando && empleados && empleados.length === 0 && (
            <div className="ca-empty">No hay empleados que coincidan con los filtros.</div>
          )}
          {cargando && <div className="ca-empty">Buscando…</div>}
        </div>
      </div>
    </div>
  );
}
