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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Stocker les tokens et le rôle
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('userRole', response.user.role);
      
      // Rediriger vers le dashboard approprié
      const userRole = response.user.role;
      const dashboardRoute = ROLE_ROUTES[userRole] || '/dashboard';
      navigate(dashboardRoute);
      
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Erreur de connexion. Vérifiez vos identifiants.'
      );
    } finally {
      setLoading(false);
    }
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Comptes de test */}
          <div className="test-accounts">
            <p className="test-accounts-title">Comptes de test :</p>
            <div className="test-accounts-grid">
              <div className="test-account-item">
                <span className="test-account-role">Particulier:</span>
                <span className="test-account-credentials">particulier@test.com / test123</span>
              </div>
              <div className="test-account-item">
                <span className="test-account-role">Entreprise:</span>
                <span className="test-account-credentials">entreprise@test.com / test123</span>
              </div>
              <div className="test-account-item">
                <span className="test-account-role">Admin:</span>
                <span className="test-account-credentials">admin@test.com / test123</span>
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