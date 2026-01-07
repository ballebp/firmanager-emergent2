import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  getStoredLicense, 
  storeLicense, 
  clearLicense, 
  checkLicense,
  validateLicense as validateLicenseAPI,
  startTrial as startTrialAPI,
  isLicenseExpired,
  getDaysRemaining
} from '../services/licenseService';

const LicenseContext = createContext(null);

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within LicenseProvider');
  }
  return context;
};

export const LicenseProvider = ({ children }) => {
  const { user } = useAuth();
  const [license, setLicense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseError, setLicenseError] = useState(null);

  // Check license on mount and when user changes
  useEffect(() => {
    if (user) {
      checkCurrentLicense();
    } else {
      setLicense(null);
      setLoading(false);
    }
  }, [user]);

  // Check license daily (every 24 hours)
  useEffect(() => {
    if (user && license) {
      const interval = setInterval(() => {
        checkCurrentLicense();
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => clearInterval(interval);
    }
  }, [user, license]);

  const checkCurrentLicense = async () => {
    setLoading(true);
    setLicenseError(null);

    try {
      // First check stored license
      const stored = getStoredLicense();
      
      if (stored) {
        // Verify with backend
        const token = localStorage.getItem('token');
        const result = await checkLicense(token);
        
        if (result.valid) {
          const licenseData = result.license;
          setLicense(licenseData);
          storeLicense(licenseData);
          
          // Show warning if expiring soon
          const daysRemaining = getDaysRemaining(licenseData.expires_at);
          if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0) {
            setLicenseError(`Your license expires in ${daysRemaining} days`);
          }
        } else {
          // License invalid, clear and show modal
          clearLicense();
          setLicense(null);
          setShowLicenseModal(true);
          setLicenseError(result.message || 'License is invalid');
        }
      } else {
        // No license stored, prompt user
        setShowLicenseModal(true);
      }
    } catch (error) {
      console.error('License check failed:', error);
      setLicenseError('Unable to verify license');
      // Keep existing license if check fails (offline mode)
      const stored = getStoredLicense();
      if (stored && !isLicenseExpired(stored)) {
        setLicense(stored);
      } else {
        setShowLicenseModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateLicense = async (licenseKey) => {
    try {
      const result = await validateLicenseAPI(licenseKey, user?.organization_id);
      
      if (result.valid) {
        setLicense(result.license);
        storeLicense(result.license);
        setShowLicenseModal(false);
        setLicenseError(null);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid license key' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.detail || 'License validation failed' 
      };
    }
  };

  const startTrial = async () => {
    if (!user) {
      return { success: false, error: 'Please log in first' };
    }

    try {
      const token = localStorage.getItem('token');
      const trialLicense = await startTrialAPI(user.organization_id, token);
      
      setLicense(trialLicense);
      storeLicense(trialLicense);
      setShowLicenseModal(false);
      setLicenseError(null);
      
      return { success: true, license: trialLicense };
    } catch (error) {
      return { 
        success: false, 
        error: error.detail || 'Failed to start trial' 
      };
    }
  };

  const logout = () => {
    clearLicense();
    setLicense(null);
  };

  const value = {
    license,
    loading,
    showLicenseModal,
    setShowLicenseModal,
    licenseError,
    validateLicense,
    startTrial,
    checkCurrentLicense,
    logout,
    // Convenience methods
    isExpired: license ? isLicenseExpired(license) : false,
    daysRemaining: license ? getDaysRemaining(license.expires_at) : null,
    tier: license?.subscription_tier || 'free'
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
};
