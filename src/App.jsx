import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Login */}
        <Route path="/login" element={<Login />} />
        
        {/* Ruta Dashboard */}
        <Route path="/dashboard" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;