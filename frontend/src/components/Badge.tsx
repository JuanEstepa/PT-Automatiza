type Tono = 'success' | 'warning' | 'danger' | 'neutral';

const TONO_POR_ESTADO: Record<string, Tono> = {
  OK: 'success',
  ACTIVO: 'success',
  ADVERTENCIA: 'warning',
  RECHAZADO: 'danger',
  INACTIVO: 'neutral',
  IN: 'success',
  OUT: 'neutral',
};

/** Pill de estado reutilizado en Empleados, Reportes y Última carga. */
export default function Badge({ estado, texto }: { estado: string; texto?: string }) {
  const tono = TONO_POR_ESTADO[estado] ?? 'neutral';
  return (
    <span className={`ca-badge ca-badge-${tono}`}>
      <span className="ca-badge-dot" />
      {texto ?? estado}
    </span>
  );
}
