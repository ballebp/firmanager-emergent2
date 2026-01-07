import React, { useState, useEffect, useRef } from 'react';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getServices,
  createService,
  updateService,
  deleteService,
  getSupplierPricing,
  createSupplierPricing,
  updateSupplierPricing,
  deleteSupplierPricing
} from '../services/api';
import { Plus, Edit, Trash2, X, Upload } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Economy = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [supplierPricing, setSupplierPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const [editingPricing, setEditingPricing] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [employeeFormData, setEmployeeFormData] = useState({
    initialer: '',
    navn: '',
    epost: '',
    telefon: '',
    stilling: '',
    intern_sats: 0,
    faktura_sats: 0,
    pa_service_sats: 0,
    pa_montering_sats: 0,
    pa_timesats: 0,
    pa_kjoresats: 0,
    pa_km_sats: 0
  });

  const [serviceFormData, setServiceFormData] = useState({
    tjenestenr: '',
    tjeneste_navn: '',
    beskrivelse: '',
    leverandor: '',
    produsent_id: '',
    pris: 0,  // Fast pris, ikke timepris
    t1_ekstraservice: 0,
    t2_ekstraservice_50: 0,
    t3_ekstraservice_100: 0,
    t4_ekstraarbeid: 0,
    t5_kjoretid: 0,
    t6_km_godtgjorelse: 0
  });

  const [pricingFormData, setPricingFormData] = useState({
    name: '',
    arbeidstid_rate: 0,
    kjoretid_rate: 0,
    km_rate: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, servicesRes, pricingRes] = await Promise.all([
        getEmployees(),
        getServices(),
        getSupplierPricing()
      ]);
      setEmployees(empRes.data);
      setServices(servicesRes.data);
      setSupplierPricing(pricingRes.data);
    } catch (error) {
      console.error('Failed to load economy data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Employee functions
  const handleSubmitEmployee = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...employeeFormData,
        intern_sats: parseFloat(employeeFormData.intern_sats),
        faktura_sats: parseFloat(employeeFormData.faktura_sats),
        pa_service_sats: parseFloat(employeeFormData.pa_service_sats),
        pa_montering_sats: parseFloat(employeeFormData.pa_montering_sats),
        pa_timesats: parseFloat(employeeFormData.pa_timesats),
        pa_kjoresats: parseFloat(employeeFormData.pa_kjoresats),
        pa_km_sats: parseFloat(employeeFormData.pa_km_sats)
      };
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, submitData);
      } else {
        await createEmployee(submitData);
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      resetEmployeeForm();
      loadData();
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('Could not save employee');
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      initialer: employee.initialer,
      navn: employee.navn,
      epost: employee.epost || '',
      telefon: employee.telefon || '',
      stilling: employee.stilling,
      intern_sats: employee.intern_sats,
      faktura_sats: employee.faktura_sats,
      pa_service_sats: employee.pa_service_sats || 0,
      pa_montering_sats: employee.pa_montering_sats || 0,
      pa_timesats: employee.pa_timesats || 0,
      pa_kjoresats: employee.pa_kjoresats || 0,
      pa_km_sats: employee.pa_km_sats || 0
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete employee:', error);
        alert('Could not delete employee');
      }
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      initialer: '',
      navn: '',
      epost: '',
      telefon: '',
      stilling: '',
      intern_sats: 0,
      faktura_sats: 0,
      pa_service_sats: 0,
      pa_montering_sats: 0,
      pa_timesats: 0,
      pa_kjoresats: 0,
      pa_km_sats: 0
    });
  };

  // Service functions
  const handleSubmitService = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...serviceFormData,
        pris: parseFloat(serviceFormData.pris),
        t1_ekstraservice: parseFloat(serviceFormData.t1_ekstraservice),
        t2_ekstraservice_50: parseFloat(serviceFormData.t2_ekstraservice_50),
        t3_ekstraservice_100: parseFloat(serviceFormData.t3_ekstraservice_100),
        t4_ekstraarbeid: parseFloat(serviceFormData.t4_ekstraarbeid),
        t5_kjoretid: parseFloat(serviceFormData.t5_kjoretid),
        t6_km_godtgjorelse: parseFloat(serviceFormData.t6_km_godtgjorelse)
      };
      if (editingService) {
        await updateService(editingService.id, submitData);
      } else {
        await createService(submitData);
      }
      setShowServiceModal(false);
      setEditingService(null);
      resetServiceForm();
      loadData();
    } catch (error) {
      console.error('Failed to save service:', error);
      alert('Could not save service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
      tjenestenr: service.tjenestenr,
      tjeneste_navn: service.tjeneste_navn,
      beskrivelse: service.beskrivelse || '',
      leverandor: service.leverandor || '',
      produsent_id: service.produsent_id || '',
      pris: service.pris,
      t1_ekstraservice: service.t1_ekstraservice,
      t2_ekstraservice_50: service.t2_ekstraservice_50,
      t3_ekstraservice_100: service.t3_ekstraservice_100,
      t4_ekstraarbeid: service.t4_ekstraarbeid,
      t5_kjoretid: service.t5_kjoretid,
      t6_km_godtgjorelse: service.t6_km_godtgjorelse
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete service:', error);
        alert('Could not delete service');
      }
    }
  };

  const handleServiceImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/economy/services/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.detail || 'Import feilet';
        throw new Error(errorMsg);
      }

      const result = await response.json();
      alert(`Import completed! ${result.imported_count} services imported.`);
      loadData();
    } catch (error) {
      console.error('Service import failed:', error);
      alert(`Could not import services.\nError: ${error.message}\n\nExpected columns in Excel:\n- tjenestenr\n- tjeneste navn\n- Leverand\u00f8r pris`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const resetServiceForm = () => {
    setServiceFormData({
      tjenestenr: '',
      tjeneste_navn: '',
      beskrivelse: '',
      leverandor: '',
      produsent_id: '',
      pris: 0,
      t1_ekstraservice: 0,
      t2_ekstraservice_50: 0,
      t3_ekstraservice_100: 0,
      t4_ekstraarbeid: 0,
      t5_kjoretid: 0,
      t6_km_godtgjorelse: 0
    });
  };

  // Supplier Pricing functions
  const handleSubmitPricing = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        name: pricingFormData.name,
        arbeidstid_rate: parseFloat(pricingFormData.arbeidstid_rate),
        kjoretid_rate: parseFloat(pricingFormData.kjoretid_rate),
        km_rate: parseFloat(pricingFormData.km_rate)
      };
      if (editingPricing) {
        await updateSupplierPricing(editingPricing.id, submitData);
      } else {
        await createSupplierPricing(submitData);
      }
      setShowPricingModal(false);
      setEditingPricing(null);
      resetPricingForm();
      loadData();
    } catch (error) {
      console.error('Failed to save pricing:', error);
      alert('Could not save pricing');
    }
  };

  const handleEditPricing = (pricing) => {
    setEditingPricing(pricing);
    setPricingFormData({
      name: pricing.name || '',
      arbeidstid_rate: pricing.arbeidstid_rate || 0,
      kjoretid_rate: pricing.kjoretid_rate || 0,
      km_rate: pricing.km_rate || 0
    });
    setShowPricingModal(true);
  };

  const handleDeletePricing = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplierPricing(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete pricing:', error);
        alert('Could not delete supplier');
      }
    }
  };

  const resetPricingForm = () => {
    setPricingFormData({
      name: '',
      arbeidstid_rate: 0,
      kjoretid_rate: 0,
      km_rate: 0
    });
  };

  const tabs = [
    { id: 'employees', label: 'Roles' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Supplier' }
  ];

  if (loading) {
    return <div className="text-gray-800">Loading...</div>;
  }

  return (
    <div data-testid="economy-page">
      <h1 className="text-3xl font-bold mb-6">Economy</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`economy-tab-${tab.id}`}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-800 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'employees' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Employees and Roles</h2>
            <button
              onClick={() => { resetEmployeeForm(); setShowEmployeeModal(true); }}
              data-testid="add-employee-button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus size={20} />
              New Employee
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Initials</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Name</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Position</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Internal Rate</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Invoice Rate</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {employees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-100">
                      <td className="px-4 py-2 text-sm font-medium">{employee.initialer}</td>
                      <td className="px-4 py-2 text-sm">{employee.navn}</td>
                      <td className="px-4 py-2 text-sm">{employee.stilling}</td>
                      <td className="px-4 py-2 text-sm">{employee.intern_sats.toFixed(0)} kr/t</td>
                      <td className="px-4 py-2 text-sm">{employee.faktura_sats.toFixed(0)} kr/t</td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            data-testid={`edit-employee-${employee.id}`}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            data-testid={`delete-employee-${employee.id}`}
                            className="p-1 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Services</h2>
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleServiceImport}
                accept=".xlsx,.xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                data-testid="import-services-button"
                className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors disabled:opacity-50"
              >
                <Upload size={20} />
                {importing ? 'Importing...' : 'Import Excel'}
              </button>
              <button
                onClick={() => { resetServiceForm(); setShowServiceModal(true); }}
                data-testid="add-service-button"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                <Plus size={20} />
                New service
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {services.map(service => (
              <div key={service.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{service.tjeneste_navn}</h3>
                    <p className="text-sm text-gray-800">Service no: {service.tjenestenr}</p>
                    {service.beskrivelse && <p className="text-sm text-gray-800 mt-1">{service.beskrivelse}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditService(service)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <div className="bg-gray-100 rounded p-2">
                    <p className="text-xs text-gray-800">Fixed price</p>
                    <p className="font-semibold text-green-400">{service.pris} kr</p>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <p className="text-xs text-gray-800">Extra service</p>
                    <p className="font-semibold">{service.t1_ekstraservice} kr/h</p>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <p className="text-xs text-gray-800">Driving time</p>
                    <p className="font-semibold">{service.t5_kjoretid} kr/h</p>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <p className="text-xs text-gray-800">Km compensation</p>
                    <p className="font-semibold">{service.t6_km_godtgjorelse} kr/km</p>
                  </div>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-800">
                No services registered
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Supplier rates</h2>
              <p className="text-sm text-gray-800 mt-1">Rates for invoicing (work time, driving time, km)</p>
            </div>
            <button
              onClick={() => { resetPricingForm(); setShowPricingModal(true); }}
              data-testid="add-producer-button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus size={20} />
              New supplier
            </button>
          </div>
          <div className="space-y-4">
            {supplierPricing.map(pricing => (
              <div key={pricing.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{pricing.name || 'Standard supplier'}</h3>
                    <p className="text-sm text-gray-800">Revenue (billable)</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPricing(pricing)}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePricing(pricing.id)}
                      className="flex items-center gap-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-100 rounded p-4">
                    <p className="text-sm text-gray-800">Work hourly rate</p>
                    <p className="text-2xl font-semibold">{pricing.arbeidstid_rate?.toFixed(0) || 0} kr/h</p>
                  </div>
                  <div className="bg-gray-100 rounded p-4">
                    <p className="text-sm text-gray-800">Driving rate</p>
                    <p className="text-2xl font-semibold">{pricing.kjoretid_rate?.toFixed(0) || 0} kr/h</p>
                  </div>
                  <div className="bg-gray-100 rounded p-4">
                    <p className="text-sm text-gray-800">KM rate</p>
                    <p className="text-2xl font-semibold">{pricing.km_rate?.toFixed(2) || 0} kr/km</p>
                  </div>
                </div>
              </div>
            ))}
            {supplierPricing.length === 0 && (
              <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-800">
                <p className="mb-4">No supplier rates registered</p>
                <p className="text-sm">Click &quot;New supplier&quot; to create</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingEmployee ? 'Edit employee' : 'New employee'}
              </h2>
              <button onClick={() => setShowEmployeeModal(false)} className="text-gray-800 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Initials *</label>
                  <input
                    type="text"
                    value={employeeFormData.initialer}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, initialer: e.target.value })}
                    data-testid="employee-initialer-input"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Position *</label>
                  <input
                    type="text"
                    value={employeeFormData.stilling}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, stilling: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Name *</label>
                  <input
                    type="text"
                    value={employeeFormData.navn}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, navn: e.target.value })}
                    data-testid="employee-navn-input"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    value={employeeFormData.epost}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, epost: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                  <input
                    type="text"
                    value={employeeFormData.telefon}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, telefon: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Rates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Internal rate (kr/h) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.intern_sats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, intern_sats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Invoice rate (kr/h) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.faktura_sats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, faktura_sats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">PA (Provisjon/Andel) Satser</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">PA Service sats</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.pa_service_sats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, pa_service_sats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">PA Montering sats</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.pa_montering_sats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, pa_montering_sats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">PA Timesats</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.pa_timesats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, pa_timesats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">PA Kjøresats</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.pa_kjoresats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, pa_kjoresats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">PA Km sats</label>
                    <input
                      type="number"
                      step="0.01"
                      value={employeeFormData.pa_km_sats}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, pa_km_sats: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-employee-button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingEmployee ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingService ? 'Edit service' : 'New service'}
              </h2>
              <button onClick={() => setShowServiceModal(false)} className="text-gray-800 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitService} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Service no *</label>
                  <input
                    type="text"
                    value={serviceFormData.tjenestenr}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, tjenestenr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Supplier</label>
                  <select
                    value={serviceFormData.produsent_id}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, produsent_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select supplier</option>
                    {supplierPricing.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-800 mt-1">Links to supplier rates for calculations</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Vendor</label>
                  <input
                    type="text"
                    value={serviceFormData.leverandor}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, leverandor: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Service name *</label>
                  <input
                    type="text"
                    value={serviceFormData.tjeneste_navn}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, tjeneste_navn: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description</label>
                  <textarea
                    value={serviceFormData.beskrivelse}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, beskrivelse: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    rows="2"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Prices</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">Fixed price (kr) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.pris}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, pris: e.target.value })}
                      placeholder="Example: 1490"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-800 mt-1">This is the rate charged to the customer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">T1 Ekstraservice (kr/t)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.t1_ekstraservice}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, t1_ekstraservice: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">T2 Ekstraservice 50% (kr/t)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.t2_ekstraservice_50}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, t2_ekstraservice_50: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">T3 Ekstraservice 100% (kr/t)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.t3_ekstraservice_100}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, t3_ekstraservice_100: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">T4 Ekstraarbeid (kr/t)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.t4_ekstraarbeid}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, t4_ekstraarbeid: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">T5 Driving time (kr/h)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.t5_kjoretid}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, t5_kjoretid: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">T6 Km compensation (kr/km)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={serviceFormData.t6_km_godtgjorelse}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, t6_km_godtgjorelse: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingService ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingPricing ? 'Edit supplier' : 'New supplier'}</h2>
              <button onClick={() => { setShowPricingModal(false); setEditingPricing(null); }} className="text-gray-800 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitPricing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Supplier name *</label>
                <input
                  type="text"
                  value={pricingFormData.name}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, name: e.target.value })}
                  placeholder="E.g: Standard, Premium, Biovac"
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Work hourly rate (kr/h) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingFormData.arbeidstid_rate}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, arbeidstid_rate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Driving rate (kr/h) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingFormData.kjoretid_rate}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, kjoretid_rate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">KM rate (kr/km) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={pricingFormData.km_rate}
                  onChange={(e) => setPricingFormData({ ...pricingFormData, km_rate: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowPricingModal(false); setEditingPricing(null); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Economy;




