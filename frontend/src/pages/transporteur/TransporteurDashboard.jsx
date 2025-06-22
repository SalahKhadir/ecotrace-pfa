import { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const TransporteurDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'TRANSPORTEUR') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-eco-dark">🌱 EcoTrace</h1>
            <span className="ml-4 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
              Transporteur
            </span>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard Transporteur</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4">✅ Vérifier formulaires</h3>
            <button className="w-full bg-eco-green text-white py-2 rounded-lg">
              Voir formulaires
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4">🔔 Notifications</h3>
            <button className="w-full bg-eco-blue text-white py-2 rounded-lg">
              Voir notifications
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4">📦 Confirmer réception</h3>
            <button className="w-full bg-orange-500 text-white py-2 rounded-lg">
              Confirmer
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransporteurDashboard;