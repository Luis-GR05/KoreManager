// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing'; // <--- Importamos Landing
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: LANDING PAGE */}
        <Route path="/" element={<Landing />} />

        {/* Ruta Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas Privadas (Con Layout) */}
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        
        {/* Redirección: Si alguien pone una ruta rara, que vaya a la Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}