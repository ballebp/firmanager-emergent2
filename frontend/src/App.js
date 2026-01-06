import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Invoicing from './pages/Invoicing';
import Internal from './pages/Internal';
import RoutePlanner from './pages/Routes';
import HMS from './pages/HMS';
import Products from './pages/Products';
import Results from './pages/Results';
import Economy from './pages/Economy';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/invoicing" element={<Invoicing />} />
                    <Route path="/internal" element={<Internal />} />
                    <Route path="/routes" element={<RoutePlanner />} />
                    <Route path="/hms" element={<HMS />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/results" element={<Results />} />
                    <Route path="/economy" element={<Economy />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
