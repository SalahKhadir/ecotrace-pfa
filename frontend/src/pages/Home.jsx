import { Link } from 'react-router-dom';
import { USER_ROLES, ROLE_LABELS } from '../utils/constants';
import Logo from '../components/common/Logo';

const Home = () => {
  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <div className="home-nav">
          <div className="home-logo">
            <Logo size="large" className="home-logo" />
            <span className="home-subtitle">Gestion des déchets numériques</span>
          </div>
          <Link to="/login" className="home-login-btn">
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="hero-section">
        <h2 className="hero-title">
          Gérez vos déchets <br />
          <span className="hero-highlight">numériques</span> facilement
        </h2>
        <p className="hero-description">
          EcoTrace est une plateforme complète pour la gestion, le suivi et la traçabilité 
          de vos déchets électroniques. Chaque acteur a son interface dédiée pour une 
          expérience optimale.
        </p>
        
        <Link to="/login" className="hero-cta-btn">
          Commencer maintenant →
        </Link>

        {/* Types d'utilisateurs */}
        <div className="roles-section">
          <h3 className="roles-title">
            Une interface pour chaque acteur
          </h3>
          
          <div className="roles-grid">
            {/* Particulier */}
            <div className="role-card">
              <div className="role-icon">👤</div>
              <h4 className="role-title">{ROLE_LABELS[USER_ROLES.PARTICULIER]}</h4>
              <ul className="role-features">
                <li>• Remplir formulaire de collecte</li>
                <li>• Suivre ses collectes</li>
              </ul>
            </div>

            {/* Entreprise */}
            <div className="role-card">
              <div className="role-icon">🏢</div>
              <h4 className="role-title">{ROLE_LABELS[USER_ROLES.ENTREPRISE]}</h4>
              <ul className="role-features">
                <li>• Planifier collectes</li>
                <li>• Remplir formulaires</li>
                <li>• Suivre les collectes</li>
              </ul>
            </div>

            {/* Transporteur */}
            <div className="role-card">
              <div className="role-icon">🚛</div>
              <h4 className="role-title">{ROLE_LABELS[USER_ROLES.TRANSPORTEUR]}</h4>
              <ul className="role-features">
                <li>• Vérifier formulaires</li>
                <li>• Recevoir notifications</li>
                <li>• Confirmer réceptions</li>
              </ul>
            </div>

            {/* Technicien */}
            <div className="role-card">
              <div className="role-icon">🔧</div>
              <h4 className="role-title">{ROLE_LABELS[USER_ROLES.TECHNICIEN]}</h4>
              <ul className="role-features">
                <li>• Valoriser les déchets</li>
                <li>• Suivre traçabilité</li>
              </ul>
            </div>

            {/* Administrateur */}
            <div className="role-card">
              <div className="role-icon">⚙️</div>
              <h4 className="role-title">{ROLE_LABELS[USER_ROLES.ADMINISTRATEUR]}</h4>
              <ul className="role-features">
                <li>• Gérer profils</li>
                <li>• Gérer demandes</li>
                <li>• Planifier collectes</li>
                <li>• Superviser sous-traitants</li>
              </ul>
            </div>

            {/* Responsable Logistique */}
            <div className="role-card">
              <div className="role-icon">📊</div>
              <h4 className="role-title">{ROLE_LABELS[USER_ROLES.RESPONSABLE_LOGISTIQUE]}</h4>
              <ul className="role-features">
                <li>• Suivre traçabilité</li>
                <li>• Consulter rapports</li>
                <li>• Générer rapports</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="features-section">
          <h3 className="features-title">
            Fonctionnalités principales
          </h3>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h4 className="feature-title">Sécurisé</h4>
              <p className="feature-description">
                Authentification sécurisée et gestion des rôles pour chaque type d'utilisateur
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h4 className="feature-title">Traçable</h4>
              <p className="feature-description">
                Suivi complet de vos déchets de la collecte à la valorisation
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h4 className="feature-title">Efficace</h4>
              <p className="feature-description">
                Interface simple et rapide, adaptée à chaque rôle utilisateur
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <p className="footer-text">
            © 2024 EcoTrace - Système de gestion des déchets numériques
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;