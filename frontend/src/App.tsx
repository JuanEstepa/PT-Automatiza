import { Link, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Reports from './pages/Reports';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 18 }}>Control de Acceso — Banco Andino</h1>
        <nav style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          <Link to="/">Aforo</Link>
          <Link to="/cargar">Cargar Excel</Link>
          <Link to="/reportes">Reportes</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cargar" element={<Upload />} />
        <Route path="/reportes" element={<Reports />} />
      </Routes>
    </div>
  );
}
