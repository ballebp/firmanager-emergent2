import React, { useState, useEffect } from 'react';
import { getDashboardStats, getWorkOrders, getCustomers, getEmployees, getServices } from '../services/api';
import { Users, FileText, Package, TrendingUp, Calendar, MapPin, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, customersRes, employeesRes, servicesRes] = await Promise.all([
        getDashboardStats(),
        getWorkOrders(),
        getCustomers(),
        getEmployees(),
        getServices()
      ]);
      setStats(statsRes.data);
      setWorkOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setEmployees(employeesRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-800">Loading...</div>;
  }

  // Calculate this month's stats
  const thisMonth = new Date().toISOString().slice(0, 7);
  const thisMonthOrders = workOrders.filter(o => new Date(o.date).toISOString().slice(0, 7) === thisMonth);
  const completedThisMonth = thisMonthOrders.filter(o => o.status === 'fullført').length;
  const pendingThisMonth = thisMonthOrders.filter(o => o.status === 'planlagt').length;

  // Calculate revenue estimate
  const totalHours = thisMonthOrders.reduce((sum, o) => sum + (o.arbeidstid || 0), 0);
  const totalKm = thisMonthOrders.reduce((sum, o) => sum + (o.kjorte_km || 0), 0);
  
  // Recent work orders
  const recentOrders = [...workOrders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Get upcoming planned orders
  const today = new Date();
  const upcomingOrders = workOrders
    .filter(o => o.status === 'planlagt' && new Date(o.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const getCustomerName = (id) => customers.find(c => c.id === id)?.kundnavn || '-';
  const getEmployeeName = (id) => employees.find(e => e.id === id)?.navn || '-';

  const statCards = [
    {
      title: 'Total Customers',
      value: stats?.total_customers || customers.length,
      icon: Users,
      color: 'bg-blue-500',
      sub: `${services.length} services`
    },
    {
      title: 'Employees',
      value: employees.length,
      icon: Users,
      color: 'bg-indigo-500',
      sub: 'Active employees'
    },
    {
      title: 'This Month',
      value: completedThisMonth,
      icon: CheckCircle,
      color: 'bg-green-500',
      sub: `${pendingThisMonth} planned`
    },
    {
      title: 'Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'bg-purple-500',
      sub: 'In catalog'
    }
  ];

  return (
    <div data-testid="dashboard-page">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-800 mt-1">Welcome to Firmanager</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-800">Today's Date</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString('no-NO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              data-testid={`stat-card-${idx}`}
              className="bg-white border border-gray-200 rounded p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <p className="text-gray-800 text-sm mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              {stat.sub && <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-500" />
            Monthly Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-800">Work Orders</span>
              <span className="font-bold">{thisMonthOrders.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-800">Completed</span>
              <span className="font-bold text-green-500">{completedThisMonth}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-800">Planned</span>
              <span className="font-bold text-yellow-500">{pendingThisMonth}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-800">Total Hours</span>
                <span className="font-bold">{totalHours.toFixed(1)} h</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-800">Driven km</span>
                <span className="font-bold">{totalKm.toFixed(0)} km</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} className="text-yellow-500" />
            Upcoming Tasks
          </h2>
          {upcomingOrders.length > 0 ? (
            <div className="space-y-3">
              {upcomingOrders.map((order, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-100 rounded">
                  <div className="w-12 text-center">
                    <p className="text-xs text-gray-800">{new Date(order.date).toLocaleDateString('no-NO', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{getCustomerName(order.customer_id)}</p>
                    <p className="text-xs text-gray-800 capitalize">{order.order_type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-800 text-sm">No upcoming tasks</p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-green-500" />
            Recent Activity
          </h2>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-gray-100 rounded">
                  <div className={`w-2 h-2 rounded-full ${order.status === 'fullført' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{getCustomerName(order.customer_id)}</p>
                    <p className="text-xs text-gray-800">{new Date(order.date).toLocaleDateString('no-NO')} - {getEmployeeName(order.employee_id)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${order.status === 'fullført' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {order.status === 'fullført' ? 'Completed' : order.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-800 text-sm">No recent activity</p>
          )}
        </div>
      </div>

      {/* Work Order Stats by Type */}
      {stats?.stats_by_type && Object.keys(stats.stats_by_type).length > 0 && (
        <div className="bg-white border border-gray-200 rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Work Orders by Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(stats.stats_by_type).map(([type, data]) => (
              <div key={type} className="bg-gray-100 rounded p-4">
                <h3 className="font-medium text-lg capitalize mb-2">{type}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-800">Count: <span className="text-gray-900 font-bold">{data.count}</span></p>
                  <p className="text-gray-800">Hours: <span className="text-gray-900">{data.total_hours.toFixed(1)}</span></p>
                  <p className="text-gray-800">Km: <span className="text-gray-900">{data.total_km.toFixed(0)}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="/customers" className="bg-gray-100 hover:bg-gray-200 rounded p-4 text-center transition-colors">
          <Users size={32} className="mx-auto mb-2 text-blue-500" />
          <p className="font-medium">Customers</p>
        </a>
        <a href="/invoicing" className="bg-gray-100 hover:bg-gray-200 rounded p-4 text-center transition-colors">
          <FileText size={32} className="mx-auto mb-2 text-green-500" />
          <p className="font-medium">Invoicing</p>
        </a>
        <a href="/routes" className="bg-gray-100 hover:bg-gray-200 rounded p-4 text-center transition-colors">
          <MapPin size={32} className="mx-auto mb-2 text-yellow-500" />
          <p className="font-medium">Route Planner</p>
        </a>
        <a href="/results" className="bg-gray-100 hover:bg-gray-200 rounded p-4 text-center transition-colors">
          <TrendingUp size={32} className="mx-auto mb-2 text-purple-500" />
          <p className="font-medium">Results</p>
        </a>
      </div>
    </div>
  );
};

export default Dashboard;




