import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import NotificationCenter from '../../components/common/NotificationCenter';
import { notificationService } from '../../services/notificationService';
import '../../styles/EntrepriseDashboard.css';

const EntrepriseDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedFormulaire, setSelectedFormulaire] = useState(null); // Pour planifier depuis un formulaire
  const [loading, setLoading] = useState(true);
  const [collectes, setCollectes] = useState([]);
  const [formulaires, setFormulaires] = useState([]);
  const [stats, setStats] = useState({});
  const [sidebarNotifications, setSidebarNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole');
      const userInfo = localStorage.getItem('userInfo');

      if (!token || role !== 'ENTREPRISE') {
        navigate('/login');
        return;
      }

      try {
        // Charger les informations utilisateur depuis localStorage
        if (userInfo) {
          setUser(JSON.parse(userInfo));
        }

        // Charger les données depuis l'API
        await Promise.all([
          loadCollectes(),
          loadFormulaires(),
          loadStats()
        ]);

      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

  // Effect to track notifications for sidebar badge
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        await notificationService.initialize();
        await notificationService.loadNotifications('ENTREPRISE');
        const unsubscribe = notificationService.addListener(setSidebarNotifications);
        
        // Start polling for new notifications
        notificationService.startPolling();
        
        return unsubscribe;
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    const unsubscribePromise = loadNotifications();
    
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
      notificationService.stopPolling();
    };
  }, []);

  const loadCollectes = async () => {
    try {
      const data = await wasteService.getMesCollectes();
      setCollectes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des collectes:', error);
      setCollectes([]);
    }
  };

  const loadFormulaires = async () => {
    try {
      const data = await wasteService.getMesFormulaires();
      setFormulaires(data);
    } catch (error) {
      console.error('Erreur lors du chargement des formulaires:', error);
      setFormulaires([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await wasteService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      setStats({
        formulaires_total: 0,
        formulaires_en_attente: 0,
        collectes_total: 0,
        collectes_en_cours: 0,
        collectes_terminees: 0
      });
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/');
    }
  };

  const refreshData = async () => {
    await Promise.all([
      loadCollectes(),
      loadFormulaires(),
      loadStats()
    ]);
  };

  if (loading) {
    return (
      <div className="entreprise-dashboard">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280' }}>Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="entreprise-dashboard">
      {/* Header */}
      <header className="entreprise-header">        <div className="entreprise-header-content">
        <div className="entreprise-header-left">
          <Logo className="entreprise-logo" size="medium" showText={true} />
          <div className="entreprise-user-badge">
            <span className="entreprise-user-role">
              🏢 Entreprise
            </span>
          </div>
        </div>

        <div className="entreprise-user-badge">
          <NotificationCenter userRole="ENTREPRISE" showAsDropdown={true} />
          <span className="entreprise-user-name">
            Bonjour, {user.company_name || user.first_name || user.username}
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </div>
      </header>

      {/* Navigation */}
      <nav className="entreprise-nav">
        <div className="entreprise-nav-content">
          <button
            className={`entreprise-nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📊 Vue d'ensemble
          </button>
          <button
            className={`entreprise-nav-btn ${activeSection === 'formulaire' ? 'active' : ''}`}
            onClick={() => setActiveSection('formulaire')}
          >
            📝 Nouveau formulaire
          </button>
          <button
            className={`entreprise-nav-btn ${activeSection === 'collectes' ? 'active' : ''}`}
            onClick={() => setActiveSection('collectes')}
          >
            📋 Mes collectes
          </button>
          <button
            className={`entreprise-nav-btn ${activeSection === 'formulaires' ? 'active' : ''}`}
            onClick={() => setActiveSection('formulaires')}
          >
            📄 Mes formulaires
          </button>
          <button
            className={`entreprise-nav-btn ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            🔔 Notifications
            {sidebarNotifications.filter(n => !(n.read || n.is_read)).length > 0 && (
              <span className="notification-badge">
                {sidebarNotifications.filter(n => !(n.read || n.is_read)).length}
              </span>
            )}
          </button>
          <button
            className={`entreprise-nav-btn ${activeSection === 'profil' ? 'active' : ''}`}
            onClick={() => setActiveSection('profil')}
          >
            🏢 Profil entreprise
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="entreprise-main">
        {activeSection === 'overview' && (
          <OverviewSection
            user={user}
            collectes={collectes}
            formulaires={formulaires}
            stats={stats}
            setActiveSection={setActiveSection}
          />
        )}

        {activeSection === 'planifier' && (
          <PlanifierCollecteSection
            user={user}
            selectedFormulaire={selectedFormulaire}
            onSuccess={() => {
              setActiveSection('collectes');
              setSelectedFormulaire(null);
              refreshData();
            }}
            onCancel={() => {
              setSelectedFormulaire(null);
              setActiveSection('formulaires');
            }}
          />
        )}

        {activeSection === 'formulaire' && (
          <FormulaireSection
            user={user}
            onSuccess={() => {
              setActiveSection('formulaires');
              refreshData();
            }}
          />
        )}

        {activeSection === 'collectes' && (
          <CollectesSection collectes={collectes} setActiveSection={setActiveSection} />
        )}

        {activeSection === 'formulaires' && (
          <FormulairesSection
            formulaires={formulaires}
            onRefresh={refreshData}
            setActiveSection={setActiveSection}
            onPlanifierCollecte={(formulaire) => {
              setSelectedFormulaire(formulaire);
              setActiveSection('planifier');
            }}
          />
        )}

        {activeSection === 'notifications' && (
          <div className="notifications-section">
            <div className="section-header">
              <h2>Centre de Notifications</h2>
              <p>Toutes vos notifications en temps réel</p>
            </div>
            <NotificationCenter userRole="ENTREPRISE" showAsDropdown={false} />
          </div>
        )}

        {activeSection === 'profil' && (
          <ProfilEntrepriseSection user={user} setUser={setUser} />
        )}
      </main>
    </div>
  );
};

// Section Vue d'ensemble
const OverviewSection = ({ user, collectes, formulaires, stats, setActiveSection }) => (
  <div>
    <div className="entreprise-welcome">
      <h2>Tableau de bord entreprise</h2>
      <p>Gérez efficacement vos demandes de collecte et suivez vos déchets numériques</p>
    </div>

    {/* Statistiques */}
    <div className="entreprise-stats-grid">
      <div className="entreprise-stat-card primary">
        <div className="entreprise-stat-icon">📝</div>
        <div className="entreprise-stat-content">
          <h3>{stats.formulaires_total || 0}</h3>
          <p>Formulaires soumis<br />{stats.formulaires_en_attente || 0} en attente</p>
        </div>
      </div>

      <div className="entreprise-stat-card info">
        <div className="entreprise-stat-icon">📋</div>
        <div className="entreprise-stat-content">
          <h3>{stats.collectes_total || 0}</h3>
          <p>Collectes planifiées<br />{stats.collectes_en_cours || 0} en cours</p>
        </div>
      </div>

      <div className="entreprise-stat-card success">
        <div className="entreprise-stat-icon">✅</div>
        <div className="entreprise-stat-content">
          <h3>{stats.collectes_terminees || 0}</h3>
          <p>Collectes terminées<br />Cette année</p>
        </div>
      </div>

      <div className="entreprise-stat-card warning">
        <div className="entreprise-stat-icon">⏱️</div>
        <div className="entreprise-stat-content">
          <h3>{stats.formulaires_en_attente || 0}</h3>
          <p>Demandes en cours<br />À traiter</p>
        </div>
      </div>
    </div>

    {/* Actions rapides */}
    <div className="entreprise-actions">
      <h3>Actions rapides</h3>
      <div className="entreprise-actions-grid">

        <div
          className="entreprise-action-card planning"
          onClick={() => setActiveSection('formulaire')}
        >
          <div className="entreprise-action-icon">📝</div>
          <h4>Demander une collecte</h4>
          <p>Remplir un formulaire de demande de collecte</p>
        </div>

        <div
          className="entreprise-action-card planning"
          onClick={() => setActiveSection('collectes')}
        >
          <div className="entreprise-action-icon">📋</div>
          <h4>Suivre mes collectes</h4>
          <p>Consulter l'état d'avancement de vos collectes</p>
        </div>

        <div
          className="entreprise-action-card suivi"
          onClick={() => alert('Fonctionnalité en cours de développement')}
        >
          <div className="entreprise-action-icon">📊</div>
          <h4>Rapports</h4>
          <p>Télécharger vos rapports de traçabilité</p>
        </div>
      </div>
    </div>

    {/* Activité récente */}
    <div className="entreprise-activity">
      <h3>Activité récente</h3>
      {formulaires.length > 0 ? (
        <div className="entreprise-activity-list">
          {formulaires.slice(0, 5).map((formulaire, index) => (
            <div key={index} className="entreprise-activity-item">
              <div className="entreprise-activity-info">
                <h4>Formulaire #{formulaire.reference}</h4>
                <p className="entreprise-activity-date">
                  {formulaire.type_dechets} - {new Date(formulaire.date_creation).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span className={`entreprise-activity-status status-${formulaire.statut.toLowerCase()}`}>
                {getStatutLabel(formulaire.statut)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="entreprise-empty-state">
          <p>Aucune activité récente. Commencez par remplir un formulaire de collecte.</p>
          <button
            className="entreprise-empty-state-button"
            onClick={() => setActiveSection('formulaire')}
          >
            Nouveau formulaire
          </button>
        </div>
      )}
    </div>
  </div>
);

// Section Planifier Collecte (pour entreprises et responsables logistique)


// Section Formulaire Entreprise (spécifique aux entreprises)
const FormulaireSection = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    type_dechets: '',
    description: '',
    quantite_estimee: '', // Doit être un choix prédéfini comme ParticulierDashboard
    date_souhaitee: '',
    creneau_horaire: '', // Utilise le même nom que particulier mais avec des valeurs entreprise
    mode_collecte: 'domicile', // Backend utilise 'domicile' pour collecte sur site
    adresse_collecte: user?.address || '',
    telephone: user?.phone || '', // Même nom que particulier
    instructions_speciales: '', // Même nom que particulier
    // Champs spécifiques entreprise
    contact_nom: user?.company_name || '',
    contact_email: user?.email || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!formData.type_dechets || !formData.description || !formData.date_souhaitee || !formData.creneau_horaire) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (!formData.adresse_collecte) {
        throw new Error('L\'adresse de collecte est obligatoire');
      }

      if (!formData.telephone) {
        throw new Error('Le numéro de téléphone est obligatoire');
      }

      // Envoyer les données (même structure que particulier)
      await wasteService.createFormulaireCollecte(formData);
      setSuccess(true);

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.message || 'Erreur lors de l\'envoi du formulaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (success) {
    return (
      <div className="entreprise-success-state">
        <div className="entreprise-success-icon">✅</div>
        <h3>Demande de collecte envoyée !</h3>
        <p>Votre demande a été transmise avec succès. Le responsable logistique examinera votre demande et vous confirmera la collecte.</p>
        <div className="entreprise-form-info" style={{ marginTop: '1.5rem' }}>
          <span>ℹ️</span>
          <span>Vous recevrez une confirmation dans votre tableau de bord une fois la collecte validée.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="entreprise-formulaire">
      <div className="entreprise-form-header">
        <h2>Demande de collecte entreprise</h2>
        <p>Planifiez une collecte de vos déchets numériques sur votre site d'entreprise</p>
      </div>

      <form onSubmit={handleSubmit} className="entreprise-form">
        {error && (
          <div className="entreprise-error-alert">
            <span className="entreprise-error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className="entreprise-form-section">
          <h3>📋 Informations sur les déchets</h3>

          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label>Type de déchets *</label>
              <select
                name="type_dechets"
                value={formData.type_dechets}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un type</option>
                <option value="ordinateur">Ordinateurs / Laptops</option>
                <option value="smartphone">Smartphones / Tablettes</option>
                <option value="electromenager">Électroménager</option>
                <option value="televiseur">Téléviseurs / Écrans</option>
                <option value="composants">Composants électroniques</option>
                <option value="autres">Autres équipements</option>
              </select>
            </div>

            <div className="entreprise-form-group">
              <label>Quantité estimée *</label>
              <select
                name="quantite_estimee"
                value={formData.quantite_estimee}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez la quantité</option>
                <option value="1-5kg">1-5 kg</option>
                <option value="5-10kg">5-10 kg</option>
                <option value="10-20kg">10-20 kg</option>
                <option value="20kg+">Plus de 20 kg</option>
              </select>
              <small>Estimation du poids total des équipements</small>
            </div>
          </div>

          <div className="entreprise-form-group">
            <label>Description détaillée des équipements *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Détaillez les équipements : marques, modèles, état, accessoires inclus..."
            />
            <small>Plus vous êtes précis, mieux nous pourrons organiser la collecte</small>
          </div>
        </div>

        <div className="entreprise-form-section">
          <h3>📅 Planification de la collecte</h3>

          <div className="entreprise-form-info">
            <span>🏢</span>
            <span>Mode de collecte : <strong>Collecte sur site d'entreprise</strong></span>
          </div>

          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label>Date souhaitée *</label>
              <input
                type="date"
                name="date_souhaitee"
                value={formData.date_souhaitee}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <small>Minimum 48h à l'avance</small>
            </div>

            <div className="entreprise-form-group">
              <label>Créneaux horaires souhaités *</label>
              <select
                name="creneau_horaire"
                value={formData.creneau_horaire}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un créneau</option>
                <option value="matin">Matin (8h-12h)</option>
                <option value="apres_midi">Après-midi (14h-18h)</option>
                <option value="flexible">Flexible</option>
              </select>
              <small>Créneaux préférés pour la collecte</small>
            </div>
          </div>

          <div className="entreprise-form-group">
            <label>Adresse complète de l'entreprise *</label>
            <textarea
              name="adresse_collecte"
              value={formData.adresse_collecte}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Adresse complète : numéro, rue, code postal, ville&#10;Étage, bâtiment, instructions d'accès..."
            />
            <small>Incluez les détails d'accès (étage, bâtiment, code d'entrée...)</small>
          </div>
        </div>

        <div className="entreprise-form-section">
          <h3>👥 Contact et informations</h3>

          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label>Nom de l'entreprise</label>
              <input
                type="text"
                name="contact_nom"
                value={formData.contact_nom}
                onChange={handleChange}
                placeholder="Raison sociale de l'entreprise"
              />
            </div>

            <div className="entreprise-form-group">
              <label>Téléphone de contact *</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                placeholder="Numéro direct du contact"
                required
              />
              <small>Numéro joignable le jour de la collecte</small>
            </div>
          </div>

          <div className="entreprise-form-group">
            <label>Email de contact</label>
            <input
              type="email"
              name="contact_email"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="email@entreprise.com"
            />
            <small>Pour recevoir les confirmations et suivis</small>
          </div>

          <div className="entreprise-form-group">
            <label>Instructions particulières</label>
            <textarea
              name="instructions_speciales"
              value={formData.instructions_speciales}
              onChange={handleChange}
              rows={3}
              placeholder="Précisez : accès véhicule, horaires préférés, personne à contacter, matériel de manutention nécessaire..."
            />
            <small>Toute information utile pour organiser la collecte</small>
          </div>
        </div>

        <div className="entreprise-form-info">
          <span>📋</span>
          <span>
            <strong>Processus :</strong> Votre demande sera examinée par notre responsable logistique.
            Vous recevrez une confirmation avec les détails finaux de la collecte dans votre tableau de bord.
          </span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="entreprise-submit-btn"
        >
          {submitting ? '📤 Envoi en cours...' : '📋 Envoyer la demande de collecte'}
        </button>
      </form>
    </div>
  );
};

// Section Collectes
const CollectesSection = ({ collectes, setActiveSection }) => (
  <div>
    <div className="entreprise-form-header">
      <h2>Mes collectes</h2>
      <p>Suivez l'état d'avancement de vos collectes de déchets numériques</p>
    </div>

    {collectes.length > 0 ? (
      <div className="entreprise-activity-list">
        {collectes.map((collecte, index) => (
          <div key={index} className="entreprise-activity-item">
            <div className="entreprise-activity-info">
              <h4>Collecte #{collecte.id}</h4>
              <p className="entreprise-activity-date">
                Planifiée le {new Date(collecte.date_collecte).toLocaleDateString('fr-FR')}
              </p>
              {collecte.transporteur && (
                <p className="entreprise-activity-date">
                  Transporteur: {collecte.transporteur_nom}
                </p>
              )}
            </div>
            <span className={`entreprise-activity-status status-${collecte.statut.toLowerCase()}`}>
              {getStatutLabel(collecte.statut)}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div className="entreprise-empty-state">
        <p>Aucune collecte planifiée pour le moment</p>
        <button
          className="entreprise-empty-state-button"
          onClick={() => setActiveSection('formulaire')}
        >
          Planifier une collecte
        </button>
      </div>
    )}
  </div>
);

// Section Formulaires
const FormulairesSection = ({ formulaires, onRefresh, setActiveSection, onPlanifierCollecte }) => (
  <div>
    <div className="entreprise-form-header">
      <h2>Mes formulaires</h2>
      <p>Consultez l'historique de vos demandes de collecte</p>
    </div>

    {formulaires.length > 0 ? (
      <div className="entreprise-activity-list">
        {formulaires.map((formulaire, index) => (
          <div key={index} className="entreprise-activity-item">
            <div className="entreprise-activity-info">
              <h4>{formulaire.reference}</h4>
              <p className="entreprise-activity-date">
                {formulaire.type_dechets} - {new Date(formulaire.date_creation).toLocaleDateString('fr-FR')}
              </p>
              <p style={{ color: '#374151', marginTop: '0.5rem' }}>{formulaire.description}</p>
              <p className="entreprise-activity-date">
                Date souhaitée: {new Date(formulaire.date_souhaitee).toLocaleDateString('fr-FR')} |
                Mode: {formulaire.mode_collecte === 'domicile' ? 'Collecte sur site' : 'Apport volontaire'}
                {formulaire.creneau_horaire && ` | Créneau: ${getCreneauLabel(formulaire.creneau_horaire)}`}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span className={`entreprise-activity-status status-${formulaire.statut.toLowerCase()}`}>
                {getStatutLabel(formulaire.statut)}
              </span>

              {/* Bouton Planifier collecte pour formulaires validés sans collecte */}
              {(formulaire.statut === 'VALIDE' && !formulaire.collecte_info) && (
                <button
                  onClick={() => onPlanifierCollecte(formulaire)}
                  className="entreprise-submit-btn"
                  style={{
                    minWidth: 'auto',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, #059669, #047857)'
                  }}
                >
                  📅 Planifier collecte
                </button>
              )}

              {/* Afficher info collecte si associée */}
              {formulaire.collecte_info && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#059669',
                  background: '#f0fdf4',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid #bbf7d0'
                }}>
                  📦 Collecte {formulaire.collecte_info.reference}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="entreprise-empty-state">
        <p>Aucun formulaire soumis</p>
        <button
          className="entreprise-empty-state-button"
          onClick={() => setActiveSection('formulaire')}
        >
          Créer un formulaire
        </button>
      </div>
    )}
  </div>
);

// Section Profil Entreprise
const ProfilEntrepriseSection = ({ user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    company_name: user?.company_name || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    company_siret: user?.company_siret || ''
  });
  const [updating, setUpdating] = useState(false);

  const handleSave = async () => {
    setUpdating(true);
    try {
      const updatedUser = await userService.updateProfile(formData);
      setUser(updatedUser);
      setEditing(false);

      // Mettre à jour localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const updatedUserInfo = { ...userInfo, ...updatedUser };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="entreprise-formulaire">
      <div className="entreprise-form-header">
        <h2>Profil entreprise</h2>
        <p>Gérez les informations de votre entreprise</p>
      </div>

      <div className="entreprise-form">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3>Informations de l'entreprise</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="entreprise-submit-btn"
              style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
            >
              Modifier
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSave}
                disabled={updating}
                className="entreprise-submit-btn"
                style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
              >
                {updating ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    company_name: user?.company_name || '',
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    address: user?.address || '',
                    company_siret: user?.company_siret || ''
                  });
                }}
                style={{
                  background: '#6b7280',
                  minWidth: 'auto',
                  padding: '0.5rem 1rem'
                }}
                className="entreprise-submit-btn"
              >
                Annuler
              </button>
            </div>
          )}
        </div>

        <div className="entreprise-form-grid-2">
          <div className="entreprise-form-group">
            <label>Nom de l'entreprise</label>
            {editing ? (
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            ) : (
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.company_name || 'Non renseigné'}
              </p>
            )}
          </div>

          <div className="entreprise-form-group">
            <label>SIRET</label>
            {editing ? (
              <input
                type="text"
                value={formData.company_siret}
                onChange={(e) => setFormData(prev => ({ ...prev, company_siret: e.target.value }))}
              />
            ) : (
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.company_siret || 'Non renseigné'}
              </p>
            )}
          </div>

          <div className="entreprise-form-group">
            <label>Prénom du contact</label>
            {editing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            ) : (
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.first_name || 'Non renseigné'}
              </p>
            )}
          </div>

          <div className="entreprise-form-group">
            <label>Nom du contact</label>
            {editing ? (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            ) : (
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.last_name || 'Non renseigné'}
              </p>
            )}
          </div>

          <div className="entreprise-form-group">
            <label>Email</label>
            {editing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            ) : (
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.email || 'Non renseigné'}
              </p>
            )}
          </div>

          <div className="entreprise-form-group">
            <label>Téléphone</label>
            {editing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            ) : (
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.phone || 'Non renseigné'}
              </p>
            )}
          </div>
        </div>

        <div className="entreprise-form-group">
          <label>Adresse</label>
          {editing ? (
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
            />
          ) : (
            <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
              {user?.address || 'Non renseignée'}
            </p>
          )}
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #f3f4f6' }}>
          <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--eco-dark)', marginBottom: '1rem' }}>
            Informations du compte
          </h4>
          <div className="entreprise-form-grid-2">
            <div className="entreprise-form-group">
              <label>Nom d'utilisateur</label>
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.username}
              </p>
            </div>
            <div className="entreprise-form-group">
              <label>Rôle</label>
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                Entreprise
              </p>
            </div>
            <div className="entreprise-form-group">
              <label>Date de création</label>
              <p style={{ padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: '0.75rem', margin: 0 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Inconnu'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonctions utilitaires
const getStatutLabel = (statut) => {
  const labels = {
    'SOUMIS': 'Soumis',
    'EN_ATTENTE': 'En attente',
    'VALIDE': 'Validé',
    'REJETE': 'Rejeté',
    'PLANIFIEE': 'Planifiée',
    'EN_COURS': 'En cours',
    'TERMINEE': 'Terminée',
    'ANNULEE': 'Annulée'
  };
  return labels[statut] || statut;
};

const getCreneauLabel = (creneau) => {
  const labels = {
    'matin': 'Matin (8h-12h)',
    'apres_midi': 'Après-midi (14h-18h)',
    'flexible': 'Flexible'
  };
  return labels[creneau] || creneau;
};

export default EntrepriseDashboard;