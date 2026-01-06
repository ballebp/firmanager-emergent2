import React, { useState, useEffect } from 'react';
import { getInternalOrders, createInternalOrder, updateInternalOrder, deleteInternalOrder, getEmployees } from '../services/api';
import { Plus, Edit, Trash2, CheckSquare, Square, X } from 'lucide-react';

const Internal = () => {
  const [orders, setOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [formData, setFormData] = useState({
    avdeling: '',
    date: new Date().toISOString().split('T')[0],
    employee_id: '',
    beskrivelse: '',
    arbeidstid: 0,
    task_type: 'kontor',
    kommentar: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, employeesRes] = await Promise.all([
        getInternalOrders(),
        getEmployees()
      ]);
      setOrders(ordersRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        arbeidstid: parseFloat(formData.arbeidstid)
      };
      if (editingOrder) {
        await updateInternalOrder(editingOrder.id, submitData);
      } else {
        await createInternalOrder(submitData);
      }
      setShowModal(false);
      setEditingOrder(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save internal order:', error);
      alert('Kunne ikke lagre intern ordre');
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setFormData({
      avdeling: order.avdeling || '',
      date: new Date(order.date).toISOString().split('T')[0],
      employee_id: order.employee_id || '',
      beskrivelse: order.beskrivelse || '',
      arbeidstid: order.arbeidstid || 0,
      task_type: order.task_type || 'kontor',
      kommentar: order.kommentar || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Er du sikker på at du vil slette denne ordren?')) {
      try {
        await deleteInternalOrder(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete internal order:', error);
        alert('Kunne ikke slette ordre');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOrders.size === 0) return;
    
    if (window.confirm(`Er du sikker på at du vil slette ${selectedOrders.size} valgte ordre?`)) {
      try {
        const deletePromises = Array.from(selectedOrders).map(id => deleteInternalOrder(id));
        await Promise.all(deletePromises);
        setSelectedOrders(new Set());
        loadData();
      } catch (error) {
        console.error('Failed to delete orders:', error);
        alert('Kunne ikke slette alle ordre');
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
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const resetForm = () => {
    setFormData({
      avdeling: '',
      date: new Date().toISOString().split('T')[0],
      employee_id: '',
      beskrivelse: '',
      arbeidstid: 0,
      task_type: 'kontor',
      kommentar: ''
    });
  };

  const openNewModal = () => {
    resetForm();
    setEditingOrder(null);
    setShowModal(true);
  };

  const getEmployeeName = (id) => {
    const employee = employees.find(e => e.id === id);
    return employee?.navn || '-';
  };

  return (
    <div data-testid="internal-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Intern</h1>
          <p className="text-sm text-gray-400 mt-1">{orders.length} interne ordre</p>
        </div>
        <div className="flex gap-3">
          {selectedOrders.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              data-testid="delete-selected-internal-button"
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors"
            >
              <Trash2 size={20} />
              Slett valgte ({selectedOrders.size})
            </button>
          )}
          <button
            onClick={openNewModal}
            data-testid="add-internal-order-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={20} />
            Registrer nytt
          </button>
        </div>
      </div>

      {/* Select all */}
      {orders.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            {selectedOrders.size === orders.length ? (
              <CheckSquare size={18} className="text-blue-500" />
            ) : (
              <Square size={18} />
            )}
            Velg alle
          </button>
          {selectedOrders.size > 0 && (
            <span className="text-sm text-gray-500">({selectedOrders.size} valgt)</span>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left w-10"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Dato</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Avdeling</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Ansatt</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Beskrivelse</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Timer</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-400">Laster...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-400">Ingen interne ordre funnet</td>
                </tr>
              ) : (
                orders.map((order) => (
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
                    <td className="px-4 py-3 text-sm">{order.avdeling}</td>
                    <td className="px-4 py-3 text-sm">{getEmployeeName(order.employee_id)}</td>
                    <td className="px-4 py-3 text-sm capitalize">{order.task_type}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{order.beskrivelse}</td>
                    <td className="px-4 py-3 text-sm">{order.arbeidstid}h</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          data-testid={`edit-internal-${order.id}`}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          data-testid={`delete-internal-${order.id}`}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingOrder ? 'Rediger intern ordre' : 'Registrer intern ordre'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingOrder(null); }}
                className="p-2 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Avdeling *</label>
                  <input
                    type="text"
                    value={formData.avdeling}
                    onChange={(e) => setFormData({ ...formData, avdeling: e.target.value })}
                    data-testid="internal-avdeling-input"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dato *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Ansatt *</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Velg ansatt</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.navn}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                  <select
                    value={formData.task_type}
                    onChange={(e) => setFormData({ ...formData, task_type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="kontor">Kontor</option>
                    <option value="ekstra">Ekstra</option>
                    <option value="montering">Montering</option>
                    <option value="soknad">Søknad</option>
                    <option value="vedlikehold">Vedlikehold</option>
                    <option value="diverse">Diverse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Arbeidstid (timer) *</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.arbeidstid}
                    onChange={(e) => setFormData({ ...formData, arbeidstid: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Beskrivelse *</label>
                  <textarea
                    value={formData.beskrivelse}
                    onChange={(e) => setFormData({ ...formData, beskrivelse: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kommentar</label>
                  <textarea
                    value={formData.kommentar}
                    onChange={(e) => setFormData({ ...formData, kommentar: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingOrder(null); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  data-testid="save-internal-order-button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingOrder ? 'Oppdater' : 'Opprett'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Internal;
