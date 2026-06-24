import { Link, useLocation } from 'react-router-dom';
import { Droplets, Bell, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import axios from 'axios';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Star Topology', path: '/star-topology' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Alerts', path: '/alerts' },
  ];

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/api/auth/logout');
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
      // Fallback redirect even if API fails
      window.location.href = '/login';
    }
  };

  return (
    <nav className="h-16 w-full border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 text-primary font-bold text-lg">
        <Droplets size={24} className="text-primary" />
        <span>WaterTwin</span>
      </div>

      {/* Center: Pill Navigation */}
      <div className="flex items-center bg-background border border-border p-1 rounded-full shadow-sm">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-text-muted hover:text-text hover:bg-surface-light'
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 text-text-muted">
        <button className="p-2 hover:bg-surface-light rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full border border-surface"></span>
        </button>
        <ThemeToggle />
        <button className="p-2 hover:bg-surface-light rounded-full transition-colors">
          <User size={20} />
        </button>
        <button 
          onClick={handleLogout}
          className="p-2 hover:bg-danger/10 hover:text-danger rounded-full transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </nav>
  );
}
