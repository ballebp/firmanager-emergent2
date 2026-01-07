import React, { useState, useEffect, useRef } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/api';
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronUp, X, Upload, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { canAddMore } from '../services/licenseService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const { license, setShowLicenseModal } = useLicense();
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  
  const [formData, setFormData] = useState({
    anleggsnr: '',
    kundennr: '',
    kundnavn: '',
    typenr: '',
    typenavn: '',
    kommune: '',
    adresse: '',
    postnr: '',
    poststed: '',
    service_intervall: '',
    uke: '',
    serviceansvarlig: '',
    telefon1: '',
    telefon2: '',
    epost: '',
    startdato: '',
    styreenhet: '',
    kommentar: '',
    kundeinfo: '',
    tjeneste_nr: ''
  });

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      const response = await getCustomers(search);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check license limit for new customers
    if (!editingCustomer) {
      if (!canAddMore(license, 'customers', customers.length)) {
        setShowLimitWarning(true);
        return;
      }
    }
    
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Could not save customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      anleggsnr: customer.anleggsnr || '',
      kundennr: customer.kundennr || '',
      kundnavn: customer.kundnavn || '',
      typenr: customer.typenr || '',
      typenavn: customer.typenavn || '',
      kommune: customer.kommune || '',
      adresse: customer.adresse || '',
      postnr: customer.postnr || '',
      poststed: customer.poststed || '',
      service_intervall: customer.service_intervall || '',
      uke: customer.uke || '',
      serviceansvarlig: customer.serviceansvarlig || '',
      telefon1: customer.telefon1 || '',
      telefon2: customer.telefon2 || '',
      epost: customer.epost || '',
      startdato: customer.startdato || '',
      styreenhet: customer.styreenhet || '',
      kommentar: customer.kommentar || '',
      kundeinfo: customer.kundeinfo || '',
      tjeneste_nr: customer.tjeneste_nr || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Could not delete customer');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedCustomers.size} selected customers?`)) {
      try {
        const deletePromises = Array.from(selectedCustomers).map(id => deleteCustomer(id));
        await Promise.all(deletePromises);
        setSelectedCustomers(new Set());
        loadCustomers();
      } catch (error) {
        console.error('Failed to delete customers:', error);
        alert('Could not delete all customers');
      }
    }
  };

  const toggleSelectCustomer = (id) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const resetForm = () => {
    setFormData({
      anleggsnr: '',
      kundennr: '',
      kundnavn: '',
      typenr: '',
      typenavn: '',
      kommune: '',
      adresse: '',
      postnr: '',
      poststed: '',
      service_intervall: '',
      uke: '',
      serviceansvarlig: '',
      telefon1: '',
      telefon2: '',
      epost: '',
      startdato: '',
      styreenhet: '',
      kommentar: '',
      kundeinfo: '',
      tjeneste_nr: ''
    });
  };

  const openNewCustomerModal = () => {
    resetForm();
    setEditingCustomer(null);
    setShowModal(true);
  };

  const toggleExpand = (customerId) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  // Import Excel file
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
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
      const response = await fetch(`${API_URL}/api/customers/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const result = await response.json();
      alert(`Import completed! ${result.imported_count} customers imported.`);
      loadCustomers();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Could not import customers. Check that the file has the correct format.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Detail field component
  const DetailField = ({ label, value }) => (
    <div className="py-1">
      <span className="text-xs text-gray-700 uppercase">{label}</span>
      <p className="text-sm text-gray-900">{value || '-'}</p>
    </div>
  );

  return (
    <div data-testid="customers-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-sm text-gray-800 mt-1">{customers.length} customers total</p>
        </div>
        <div className="flex gap-3">
          {selectedCustomers.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              data-testid="delete-selected-button"
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors"
            >
              <Trash2 size={20} />
              Delete selected ({selectedCustomers.size})
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={importing}
            data-testid="import-customers-button"
            className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded transition-colors disabled:opacity-50"
          >
            <Upload size={20} />
            {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <button
            onClick={openNewCustomerModal}
            data-testid="add-customer-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={20} />
            New Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800" size={20} />
          <input
            type="text"
            placeholder="Search for customer (name, facility number, postal code, city...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-customers-input"
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Select all checkbox */}
      {customers.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-800 hover:text-gray-900"
          >
            {selectedCustomers.size === customers.length ? (
              <CheckSquare size={18} className="text-blue-500" />
            ) : (
              <Square size={18} />
            )}
            Select all
          </button>
          {selectedCustomers.size > 0 && (
            <span className="text-sm text-gray-700">({selectedCustomers.size} selected)</span>
          )}
        </div>
      )}

      {/* Customer List */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-800">
            Loading...
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-800">
            No customers found
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className={`bg-white border rounded overflow-hidden ${selectedCustomers.has(customer.id) ? 'border-blue-500' : 'border-gray-200'}`}>
              {/* Main row - always visible */}
              <div className="flex items-center p-4">
                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelectCustomer(customer.id); }}
                  className="mr-3"
                >
                  {selectedCustomers.has(customer.id) ? (
                    <CheckSquare size={20} className="text-blue-500" />
                  ) : (
                    <Square size={20} className="text-gray-700" />
                  )}
                </button>
                
                <div 
                  className="flex items-center justify-between flex-1 cursor-pointer hover:bg-gray-100/50 -m-2 p-2 rounded"
                  onClick={() => toggleExpand(customer.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 text-center">
                      <span className="text-xs text-gray-700">An.nr</span>
                      <p className="font-mono text-blue-700">{customer.anleggsnr}</p>
                    </div>
                    <div className="w-16 text-center">
                      <span className="text-xs text-gray-700">Knr</span>
                      <p className="font-mono text-gray-800">{customer.kundennr}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.kundnavn}</p>
                      <p className="text-sm text-gray-800">{customer.adresse}, {customer.postnr} {customer.poststed}</p>
                    </div>
                    <div className="w-40 hidden md:block">
                      <span className="text-xs text-gray-700">Type</span>
                      <p className="text-sm truncate">{customer.typenavn || '-'}</p>
                    </div>
                    <div className="w-28 hidden lg:block">
                      <span className="text-xs text-gray-700">Tlf</span>
                      <p className="text-sm">{customer.telefon1 || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}
                      data-testid={`edit-customer-${customer.id}`}
                      className="p-2 hover:bg-gray-700 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }}
                      data-testid={`delete-customer-${customer.id}`}
                      className="p-2 hover:bg-red-900/30 text-red-400 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    {expandedCustomer === customer.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>
              
              {/* Expanded details */}
              {expandedCustomer === customer.id && (
                <div className="border-t border-gray-200 bg-gray-100/30 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <DetailField label="An.nr." value={customer.anleggsnr} />
                    <DetailField label="Knr" value={customer.kundennr} />
                    <DetailField label="Kunde" value={customer.kundnavn} />
                    <DetailField label="Type nr." value={customer.typenr} />
                    <DetailField label="Type navn" value={customer.typenavn} />
                    <DetailField label="Kommune" value={customer.kommune} />
                    <DetailField label="Adresse" value={customer.adresse} />
                    <DetailField label="Postnr" value={customer.postnr} />
                    <DetailField label="Sted" value={customer.poststed} />
                    <DetailField label="Service intervall" value={customer.service_intervall} />
                    <DetailField label="Uke" value={customer.uke} />
                    <DetailField label="Serviceansvarlig" value={customer.serviceansvarlig} />
                    <DetailField label="Tlf 1" value={customer.telefon1} />
                    <DetailField label="Tlf 2" value={customer.telefon2} />
                    <DetailField label="Epost" value={customer.epost} />
                    <DetailField label="Startdato" value={customer.startdato} />
                    <DetailField label="Styreenhet" value={customer.styreenhet} />
                    <DetailField label="Tjeneste nr." value={customer.tjeneste_nr} />
                  </div>
                  
                  {/* Kundeinfo box */}
                  {customer.kundeinfo && (
                    <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded">
                      <span className="text-xs text-yellow-700 uppercase font-semibold">Kundeinfo</span>
                      <p className="text-sm text-yellow-900 mt-1">{customer.kundeinfo}</p>
                    </div>
                  )}
                  
                  {/* Kommentar box */}
                  {customer.kommentar && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded">
                      <span className="text-xs text-red-500 uppercase font-semibold">Kommentar / Adgangsinformasjon</span>
                      <p className="text-sm text-red-900 mt-1">{customer.kommentar}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingCustomer(null); }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">An.nr. *</label>
                  <input
                    type="text"
                    value={formData.anleggsnr}
                    onChange={(e) => setFormData({ ...formData, anleggsnr: e.target.value })}
                    data-testid="customer-anleggsnr-input"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Knr *</label>
                  <input
                    type="text"
                    value={formData.kundennr}
                    onChange={(e) => setFormData({ ...formData, kundennr: e.target.value })}
                    data-testid="customer-kundennr-input"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Customer *</label>
                  <input
                    type="text"
                    value={formData.kundnavn}
                    onChange={(e) => setFormData({ ...formData, kundnavn: e.target.value })}
                    data-testid="customer-kundnavn-input"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Type no.</label>
                  <input
                    type="text"
                    value={formData.typenr}
                    onChange={(e) => setFormData({ ...formData, typenr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Type name</label>
                  <input
                    type="text"
                    value={formData.typenavn}
                    onChange={(e) => setFormData({ ...formData, typenavn: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Municipality *</label>
                  <input
                    type="text"
                    value={formData.kommune}
                    onChange={(e) => setFormData({ ...formData, kommune: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Address *</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Postal code *</label>
                  <input
                    type="text"
                    value={formData.postnr}
                    onChange={(e) => setFormData({ ...formData, postnr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.poststed}
                    onChange={(e) => setFormData({ ...formData, poststed: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Service interval</label>
                  <input
                    type="text"
                    value={formData.service_intervall}
                    onChange={(e) => setFormData({ ...formData, service_intervall: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Week</label>
                  <input
                    type="text"
                    value={formData.uke}
                    onChange={(e) => setFormData({ ...formData, uke: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Service responsible</label>
                  <input
                    type="text"
                    value={formData.serviceansvarlig}
                    onChange={(e) => setFormData({ ...formData, serviceansvarlig: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone 1</label>
                  <input
                    type="text"
                    value={formData.telefon1}
                    onChange={(e) => setFormData({ ...formData, telefon1: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Phone 2</label>
                  <input
                    type="text"
                    value={formData.telefon2}
                    onChange={(e) => setFormData({ ...formData, telefon2: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Epost</label>
                  <input
                    type="email"
                    value={formData.epost}
                    onChange={(e) => setFormData({ ...formData, epost: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Start date</label>
                  <input
                    type="text"
                    value={formData.startdato}
                    onChange={(e) => setFormData({ ...formData, startdato: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Control unit</label>
                  <input
                    type="text"
                    value={formData.styreenhet}
                    onChange={(e) => setFormData({ ...formData, styreenhet: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Service no.</label>
                  <input
                    type="text"
                    value={formData.tjeneste_nr}
                    onChange={(e) => setFormData({ ...formData, tjeneste_nr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Customer info</label>
                  <textarea
                    value={formData.kundeinfo}
                    onChange={(e) => setFormData({ ...formData, kundeinfo: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Comment / Access information</label>
                  <textarea
                    value={formData.kommentar}
                    onChange={(e) => setFormData({ ...formData, kommentar: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                  }}
                  data-testid="cancel-customer-button"
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-customer-button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* License Limit Warning Modal */}
      {showLimitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-yellow-600" size={32} />
              <h3 className="text-xl font-semibold text-gray-900">Customer Limit Reached</h3>
            </div>
            <p className="text-gray-700 mb-4">
              You've reached your plan's limit of {license?.features?.max_customers || 0} customers.
            </p>
            <p className="text-gray-700 mb-6">
              Upgrade to Professional for unlimited customers, routes, and products.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLimitWarning(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLimitWarning(false);
                  setShowLicenseModal(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;





