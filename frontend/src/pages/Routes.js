import React, { useState, useEffect, useMemo } from 'react';
import { createRoute, getCustomers } from '../services/api';
import { Plus, MapPin, Printer, Trash2, Filter, X, ClipboardPaste } from 'lucide-react';

const Routes = () => {
  const [currentRoute, setCurrentRoute] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Area filter state
  const [areaFilter, setAreaFilter] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedCustomersForRoute, setSelectedCustomersForRoute] = useState(new Set());
  
  // Anleggsnr paste state
  const [routeMode, setRouteMode] = useState('area'); // 'area' or 'anleggsnr'
  const [anleggsnrInput, setAnleggsnrInput] = useState('');
  const [parsedAnleggsnr, setParsedAnleggsnr] = useState([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const customersRes = await getCustomers();
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique areas (kommune, poststed, postnr)
  const uniqueAreas = useMemo(() => {
    const areas = new Map();
    customers.forEach(c => {
      const key = `${c.postnr}-${c.poststed}`;
      if (!areas.has(key)) {
        areas.set(key, { postnr: c.postnr, poststed: c.poststed, kommune: c.kommune, count: 1 });
      } else {
        areas.get(key).count++;
      }
    });
    return Array.from(areas.values()).sort((a, b) => a.postnr - b.postnr);
  }, [customers]);

  // Filter areas based on search
  const filteredAreas = useMemo(() => {
    if (!areaFilter) return uniqueAreas.slice(0, 20);
    const search = areaFilter.toLowerCase();
    return uniqueAreas.filter(a => 
      a.postnr?.includes(search) || 
      a.poststed?.toLowerCase().includes(search) ||
      a.kommune?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [uniqueAreas, areaFilter]);

  // Get customers in selected areas
  const customersInSelectedAreas = useMemo(() => {
    if (selectedAreas.length === 0) return [];
    return customers.filter(c => 
      selectedAreas.some(a => a.postnr === c.postnr && a.poststed === c.poststed)
    );
  }, [customers, selectedAreas]);

  const addArea = (area) => {
    if (!selectedAreas.find(a => a.postnr === area.postnr && a.poststed === area.poststed)) {
      setSelectedAreas([...selectedAreas, area]);
    }
    setAreaFilter('');
  };

  const removeArea = (area) => {
    setSelectedAreas(selectedAreas.filter(a => !(a.postnr === area.postnr && a.poststed === area.poststed)));
  };

  const toggleCustomerForRoute = (customerId) => {
    const newSelected = new Set(selectedCustomersForRoute);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomersForRoute(newSelected);
  };

  const selectAllInArea = () => {
    setSelectedCustomersForRoute(new Set(customersInSelectedAreas.map(c => c.id)));
  };

  const clearSelection = () => {
    setSelectedCustomersForRoute(new Set());
  };

  // Parse anleggsnr input (comma, newline, space, or tab separated)
  const handleAnleggsnrInputChange = (value) => {
    setAnleggsnrInput(value);
    const parsed = value
      .split(/[\n,\t\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setParsedAnleggsnr(parsed);
  };

  // Get customers matching parsed anleggsnr
  const matchedCustomers = useMemo(() => {
    if (parsedAnleggsnr.length === 0) return [];
    return customers.filter(c => parsedAnleggsnr.includes(c.anleggsnr));
  }, [customers, parsedAnleggsnr]);

  const unmatchedAnleggsnr = useMemo(() => {
    const matchedSet = new Set(matchedCustomers.map(c => c.anleggsnr));
    return parsedAnleggsnr.filter(a => !matchedSet.has(a));
  }, [parsedAnleggsnr, matchedCustomers]);

  // Geo-optimize route based on coordinates/postnr
  const optimizeRoute = (customerList) => {
    if (customerList.length <= 1) return customerList;
    
    // Sort by postnr first, then by address for geo-optimization
    return [...customerList].sort((a, b) => {
      const postnrA = parseInt(a.postnr) || 0;
      const postnrB = parseInt(b.postnr) || 0;
      if (postnrA !== postnrB) return postnrA - postnrB;
      return (a.adresse || '').localeCompare(b.adresse || '');
    });
  };

  const handleGenerateRoute = async () => {
    let anleggsnrList = [];
    
    if (routeMode === 'area') {
      const selectedCustomersList = customersInSelectedAreas.filter(c => selectedCustomersForRoute.has(c.id));
      if (selectedCustomersList.length === 0) {
        alert('Please select at least one customer for the route');
        return;
      }
      // Geo-optimize the route
      const optimizedCustomers = optimizeRoute(selectedCustomersList);
      anleggsnrList = optimizedCustomers.map(c => c.anleggsnr);
    } else {
      // Anleggsnr mode
      if (matchedCustomers.length === 0) {
        alert('No valid facility numbers found');
        return;
      }
      // Geo-optimize the route
      const optimizedCustomers = optimizeRoute(matchedCustomers);
      anleggsnrList = optimizedCustomers.map(c => c.anleggsnr);
    }

    try {
      const response = await createRoute({
        date: new Date(selectedDate).toISOString(),
        anleggsnr_list: anleggsnrList
      });
      setCurrentRoute(response.data);
      setShowModal(false);
      setSelectedAreas([]);
      setSelectedCustomersForRoute(new Set());
      setAnleggsnrInput('');
      setParsedAnleggsnr([]);
    } catch (error) {
      console.error('Failed to create route:', error);
      alert('Could not generate route');
    }
  };

  const handleClearRoute = () => {
    setCurrentRoute(null);
  };

  const getCustomerByAnleggsnr = (anleggsnr) => {
    return customers.find(c => c.anleggsnr === anleggsnr);
  };

  // Print travel note function
  const handlePrintTravelNote = (route) => {
    const stops = route.anleggsnr_list.map((anleggsnr, idx) => {
      const customer = getCustomerByAnleggsnr(anleggsnr);
      return {
        stopNumber: idx + 1,
        anleggsnr,
        kundennr: customer?.kundennr || '-',
        customerName: customer?.kundnavn || 'Unknown customer',
        typenr: customer?.typenr || '-',
        typenavn: customer?.typenavn || '-',
        kommune: customer?.kommune || '-',
        address: customer?.adresse || '-',
        postnr: customer?.postnr || '-',
        poststed: customer?.poststed || '-',
        serviceInterval: customer?.service_intervall || '-',
        uke: customer?.uke || '-',
        serviceansvarlig: customer?.serviceansvarlig || '-',
        phone1: customer?.telefon1 || '-',
        phone2: customer?.telefon2 || '-',
        epost: customer?.epost || '-',
        startdato: customer?.startdato || '-',
        styreenhet: customer?.styreenhet || '-',
        kommentar: customer?.kommentar || '',
        kundeinfo: customer?.kundeinfo || ''
      };
    });

    const routeDate = new Date(route.date).toLocaleDateString('no-NO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kjøreseddel - ${routeDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 15px; color: #333; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #333; }
          .header h1 { font-size: 50px; margin-bottom: 5px; }
          .header .date { font-size: 30px; color: #666; }
          .header .info { font-size: 22px; color: #888; margin-top: 3px; }
          .stop { page-break-inside: avoid; margin-bottom: 15px; padding: 10px; border: 1px solid #333; border-radius: 4px; background: #fff; }
          .stop-header { display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #333; background: #e8e8e8; margin: -10px -10px 10px -10px; padding: 8px 10px; border-radius: 3px 3px 0 0; }
          .stop-number { width: 30px; height: 30px; background: #2563eb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 22px; margin-right: 10px; flex-shrink: 0; }
          .stop-title { font-size: 34px; font-weight: bold; }
          .stop-subtitle { font-size: 24px; color: #333; font-weight: bold; }
          .stop-subtitle .annr { font-size: 28px; color: #000; }
          .stop-subtitle .knr { font-size: 28px; color: #000; }
          .customer-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px; }
          .detail-item { padding: 3px 0; }          .detail-item.full-width { grid-column: span 4; }
          .detail-item.half-width { grid-column: span 2; }
          .detail-label { font-size: 16px; color: #666; text-transform: uppercase; margin-bottom: 1px; font-weight: bold; }
          .detail-value { font-size: 20px; font-weight: 500; }
          .info-box { margin-top: 8px; padding: 6px; border-radius: 3px; }
          .info-box.kundeinfo { background: #fff8dc; border: 1px solid #daa520; }
          .info-box.kommentar { background: #ffe4e1; border: 1px solid #cd5c5c; }
          .info-box-label { font-size: 18px; font-weight: bold; color: #666; margin-bottom: 3px; text-transform: uppercase; }
          .info-box-value { font-size: 20px; line-height: 1.3; }
          .measurements { margin-top: 12px; padding-top: 10px; border-top: 2px solid #333; }
          .measurements-title { font-size: 20px; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; background: #333; color: white; padding: 4px 8px; display: inline-block; }
          .measurements-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .measurement-item { border-bottom: 1px dashed #999; padding-bottom: 3px; }
          .measurement-label { font-size: 17px; color: #333; font-weight: bold; }
          .measurement-value { height: 18px; border-bottom: 1px solid #666; margin-top: 2px; }
          .parts-section { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #999; }
          .parts-title { font-size: 20px; font-weight: bold; margin-bottom: 6px; }
          .parts-table { width: 100%; border-collapse: collapse; }
          .parts-table th, .parts-table td { border: 1px solid #999; padding: 4px; text-align: left; font-size: 18px; }
          .parts-table th { background: #e8e8e8; font-weight: bold; }
          .parts-table td { height: 20px; }
          .status-section { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #999; }
          .checkbox-row { display: flex; gap: 20px; margin-top: 6px; }
          .checkbox-item { display: flex; align-items: center; gap: 5px; font-size: 20px; }
          .checkbox { width: 14px; height: 14px; border: 2px solid #333; border-radius: 2px; }
          .notes-row { margin-top: 8px; }
          .notes-label { font-size: 18px; font-weight: bold; margin-bottom: 3px; }
          .notes-box { width: 100%; height: 30px; border: 1px solid #999; border-radius: 3px; }
          .time-km-section { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed #999; }
          .time-km-item { }
          .time-km-label { font-size: 18px; font-weight: bold; }
          .time-km-value { height: 18px; border-bottom: 1px solid #666; margin-top: 2px; }
          .footer { margin-top: 20px; padding-top: 12px; border-top: 2px solid #333; text-align: center; font-size: 16px; color: #666; }
          @media print { .stop { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚐 Kjøreseddel</h1>
          <div class="date">${routeDate}</div>
          <div class="info">Totalt ${stops.length} stopp • Geo-optimalisert rute</div>
        </div>
        
        ${stops.map(stop => `
          <div class="stop">
            <div class="stop-header">
              <div class="stop-number">${stop.stopNumber}</div>
              <div>
                <div class="stop-title">${stop.customerName}</div>
                <div class="stop-subtitle">An.nr: <span class="annr">${stop.anleggsnr}</span> | Knr: <span class="knr">${stop.kundennr}</span></div>
              </div>
            </div>
            
            <div class="customer-info">
              <div class="detail-item"><div class="detail-label">Type nr.</div><div class="detail-value">${stop.typenr}</div></div>
              <div class="detail-item"><div class="detail-label">Type navn</div><div class="detail-value">${stop.typenavn}</div></div>
              <div class="detail-item"><div class="detail-label">Styreenhet</div><div class="detail-value">${stop.styreenhet}</div></div>
              <div class="detail-item"><div class="detail-label">Serviceansvarlig</div><div class="detail-value">${stop.serviceansvarlig}</div></div>
              <div class="detail-item half-width"><div class="detail-label">Adresse</div><div class="detail-value">${stop.address}, ${stop.postnr} ${stop.poststed}</div></div>
              <div class="detail-item"><div class="detail-label">Kommune</div><div class="detail-value">${stop.kommune}</div></div>
              <div class="detail-item"><div class="detail-label">Service-intervall</div><div class="detail-value">${stop.serviceInterval}</div></div>
              <div class="detail-item"><div class="detail-label">Tlf 1</div><div class="detail-value">${stop.phone1}</div></div>
              <div class="detail-item"><div class="detail-label">Tlf 2</div><div class="detail-value">${stop.phone2}</div></div>
              <div class="detail-item"><div class="detail-label">Epost</div><div class="detail-value">${stop.epost}</div></div>
              <div class="detail-item"><div class="detail-label">Uke</div><div class="detail-value">${stop.uke}</div></div>
            </div>
            
            ${stop.kundeinfo ? `<div class="info-box kundeinfo"><div class="info-box-label">Kundeinfo</div><div class="info-box-value">${stop.kundeinfo}</div></div>` : ''}
            ${stop.kommentar ? `<div class="info-box kommentar"><div class="info-box-label">Kommentar / Adgangsinformasjon</div><div class="info-box-value">${stop.kommentar}</div></div>` : ''}
            
            <div class="measurements">
              <div class="measurements-title">Målinger (fylles ut)</div>
              <div class="measurements-grid">
                <div class="measurement-item"><div class="measurement-label">Høyt nivå</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Uttap.(12)</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">PH</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Temp</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Siste test.(17)</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Strømbr.(13)</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">PO4</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Dosm.pr.syk.</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Alarmer(15)</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Maksprog.</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Turb>20?</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">SV30</div><div class="measurement-value"></div></div>
                <div class="measurement-item"><div class="measurement-label">Sl.nivå%</div><div class="measurement-value"></div></div>
              </div>
            </div>
            
            <div class="time-km-section">
              <div class="time-km-item"><div class="time-km-label">AT (Arbeidstid)</div><div class="time-km-value"></div></div>
              <div class="time-km-item"><div class="time-km-label">KT (Kjøretid)</div><div class="time-km-value"></div></div>
              <div class="time-km-item"><div class="time-km-label">KM (Kilometer)</div><div class="time-km-value"></div></div>
            </div>
            
            <div class="parts-section">
              <div class="parts-title">Deler:</div>
              <table class="parts-table">
                <thead><tr><th style="width: 15%">Antall</th><th style="width: 55%">Emne</th><th style="width: 30%">Varenr.</th></tr></thead>
                <tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody>
              </table>
            </div>
            
            <div class="status-section">
              <div class="detail-label">Status</div>
              <div class="checkbox-row">
                <div class="checkbox-item"><div class="checkbox"></div><span>Utført</span></div>
                <div class="checkbox-item"><div class="checkbox"></div><span>Ikke hjemme</span></div>
                <div class="checkbox-item"><div class="checkbox"></div><span>Avvik</span></div>
                <div class="checkbox-item"><div class="checkbox"></div><span>Reservedeler</span></div>
              </div>
            </div>
            
            <div class="notes-row"><div class="notes-label">Notater</div><div class="notes-box"></div></div>
          </div>
        `).join('')}
        
        <div class="footer"><p>Generert fra Firmanager • ${new Date().toLocaleString('no-NO')}</p></div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  return (
    <div data-testid="routes-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Route Planner</h1>
        <button
          onClick={() => setShowModal(true)}
          data-testid="add-route-button"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          <Plus size={20} />
          Generate Route
        </button>
      </div>

      {/* Current Route */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-800">Loading...</div>
        ) : !currentRoute ? (
          <div className="bg-white border border-gray-200 rounded p-6 text-center text-gray-800">
            <p className="mb-4">No active route</p>
            <p className="text-sm">Click &quot;Generate Route&quot; to create a new travel note</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Route - {new Date(currentRoute.date).toLocaleDateString('no-NO')}</h3>
                <p className="text-sm text-gray-800 mt-1">Geo-optimized • {currentRoute.anleggsnr_list.length} stops</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handlePrintTravelNote(currentRoute)} data-testid="print-route-button" className="flex items-center gap-2 px-3 py-1 bg-green-700 hover:bg-green-600 rounded text-sm transition-colors">
                  <Printer size={16} />Print Travel Note
                </button>
                <button onClick={handleClearRoute} data-testid="clear-route-button" className="flex items-center gap-2 px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors">
                  <Trash2 size={16} />Remove Route
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {currentRoute.anleggsnr_list.map((anleggsnr, idx) => {
                const customer = getCustomerByAnleggsnr(anleggsnr);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-gray-100 p-3 rounded">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-sm font-medium">{idx + 1}</div>
                    <MapPin size={16} className="text-gray-800" />
                    <div className="flex-1">
                      <p className="font-medium">{customer?.kundnavn || anleggsnr}</p>
                      <p className="text-sm text-gray-800">{customer ? `${customer.adresse}, ${customer.postnr} ${customer.poststed}` : 'Customer not found'}</p>
                    </div>
                    <div className="text-right text-sm text-gray-800">
                      <p>An.nr: {anleggsnr}</p>
                      {customer?.telefon1 && <p>Tlf: {customer.telefon1}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal with Area Filter and Anleggsnr Input */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Generate New Route</h2>
              <button onClick={() => { setShowModal(false); setSelectedAreas([]); setSelectedCustomersForRoute(new Set()); setAnleggsnrInput(''); setParsedAnleggsnr([]); }} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500" />
              </div>
              
              {/* Mode selection tabs */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Select Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRouteMode('area')}
                    className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${routeMode === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-700'}`}
                  >
                    <Filter size={16} />
                    Select Area
                  </button>
                  <button
                    onClick={() => setRouteMode('anleggsnr')}
                    className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${routeMode === 'anleggsnr' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-700'}`}
                  >
                    <ClipboardPaste size={16} />
                    Paste Facility Numbers
                  </button>
                </div>
              </div>
              
              {/* Mode: Anleggsnr paste */}
              {routeMode === 'anleggsnr' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    <ClipboardPaste size={16} className="inline mr-2" />
                    Paste facility numbers (comma, space, or newline separated)
                  </label>
                  <textarea
                    value={anleggsnrInput}
                    onChange={(e) => handleAnleggsnrInputChange(e.target.value)}
                    placeholder="F.eks: 12345, 12346, 12347&#10;eller&#10;12345&#10;12346&#10;12347"
                    data-testid="anleggsnr-paste-input"
                    rows={5}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  
                  {parsedAnleggsnr.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">{matchedCustomers.length} found</span>
                        {unmatchedAnleggsnr.length > 0 && (
                          <span className="text-red-400">{unmatchedAnleggsnr.length} not found</span>
                        )}
                      </div>
                      
                      {unmatchedAnleggsnr.length > 0 && (
                        <div className="p-2 bg-red-900/20 border border-red-800 rounded text-sm">
                          <p className="text-red-400 mb-1">Following facility numbers were not found:</p>
                          <p className="text-gray-800 font-mono text-xs">{unmatchedAnleggsnr.join(', ')}</p>
                        </div>
                      )}
                      
                      {matchedCustomers.length > 0 && (
                        <div className="max-h-40 overflow-y-auto bg-gray-100 border border-gray-300 rounded">
                          {matchedCustomers.map((customer, idx) => (
                            <div key={customer.id} className="p-2 border-b border-gray-300 last:border-0 flex items-center gap-3">
                              <span className="text-xs text-gray-800">{idx + 1}.</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{customer.kundnavn}</p>
                                <p className="text-xs text-gray-800">{customer.adresse}, {customer.postnr} {customer.poststed}</p>
                              </div>
                              <span className="text-xs text-gray-800 font-mono">{customer.anleggsnr}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Mode: Area Filter */}
              {routeMode === 'area' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <Filter size={16} className="inline mr-2" />
                      Select areas (postal code/city/municipality)
                    </label>
                    <input
                      type="text"
                      value={areaFilter}
                      onChange={(e) => setAreaFilter(e.target.value)}
                      placeholder="Search by postal code, city or municipality..."
                      data-testid="area-filter-input"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                    
                    {/* Area suggestions */}
                    {areaFilter && filteredAreas.length > 0 && (
                      <div className="mt-2 bg-gray-100 border border-gray-300 rounded max-h-40 overflow-y-auto">
                        {filteredAreas.map((area, idx) => (
                          <button key={idx} onClick={() => addArea(area)} className="w-full px-3 py-2 text-left hover:bg-gray-700 flex justify-between items-center">
                            <span>{area.postnr} {area.poststed} ({area.kommune})</span>
                            <span className="text-xs text-gray-800">{area.count} customers</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Selected areas */}
                    {selectedAreas.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedAreas.map((area, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 rounded-full text-sm">
                            {area.postnr} {area.poststed}
                            <button onClick={() => removeArea(area)} className="hover:bg-blue-700 rounded-full p-0.5">
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Customer selection */}
                  {selectedAreas.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-900">
                          Select customers ({customersInSelectedAreas.length} available, {selectedCustomersForRoute.size} selected)
                        </label>
                        <div className="flex gap-2">
                          <button onClick={selectAllInArea} className="text-xs text-blue-700 hover:text-blue-800">Select all</button>
                          <button onClick={clearSelection} className="text-xs text-gray-800 hover:text-gray-900">Clear all</button>
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto bg-gray-100 border border-gray-300 rounded">
                        {customersInSelectedAreas.map((customer) => (
                          <div key={customer.id} onClick={() => toggleCustomerForRoute(customer.id)} className={`p-2 cursor-pointer flex items-center gap-3 hover:bg-gray-700 ${selectedCustomersForRoute.has(customer.id) ? 'bg-blue-900/30' : ''}`}>
                            <input type="checkbox" checked={selectedCustomersForRoute.has(customer.id)} readOnly className="w-4 h-4" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{customer.kundnavn}</p>
                              <p className="text-xs text-gray-800">{customer.adresse}, {customer.postnr} {customer.poststed}</p>
                            </div>
                            <span className="text-xs text-gray-800">An.nr: {customer.anleggsnr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <p><strong>Geo-optimization:</strong> The route is automatically optimized based on postal code and address for the most efficient driving route.</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6">
              <button onClick={() => { setShowModal(false); setSelectedAreas([]); setSelectedCustomersForRoute(new Set()); setAnleggsnrInput(''); setParsedAnleggsnr([]); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-700 rounded transition-colors">Cancel</button>
              <button 
                onClick={handleGenerateRoute} 
                disabled={routeMode === 'area' ? selectedCustomersForRoute.size === 0 : matchedCustomers.length === 0} 
                data-testid="generate-route-button" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate route ({routeMode === 'area' ? selectedCustomersForRoute.size : matchedCustomers.length} stops)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;





