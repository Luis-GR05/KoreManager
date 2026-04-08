// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NewBooking from './pages/NewBooking';
import BookingHistory from './pages/BookingHistory';
import Inventory from './pages/Inventory';
import AdminPanel from './pages/AdminPanel';
import Estadisticas from './pages/Estadisticas';
import Layout from './components/Layout';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1F1F2E',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '1rem',
          },
          success: { iconTheme: { primary: '#CCFF00', secondary: '#000' } },
          error:   { iconTheme: { primary: '#FF3B30', secondary: '#fff' } },
        }}
      />

      <BrowserRouter>
        <Routes>
          {/* RUTAS PÚBLICAS */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* RUTAS PRIVADAS - todos los usuarios autenticados */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reservar" element={
            <ProtectedRoute>
              <Layout><NewBooking /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/historial" element={
            <ProtectedRoute>
              <Layout><BookingHistory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/estadisticas" element={
            <ProtectedRoute>
              <Layout><Estadisticas /></Layout>
            </ProtectedRoute>
          } />

          {/* RUTAS PRIVADAS - solo conserje y admin */}
          <Route path="/inventario" element={
            <ProtectedRoute allowedRoles={['conserje', 'admin']}>
              <Layout><Inventory /></Layout>
            </ProtectedRoute>
          } />

          {/* RUTAS PRIVADAS - solo admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminPanel /></Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}