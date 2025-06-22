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
    <div className="min-h-screen bg-gradient-to-br from-eco-blue to-eco-green flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-white mb-2">🌱 EcoTrace</h1>
          </Link>
          <h2 className="text-2xl font-bold text-white">
            Connexion à votre compte
          </h2>
          <p className="mt-2 text-white/80">
            Accédez à votre interface personnalisée
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-eco-blue hover:bg-gray-100 font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Comptes de test */}
          <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-white/80 text-sm mb-4">Comptes de test :</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="bg-white/10 p-2 rounded">
                <span className="text-white/60">Particulier:</span>
                <span className="text-white ml-1">particulier@test.com / test123</span>
              </div>
              <div className="bg-white/10 p-2 rounded">
                <span className="text-white/60">Entreprise:</span>
                <span className="text-white ml-1">entreprise@test.com / test123</span>
              </div>
              <div className="bg-white/10 p-2 rounded">
                <span className="text-white/60">Admin:</span>
                <span className="text-white ml-1">admin@test.com / test123</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retour à l'accueil */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-white/80 hover:text-white transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;