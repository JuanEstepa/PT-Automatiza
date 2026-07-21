import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Empleados from './pages/Empleados';
import Aforo from './pages/Aforo';
import Reportes from './pages/Reportes';
import UltimaCarga from './pages/UltimaCarga';

const NAV = [
  { to: '/', icon: '●', label: 'Aforo en tiempo real', sub: 'Ocupación actual por sede' },
  { to: '/empleados', icon: '▤', label: 'Empleados', sub: 'Directorio y datos de identidad' },
  { to: '/reportes', icon: '▦', label: 'Reportes', sub: 'Auditoría de accesos exportable' },
  { to: '/carga', icon: '⇧', label: 'Última carga', sub: 'Carga del Excel y resumen' },
];

function tituloActual(pathname: string) {
  return NAV.find((n) => n.to === pathname) ?? NAV[0];
}

function Shell() {
  const location = useLocation();
  const actual = tituloActual(location.pathname);

  return (
    <div className="ca-shell">
      <aside className="ca-sidebar">
        <div className="ca-brand">
          <div className="ca-brand-mark">BA</div>
          <div className="ca-brand-text">
            <strong>Banco Andino</strong>
            <span>Control de acceso</span>
          </div>
        </div>
        <nav className="ca-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `ca-nav-link${isActive ? ' active' : ''}`}
            >
              <span className="ca-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ca-sidebar-footer">
          Capa propia sobre BioStar 2.
          <br />
          Integración simulada (RF-19).
        </div>
      </aside>

      <div className="ca-main">
        <header className="ca-topbar">
          <div>
            <h1>{actual.label}</h1>
            <div className="ca-topbar-sub">{actual.sub}</div>
          </div>
        </header>
        <main className="ca-content">
          <Routes>
            <Route path="/" element={<Aforo />} />
            <Route path="/empleados" element={<Empleados />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/carga" element={<UltimaCarga />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <Shell />;
}
