import React, { useState, useEffect } from 'react';
import { getWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder, getCustomers, getEmployees, getServicePricingForCustomer } from '../services/api';
import { Plus, Edit, Trash2, Filter, Info, CheckSquare, Square } from 'lucide-react';

const Invoicing = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filterOrderType, setFilterOrderType] = useState('');
  const [servicePricing, setServicePricing] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [formData, setFormData] = useState({
    anleggsnr: '',
    customer_id: '',
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    order_type: 'service',
    description: '',
    arbeidstid: 0,
    kjoretid: 0,
    kjorte_km: 0
  });

  useEffect(() => {
    loadData();
  }, [filterOrderType]);

  const loadData = async () => {
    try {
      const params = {};
      if (filterOrderType) params.order_type = filterOrderType;

      const [ordersRes, customersRes, employeesRes] = await Promise.all([
        getWorkOrders(params),
        getCustomers(),
        getEmployees()
      ]);
      setWorkOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnleggsnrChange = async (anleggsnr) => {
    setFormData(prev => ({ ...prev, anleggsnr }));
    setServicePricing(null);
    
    // Auto-identify customer by anleggsnr
    const customer = customers.find(c => c.anleggsnr === anleggsnr);
    if (customer) {
      setFormData(prev => ({ ...prev, customer_id: customer.id }));
      
      // Fetch service pricing for this customer
      try {
        const response = await getServicePricingForCustomer(anleggsnr);
        if (response.data.service) {
          setServicePricing(response.data.service);
        }
      } catch (error) {
        console.error('Failed to fetch service pricing:', error);
      }
    } else {
      setFormData(prev => ({ ...prev, customer_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      alert('Cannot find customer with this facility number');
      return;
    }

    try {
      const submitData = {
        customer_id: formData.customer_id,
        employee_id: formData.employee_id,
        date: new Date(formData.date).toISOString(),
        order_type: formData.order_type,
        status: 'fullført',
        description: formData.description,
        arbeidstid: parseFloat(formData.arbeidstid),
        kjoretid: parseFloat(formData.kjoretid),
        kjorte_km: parseFloat(formData.kjorte_km)
      };
      
      if (editingOrder) {
        await updateWorkOrder(editingOrder.id, submitData);
        setShowModal(false);
        setEditingOrder(null);
      } else {
        await createWorkOrder(submitData);
        // Keep modal open and reset form for next entry
        setFormData({
          anleggsnr: '',
          customer_id: '',
          employee_id: formData.employee_id,  // Keep same employee
          date: formData.date,  // Keep same date
          order_type: formData.order_type,  // Keep same type
          description: '',
          arbeidstid: 0,
          kjoretid: 0,
          kjorte_km: 0
        });
      }
      
      loadData();
    } catch (error) {
      console.error('Failed to save work order:', error);
      alert('Could not save work order');
    }
  };

  const handleEdit = (order) => {
    const customer = customers.find(c => c.id === order.customer_id);
    setEditingOrder(order);
    setFormData({
      anleggsnr: customer?.anleggsnr || '',
      customer_id: order.customer_id,
      employee_id: order.employee_id,
      date: new Date(order.date).toISOString().split('T')[0],
      order_type: order.order_type,
      description: order.description || '',
      arbeidstid: order.arbeidstid,
      kjoretid: order.kjoretid,
      kjorte_km: order.kjorte_km
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      try {
        await deleteWorkOrder(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete work order:', error);
        alert('Could not delete work order');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.size} selected work orders?`)) {
      try {
        const deletePromises = Array.from(selectedOrders).map(id => deleteWorkOrder(id));
        await Promise.all(deletePromises);
        setSelectedOrders(new Set());
        loadData();
      } catch (error) {
        console.error('Failed to delete work orders:', error);
        alert('Could not delete all work orders');
      }
    }
  };

  const toggleSelectOrder = (id) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === workOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(workOrders.map(o => o.id)));
    }
  };

  const resetForm = () => {
    setFormData({
      anleggsnr: '',
      customer_id: '',
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      order_type: 'service',
      description: '',
      arbeidstid: 0,
      kjoretid: 0,
      kjorte_km: 0
    });
  };

  const openNewOrderModal = () => {
    resetForm();
    setEditingOrder(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOrder(null);
    resetForm();
  };

  const getCustomerName = (id) => {
    const customer = customers.find(c => c.id === id);
    return customer?.kundnavn || '-';
  };

  const getEmployeeName = (id) => {
    const employee = employees.find(e => e.id === id);
    return employee?.navn || '-';
  };

  const getCurrentCustomer = () => {
    return customers.find(c => c.id === formData.customer_id);
  };

  return (
    <div data-testid="invoicing-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoice Basis</h1>
          <p className="text-sm text-gray-400 mt-1">{workOrders.length} work orders</p>
        </div>
        <div className="flex gap-3">
          {selectedOrders.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              data-testid="delete-selected-orders-button"
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors"
            >
              <Trash2 size={20} />
              Delete selected ({selectedOrders.size})
            </button>
          )}
          <button
            onClick={openNewOrderModal}
            data-testid="add-workorder-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={20} />
            Registrer nytt
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterOrderType}
            onChange={(e) => setFilterOrderType(e.target.value)}
            data-testid="filter-ordertype"
            className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All types</option>
            <option value="service">Service</option>
            <option value="ekstra">Extra</option>
            <option value="montering">Installation</option>
          </select>
        </div>
        {workOrders.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            {selectedOrders.size === workOrders.length ? (
              <CheckSquare size={18} className="text-blue-500" />
            ) : (
              <Square size={18} />
            )}
            Select all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left w-10"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Work hours</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Drive time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Km</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : workOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-400">No work orders found</td>
                </tr>
              ) : (
                workOrders.map((order) => (
                  <tr key={order.id} className={`hover:bg-gray-800 ${selectedOrders.has(order.id) ? 'bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelectOrder(order.id)}>
                        {selectedOrders.has(order.id) ? (
                          <CheckSquare size={18} className="text-blue-500" />
                        ) : (
                          <Square size={18} className="text-gray-500" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(order.date).toLocaleDateString('no-NO')}</td>
                    <td className="px-4 py-3 text-sm">{getCustomerName(order.customer_id)}</td>
                    <td className="px-4 py-3 text-sm">{getEmployeeName(order.employee_id)}</td>
                    <td className="px-4 py-3 text-sm capitalize">{order.order_type}</td>
                    <td className="px-4 py-3 text-sm">{order.arbeidstid}h</td>
                    <td className="px-4 py-3 text-sm">{order.kjoretid}h</td>
                    <td className="px-4 py-3 text-sm">{order.kjorte_km} km</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          data-testid={`edit-workorder-${order.id}`}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          data-testid={`delete-workorder-${order.id}`}
                          className="p-1 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingOrder ? 'Edit work order' : 'Register work order'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Facility no *</label>
                  <input
                    type="text"
                    value={formData.anleggsnr}
                    onChange={(e) => handleAnleggsnrChange(e.target.value)}
                    data-testid="workorder-anleggsnr-input"
                    placeholder="Enter facility number"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                  {formData.anleggsnr && getCurrentCustomer() && (
                    <div className="mt-2">
                      <p className="text-sm text-green-400">
                        ✓ {getCurrentCustomer().kundnavn}
                      </p>
                      {servicePricing && (
                        <div className="mt-2 p-3 bg-blue-900/20 border border-blue-800 rounded">
                          <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                            <Info size={16} />
                            <span className="font-medium">Service: {servicePricing.tjeneste_navn}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                            <div>Fixed price: <span className="text-green-400 font-semibold">{servicePricing.pris} kr</span></div>
                            <div>Extra service: {servicePricing.t1_ekstraservice} kr/h</div>
                            <div>Driving time: {servicePricing.t5_kjoretid} kr/h</div>
                            <div>Km compensation: {servicePricing.t6_km_godtgjorelse} kr/km</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {formData.anleggsnr && !getCurrentCustomer() && (
                    <p className="text-sm text-red-400 mt-1">
                      ✗ Cannot find customer
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Employee *</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    data-testid="workorder-employee-select"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Select employee</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.navn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    data-testid="workorder-date-input"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                  <select
                    value={formData.order_type}
                    onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="service">Service</option>
                    <option value="ekstra">Extra</option>
                    <option value="montering">Installation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Work hours (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.arbeidstid}
                    onChange={(e) => setFormData({ ...formData, arbeidstid: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Driving time (hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.kjoretid}
                    onChange={(e) => setFormData({ ...formData, kjoretid: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Driven km</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.kjorte_km}
                    onChange={(e) => setFormData({ ...formData, kjorte_km: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                {editingOrder && (
                  <button
                    type="button"
                    onClick={closeModal}
                    data-testid="cancel-workorder-button"
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {!editingOrder && (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                  >
                    Close
                  </button>
                )}
                <button
                  type="submit"
                  data-testid="save-workorder-button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingOrder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoicing;