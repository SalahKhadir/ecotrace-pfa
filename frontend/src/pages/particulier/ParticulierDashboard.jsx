import { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ParticulierDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    if (!token || role !== 'PARTICULIER') {
      navigate('/login');
      return;
    }

    // Simuler les données utilisateur (remplacer par un appel API)
    setUser({
      name: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      role: 'PARTICULIER'
    });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-eco-dark">🌱 EcoTrace</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Particulier
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Bonjour, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord Particulier
          </h2>
          <p className="text-gray-600">
            Gérez vos demandes de collecte et suivez vos déchets électroniques
          </p>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-eco-green/10 p-3 rounded-lg">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">
                Nouvelle collecte
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Remplissez un formulaire pour programmer une collecte de vos déchets électroniques
            </p>
            <button className="w-full bg-eco-green hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
              Remplir formulaire de collecte
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-eco-blue/10 p-3 rounded-lg">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 ml-4">
                Suivre collectes
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Consultez le statut de vos demandes de collecte en cours
            </p>
            <button className="w-full bg-eco-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              Voir mes collectes
            </button>
          </div>
        </div>

        {/* Historique récent */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Mes collectes récentes
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Exemple de collecte */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <span className="text-green-600 font-semibold">✓</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Collecte #001</p>
                    <p className="text-sm text-gray-600">Ordinateur portable + accessoires</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">Terminée</p>
                  <p className="text-xs text-gray-500">15 déc. 2024</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <span className="text-yellow-600 font-semibold">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">Collecte #002</p>
                    <p className="text-sm text-gray-600">Smartphones et tablettes</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-600">En cours</p>
                  <p className="text-xs text-gray-500">22 déc. 2024</p>
                </div>
              </div>

              <div className="text-center py-8 text-gray-500">
                <p>Aucune autre collecte pour le moment</p>
                <button className="mt-2 text-eco-green hover:text-green-600 font-medium">
                  Programmer une nouvelle collecte
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParticulierDashboard;