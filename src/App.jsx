import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Páginas con Lazy Loading para mejorar rendimiento (code splitting)
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AvisoLegal = lazy(() => import('./pages/legal/AvisoLegal'));
const Privacidad = lazy(() => import('./pages/legal/Privacidad'));
const Cookies = lazy(() => import('./pages/legal/Cookies'));
const Terminos = lazy(() => import('./pages/legal/Terminos'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const NewBooking = lazy(() => import('./pages/NewBooking'));
const BookingHistory = lazy(() => import('./pages/BookingHistory'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const Inventory = lazy(() => import('./pages/Inventory'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Estadisticas = lazy(() => import('./pages/Estadisticas'));

/**
 * Spinner de carga minimalista para las transiciones entre páginas
 */
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F1A]">
    <div className="w-10 h-10 rounded-full border-4 border-[#CCFF00]/20 border-t-[#CCFF00] animate-spin"></div>
  </div>
);

/**
 * Componente raíz de la app:
 * - configura providers (Auth + Toaster)
 * - define el routing (público/privado) con `react-router-dom`
 *
 * @returns {import('react').JSX.Element}
 */
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/legal/aviso-legal" element={<AvisoLegal />} />
            <Route path="/legal/privacidad" element={<Privacidad />} />
            <Route path="/legal/cookies" element={<Cookies />} />
            <Route path="/legal/terminos" element={<Terminos />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/pago/exito" element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            } />
            <Route path="/pago/cancelado" element={
              <ProtectedRoute>
                <PaymentCancel />
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
            <Route path="/checkout/:id" element={
              <ProtectedRoute>
                <Layout><CheckoutPage /></Layout>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}