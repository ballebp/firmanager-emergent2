import React, { useState } from 'react';
import { X, Key, Clock } from 'lucide-react';
import { useLicense } from '../contexts/LicenseContext';

const LicenseModal = () => {
  const { showLicenseModal, setShowLicenseModal, validateLicense, startTrial } = useLicense();
  const [mode, setMode] = useState('choose'); // choose, trial, enter-key
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!showLicenseModal) return null;

  const handleStartTrial = async () => {
    setLoading(true);
    setError('');
    
    const result = await startTrial();
    
    if (result.success) {
      setShowLicenseModal(false);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleValidateLicense = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError('');
    
    const result = await validateLicense(licenseKey.trim());
    
    if (result.success) {
      setShowLicenseModal(false);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleValidateLicense();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Activate Firmanager</h2>
          {mode === 'choose' && (
            <button
              onClick={() => setShowLicenseModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'choose' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Choose how you want to get started with Firmanager:
              </p>

              <button
                onClick={() => setMode('trial')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Clock className="text-white" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Start Free Trial</div>
                  <div className="text-sm text-gray-600">14 days, full features, no credit card</div>
                </div>
              </button>

              <button
                onClick={() => setMode('enter-key')}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Key className="text-white" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900">Enter License Key</div>
                  <div className="text-sm text-gray-600">Already purchased? Activate now</div>
                </div>
              </button>

              <p className="text-xs text-gray-500 text-center mt-6">
                By continuing, you agree to our Terms of Service
              </p>
            </div>
          )}

          {mode === 'trial' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">14-Day Free Trial</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Full access to all features</li>
                  <li>✓ Up to 50 customers</li>
                  <li>✓ Up to 20 routes</li>
                  <li>✓ HMS module included</li>
                  <li>✓ No credit card required</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('choose')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleStartTrial}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Start Trial'}
                </button>
              </div>
            </div>
          )}

          {mode === 'enter-key' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Key
                </label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the license key you received after purchase
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setMode('choose')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleValidateLicense}
                  disabled={loading || !licenseKey.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Validating...' : 'Activate'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LicenseModal;
