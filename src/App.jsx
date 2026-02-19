// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // <-- 1. Importamos el Toaster

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NewBooking from './pages/NewBooking';
import Inventory from './pages/Inventory';
import AdminPanel from './pages/AdminPanel';
import Layout from './components/Layout';

export default function App() {
  return (
    <>
      {/* 2. Configuramos las notificaciones globales */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1F1F2E', // bg-dark-elevated
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#CCFF00', // brand-lime
              secondary: '#000',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF3B30', // semantic-danger
              secondary: '#fff',
            },
          },
        }}
      />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* RUTAS PRIVADAS */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/profile" element={<Layout><Profile /></Layout>} />
          <Route path="/reservar" element={<Layout><NewBooking /></Layout>} />
          <Route path="/inventario" element={<Layout><Inventory /></Layout>} />
          <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}