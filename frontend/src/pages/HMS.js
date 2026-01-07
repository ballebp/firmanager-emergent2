import React, { useState, useEffect } from 'react';
import {
  getRiskAssessments,
  createRiskAssessment,
  getIncidents,
  createIncident,
  getTraining,
  createTraining,
  getEquipment,
  createEquipment
} from '../services/api';
import { Plus, AlertTriangle, FileText, GraduationCap, Wrench, X, Lock } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';
import { hasFeature } from '../services/licenseService';

const HMS = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [training, setTraining] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const { license, setShowLicenseModal } = useLicense();
  
  // Check if HMS is enabled
  const hmsEnabled = hasFeature(license, 'hms');
  
  // Form data states
  const [riskFormData, setRiskFormData] = useState({
    tittel: '',
    beskrivelse: '',
    dato: new Date().toISOString().split('T')[0],
    alvorlighetsgrad: 'middels',
    status: 'aktiv',
    ansvarlig: ''
  });

  const [incidentFormData, setIncidentFormData] = useState({
    dato: new Date().toISOString().split('T')[0],
    beskrivelse: '',
    type: 'ulykke',
    status: 'åpen',
    alvorlighetsgrad: 'lav'
  });

  const [trainingFormData, setTrainingFormData] = useState({
    navn: '',
    beskrivelse: '',
    dato: new Date().toISOString().split('T')[0],
    expires_at: '',
    status: 'aktiv',
    ansatte: []
  });

  const [equipmentFormData, setEquipmentFormData] = useState({
    navn: '',
    control_date: new Date().toISOString().split('T')[0],
    next_control: '',
    status: 'ok'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [riskRes, incidentRes, trainingRes, equipmentRes] = await Promise.all([
        getRiskAssessments(),
        getIncidents(),
        getTraining(),
        getEquipment()
      ]);
      setRiskAssessments(riskRes.data);
      setIncidents(incidentRes.data);
      setTraining(trainingRes.data);
      setEquipment(equipmentRes.data);
    } catch (error) {
      console.error('Failed to load HMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    resetForms();
  };

  const resetForms = () => {
    setRiskFormData({
      tittel: '',
      beskrivelse: '',
      dato: new Date().toISOString().split('T')[0],
      alvorlighetsgrad: 'middels',
      status: 'aktiv',
      ansvarlig: ''
    });
    setIncidentFormData({
      dato: new Date().toISOString().split('T')[0],
      beskrivelse: '',
      type: 'ulykke',
      status: 'åpen',
      alvorlighetsgrad: 'lav'
    });
    setTrainingFormData({
      navn: '',
      beskrivelse: '',
      dato: new Date().toISOString().split('T')[0],
      expires_at: '',
      status: 'aktiv',
      ansatte: []
    });
    setEquipmentFormData({
      navn: '',
      control_date: new Date().toISOString().split('T')[0],
      next_control: '',
      status: 'ok'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'risk') {
        await createRiskAssessment({
          ...riskFormData,
          dato: new Date(riskFormData.dato).toISOString()
        });
      } else if (modalType === 'incident') {
        await createIncident({
          ...incidentFormData,
          dato: new Date(incidentFormData.dato).toISOString()
        });
      } else if (modalType === 'training') {
        await createTraining({
          ...trainingFormData,
          dato: new Date(trainingFormData.dato).toISOString(),
          expires_at: trainingFormData.expires_at ? new Date(trainingFormData.expires_at).toISOString() : null
        });
      } else if (modalType === 'equipment') {
        await createEquipment({
          ...equipmentFormData,
          control_date: new Date(equipmentFormData.control_date).toISOString(),
          next_control: new Date(equipmentFormData.next_control).toISOString()
        });
      }
      
      closeModal();
      loadData();
    } catch (error) {
      console.error('Failed to create HMS entry:', error);
      alert('Could not create entry');
    }
  };

  const activeRiskAssessments = riskAssessments.filter(r => r.status === 'aktiv');
  const openIncidents = incidents.filter(i => i.status === 'åpen' || i.status === 'undersøkes');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'risk', label: 'Risk Assessment' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'training', label: 'Training' },
    { id: 'equipment', label: 'Equipment' }
  ];

  return (
    <div data-testid="hms-page">
      <h1 className="text-3xl font-bold mb-6">HMS - Health, Environment and Safety</h1>

      {/* HMS License Gate */}
      {!hmsEnabled ? (
        <div className="bg-white rounded p-8 text-center max-w-2xl mx-auto mt-12 border-2 border-blue-200">
          <div className="flex justify-center mb-4">
            <Lock size={64} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">HMS Module Not Available</h2>
          <p className="text-gray-700 mb-6 text-lg">
            The HMS (Health, Environment and Safety) module is available in Trial, Professional, and Enterprise plans.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-6 mb-6 text-left">
            <p className="font-semibold text-gray-900 mb-3">HMS Features Include:</p>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Risk Assessment Management</li>
              <li>✓ Incident Tracking & Reporting</li>
              <li>✓ Training & Certification Records</li>
              <li>✓ Equipment Safety Documentation</li>
              <li>✓ Compliance Monitoring</li>
            </ul>
          </div>
          <button
            onClick={() => setShowLicenseModal(true)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded text-lg font-semibold transition-colors"
          >
            Upgrade to Access HMS
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`hms-tab-${tab.id}`}
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-yellow-500 p-3 rounded">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeRiskAssessments.length}</p>
                  <p className="text-sm text-gray-800">Active risk assessments</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-red-500 p-3 rounded">
                  <FileText size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{openIncidents.length}</p>
                  <p className="text-sm text-gray-800">Open incidents</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500 p-3 rounded">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{training.length}</p>
                  <p className="text-sm text-gray-800">Training sessions</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-green-500 p-3 rounded">
                  <Wrench size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{equipment.length}</p>
                  <p className="text-sm text-gray-800">Equipment registered</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="text-lg font-semibold mb-4">Latest incidents</h3>
              {incidents.slice(0, 5).map(incident => (
                <div key={incident.id} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                  <p className="font-medium">{incident.beskrivelse}</p>
                  <p className="text-sm text-gray-800">{new Date(incident.dato).toLocaleDateString('no-NO')}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded p-4">
              <h3 className="text-lg font-semibold mb-4">High risk activities</h3>
              {riskAssessments.filter(r => r.alvorlighetsgrad === 'høy').slice(0, 5).map(risk => (
                <div key={risk.id} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                  <p className="font-medium">{risk.tittel}</p>
                  <p className="text-sm text-red-400">High severity</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Risk Assessments Tab */}
      {activeTab === 'risk' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Risk Assessments</h2>
            <button
              onClick={() => openModal('risk')}
              data-testid="add-risk-assessment-button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus size={20} />
              New Risk Assessment
            </button>
          </div>
          <div className="space-y-3">
            {riskAssessments.map(risk => (
              <div key={risk.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{risk.tittel}</h3>
                    <p className="text-sm text-gray-800 mt-1">{risk.beskrivelse}</p>
                    <div className="flex gap-3 mt-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        risk.alvorlighetsgrad === 'høy' ? 'bg-red-900/30 text-red-400' :
                        risk.alvorlighetsgrad === 'middels' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>
                        {risk.alvorlighetsgrad}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-900">
                        {risk.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800">{new Date(risk.dato).toLocaleDateString('no-NO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Hendelser</h2>
            <button
              onClick={() => openModal('incident')}
              data-testid="add-incident-button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus size={20} />
              Rapporter hendelse
            </button>
          </div>
          <div className="space-y-3">
            {incidents.map(incident => (
              <div key={incident.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold capitalize">{incident.type}</h3>
                    <p className="text-sm text-gray-800 mt-1">{incident.beskrivelse}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-900">
                        {incident.status}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-900">
                        {incident.alvorlighetsgrad}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800">{new Date(incident.dato).toLocaleDateString('no-NO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Opplæring</h2>
            <button
              onClick={() => openModal('training')}
              data-testid="add-training-button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus size={20} />
              Ny opplæring
            </button>
          </div>
          <div className="space-y-3">
            {training.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded p-4">
                <h3 className="font-semibold">{t.navn}</h3>
                <p className="text-sm text-gray-800 mt-1">{t.beskrivelse}</p>
                <div className="flex gap-3 mt-2 text-sm">
                  <span className="text-gray-800">Dato: {new Date(t.dato).toLocaleDateString('no-NO')}</span>
                  {t.expires_at && (
                    <span className="text-gray-800">Utløper: {new Date(t.expires_at).toLocaleDateString('no-NO')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Utstyr</h2>
            <button
              onClick={() => openModal('equipment')}
              data-testid="add-equipment-button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus size={20} />
              Registrer utstyr
            </button>
          </div>
          <div className="space-y-3">
            {equipment.map(e => (
              <div key={e.id} className="bg-white border border-gray-200 rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{e.navn}</h3>
                    <div className="flex gap-3 mt-2 text-sm text-gray-800">
                      <span>Kontrollert: {new Date(e.control_date).toLocaleDateString('no-NO')}</span>
                      <span>Neste: {new Date(e.next_control).toLocaleDateString('no-NO')}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    e.status === 'ok' ? 'bg-green-900/30 text-green-400' :
                    e.status === 'trenger_kontroll' ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    {e.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal with actual forms */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {modalType === 'risk' && 'New Risk Assessment'}
                {modalType === 'incident' && 'Report Incident'}
                {modalType === 'training' && 'New Training'}
                {modalType === 'equipment' && 'Register Equipment'}
              </h2>
              <button onClick={closeModal} className="text-gray-800 hover:text-gray-900">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Risk Assessment Form */}
              {modalType === 'risk' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Title *</label>
                    <input
                      type="text"
                      value={riskFormData.tittel}
                      onChange={(e) => setRiskFormData({ ...riskFormData, tittel: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                    <textarea
                      value={riskFormData.beskrivelse}
                      onChange={(e) => setRiskFormData({ ...riskFormData, beskrivelse: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      rows="4"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Date *</label>
                      <input
                        type="date"
                        value={riskFormData.dato}
                        onChange={(e) => setRiskFormData({ ...riskFormData, dato: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Severity *</label>
                      <select
                        value={riskFormData.alvorlighetsgrad}
                        onChange={(e) => setRiskFormData({ ...riskFormData, alvorlighetsgrad: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="lav">Lav</option>
                        <option value="middels">Middels</option>
                        <option value="høy">Høy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Status *</label>
                      <select
                        value={riskFormData.status}
                        onChange={(e) => setRiskFormData({ ...riskFormData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="aktiv">Active</option>
                        <option value="lukket">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Responsible</label>
                      <input
                        type="text"
                        value={riskFormData.ansvarlig}
                        onChange={(e) => setRiskFormData({ ...riskFormData, ansvarlig: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Incident Form */}
              {modalType === 'incident' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                    <textarea
                      value={incidentFormData.beskrivelse}
                      onChange={(e) => setIncidentFormData({ ...incidentFormData, beskrivelse: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      rows="4"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Date *</label>
                      <input
                        type="date"
                        value={incidentFormData.dato}
                        onChange={(e) => setIncidentFormData({ ...incidentFormData, dato: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Type *</label>
                      <select
                        value={incidentFormData.type}
                        onChange={(e) => setIncidentFormData({ ...incidentFormData, type: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="ulykke">Accident</option>
                        <option value="nestenulykke">Near miss</option>
                        <option value="observasjon">Observation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Status *</label>
                      <select
                        value={incidentFormData.status}
                        onChange={(e) => setIncidentFormData({ ...incidentFormData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="åpen">Open</option>
                        <option value="undersøkes">Investigating</option>
                        <option value="lukket">Closed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Alvorlighetsgrad *</label>
                      <select
                        value={incidentFormData.alvorlighetsgrad}
                        onChange={(e) => setIncidentFormData({ ...incidentFormData, alvorlighetsgrad: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      >
                        <option value="lav">Lav</option>
                        <option value="middels">Middels</option>
                        <option value="høy">Høy</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Training Form */}
              {modalType === 'training' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Name *</label>
                    <input
                      type="text"
                      value={trainingFormData.navn}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, navn: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                    <textarea
                      value={trainingFormData.beskrivelse}
                      onChange={(e) => setTrainingFormData({ ...trainingFormData, beskrivelse: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Dato *</label>
                      <input
                        type="date"
                        value={trainingFormData.dato}
                        onChange={(e) => setTrainingFormData({ ...trainingFormData, dato: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Expires date</label>
                      <input
                        type="date"
                        value={trainingFormData.expires_at}
                        onChange={(e) => setTrainingFormData({ ...trainingFormData, expires_at: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Equipment Form */}
              {modalType === 'equipment' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Navn *</label>
                    <input
                      type="text"
                      value={equipmentFormData.navn}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, navn: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Control date *</label>
                      <input
                        type="date"
                        value={equipmentFormData.control_date}
                        onChange={(e) => setEquipmentFormData({ ...equipmentFormData, control_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Next control *</label>
                      <input
                        type="date"
                        value={equipmentFormData.next_control}
                        onChange={(e) => setEquipmentFormData({ ...equipmentFormData, next_control: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Status *</label>
                    <select
                      value={equipmentFormData.status}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-900 focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="ok">OK</option>
                      <option value="trenger_kontroll">Needs control</option>
                      <option value="utrangert">Decommissioned</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-700 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid={`save-${modalType}-button`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default HMS;




