import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Briefcase,
  Route,
  Shield,
  Package,
  BarChart3,
  DollarSign,
  Settings,
  LogOut
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customers', icon: Users, label: 'Kunder' },
    { path: '/invoicing', icon: FileText, label: 'Fakturagrunnlag' },
    { path: '/internal', icon: Briefcase, label: 'Intern' },
    { path: '/routes', icon: Route, label: 'Ruteplanlegger' },
    { path: '/hms', icon: Shield, label: 'HMS' },
    { path: '/products', icon: Package, label: 'Produktkatalog' },
    { path: '/results', icon: BarChart3, label: 'Resultater' },
    { path: '/economy', icon: DollarSign, label: 'Økonomi' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Firmanager</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm">
              <p className="font-medium">{user?.name}</p>
              <p className="text-gray-400 text-xs">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            <LogOut size={16} />
            <span>Logg ut</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
