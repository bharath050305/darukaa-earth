import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="border-b border-emerald-900/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold text-emerald-900">
          <span className="text-2xl">🌳</span> Darukaa.Earth
        </Link>
        {user && (
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-slate-600 hover:text-emerald-800">
              Projects
            </Link>
            <Link to="/map" className="text-slate-600 hover:text-emerald-800">
              Map
            </Link>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">{user.full_name}</span>
            <button
              onClick={handleLogout}
              className="rounded-md bg-emerald-800 px-3 py-1.5 text-white hover:bg-emerald-900"
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
