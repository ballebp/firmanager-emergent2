import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Get stored license from localStorage
export const getStoredLicense = () => {
  const licenseData = localStorage.getItem('firmanager_license');
  if (licenseData) {
    try {
      return JSON.parse(licenseData);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Store license in localStorage
export const storeLicense = (licenseData) => {
  localStorage.setItem('firmanager_license', JSON.stringify(licenseData));
};

// Clear stored license
export const clearLicense = () => {
  localStorage.removeItem('firmanager_license');
};

// Validate license key with backend
export const validateLicense = async (licenseKey, organizationId = null) => {
  try {
    const response = await axios.post(`${API_URL}/api/licenses/validate`, {
      license_key: licenseKey,
      organization_id: organizationId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'License validation failed' };
  }
};

// Check current license status
export const checkLicense = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/licenses/check`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'License check failed' };
  }
};

// Start trial (generates trial license)
export const startTrial = async (organizationId, token) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/licenses/generate`,
      {
        organization_id: organizationId,
        subscription_tier: 'trial',
        max_users: 1,
        trial_days: 14
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'Failed to start trial' };
  }
};

// Check if feature is enabled based on license
export const hasFeature = (license, feature) => {
  if (!license || !license.features) return false;
  
  switch (feature) {
    case 'hms':
      return license.features.hms_enabled === true;
    case 'unlimited_customers':
      return license.features.max_customers === -1;
    case 'unlimited_routes':
      return license.features.max_routes === -1;
    case 'unlimited_products':
      return license.features.max_products === -1;
    case 'multi_user':
      return license.features.multi_user === true;
    default:
      return false;
  }
};

// Check if limit is reached
export const canAddMore = (license, type, currentCount) => {
  if (!license || !license.features) return false;
  
  const maxKey = `max_${type}`;
  const maxLimit = license.features[maxKey];
  
  // -1 means unlimited
  if (maxLimit === -1) return true;
  
  return currentCount < maxLimit;
};

// Get days remaining
export const getDaysRemaining = (expiresAt) => {
  if (!expiresAt) return null;
  
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

// Check if license is expired
export const isLicenseExpired = (license) => {
  if (!license || !license.expires_at) return false;
  
  const now = new Date();
  const expiry = new Date(license.expires_at);
  
  return now > expiry;
};

// Get subscription tier display name
export const getTierName = (tier) => {
  const tierNames = {
    trial: 'Trial',
    free: 'Free',
    pro: 'Professional',
    enterprise: 'Enterprise'
  };
  return tierNames[tier] || tier;
};
