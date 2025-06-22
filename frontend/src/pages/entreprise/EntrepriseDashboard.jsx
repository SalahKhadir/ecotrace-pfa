import '../../styles/EntrepriseDashboard.css';
import { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const EntrepriseDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole');
      
      if (!token || role !== 'ENTREPRISE') {
        navigate('/login');
        return;
      }

      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      setUser(userInfo);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="entreprise-dashboard">
      {/* Header */}
      <header className="entreprise-header">
        <div className="entreprise-header-content">
          <div className="entreprise-header-left">
            <h1 className="entreprise-logo">🌱 EcoTrace</h1>
            <div className="entreprise-user-badge">
              <span className="entreprise-user-role">🏢 Entreprise</span>
              <span className="entreprise-user-name">{user?.company_name || user?.username}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="entreprise-nav">
        <div className="entreprise-nav-content">
          <button 
            className={`entreprise-nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            📊 Tableau de bord
          </button>
          <button 
            className={`entreprise-nav-btn ${activeSection === 'formulaire' ? 'active' : ''}`}
            onClick={() => setActiveSection('formulaire')}
          >
            📝 Nouvelle demande
          </button>
          <button 
            className={`entreprise-nav-btn ${activeSection === 'mes-demandes' ? 'active' : ''}`}
            onClick={() => setActiveSection('mes-demandes')}
          >
            📋 Mes demandes
          </button>
          <button 
            className={`entreprise-nav-btn ${activeSection === 'suivi' ? 'active' : ''}`}
            onClick={() => setActiveSection('suivi')}
          >
            📍 Suivi collectes
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="entreprise-main">
        {activeSection === 'dashboard' && (
          <DashboardOverview user={user} setActiveSection={setActiveSection} />
        )}
        {activeSection === 'formulaire' && (
          <FormulaireEntrepriseSection user={user} onSuccess={() => setActiveSection('mes-demandes')} />
        )}
        {activeSection === 'mes-demandes' && (
          <MesDemandesSection user={user} />
        )}
        {activeSection === 'suivi' && (
          <SuiviCollectesSection user={user} />
        )}
      </main>
    </div>
  );
};

// Vue d'ensemble du dashboard
const DashboardOverview = ({ user, setActiveSection }) => {
  const [stats, setStats] = useState({
    totalDemandes: 0,
    demandesEnAttente: 0,
    collectesPlanifiees: 0,
    collectesTerminees: 0
  });
  const [activiteRecente, setActiviteRecente] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simuler des données pour l'instant
      setStats({
        totalDemandes: 12,
        demandesEnAttente: 3,
        collectesPlanifiees: 2,
        collectesTerminees: 7
      });
      
      setActiviteRecente([
        { type: 'formulaire', titre: 'Équipements informatiques', date: '2025-06-20', statut: 'EN_ATTENTE' },
        { type: 'collecte', titre: 'Collecte CO-001', date: '2025-06-18', statut: 'TERMINEE' },
        { type: 'formulaire', titre: 'Serveurs obsolètes', date: '2025-06-15', statut: 'VALIDE' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="section-loading">Chargement des données...</div>;
  }

  return (
    <div className="entreprise-dashboard-overview">
      <div className="entreprise-welcome">
        <h2>Bienvenue, {user?.company_name || user?.first_name}</h2>
        <p>Gérez vos déchets électroniques de manière professionnelle et responsable.</p>
      </div>

      {/* Statistiques */}
      <div className="entreprise-stats-grid">
        <div className="entreprise-stat-card primary">
          <div className="entreprise-stat-icon">📝</div>
          <div className="entreprise-stat-content">
            <h3>{stats.totalDemandes}</h3>
            <p>Demandes totales</p>
          </div>
        </div>
        
        <div className="entreprise-stat-card warning">
          <div className="entreprise-stat-icon">⏳</div>
          <div className="entreprise-stat-content">
            <h3>{stats.demandesEnAttente}</h3>
            <p>En attente de validation</p>
          </div>
        </div>
        
        <div className="entreprise-stat-card info">
          <div className="entreprise-stat-icon">📅</div>
          <div className="entreprise-stat-content">
            <h3>{stats.collectesPlanifiees}</h3>
            <p>Collectes planifiées</p>
          </div>
        </div>
        
        <div className="entreprise-stat-card success">
          <div className="entreprise-stat-icon">✅</div>
          <div className="entreprise-stat-content">
            <h3>{stats.collectesTerminees}</h3>
            <p>Collectes terminées</p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="entreprise-actions">
        <h3>Actions rapides</h3>
        <div className="entreprise-actions-grid">
          <button 
            className="entreprise-action-card nouvelle-demande"
            onClick={() => setActiveSection('formulaire')}
          >
            <div className="entreprise-action-icon">➕</div>
            <h4>Nouvelle demande de collecte</h4>
            <p>Planifier une collecte pour vos déchets électroniques</p>
          </button>
          
          <button 
            className="entreprise-action-card planning"
            onClick={() => setActiveSection('suivi')}
          >
            <div className="entreprise-action-icon">📅</div>
            <h4>Planifier une collecte</h4>
            <p>Organiser le ramassage selon vos créneaux</p>
          </button>
          
          <button 
            className="entreprise-action-card suivi"
            onClick={() => setActiveSection('mes-demandes')}
          >
            <div className="entreprise-action-icon">📊</div>
            <h4>Suivre mes demandes</h4>
            <p>Consulter l'état de vos demandes de collecte</p>
          </button>
        </div>
      </div>

      {/* Activité récente */}
      <div className="entreprise-activity">
        <h3>Activité récente</h3>
        {activiteRecente.length > 0 ? (
          <div className="entreprise-activity-list">
            {activiteRecente.map((item, index) => (
              <div key={index} className="entreprise-activity-item">
                <div className="entreprise-activity-info">
                  <h4>{item.titre}</h4>
                  <span className="entreprise-activity-date">
                    {new Date(item.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className={`entreprise-activity-status status-${item.statut.toLowerCase()}`}>
                  {getStatutLabel(item.statut)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="entreprise-empty-state">
            <p>Aucune activité récente</p>
            <button 
              className="entreprise-empty-state-button"
              onClick={() => setActiveSection('formulaire')}
            >
              Créer une nouvelle demande
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Formulaire de collecte spécifique entreprise
const FormulaireEntrepriseSection = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    type_dechets: '',
    description: '',
    quantite_estimee: '',
    mode_collecte: 'domicile', // Toujours collecte à domicile pour les entreprises
    date_souhaitee: '',
    heure_debut: '',
    heure_fin: '',
    adresse_collecte: user?.address || '',
    telephone: user?.phone || '',
    contact_sur_site: '',
    instructions_speciales: '',
    photo1: null,
    photo2: null,
    photo3: null
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState({});

  const typesDechetsEntreprise = [
    { value: 'ordinateur', label: 'Ordinateurs / Laptops' },
    { value: 'serveur', label: 'Serveurs / Équipements réseau' },
    { value: 'smartphone', label: 'Smartphones / Tablettes' },
    { value: 'imprimante', label: 'Imprimantes / Scanners' },
    { value: 'ecran', label: 'Écrans / Moniteurs' },
    { value: 'telephonie', label: 'Équipements téléphoniques' },
    { value: 'composants', label: 'Composants électroniques' },
    { value: 'electromenager', label: 'Électroménager professionnel' },
    { value: 'autres', label: 'Autres équipements' }
  ];

  const quantitesEntreprise = [
    { value: '1-10kg', label: '1-10 kg (petits équipements)' },
    { value: '10-50kg', label: '10-50 kg (équipements moyens)' },
    { value: '50-100kg', label: '50-100 kg (gros équipements)' },
    { value: '100-500kg', label: '100-500 kg (lot important)' },
    { value: '500kg+', label: 'Plus de 500 kg (déménagement/rénovation)' }
  ];

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotoPreviews(prev => ({ ...prev, [name]: e.target.result }));
        };
        reader.readAsDataURL(file);
      } else {
        setPhotoPreviews(prev => ({ ...prev, [name]: null }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validation spécifique entreprise
      if (!formData.heure_debut || !formData.heure_fin) {
        throw new Error('Les heures de début et fin sont obligatoires pour les entreprises');
      }

      if (formData.heure_debut >= formData.heure_fin) {
        throw new Error('L\'heure de fin doit être après l\'heure de début');
      }

      // Préparation des données pour l'API
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          if (key.startsWith('photo') && formData[key]) {
            submitData.append(key, formData[key]);
          } else if (!key.startsWith('photo')) {
            submitData.append(key, formData[key]);
          }
        }
      });

      // Ajouter les créneaux horaires formatés pour entreprise
      submitData.append('creneau_horaire', `${formData.heure_debut}-${formData.heure_fin}`);

      // Simuler l'envoi pour l'instant
      console.log('Données du formulaire entreprise:', Object.fromEntries(submitData));
      
      // const response = await wasteService.createFormulaire(submitData);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="entreprise-success-state">
        <div className="entreprise-success-icon">✅</div>
        <h3>Demande soumise avec succès !</h3>
        <p>Votre demande de collecte a été envoyée et sera traitée dans les plus brefs délais.</p>
        <p>Vous recevrez une confirmation par email avec les détails de la planification.</p>
      </div>
    );
  }

  return (
    <div className="entreprise-formulaire">
      <div className="entreprise-form-header">
        <h2>📝 Nouvelle demande de collecte</h2>
        <p>Planifiez la collecte de vos déchets électroniques d'entreprise</p>
      </div>

      <form onSubmit={handleSubmit} className="entreprise-form">
        {error && (
          <div className="entreprise-error-alert">
            <span className="entreprise-error-icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Informations sur les déchets */}
        <div className="entreprise-form-section">
          <h3>🗂️ Informations sur les déchets</h3>
          
          <div className="entreprise-form-group">
            <label htmlFor="type_dechets">Type d'équipements *</label>
            <select
              id="type_dechets"
              name="type_dechets"
              required
              value={formData.type_dechets}
              onChange={handleChange}
            >
              <option value="">Sélectionnez le type d'équipements</option>
              {typesDechetsEntreprise.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="entreprise-form-group">
            <label htmlFor="quantite_estimee">Quantité estimée *</label>
            <select
              id="quantite_estimee"
              name="quantite_estimee"
              required
              value={formData.quantite_estimee}
              onChange={handleChange}
            >
              <option value="">Sélectionnez la quantité</option>
              {quantitesEntreprise.map(quantite => (
                <option key={quantite.value} value={quantite.value}>{quantite.label}</option>
              ))}
            </select>
          </div>

          <div className="entreprise-form-group">
            <label htmlFor="description">Description détaillée *</label>
            <textarea
              id="description"
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez précisément les équipements à collecter (marques, modèles, quantités exactes, état, etc.)"
            />
          </div>
        </div>

        {/* Planification collecte */}
        <div className="entreprise-form-section">
          <h3>📅 Planification de la collecte</h3>
          
          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label htmlFor="date_souhaitee">Date souhaitée *</label>
              <input
                type="date"
                id="date_souhaitee"
                name="date_souhaitee"
                required
                value={formData.date_souhaitee}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="entreprise-form-group">
              <span className="entreprise-form-info">ℹ️ Mode de collecte: <strong>Collecte sur site entreprise</strong></span>
            </div>
          </div>

          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label htmlFor="heure_debut">Heure de début *</label>
              <input
                type="time"
                id="heure_debut"
                name="heure_debut"
                required
                value={formData.heure_debut}
                onChange={handleChange}
                min="08:00"
                max="18:00"
              />
              <small>Heure d'arrivée souhaitée de l'équipe de collecte</small>
            </div>

            <div className="entreprise-form-group">
              <label htmlFor="heure_fin">Heure de fin *</label>
              <input
                type="time"
                id="heure_fin"
                name="heure_fin"
                required
                value={formData.heure_fin}
                onChange={handleChange}
                min="09:00"
                max="19:00"
              />
              <small>Heure limite de présence sur site</small>
            </div>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="entreprise-form-section">
          <h3>📞 Informations de contact</h3>
          
          <div className="entreprise-form-group">
            <label htmlFor="adresse_collecte">Adresse de collecte *</label>
            <textarea
              id="adresse_collecte"
              name="adresse_collecte"
              required
              rows="3"
              value={formData.adresse_collecte}
              onChange={handleChange}
              placeholder="Adresse complète de l'entreprise (bâtiment, étage, service...)"
            />
          </div>

          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label htmlFor="telephone">Téléphone principal *</label>
              <input
                type="tel"
                id="telephone"
                name="telephone"
                required
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Numéro de l'entreprise"
              />
            </div>

            <div className="entreprise-form-group">
              <label htmlFor="contact_sur_site">Contact sur site</label>
              <input
                type="text"
                id="contact_sur_site"
                name="contact_sur_site"
                value={formData.contact_sur_site}
                onChange={handleChange}
                placeholder="Nom de la personne à contacter sur site"
              />
            </div>
          </div>

          <div className="entreprise-form-group">
            <label htmlFor="instructions_speciales">Instructions spéciales</label>
            <textarea
              id="instructions_speciales"
              name="instructions_speciales"
              rows="3"
              value={formData.instructions_speciales}
              onChange={handleChange}
              placeholder="Instructions particulières : accès sécurisé, badge nécessaire, étage, ascenseur de service, créneaux d'accès spécifiques..."
            />
          </div>
        </div>

        {/* Photos */}
        <div className="entreprise-form-section">
          <h3>📸 Photos (optionnel)</h3>
          <p className="section-subtitle">Ajoutez des photos pour faciliter l'estimation et la planification</p>
          
          <div className="entreprise-photos-grid">
            {[1, 2, 3].map(num => (
              <div key={num} className="entreprise-photo-upload">
                <input
                  type="file"
                  id={`photo${num}`}
                  name={`photo${num}`}
                  accept="image/*"
                  onChange={handleChange}
                  className="entreprise-photo-input"
                />
                <label htmlFor={`photo${num}`} className="entreprise-photo-label">
                  {photoPreviews[`photo${num}`] ? (
                    <img src={photoPreviews[`photo${num}`]} alt={`Aperçu ${num}`} className="entreprise-photo-preview" />
                  ) : (
                    <div className="entreprise-photo-placeholder">
                      <span className="entreprise-photo-icon">📷</span>
                      <span>Photo {num}</span>
                    </div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton de soumission */}
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={submitting}
            className="entreprise-submit-btn"
          >
            {submitting ? (
              <>
                <span className="loading-spinner"></span>
                Envoi en cours...
              </>
            ) : (
              '📤 Soumettre la demande'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Section mes demandes (similaire au particulier mais adaptée)
const MesDemandesSection = ({ user }) => {
  return (
    <div className="entreprise-placeholder">
      <h2>📋 Mes demandes de collecte</h2>
      <p>Cette section affichera la liste de toutes vos demandes de collecte avec leur statut.</p>
      <div className="entreprise-placeholder-content">
        <div className="entreprise-placeholder-card">
          <h3>Fonctionnalité en développement</h3>
          <p>Vous pourrez bientôt consulter et gérer toutes vos demandes depuis cette interface.</p>
        </div>
      </div>
    </div>
  );
};

// Section suivi collectes
const SuiviCollectesSection = ({ user }) => {
  return (
    <div className="entreprise-placeholder">
      <h2>📍 Suivi des collectes</h2>
      <p>Suivez en temps réel l'état d'avancement de vos collectes planifiées.</p>
      <div className="entreprise-placeholder-content">
        <div className="entreprise-placeholder-card">
          <h3>Fonctionnalité en développement</h3>
          <p>Vous pourrez bientôt suivre vos collectes en temps réel avec notifications.</p>
        </div>
      </div>
    </div>
  );
};

// Fonction utilitaire pour les statuts
const getStatutLabel = (statut) => {
  const statuts = {
    'SOUMIS': 'Soumis',
    'EN_ATTENTE': 'En attente',
    'VALIDE': 'Validé',
    'REJETE': 'Rejeté',
    'EN_COURS': 'En cours',
    'TERMINEE': 'Terminé',
    'PLANIFIEE': 'Planifiée',
    'ANNULEE': 'Annulée'
  };
  return statuts[statut] || statut;
};

export default EntrepriseDashboard;