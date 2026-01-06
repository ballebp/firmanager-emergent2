import React, { useState, useEffect, useRef } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/api';
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronUp, X, Upload, CheckSquare, Square } from 'lucide-react';

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
      alert('Kunne ikke lagre kunde');
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
    if (window.confirm('Er du sikker på at du vil slette denne kunden?')) {
      try {
        await deleteCustomer(id);
        loadCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
        alert('Kunne ikke slette kunde');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCustomers.size === 0) return;
    
    if (window.confirm(`Er du sikker på at du vil slette ${selectedCustomers.size} valgte kunder?`)) {
      try {
        const deletePromises = Array.from(selectedCustomers).map(id => deleteCustomer(id));
        await Promise.all(deletePromises);
        setSelectedCustomers(new Set());
        loadCustomers();
      } catch (error) {
        console.error('Failed to delete customers:', error);
        alert('Kunne ikke slette alle kunder');
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
      alert('Vennligst velg en Excel-fil (.xlsx eller .xls)');
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
        throw new Error('Import feilet');
      }

      const result = await response.json();
      alert(`Import fullført! ${result.imported_count} kunder importert.`);
      loadCustomers();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Kunne ikke importere kunder. Sjekk at filen har riktig format.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Detail field component
  const DetailField = ({ label, value }) => (
    <div className="py-1">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <p className="text-sm text-gray-200">{value || '-'}</p>
    </div>
  );

  return (
    <div data-testid="customers-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kunder</h1>
          <p className="text-sm text-gray-400 mt-1">{customers.length} kunder totalt</p>
        </div>
        <div className="flex gap-3">
          {selectedCustomers.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              data-testid="delete-selected-button"
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 rounded transition-colors"
            >
              <Trash2 size={20} />
              Slett valgte ({selectedCustomers.size})
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
            {importing ? 'Importerer...' : 'Importer Excel'}
          </button>
          <button
            onClick={openNewCustomerModal}
            data-testid="add-customer-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Plus size={20} />
            Ny kunde
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Søk etter kunde (navn, anleggsnr, postnr, poststed...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="search-customers-input"
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Select all checkbox */}
      {customers.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            {selectedCustomers.size === customers.length ? (
              <CheckSquare size={18} className="text-blue-500" />
            ) : (
              <Square size={18} />
            )}
            Velg alle
          </button>
          {selectedCustomers.size > 0 && (
            <span className="text-sm text-gray-500">({selectedCustomers.size} valgt)</span>
          )}
        </div>
      )}

      {/* Customer List */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-400">
            Laster...
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-400">
            Ingen kunder funnet
          </div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className={`bg-gray-900 border rounded-lg overflow-hidden ${selectedCustomers.has(customer.id) ? 'border-blue-500' : 'border-gray-800'}`}>
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
                    <Square size={20} className="text-gray-500" />
                  )}
                </button>
                
                <div 
                  className="flex items-center justify-between flex-1 cursor-pointer hover:bg-gray-800/50 -m-2 p-2 rounded"
                  onClick={() => toggleExpand(customer.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 text-center">
                      <span className="text-xs text-gray-500">An.nr</span>
                      <p className="font-mono text-blue-400">{customer.anleggsnr}</p>
                    </div>
                    <div className="w-16 text-center">
                      <span className="text-xs text-gray-500">Knr</span>
                      <p className="font-mono text-gray-400">{customer.kundennr}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.kundnavn}</p>
                      <p className="text-sm text-gray-400">{customer.adresse}, {customer.postnr} {customer.poststed}</p>
                    </div>
                    <div className="w-40 hidden md:block">
                      <span className="text-xs text-gray-500">Type</span>
                      <p className="text-sm truncate">{customer.typenavn || '-'}</p>
                    </div>
                    <div className="w-28 hidden lg:block">
                      <span className="text-xs text-gray-500">Tlf</span>
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
                <div className="border-t border-gray-800 bg-gray-800/30 p-4">
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
                      <span className="text-xs text-yellow-500 uppercase font-semibold">Kundeinfo</span>
                      <p className="text-sm text-yellow-100 mt-1">{customer.kundeinfo}</p>
                    </div>
                  )}
                  
                  {/* Kommentar box */}
                  {customer.kommentar && (
                    <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded">
                      <span className="text-xs text-red-500 uppercase font-semibold">Kommentar / Adgangsinformasjon</span>
                      <p className="text-sm text-red-100 mt-1">{customer.kommentar}</p>
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
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {editingCustomer ? 'Rediger kunde' : 'Ny kunde'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingCustomer(null); }}
                className="p-2 hover:bg-gray-800 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">An.nr. *</label>
                  <input
                    type="text"
                    value={formData.anleggsnr}
                    onChange={(e) => setFormData({ ...formData, anleggsnr: e.target.value })}
                    data-testid="customer-anleggsnr-input"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Knr *</label>
                  <input
                    type="text"
                    value={formData.kundennr}
                    onChange={(e) => setFormData({ ...formData, kundennr: e.target.value })}
                    data-testid="customer-kundennr-input"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kunde *</label>
                  <input
                    type="text"
                    value={formData.kundnavn}
                    onChange={(e) => setFormData({ ...formData, kundnavn: e.target.value })}
                    data-testid="customer-kundnavn-input"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type nr.</label>
                  <input
                    type="text"
                    value={formData.typenr}
                    onChange={(e) => setFormData({ ...formData, typenr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type navn</label>
                  <input
                    type="text"
                    value={formData.typenavn}
                    onChange={(e) => setFormData({ ...formData, typenavn: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kommune *</label>
                  <input
                    type="text"
                    value={formData.kommune}
                    onChange={(e) => setFormData({ ...formData, kommune: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Adresse *</label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Postnr *</label>
                  <input
                    type="text"
                    value={formData.postnr}
                    onChange={(e) => setFormData({ ...formData, postnr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sted *</label>
                  <input
                    type="text"
                    value={formData.poststed}
                    onChange={(e) => setFormData({ ...formData, poststed: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Service intervall</label>
                  <input
                    type="text"
                    value={formData.service_intervall}
                    onChange={(e) => setFormData({ ...formData, service_intervall: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Uke</label>
                  <input
                    type="text"
                    value={formData.uke}
                    onChange={(e) => setFormData({ ...formData, uke: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Serviceansvarlig</label>
                  <input
                    type="text"
                    value={formData.serviceansvarlig}
                    onChange={(e) => setFormData({ ...formData, serviceansvarlig: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tlf 1</label>
                  <input
                    type="text"
                    value={formData.telefon1}
                    onChange={(e) => setFormData({ ...formData, telefon1: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tlf 2</label>
                  <input
                    type="text"
                    value={formData.telefon2}
                    onChange={(e) => setFormData({ ...formData, telefon2: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Epost</label>
                  <input
                    type="email"
                    value={formData.epost}
                    onChange={(e) => setFormData({ ...formData, epost: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Startdato</label>
                  <input
                    type="text"
                    value={formData.startdato}
                    onChange={(e) => setFormData({ ...formData, startdato: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Styreenhet</label>
                  <input
                    type="text"
                    value={formData.styreenhet}
                    onChange={(e) => setFormData({ ...formData, styreenhet: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tjeneste nr.</label>
                  <input
                    type="text"
                    value={formData.tjeneste_nr}
                    onChange={(e) => setFormData({ ...formData, tjeneste_nr: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kundeinfo</label>
                  <textarea
                    value={formData.kundeinfo}
                    onChange={(e) => setFormData({ ...formData, kundeinfo: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Kommentar / Adgangsinformasjon</label>
                  <textarea
                    value={formData.kommentar}
                    onChange={(e) => setFormData({ ...formData, kommentar: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                  }}
                  data-testid="cancel-customer-button"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  data-testid="save-customer-button"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  {editingCustomer ? 'Oppdater' : 'Opprett'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
