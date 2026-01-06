import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Customers
export const getCustomers = (search = '') => 
  axios.get(`${API}/customers${search ? `?search=${search}` : ''}`, { headers: getAuthHeaders() });

export const getCustomer = (id) => 
  axios.get(`${API}/customers/${id}`, { headers: getAuthHeaders() });

export const createCustomer = (data) => 
  axios.post(`${API}/customers`, data, { headers: getAuthHeaders() });

export const updateCustomer = (id, data) => 
  axios.put(`${API}/customers/${id}`, data, { headers: getAuthHeaders() });

export const deleteCustomer = (id) => 
  axios.delete(`${API}/customers/${id}`, { headers: getAuthHeaders() });

// Employees
export const getEmployees = () => 
  axios.get(`${API}/employees`, { headers: getAuthHeaders() });

export const createEmployee = (data) => 
  axios.post(`${API}/employees`, data, { headers: getAuthHeaders() });

export const updateEmployee = (id, data) => 
  axios.put(`${API}/employees/${id}`, data, { headers: getAuthHeaders() });

export const deleteEmployee = (id) => 
  axios.delete(`${API}/employees/${id}`, { headers: getAuthHeaders() });

// Work Orders
export const getWorkOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return axios.get(`${API}/workorders${query ? `?${query}` : ''}`, { headers: getAuthHeaders() });
};

export const createWorkOrder = (data) => 
  axios.post(`${API}/workorders`, data, { headers: getAuthHeaders() });

export const updateWorkOrder = (id, data) => 
  axios.put(`${API}/workorders/${id}`, data, { headers: getAuthHeaders() });

export const deleteWorkOrder = (id) => 
  axios.delete(`${API}/workorders/${id}`, { headers: getAuthHeaders() });

// Internal Orders
export const getInternalOrders = () => 
  axios.get(`${API}/internalorders`, { headers: getAuthHeaders() });

export const createInternalOrder = (data) => 
  axios.post(`${API}/internalorders`, data, { headers: getAuthHeaders() });

export const updateInternalOrder = (id, data) => 
  axios.put(`${API}/internalorders/${id}`, data, { headers: getAuthHeaders() });

export const deleteInternalOrder = (id) => 
  axios.delete(`${API}/internalorders/${id}`, { headers: getAuthHeaders() });

// Products
export const getProducts = () => 
  axios.get(`${API}/products`, { headers: getAuthHeaders() });

export const createProduct = (data) => 
  axios.post(`${API}/products`, data, { headers: getAuthHeaders() });

export const updateProduct = (id, data) => 
  axios.put(`${API}/products/${id}`, data, { headers: getAuthHeaders() });

export const deleteProduct = (id) => 
  axios.delete(`${API}/products/${id}`, { headers: getAuthHeaders() });

// Routes
export const getRoutes = () => 
  axios.get(`${API}/routes`, { headers: getAuthHeaders() });

export const createRoute = (data) => 
  axios.post(`${API}/routes`, data, { headers: getAuthHeaders() });

// HMS
export const getRiskAssessments = () => 
  axios.get(`${API}/hms/riskassessments`, { headers: getAuthHeaders() });

export const createRiskAssessment = (data) => 
  axios.post(`${API}/hms/riskassessments`, data, { headers: getAuthHeaders() });

export const getIncidents = () => 
  axios.get(`${API}/hms/incidents`, { headers: getAuthHeaders() });

export const createIncident = (data) => 
  axios.post(`${API}/hms/incidents`, data, { headers: getAuthHeaders() });

export const getTraining = () => 
  axios.get(`${API}/hms/training`, { headers: getAuthHeaders() });

export const createTraining = (data) => 
  axios.post(`${API}/hms/training`, data, { headers: getAuthHeaders() });

export const getEquipment = () => 
  axios.get(`${API}/hms/equipment`, { headers: getAuthHeaders() });

export const createEquipment = (data) => 
  axios.post(`${API}/hms/equipment`, data, { headers: getAuthHeaders() });

// Economy
export const getPayouts = () => 
  axios.get(`${API}/economy/payouts`, { headers: getAuthHeaders() });

export const createPayout = (data) => 
  axios.post(`${API}/economy/payouts`, data, { headers: getAuthHeaders() });

export const getServices = () => 
  axios.get(`${API}/economy/services`, { headers: getAuthHeaders() });

export const getService = (id) => 
  axios.get(`${API}/economy/services/${id}`, { headers: getAuthHeaders() });

export const createService = (data) => 
  axios.post(`${API}/economy/services`, data, { headers: getAuthHeaders() });

export const updateService = (id, data) => 
  axios.put(`${API}/economy/services/${id}`, data, { headers: getAuthHeaders() });

export const deleteService = (id) => 
  axios.delete(`${API}/economy/services/${id}`, { headers: getAuthHeaders() });

export const getSupplierPricing = () => 
  axios.get(`${API}/economy/supplier-pricing`, { headers: getAuthHeaders() });

export const createSupplierPricing = (data) => 
  axios.post(`${API}/economy/supplier-pricing`, data, { headers: getAuthHeaders() });

export const updateSupplierPricing = (id, data) => 
  axios.put(`${API}/economy/supplier-pricing/${id}`, data, { headers: getAuthHeaders() });

export const deleteSupplierPricing = (id) => 
  axios.delete(`${API}/economy/supplier-pricing/${id}`, { headers: getAuthHeaders() });

// Get service pricing for a customer by anleggsnr
export const getServicePricingForCustomer = (anleggsnr) => 
  axios.get(`${API}/customers/${anleggsnr}/service-pricing`, { headers: getAuthHeaders() });

// Dashboard
export const getDashboardStats = () => 
  axios.get(`${API}/dashboard/stats`, { headers: getAuthHeaders() });
