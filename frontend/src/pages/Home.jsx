import { Link } from 'react-router-dom';
import { USER_ROLES, ROLE_LABELS } from '../utils/constants';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-eco-blue to-eco-green">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-eco-dark">🌱 EcoTrace</h1>
              <span className="ml-3 text-sm text-gray-600">Gestion des déchets numériques</span>
            </div>
            <Link
              to="/login"
              className="bg-eco-green hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Gérez vos déchets <br />
            <span className="text-yellow-300">numériques</span> facilement
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto">
            EcoTrace est une plateforme complète pour la gestion, le suivi et la traçabilité 
            de vos déchets électroniques. Chaque acteur a son interface dédiée pour une 
            expérience optimale.
          </p>
          
          <Link
            to="/login"
            className="bg-white text-eco-blue hover:bg-gray-100 px-8 py-4 rounded-lg font-bold text-lg transition-colors inline-block"
          >
            Commencer maintenant →
          </Link>
        </div>

        {/* Types d'utilisateurs */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            Une interface pour chaque acteur
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Particulier */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">👤</div>
              <h4 className="text-xl font-bold mb-3">{ROLE_LABELS[USER_ROLES.PARTICULIER]}</h4>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Remplir formulaire de collecte</li>
                <li>• Suivre ses collectes</li>
              </ul>
            </div>

            {/* Entreprise */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">🏢</div>
              <h4 className="text-xl font-bold mb-3">{ROLE_LABELS[USER_ROLES.ENTREPRISE]}</h4>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Planifier collectes</li>
                <li>• Remplir formulaires</li>
                <li>• Suivre les collectes</li>
              </ul>
            </div>

            {/* Transporteur */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">🚛</div>
              <h4 className="text-xl font-bold mb-3">{ROLE_LABELS[USER_ROLES.TRANSPORTEUR]}</h4>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Vérifier formulaires</li>
                <li>• Recevoir notifications</li>
                <li>• Confirmer réceptions</li>
              </ul>
            </div>

            {/* Technicien */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">🔧</div>
              <h4 className="text-xl font-bold mb-3">{ROLE_LABELS[USER_ROLES.TECHNICIEN]}</h4>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Valoriser les déchets</li>
                <li>• Suivre traçabilité</li>
              </ul>
            </div>

            {/* Administrateur */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">⚙️</div>
              <h4 className="text-xl font-bold mb-3">{ROLE_LABELS[USER_ROLES.ADMINISTRATEUR]}</h4>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Gérer profils</li>
                <li>• Gérer demandes</li>
                <li>• Planifier collectes</li>
                <li>• Superviser sous-traitants</li>
              </ul>
            </div>

            {/* Responsable Logistique */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-bold mb-3">{ROLE_LABELS[USER_ROLES.RESPONSABLE_LOGISTIQUE]}</h4>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Suivre traçabilité</li>
                <li>• Consulter rapports</li>
                <li>• Générer rapports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-white mb-12">
            Fonctionnalités principales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white">
              <div className="text-5xl mb-4">🔒</div>
              <h4 className="text-xl font-bold mb-3">Sécurisé</h4>
              <p className="text-white/80">
                Authentification sécurisée et gestion des rôles pour chaque type d'utilisateur
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white">
              <div className="text-5xl mb-4">📍</div>
              <h4 className="text-xl font-bold mb-3">Traçable</h4>
              <p className="text-white/80">
                Suivi complet de vos déchets de la collecte à la valorisation
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-white">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="text-xl font-bold mb-3">Efficace</h4>
              <p className="text-white/80">
                Interface simple et rapide, adaptée à chaque rôle utilisateur
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-eco-dark text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 EcoTrace - Système de gestion des déchets numériques
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;