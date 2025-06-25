import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';
import Logo from '../../components/common/Logo';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: '',
    // Champs spécifiques pour les entreprises
    company_name: '',
    company_address: '',
    company_phone: '',
    siret: '',
    // Champs spécifiques pour les particuliers
    phone: '',
    address: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Effacer les messages quand l'utilisateur tape
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    // Validation basique
    if (!formData.username.trim()) {
      setError('Le nom d\'utilisateur est requis');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('L\'email est requis');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Veuillez entrer un email valide');
      return false;
    }
    
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    if (!formData.first_name.trim()) {
      setError('Le prénom est requis');
      return false;
    }
    
    if (!formData.last_name.trim()) {
      setError('Le nom est requis');
      return false;
    }
    
    if (!formData.role) {
      setError('Veuillez sélectionner un type de compte');
      return false;
    }
    
    // Validation spécifique pour les entreprises
    if (formData.role === 'ENTREPRISE') {
      if (!formData.company_name.trim()) {
        setError('Le nom de l\'entreprise est requis');
        return false;
      }
      if (!formData.siret.trim()) {
        setError('Le numéro SIRET est requis');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Tentative d\'inscription avec:', formData.email);
      
      // Préparer les données à envoyer
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };
      
      // Ajouter les champs spécifiques selon le rôle
      if (formData.role === 'ENTREPRISE') {
        userData.company_name = formData.company_name;
        userData.company_address = formData.company_address;
        userData.company_phone = formData.company_phone;
        userData.siret = formData.siret;
      } else if (formData.role === 'PARTICULIER') {
        userData.phone = formData.phone;
        userData.address = formData.address;
      }
      
      const response = await authService.register(userData);
      
      console.log('Réponse d\'inscription:', response);
      
      if (formData.role === 'PARTICULIER') {
        // Pour les particuliers, connexion automatique
        setSuccess('Compte créé avec succès ! Connexion en cours...');
        
        // Connexion automatique
        try {
          const loginResponse = await authService.login(formData.email, formData.password);
          
          // Stocker les tokens et informations utilisateur
          localStorage.setItem('accessToken', loginResponse.access);
          localStorage.setItem('refreshToken', loginResponse.refresh);
          localStorage.setItem('userRole', loginResponse.user.role);
          localStorage.setItem('userInfo', JSON.stringify(loginResponse.user));
          
          // Rediriger vers le dashboard particulier
          setTimeout(() => {
            navigate('/dashboard/particulier');
          }, 1500);
          
        } catch (loginError) {
          console.error('Erreur lors de la connexion automatique:', loginError);
          setSuccess('Compte créé avec succès ! Veuillez vous connecter.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
        
      } else if (formData.role === 'ENTREPRISE') {
        // Pour les entreprises, attendre validation de l'admin
        setSuccess('Compte entreprise créé avec succès ! Votre compte est en attente de validation par un administrateur. Vous recevrez un email de confirmation une fois votre compte activé.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Gestion des erreurs spécifiques
        if (errorData.username) {
          setError('Ce nom d\'utilisateur est déjà utilisé');
        } else if (errorData.email) {
          setError('Cette adresse email est déjà utilisée');
        } else if (errorData.password) {
          setError('Le mot de passe ne respecte pas les critères requis');
        } else {
          setError(errorData.detail || errorData.message || 'Une erreur est survenue lors de l\'inscription');
        }
      } else {
        setError('Impossible de créer le compte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-section">
          <div className="register-header">
            <Logo />
            <h1>Créer un compte</h1>
            <p>Rejoignez EcoTrace pour une gestion écologique des déchets</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Informations personnelles */}
            <div className="form-section">
              <h3>Informations personnelles</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="first_name">Prénom *</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    placeholder="Votre prénom"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="last_name">Nom *</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Nom d'utilisateur *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choisissez un nom d'utilisateur"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="votre.email@exemple.com"
                />
              </div>
            </div>

            {/* Type de compte */}
            <div className="form-section">
              <h3>Type de compte</h3>
              
              <div className="role-selection">
                <div className="role-option">
                  <input
                    type="radio"
                    id="particulier"
                    name="role"
                    value="PARTICULIER"
                    checked={formData.role === 'PARTICULIER'}
                    onChange={handleChange}
                  />
                  <label htmlFor="particulier" className="role-label">
                    <div className="role-icon">🏠</div>
                    <div className="role-info">
                      <h4>Particulier</h4>
                      <p>Pour les individus souhaitant gérer leurs déchets domestiques</p>
                      <small>✅ Accès immédiat après inscription</small>
                    </div>
                  </label>
                </div>
                
                <div className="role-option">
                  <input
                    type="radio"
                    id="entreprise"
                    name="role"
                    value="ENTREPRISE"
                    checked={formData.role === 'ENTREPRISE'}
                    onChange={handleChange}
                  />
                  <label htmlFor="entreprise" className="role-label">
                    <div className="role-icon">🏢</div>
                    <div className="role-info">
                      <h4>Entreprise</h4>
                      <p>Pour les entreprises gérant des déchets professionnels</p>
                      <small>⏳ Validation administrateur requise</small>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Champs spécifiques aux entreprises */}
            {formData.role === 'ENTREPRISE' && (
              <div className="form-section">
                <h3>Informations entreprise</h3>
                
                <div className="form-group">
                  <label htmlFor="company_name">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    placeholder="Nom de votre entreprise"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="siret">Numéro SIRET *</label>
                  <input
                    type="text"
                    id="siret"
                    name="siret"
                    value={formData.siret}
                    onChange={handleChange}
                    required
                    placeholder="14 chiffres"
                    maxLength="14"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company_address">Adresse de l'entreprise</label>
                  <textarea
                    id="company_address"
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Adresse complète de votre entreprise"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company_phone">Téléphone de l'entreprise</label>
                  <input
                    type="tel"
                    id="company_phone"
                    name="company_phone"
                    value={formData.company_phone}
                    onChange={handleChange}
                    placeholder="Numéro de téléphone"
                  />
                </div>
              </div>
            )}

            {/* Champs spécifiques aux particuliers */}
            {formData.role === 'PARTICULIER' && (
              <div className="form-section">
                <h3>Informations complémentaires</h3>
                
                <div className="form-group">
                  <label htmlFor="phone">Téléphone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Votre numéro de téléphone"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Adresse</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Votre adresse complète"
                  />
                </div>
              </div>
            )}

            {/* Mot de passe */}
            <div className="form-section">
              <h3>Sécurité</h3>
              
              <div className="form-group">
                <label htmlFor="password">Mot de passe *</label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Au moins 8 caractères"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <small>Le mot de passe doit contenir au moins 8 caractères</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
                <div className="password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Répétez votre mot de passe"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            </div>

            {/* Messages d'erreur et de succès */}
            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {success}
              </div>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>
              Vous avez déjà un compte ? 
              <Link to="/login" className="login-link">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <div className="register-info-section">
          <div className="info-content">
            <h2>Pourquoi rejoindre EcoTrace ?</h2>
            <div className="features">
              <div className="feature">
                <div className="feature-icon">🌱</div>
                <h3>Écologique</h3>
                <p>Contribuez à la protection de l'environnement en gérant vos déchets de manière responsable</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📱</div>
                <h3>Simple</h3>
                <p>Interface intuitive pour planifier et suivre vos collectes de déchets</p>
              </div>
              <div className="feature">
                <div className="feature-icon">🚛</div>
                <h3>Efficace</h3>
                <p>Réseau de transporteurs et centres de traitement pour une gestion optimale</p>
              </div>
              <div className="feature">
                <div className="feature-icon">📊</div>
                <h3>Traçable</h3>
                <p>Suivi complet de vos déchets de la collecte à la valorisation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
