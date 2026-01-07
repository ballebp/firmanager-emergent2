import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Shield, X, Key, Calendar, Award } from 'lucide-react';
import axios from 'axios';
import { useLicense } from '../contexts/LicenseContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Settings = () => {
  const [users, setUsers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'user', password: 'user123' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { license, daysRemaining, tier, isExpired, setShowLicenseModal } = useLicense();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgResponse, usersResponse] = await Promise.all([
        axios.get(`${API}/organizations/me`, { headers: getAuthHeaders() }),
        axios.get(`${API}/organizations/users`, { headers: getAuthHeaders() })
      ]);
      setOrganization(orgResponse.data);
      setUsers(usersResponse.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await axios.post(`${API}/organizations/users/create`, newUser, { headers: getAuthHeaders() });
      setSuccess(`User ${newUser.email} added successfully!`);
      setNewUser({ email: '', name: '', role: 'user', password: 'user123' });
      setShowAddUser(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`${API}/organizations/users/${userId}/role?role=${newRole}`, {}, { headers: getAuthHeaders() });
      setSuccess('Role updated successfully');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to remove ${userEmail}?`)) {
      try {
        await axios.delete(`${API}/organizations/users/${userId}`, { headers: getAuthHeaders() });
        setSuccess('User removed successfully');
        fetchData();
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to remove user');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-900">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-800">Manage your organization and users</p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-2 rounded mb-4">
            {success}
          </div>
        )}

        <div className="bg-white rounded p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Shield className="mr-2" />
            Organization
          </h2>
          <div className="space-y-2">
            <p><span className="text-gray-800">Name:</span> <span className="font-medium">{organization?.name}</span></p>
            <p><span className="text-gray-800">Subscription:</span> <span className="font-medium capitalize">{organization?.subscription_tier}</span></p>
          </div>
        </div>

        {/* License Information */}
        <div className="bg-white rounded p-4 mb-6 border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Key className="mr-2 text-blue-600" />
            License Information
          </h2>
          
          {license ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">License Tier</p>
                  <p className="text-lg font-semibold capitalize flex items-center">
                    <Award className="mr-2 text-yellow-500" size={20} />
                    {tier}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-lg font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                    {isExpired ? 'Expired' : 'Active'}
                  </p>
                </div>

                {license.expires_at && (
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="text-lg font-medium flex items-center">
                      <Calendar className="mr-2 text-gray-500" size={20} />
                      {new Date(license.expires_at).toLocaleDateString()}
                      {!isExpired && daysRemaining !== null && (
                        <span className={`ml-2 text-sm ${daysRemaining <= 7 ? 'text-red-600' : 'text-gray-600'}`}>
                          ({daysRemaining} days left)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">License Key</p>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {license.license_key}
                  </p>
                </div>
              </div>

              {/* Feature Limits */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Your Plan Includes:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Customers</p>
                    <p className="text-xl font-bold text-blue-700">
                      {license.features?.max_customers === -1 ? 'Unlimited' : license.features?.max_customers || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Routes</p>
                    <p className="text-xl font-bold text-green-700">
                      {license.features?.max_routes === -1 ? 'Unlimited' : license.features?.max_routes || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Products</p>
                    <p className="text-xl font-bold text-purple-700">
                      {license.features?.max_products === -1 ? 'Unlimited' : license.features?.max_products || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-gray-600">HMS Module: 
                    <span className={`ml-2 font-semibold ${license.features?.hms_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {license.features?.hms_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </p>
                  {license.features?.multi_user && (
                    <p className="text-sm text-gray-600">Multi-User: 
                      <span className="ml-2 font-semibold text-green-600">Enabled</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Upgrade/Renew Buttons */}
              <div className="border-t border-gray-200 pt-4 mt-4 flex gap-3">
                {tier === 'trial' || tier === 'free' ? (
                  <button
                    onClick={() => window.open('https://vmpnordic.com/pricing', '_blank')}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Upgrade to Pro
                  </button>
                ) : null}
                {isExpired || (daysRemaining && daysRemaining <= 7) ? (
                  <button
                    onClick={() => setShowLicenseModal(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-semibold"
                  >
                    Renew License
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">No active license found</p>
              <button
                onClick={() => setShowLicenseModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Activate License
              </button>
            </div>
          )}
        </div>

        <div className="bg-gray-100 rounded p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Users className="mr-2" />
              Users ({users.length})
            </h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <Plus className="mr-2" size={20} />
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Email</th>
                  <th className="text-left py-2 px-4">Role</th>
                  <th className="text-right py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="py-2 px-4">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded px-2 py-1">
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="trial">Trial</option>
                        <option value="free">Free</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-4 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Add New User</h3>
                <button
                  onClick={() => setShowAddUser(false)}
                  className="text-gray-800 hover:text-gray-900">
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    required
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                    required
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="trial">Trial</option>
                    <option value="free">Free</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Temporary Password *</label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                    placeholder="user123"
                  />
                  <p className="text-xs text-gray-800 mt-1">User should change this on first login</p>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors">
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;



