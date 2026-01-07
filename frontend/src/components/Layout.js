import React, { useState } from 'react';
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
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-gray-600' },
    { path: '/customers', icon: Users, label: 'Customers', color: 'text-blue-500' },
    { path: '/invoicing', icon: FileText, label: 'Invoicing', color: 'text-green-500' },
    { path: '/internal', icon: Briefcase, label: 'Internal', color: 'text-orange-500' },
    { path: '/routes', icon: Route, label: 'Route Planner', color: 'text-yellow-500' },
    { path: '/hms', icon: Shield, label: 'HMS', color: 'text-red-500' },
    { path: '/products', icon: Package, label: 'Product Catalog', color: 'text-indigo-500' },
    { path: '/results', icon: BarChart3, label: 'Results', color: 'text-purple-500' },
    { path: '/economy', icon: DollarSign, label: 'Economy', color: 'text-emerald-500' },
    { path: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-500' }
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div 
        className={`${
          isMenuCollapsed ? 'w-16' : 'w-64'
        } bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isMenuCollapsed && <h1 className="text-xl font-bold text-blue-600">Firmanager</h1>}
          <button
            onClick={() => setIsMenuCollapsed(!isMenuCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors ml-auto"
            title={isMenuCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            {isMenuCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
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
                className={`flex items-center gap-3 ${
                  isMenuCollapsed ? 'justify-center px-4' : 'px-6'
                } py-2.5 transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-800 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={isMenuCollapsed ? item.label : ''}
              >
                <Icon size={22} className={isActive ? '' : item.color} />
                {!isMenuCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          {!isMenuCollapsed && (
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-gray-500 text-xs">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className={`flex items-center gap-2 w-full ${
              isMenuCollapsed ? 'justify-center' : 'px-3'
            } py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors`}
            title={isMenuCollapsed ? 'Log out' : ''}
          >
            <LogOut size={16} />
            {!isMenuCollapsed && <span>Log out</span>}
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

