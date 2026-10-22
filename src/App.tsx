import { lazy, Suspense, useEffect, useState } from 'react';
import ErrorBoundary from './industrial/ErrorBoundary';
import type { User } from './industrial/types';
import { signIn, signOut, errorMessage } from './industrial/api';
import './industrial/industrial.css';

const Workspace = lazy(() => import('./industrial/Workspace'));
function initialUser(): User | null {
  try {
    const user = JSON.parse(localStorage.getItem('gulliver_auth_session') || 'null');
    return user && typeof user.id === 'number' && typeof user.name === 'string' && typeof user.role === 'string' ? user : null;
  } catch { return null; }
}
export default function App() {
  const [user, setUser] = useState<User | null>(initialUser);
  const [employee, setEmployee] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === 'gulliver_auth_session') setUser(initialUser());
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  async function login(event: React.FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const identity = await signIn(employee, password);
      setUser(identity); setPassword('');
    } catch(e) { setError(errorMessage(e)); }
    finally { setBusy(false); }
  }
  async function logout() { await signOut(); setUser(null); }
  if(user) return <ErrorBoundary><Suspense fallback={<div className="industrial loading" role="status">Cargando tu espacio de trabajo…</div>}><Workspace key={user.id} user={user} onLogout={logout}/></Suspense></ErrorBoundary>;
  return <div className="industrial login-page"><main className="login-panel">
    <h1>Gulliver</h1><p>Registro de producción</p>
    <form onSubmit={login}>
      <label>Número de empleado<input autoComplete="username" required maxLength={8} value={employee} onChange={e=>setEmployee(e.target.value)}/></label>
      <label>Contraseña<input type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      {error && <p role="alert" className="notice error">{error}</p>}
      <button className="primary" disabled={busy}>{busy?'Iniciando sesión…':'Iniciar sesión'}</button>
    </form>
    <p>Inicia sesión con conexión para preparar tu turno. Las capturas pendientes se conservan al cerrar sesión.</p>
  </main></div>;
}
