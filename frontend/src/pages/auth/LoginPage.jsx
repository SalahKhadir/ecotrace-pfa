import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import { ROLE_ROUTES } from '../../utils/constants';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Tentative de connexion avec:', formData.email);
      
      const response = await authService.login(formData.email, formData.password);
      
      console.log('Réponse de connexion:', response);
      
      // Stocker les tokens et informations utilisateur
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userInfo', JSON.stringify(response.user));
      
      // Rediriger vers le dashboard approprié
      const userRole = response.user.role;
      const dashboardRoute = ROLE_ROUTES[userRole] || '/dashboard';
      
      console.log('Redirection vers:', dashboardRoute);
      navigate(dashboardRoute);
      
    } catch (err) {
      console.error('Erreur de connexion:', err);
      
      let errorMessage = 'Erreur de connexion. Vérifiez vos identifiants.';
      
      if (err.response?.data) {
        // Erreur du serveur Django
        const serverError = err.response.data;
        
        if (typeof serverError === 'string') {
          errorMessage = serverError;
        } else if (serverError.detail) {
          errorMessage = serverError.detail;
        } else if (serverError.non_field_errors) {
          errorMessage = serverError.non_field_errors[0];
        } else if (serverError.email) {
          errorMessage = `Email: ${serverError.email[0]}`;
        } else if (serverError.password) {
          errorMessage = `Mot de passe: ${serverError.password[0]}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour tester avec un compte prédéfini
  const quickLogin = (email) => {
    setFormData({
      email: email,
      password: 'test123'
    });
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <Link to="/" className="login-logo">
            <h1 className="login-title">🌱 EcoTrace</h1>
          </Link>
          <h2 className="login-subtitle">
            Connexion à votre compte
          </h2>
          <p className="login-description">
            Accédez à votre interface personnalisée
          </p>
        </div>

        {/* Formulaire */}
        <div className="login-form-container">
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
            >
              {loading ? (
                <span>
                  <span className="spinner-eco"></span>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Comptes de test */}
          <div className="test-accounts">
            <p className="test-accounts-title">Comptes de test - Cliquez pour remplir automatiquement :</p>
            <div className="test-accounts-grid">
              <div className="test-account-item" onClick={() => quickLogin('particulier@test.com')}>
                <span className="test-account-role">Particulier:</span>
                <span className="test-account-credentials">particulier@test.com / test123</span>
              </div>
              <div className="test-account-item" onClick={() => quickLogin('entreprise@test.com')}>
                <span className="test-account-role">Entreprise:</span>
                <span className="test-account-credentials">entreprise@test.com / test123</span>
              </div>
              <div className="test-account-item" onClick={() => quickLogin('transporteur@test.com')}>
                <span className="test-account-role">Transporteur:</span>
                <span className="test-account-credentials">transporteur@test.com / test123</span>
              </div>
              <div className="test-account-item" onClick={() => quickLogin('technicien@test.com')}>
                <span className="test-account-role">Technicien:</span>
                <span className="test-account-credentials">technicien@test.com / test123</span>
              </div>
              <div className="test-account-item" onClick={() => quickLogin('admin@test.com')}>
                <span className="test-account-role">Admin:</span>
                <span className="test-account-credentials">admin@test.com / test123</span>
              </div>
              <div className="test-account-item" onClick={() => quickLogin('logistique@test.com')}>
                <span className="test-account-role">Logistique:</span>
                <span className="test-account-credentials">logistique@test.com / test123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retour à l'accueil */}
        <div className="login-back-link">
          <Link to="/">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;