import { useEffect, useState } from 'react';
import { get } from '../api/client';

type Aforo = { siteId: number; nombre: string; aforoMaximo: number | null; ocupacionActual: number };

// Tablero de aforo por sede (RF-18).
export default function Dashboard() {
  const [data, setData] = useState<Aforo[]>([]);
  useEffect(() => { get<Aforo[]>('/occupancy').then(setData).catch(() => {}); }, []);
  return (
    <section>
      <h2>Aforo actual por sede</h2>
      <table width="100%">
        <thead><tr><th align="left">Sede</th><th>Ocupación</th><th>Máximo</th></tr></thead>
        <tbody>
          {data.map((s) => (
            <tr key={s.siteId}>
              <td>{s.nombre}</td>
              <td align="center">{s.ocupacionActual}</td>
              <td align="center">{s.aforoMaximo ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: exportar a Excel (RF-17) */}
    </section>
  );
}
