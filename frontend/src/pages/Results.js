import React, { useState, useEffect } from 'react';
import { getWorkOrders, getEmployees, getInternalOrders, getServices, getCustomers, getSupplierPricing } from '../services/api';
import { TrendingUp, DollarSign, Users, Briefcase, Building2 } from 'lucide-react';

const Results = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [internalOrders, setInternalOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [supplierPricing, setSupplierPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, internalRes, employeesRes, servicesRes, customersRes, pricingRes] = await Promise.all([
        getWorkOrders(),
        getInternalOrders(),
        getEmployees(),
        getServices(),
        getCustomers(),
        getSupplierPricing()
      ]);
      setWorkOrders(ordersRes.data);
      setInternalOrders(internalRes.data);
      setEmployees(employeesRes.data);
      setServices(servicesRes.data);
      setCustomers(customersRes.data);
      setSupplierPricing(pricingRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by selected month
  const filterByMonth = (orders, dateField = 'date') => {
    return orders.filter(order => {
      const orderDate = new Date(order[dateField]).toISOString().slice(0, 7);
      return orderDate === selectedMonth;
    });
  };

  // Get supplier pricing for a specific service (via produsent_id)
  const getSupplierRatesForService = (service) => {
    if (!service || !service.produsent_id) {
      // Fallback to first supplier pricing if no specific produsent
      const pricing = supplierPricing[0] || {};
      return {
        name: pricing.name || 'Standard',
        arbeidstid_rate: pricing.arbeidstid_rate || 0,
        kjoretid_rate: pricing.kjoretid_rate || 0,
        km_rate: pricing.km_rate || 0
      };
    }
    
    const pricing = supplierPricing.find(p => p.id === service.produsent_id);
    if (!pricing) {
      const fallback = supplierPricing[0] || {};
      return {
        name: fallback.name || 'Standard',
        arbeidstid_rate: fallback.arbeidstid_rate || 0,
        kjoretid_rate: fallback.kjoretid_rate || 0,
        km_rate: fallback.km_rate || 0
      };
    }
    
    return {
      name: pricing.name || 'Ukjent',
      arbeidstid_rate: pricing.arbeidstid_rate || 0,
      kjoretid_rate: pricing.kjoretid_rate || 0,
      km_rate: pricing.km_rate || 0
    };
  };

  // Get supplier pricing (first entry or defaults) - for summary
  const getSupplierRates = () => {
    const pricing = supplierPricing[0] || {};
    return {
      name: pricing.name || 'Standard',
      arbeidstid_rate: pricing.arbeidstid_rate || 0,
      kjoretid_rate: pricing.kjoretid_rate || 0,
      km_rate: pricing.km_rate || 0
    };
  };

  // Calculate INTERN results (intern timesats based work)
  const calculateInternResults = () => {
    const results = {};
    
    employees.forEach(emp => {
      results[emp.id] = {
        name: emp.navn,
        initialer: emp.initialer,
        intern_sats: emp.intern_sats || 0,
        hours: 0,
        amount: 0
      };
    });

    const monthInternalOrders = filterByMonth(internalOrders);
    monthInternalOrders.forEach(order => {
      if (results[order.employee_id]) {
        const employee = employees.find(e => e.id === order.employee_id);
        if (!employee) return;
        results[order.employee_id].hours += order.arbeidstid;
        results[order.employee_id].amount += order.arbeidstid * (employee.intern_sats || 0);
      }
    });

    return Object.values(results).filter(r => r.hours > 0);
  };

  // Calculate PA results (all employee-specific rates)
  const calculatePAResults = () => {
    const results = {};
    
    employees.forEach(emp => {
      results[emp.id] = {
        name: emp.navn,
        initialer: emp.initialer,
        // PA rates from employee
        pa_service_sats: emp.pa_service_sats || 0,
        pa_montering_sats: emp.pa_montering_sats || 0,
        pa_timesats: emp.pa_timesats || 0,
        pa_kjoresats: emp.pa_kjoresats || 0,
        pa_km_sats: emp.pa_km_sats || 0,
        // Counts and amounts
        service_count: 0,
        service_amount: 0,
        montering_count: 0,
        montering_amount: 0,
        extra_hours: 0,
        extra_amount: 0,
        kjore_hours: 0,
        kjore_amount: 0,
        km: 0,
        km_amount: 0,
        total: 0
      };
    });

    const monthWorkOrders = filterByMonth(workOrders);
    monthWorkOrders.forEach(order => {
      if (order.status === 'fullført' && results[order.employee_id]) {
        const employee = employees.find(e => e.id === order.employee_id);
        if (!employee) return;

        const result = results[order.employee_id];

        if (order.order_type === 'service') {
          result.service_count += 1;
          result.service_amount += employee.pa_service_sats || 0;
        } else if (order.order_type === 'montering') {
          result.montering_count += 1;
          result.montering_amount += employee.pa_montering_sats || 0;
        }

        // Time-based (arbeidstid for ekstra work)
        if (order.order_type === 'ekstra' && order.arbeidstid > 0) {
          result.extra_hours += order.arbeidstid;
          result.extra_amount += order.arbeidstid * (employee.pa_timesats || 0);
        }

        // Kjøretid
        if (order.kjoretid > 0) {
          result.kjore_hours += order.kjoretid;
          result.kjore_amount += order.kjoretid * (employee.pa_kjoresats || 0);
        }

        // Kilometer
        if (order.kjorte_km > 0) {
          result.km += order.kjorte_km;
          result.km_amount += order.kjorte_km * (employee.pa_km_sats || 0);
        }
      }
    });

    // Calculate totals
    Object.values(results).forEach(r => {
      r.total = r.service_amount + r.montering_amount + r.extra_amount + r.kjore_amount + r.km_amount;
    });

    return Object.values(results).filter(r => r.total > 0);
  };

  // Calculate BEDRIFT INNTJENING (company revenue based on service prices and supplier rates)
  const calculateCompanyRevenue = () => {
    const results = {
      // Service-based revenue (fixed prices)
      service_revenue: { count: 0, amount: 0 },
      montering_revenue: { count: 0, amount: 0 },
      ekstra_revenue: { count: 0, amount: 0 },
      // Time-based revenue (supplier rates)
      arbeidstid_revenue: { hours: 0, amount: 0 },
      kjoretid_revenue: { hours: 0, amount: 0 },
      km_revenue: { km: 0, amount: 0 },
      // Totals
      total_service_based: 0,
      total_time_based: 0,
      total_revenue: 0,
      // By produsent breakdown
      by_produsent: {}
    };

    const monthWorkOrders = filterByMonth(workOrders);
    monthWorkOrders.forEach(order => {
      if (order.status !== 'fullført') return;

      // Find customer and their service via typenr
      const customer = customers.find(c => c.id === order.customer_id);
      // Use typenr to find service (typenr matches tjenestenr)
      const serviceNr = customer?.typenr || customer?.tjeneste_nr;
      const service = serviceNr ? services.find(s => s.tjenestenr === serviceNr) : null;

      // Get rates for this specific service's produsent
      const rates = getSupplierRatesForService(service);
      
      // Track by produsent
      if (!results.by_produsent[rates.name]) {
        results.by_produsent[rates.name] = {
          arbeidstid: { hours: 0, amount: 0 },
          kjoretid: { hours: 0, amount: 0 },
          km: { km: 0, amount: 0 }
        };
      }

      // Service-based revenue (from tjenester - fixed prices)
      if (order.order_type === 'service' && service) {
        results.service_revenue.count += 1;
        results.service_revenue.amount += service.pris || 0;
      } else if (order.order_type === 'montering' && service) {
        results.montering_revenue.count += 1;
        // Use t3_ekstraservice_100 as montering rate if available
        results.montering_revenue.amount += service.t3_ekstraservice_100 || service.pris || 0;
      } else if (order.order_type === 'ekstra' && service) {
        results.ekstra_revenue.count += 1;
        results.ekstra_revenue.amount += service.t1_ekstraservice || 0;
      }

      // Time-based revenue (from produsent satser - per service)
      if (order.arbeidstid > 0) {
        results.arbeidstid_revenue.hours += order.arbeidstid;
        results.arbeidstid_revenue.amount += order.arbeidstid * rates.arbeidstid_rate;
        results.by_produsent[rates.name].arbeidstid.hours += order.arbeidstid;
        results.by_produsent[rates.name].arbeidstid.amount += order.arbeidstid * rates.arbeidstid_rate;
      }
      if (order.kjoretid > 0) {
        results.kjoretid_revenue.hours += order.kjoretid;
        results.kjoretid_revenue.amount += order.kjoretid * rates.kjoretid_rate;
        results.by_produsent[rates.name].kjoretid.hours += order.kjoretid;
        results.by_produsent[rates.name].kjoretid.amount += order.kjoretid * rates.kjoretid_rate;
      }
      if (order.kjorte_km > 0) {
        results.km_revenue.km += order.kjorte_km;
        results.km_revenue.amount += order.kjorte_km * rates.km_rate;
        results.by_produsent[rates.name].km.km += order.kjorte_km;
        results.by_produsent[rates.name].km.amount += order.kjorte_km * rates.km_rate;
      }
    });

    results.total_service_based = results.service_revenue.amount + results.montering_revenue.amount + results.ekstra_revenue.amount;
    results.total_time_based = results.arbeidstid_revenue.amount + results.kjoretid_revenue.amount + results.km_revenue.amount;
    results.total_revenue = results.total_service_based + results.total_time_based;

    return results;
  };

  // Calculate summary for overview
  const calculateSummary = () => {
    const internResults = calculateInternResults();
    const paResults = calculatePAResults();
    const companyRevenue = calculateCompanyRevenue();

    const total_intern = internResults.reduce((sum, r) => sum + r.amount, 0);
    const total_pa = paResults.reduce((sum, r) => sum + r.total, 0);
    const total_revenue = companyRevenue.total_revenue;
    const profit = total_revenue - total_pa - total_intern;

    return {
      total_intern,
      total_pa,
      total_revenue,
      profit
    };
  };

  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  const summary = calculateSummary();
  const internResults = calculateInternResults();
  const paResults = calculatePAResults();
  const companyRevenue = calculateCompanyRevenue();

  const tabs = [
    { id: 'overview', label: 'Oversikt' },
    { id: 'intern', label: 'Intern Resultater' },
    { id: 'pa', label: 'PA Resultater' },
    { id: 'revenue', label: 'Bedrift Inntjening' }
  ];

  return (
    <div data-testid="results-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resultater</h1>
        <div>
          <label className="text-sm text-gray-400 mr-2">Velg måned:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t transition-colors ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 p-3 rounded-lg">
                  <Building2 size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{summary.total_revenue.toFixed(0)} kr</p>
                  <p className="text-sm text-gray-400">Company Revenue</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{summary.total_pa.toFixed(0)} kr</p>
                  <p className="text-sm text-gray-400">PA Payment</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-3 rounded-lg">
                  <Briefcase size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{summary.total_intern.toFixed(0)} kr</p>
                  <p className="text-sm text-gray-400">Internal Salary</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <div className={`${summary.profit >= 0 ? 'bg-yellow-600' : 'bg-red-600'} p-3 rounded-lg`}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {summary.profit.toFixed(0)} kr
                  </p>
                  <p className="text-sm text-gray-400">Resultat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-purple-400" />
                Intern Resultater
              </h3>
              <p className="text-3xl font-bold text-purple-400">{summary.total_intern.toFixed(0)} kr</p>
              <p className="text-sm text-gray-400 mt-2">{internResults.length} employees with internal work</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                PA Resultater
              </h3>
              <p className="text-3xl font-bold text-blue-400">{summary.total_pa.toFixed(0)} kr</p>
              <p className="text-sm text-gray-400 mt-2">{paResults.length} employees with PA payment</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-green-400" />
                Bedrift Inntjening
              </h3>
              <p className="text-3xl font-bold text-green-400">{summary.total_revenue.toFixed(0)} kr</p>
              <p className="text-sm text-gray-400 mt-2">Based on services and supplier rates</p>
            </div>
          </div>
        </div>
      )}

      {/* INTERN TAB */}
      {activeTab === 'intern' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Intern Resultater - Intern Timesats</h2>
            <p className="text-sm text-gray-400 mb-4">Lønn basert på intern timesats for internt arbeid (ikke fakturerbart)</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Employee</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Internal Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Hours</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {internResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <p className="font-medium">{result.name}</p>
                        <p className="text-xs text-gray-400">{result.initialer}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{result.intern_sats} kr/t</td>
                      <td className="px-4 py-3 text-right">{result.hours.toFixed(1)} t</td>
                      <td className="px-4 py-3 text-right font-bold text-purple-400">{result.amount.toFixed(0)} kr</td>
                    </tr>
                  ))}
                  {internResults.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-400">No internal work for selected month</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-800">
                  <tr>
                    <td colSpan="2" className="px-4 py-3 font-bold">TOTAL</td>
                    <td className="px-4 py-3 text-right font-bold">{internResults.reduce((s, r) => s + r.hours, 0).toFixed(1)} t</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-400">{summary.total_intern.toFixed(0)} kr</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PA TAB */}
      {activeTab === 'pa' && (
        <div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">PA Resultater - Provisjon/Andel</h2>
            <p className="text-sm text-gray-400 mb-4">Utbetaling basert på alle ansatt-satser (PA service, montering, time, kjøre, km)</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium text-gray-300">Ansatt</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-300">Service</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-300">Montering</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-300">Ekstra (timer)</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-300">Kjøretid</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-300">Kilometer</th>
                    <th className="px-3 py-3 text-right font-medium text-gray-300">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-gray-800">
                      <td className="px-3 py-3">
                        <p className="font-medium">{result.name}</p>
                        <p className="text-xs text-gray-400">{result.initialer}</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-semibold">{result.service_amount.toFixed(0)} kr</p>
                        <p className="text-xs text-gray-400">{result.service_count} stk × {result.pa_service_sats} kr</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-semibold">{result.montering_amount.toFixed(0)} kr</p>
                        <p className="text-xs text-gray-400">{result.montering_count} stk × {result.pa_montering_sats} kr</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-semibold">{result.extra_amount.toFixed(0)} kr</p>
                        <p className="text-xs text-gray-400">{result.extra_hours.toFixed(1)} t × {result.pa_timesats} kr</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-semibold">{result.kjore_amount.toFixed(0)} kr</p>
                        <p className="text-xs text-gray-400">{result.kjore_hours.toFixed(1)} t × {result.pa_kjoresats} kr</p>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="font-semibold">{result.km_amount.toFixed(0)} kr</p>
                        <p className="text-xs text-gray-400">{result.km.toFixed(0)} km × {result.pa_km_sats} kr</p>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-blue-400">{result.total.toFixed(0)} kr</td>
                    </tr>
                  ))}
                  {paResults.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-400">No PA payments for selected month</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-800">
                  <tr>
                    <td className="px-3 py-3 font-bold">TOTAL</td>
                    <td className="px-3 py-3 text-right font-bold">{paResults.reduce((s, r) => s + r.service_amount, 0).toFixed(0)} kr</td>
                    <td className="px-3 py-3 text-right font-bold">{paResults.reduce((s, r) => s + r.montering_amount, 0).toFixed(0)} kr</td>
                    <td className="px-3 py-3 text-right font-bold">{paResults.reduce((s, r) => s + r.extra_amount, 0).toFixed(0)} kr</td>
                    <td className="px-3 py-3 text-right font-bold">{paResults.reduce((s, r) => s + r.kjore_amount, 0).toFixed(0)} kr</td>
                    <td className="px-3 py-3 text-right font-bold">{paResults.reduce((s, r) => s + r.km_amount, 0).toFixed(0)} kr</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-400">{summary.total_pa.toFixed(0)} kr</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BEDRIFT INNTJENING TAB */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Service-based revenue */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Tjenester (Satsbasert)</h2>
            <p className="text-sm text-gray-400 mb-4">Inntjening basert på faste tjenestesatser (Service, Montering, Ekstra)</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded p-4">
                <h3 className="font-medium text-lg mb-2">Service</h3>
                <p className="text-2xl font-bold text-green-400">{companyRevenue.service_revenue.amount.toFixed(0)} kr</p>
                <p className="text-xs text-gray-400 mt-1">{companyRevenue.service_revenue.count} stk utført</p>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <h3 className="font-medium text-lg mb-2">Montering</h3>
                <p className="text-2xl font-bold text-green-400">{companyRevenue.montering_revenue.amount.toFixed(0)} kr</p>
                <p className="text-xs text-gray-400 mt-1">{companyRevenue.montering_revenue.count} stk utført</p>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <h3 className="font-medium text-lg mb-2">Ekstra arbeid</h3>
                <p className="text-2xl font-bold text-green-400">{companyRevenue.ekstra_revenue.amount.toFixed(0)} kr</p>
                <p className="text-xs text-gray-400 mt-1">{companyRevenue.ekstra_revenue.count} stk utført</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
              <span className="font-semibold">Sum satsbasert:</span>
              <span className="font-bold text-green-400">{companyRevenue.total_service_based.toFixed(0)} kr</span>
            </div>
          </div>

          {/* Time-based revenue (Produsent satser) */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Produsent Satser (Time/KM-basert)</h2>
            <p className="text-sm text-gray-400 mb-4">Inntjening basert på produsent timesatser og km-sats per tjeneste</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded p-4">
                <h3 className="font-medium text-lg mb-2">Arbeidstid</h3>
                <p className="text-2xl font-bold text-yellow-400">{companyRevenue.arbeidstid_revenue.amount.toFixed(0)} kr</p>
                <p className="text-xs text-gray-400 mt-1">{companyRevenue.arbeidstid_revenue.hours.toFixed(1)} timer totalt</p>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <h3 className="font-medium text-lg mb-2">Kjøretid</h3>
                <p className="text-2xl font-bold text-yellow-400">{companyRevenue.kjoretid_revenue.amount.toFixed(0)} kr</p>
                <p className="text-xs text-gray-400 mt-1">{companyRevenue.kjoretid_revenue.hours.toFixed(1)} timer totalt</p>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <h3 className="font-medium text-lg mb-2">Kilometer</h3>
                <p className="text-2xl font-bold text-yellow-400">{companyRevenue.km_revenue.amount.toFixed(0)} kr</p>
                <p className="text-xs text-gray-400 mt-1">{companyRevenue.km_revenue.km.toFixed(0)} km totalt</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
              <span className="font-semibold">Sum timebasert:</span>
              <span className="font-bold text-yellow-400">{companyRevenue.total_time_based.toFixed(0)} kr</span>
            </div>
          </div>

          {/* Breakdown by Produsent */}
          {Object.keys(companyRevenue.by_produsent).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Fordelt per Produsent</h2>
              <p className="text-sm text-gray-400 mb-4">Detaljert inntjening per produsent (time/km-basert)</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-300">Produsent</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-300">Arbeidstid</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-300">Kjøretid</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-300">Kilometer</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-300">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {Object.entries(companyRevenue.by_produsent).map(([name, data]) => (
                      <tr key={name} className="hover:bg-gray-800">
                        <td className="px-4 py-3 font-medium">{name}</td>
                        <td className="px-4 py-3 text-right">
                          <p>{data.arbeidstid.amount.toFixed(0)} kr</p>
                          <p className="text-xs text-gray-400">{data.arbeidstid.hours.toFixed(1)} t</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p>{data.kjoretid.amount.toFixed(0)} kr</p>
                          <p className="text-xs text-gray-400">{data.kjoretid.hours.toFixed(1)} t</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p>{data.km.amount.toFixed(0)} kr</p>
                          <p className="text-xs text-gray-400">{data.km.km.toFixed(0)} km</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-yellow-400">
                          {(data.arbeidstid.amount + data.kjoretid.amount + data.km.amount).toFixed(0)} kr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Total Revenue Summary */}
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Total Bedrift Inntjening</h2>
                <p className="text-sm text-gray-400">Tjenester + Produsent satser</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{companyRevenue.total_revenue.toFixed(0)} kr</p>
            </div>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">Forklaring:</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          <li><strong>Intern Resultater:</strong> Lønn for internt arbeid (intern timesats × timer)</li>
          <li><strong>PA Resultater:</strong> Alle ansatt-satser (PA service, montering, time, kjøre, km)</li>
          <li><strong>Bedrift Inntjening:</strong> Fakturerbar inntekt fra tjenester og produsent-satser per tjeneste</li>
          <li><strong>Resultat:</strong> Bedrift Inntjening - PA - Intern = Bedriftens overskudd</li>
        </ul>
      </div>
    </div>
  );
};

export default Results;
