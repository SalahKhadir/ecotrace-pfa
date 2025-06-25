import '../../styles/ParticulierDashboard.css';
import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import NotificationCenter from '../../components/common/NotificationCenter';
import { notificationService } from '../../services/notificationService';

const ParticulierDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [collectes, setCollectes] = useState([]);
  const [formulaires, setFormulaires] = useState([]);
  const [stats, setStats] = useState({});
  const [showCollecteDetailsModal, setShowCollecteDetailsModal] = useState(false);
  const [selectedCollecte, setSelectedCollecte] = useState(null);
  const [sidebarNotifications, setSidebarNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      // Vérifier si l'utilisateur est connecté
      const token = localStorage.getItem('accessToken');
      const role = localStorage.getItem('userRole');
      const userInfo = localStorage.getItem('userInfo');
      
      if (!token || role !== 'PARTICULIER') {
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
        await notificationService.loadNotifications('PARTICULIER');
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

  const openCollecteDetails = (collecte) => {
    setSelectedCollecte(collecte);
    setShowCollecteDetailsModal(true);
  };

  const closeCollecteDetails = () => {
    setSelectedCollecte(null);
    setShowCollecteDetailsModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Chargement de votre tableau de bord...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">        <div className="dashboard-nav">
          <div className="dashboard-logo">
            <Logo className="dashboard-title" size="medium" showText={true} />
            <span className="badge-particulier">Particulier</span>
          </div>
          
          <div className="dashboard-user-info">
            <NotificationCenter userRole="PARTICULIER" showAsDropdown={true} />
            <span className="user-welcome">
              Bonjour, {user.first_name || user.username}
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-sidebar">
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="menu-icon">🏠</span>
            Tableau de bord
          </button>
          <button 
            className={`menu-item ${activeSection === 'formulaire' ? 'active' : ''}`}
            onClick={() => setActiveSection('formulaire')}
          >
            <span className="menu-icon">📝</span>
            Nouveau formulaire
          </button>
          <button 
            className={`menu-item ${activeSection === 'collectes' ? 'active' : ''}`}
            onClick={() => setActiveSection('collectes')}
          >
            <span className="menu-icon">📋</span>
            Mes collectes
          </button>
          <button 
            className={`menu-item ${activeSection === 'formulaires' ? 'active' : ''}`}
            onClick={() => setActiveSection('formulaires')}
          >
            <span className="menu-icon">📄</span>
            Mes formulaires
          </button>
          <button 
            className={`menu-item ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <span className="menu-icon">🔔</span>
            Notifications
            {sidebarNotifications.filter(n => !(n.read || n.is_read)).length > 0 && (
              <span className="notification-badge">
                {sidebarNotifications.filter(n => !(n.read || n.is_read)).length}
              </span>
            )}
          </button>
          <button 
            className={`menu-item ${activeSection === 'profil' ? 'active' : ''}`}
            onClick={() => setActiveSection('profil')}
          >
            <span className="menu-icon">👤</span>
            Mon profil
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Vue d'ensemble */}
        {activeSection === 'overview' && (
          <OverviewSection 
            user={user} 
            collectes={collectes} 
            formulaires={formulaires}
            stats={stats}
            setActiveSection={setActiveSection} 
          />
        )}

        {/* Formulaire de collecte */}
        {activeSection === 'formulaire' && (
          <FormulaireSection 
            user={user} 
            onSuccess={() => {
              setActiveSection('formulaires');
              refreshData();
            }} 
          />
        )}

        {/* Mes collectes */}
        {activeSection === 'collectes' && (
          <CollectesSection collectes={collectes} onOpenDetails={openCollecteDetails} />
        )}

        {/* Mes formulaires */}
        {activeSection === 'formulaires' && (
          <FormulairesSection formulaires={formulaires} onRefresh={refreshData} />
        )}

        {/* Notifications */}
        {activeSection === 'notifications' && (
          <div className="notifications-section">
            <div className="section-header">
              <h2>Centre de Notifications</h2>
              <p>Toutes vos notifications en temps réel</p>
            </div>
            <NotificationCenter userRole="PARTICULIER" showAsDropdown={false} />
          </div>
        )}

        {/* Profil */}
        {activeSection === 'profil' && (
          <ProfilSection user={user} setUser={setUser} />
        )}
      </main>

      {/* Modal de détails de collecte */}
      {showCollecteDetailsModal && selectedCollecte && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Détails de la Collecte - {selectedCollecte.reference}</h3>
              <button
                className="modal-close"
                onClick={closeCollecteDetails}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="collecte-details-modal">
                <div className="details-section">
                  <h4>Informations Générales</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Référence:</span>
                      <span>{selectedCollecte.reference}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Statut:</span>
                      <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedCollecte.statut) }}>
                        {getStatutLabel(selectedCollecte.statut)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date de collecte:</span>
                      <span>{new Date(selectedCollecte.date_collecte).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Mode de collecte:</span>
                      <span>{selectedCollecte.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}</span>
                    </div>
                  </div>
                </div>

                {selectedCollecte.adresse && (
                  <div className="details-section">
                    <h4>Adresse de Collecte</h4>
                    <p className="address-text">{selectedCollecte.adresse}</p>
                  </div>
                )}

                {selectedCollecte.transporteur_info && (
                  <div className="details-section">
                    <h4>Informations Transporteur</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Nom:</span>
                        <span>{selectedCollecte.transporteur_info.first_name} {selectedCollecte.transporteur_info.last_name}</span>
                      </div>
                      {selectedCollecte.transporteur_info.email && (
                        <div className="detail-item">
                          <span className="label">Email:</span>
                          <span>{selectedCollecte.transporteur_info.email}</span>
                        </div>
                      )}
                      {selectedCollecte.transporteur_info.phone && (
                        <div className="detail-item">
                          <span className="label">Téléphone:</span>
                          <span>{selectedCollecte.transporteur_info.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedCollecte.formulaire_origine && (
                  <div className="details-section">
                    <h4>Détails du Formulaire d'Origine</h4>
                    <div className="details-grid">
                      {selectedCollecte.formulaire_origine.type_dechets && (
                        <div className="detail-item">
                          <span className="label">Type de déchets:</span>
                          <span>{selectedCollecte.formulaire_origine.type_dechets}</span>
                        </div>
                      )}
                      {selectedCollecte.formulaire_origine.quantite_estimee && (
                        <div className="detail-item">
                          <span className="label">Quantité estimée:</span>
                          <span>{selectedCollecte.formulaire_origine.quantite_estimee} kg</span>
                        </div>
                      )}
                      {selectedCollecte.formulaire_origine.description && (
                        <div className="detail-item">
                          <span className="label">Description:</span>
                          <span>{selectedCollecte.formulaire_origine.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedCollecte.instructions && (
                  <div className="details-section">
                    <h4>Instructions Spéciales</h4>
                    <p className="instructions-text">{selectedCollecte.instructions}</p>
                  </div>
                )}

                <div className="details-section">
                  <h4>Historique</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Date de création:</span>
                      <span>{selectedCollecte.date_creation ? new Date(selectedCollecte.date_creation).toLocaleDateString('fr-FR') : 'Non spécifiée'}</span>
                    </div>
                    {selectedCollecte.date_debut && (
                      <div className="detail-item">
                        <span className="label">Date de début:</span>
                        <span>{new Date(selectedCollecte.date_debut).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {selectedCollecte.date_fin && (
                      <div className="detail-item">
                        <span className="label">Date de fin:</span>
                        <span>{new Date(selectedCollecte.date_fin).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCollecte.statut === 'TERMINEE' && selectedCollecte.poids_collecte && (
                  <div className="details-section">
                    <h4>Résultats de la Collecte</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Poids collecté:</span>
                        <span>{selectedCollecte.poids_collecte} kg</span>
                      </div>
                      {selectedCollecte.notes_transporteur && (
                        <div className="detail-item">
                          <span className="label">Notes du transporteur:</span>
                          <span>{selectedCollecte.notes_transporteur}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {selectedCollecte.statut === 'EN_COURS' && selectedCollecte.transporteur_info?.phone && (
                <button className="btn-primary">
                  📞 Contacter le transporteur
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={closeCollecteDetails}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Fonctions utilitaires pour les labels et couleurs de statut
const getStatutLabel = (statut) => {
  const labels = {
    'SOUMIS': 'Soumis',
    'EN_ATTENTE': 'En attente',
    'VALIDE': 'Validé',
    'REJETE': 'Rejeté',
    'EN_COURS': 'En cours',
    'TERMINE': 'Terminé',
    'PLANIFIEE': 'Planifiée',
    'TERMINEE': 'Terminée',
    'ANNULEE': 'Annulée'
  };
  return labels[statut] || statut;
};

const getStatusColor = (status) => {
  const colors = {
    'EN_COURS': '#f59e0b',
    'TERMINEE': '#10b981',
    'PLANIFIEE': '#3b82f6',
    'ANNULEE': '#ef4444'
  };
  return colors[status] || '#6b7280';
};

// Section Vue d'ensemble
const OverviewSection = ({ user, collectes, formulaires, stats, setActiveSection }) => {
  return (
    <div className="overview-section">
      <div className="section-header">
        <h2>Tableau de bord</h2>
        <p>Gérez vos demandes de collecte de déchets électroniques</p>
      </div>

      {/* Statistiques rapides */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <span className="stat-number">{stats.formulaires_total || 0}</span>
            <span className="stat-label">Formulaires envoyés</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <span className="stat-number">{stats.collectes_en_cours || 0}</span>
            <span className="stat-label">Collectes en cours</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-number">{stats.collectes_terminees || 0}</span>
            <span className="stat-label">Collectes terminées</span>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon">📝</div>
            <h3 className="action-title">Nouvelle collecte</h3>
          </div>
          <p className="action-description">
            Remplissez un formulaire pour programmer une collecte de vos déchets électroniques
          </p>
          <button 
            className="action-button primary"
            onClick={() => setActiveSection('formulaire')}
          >
            Remplir formulaire de collecte
          </button>
        </div>

        <div className="action-card">
          <div className="action-card-header">
            <div className="action-icon">📍</div>
            <h3 className="action-title">Suivre collectes</h3>
          </div>
          <p className="action-description">
            Consultez le statut de vos demandes de collecte en cours
          </p>
          <button 
            className="action-button secondary"
            onClick={() => setActiveSection('collectes')}
          >
            Voir mes collectes
          </button>
        </div>
      </div>

      {/* Activité récente */}
      <div className="recent-activity">
        <h3>Activité récente</h3>
        {formulaires.length > 0 || collectes.length > 0 ? (
          <div className="activity-list">
            {/* Afficher les formulaires récents */}
            {formulaires.slice(0, 2).map(formulaire => (
              <div key={`form-${formulaire.id}`} className="activity-item">
                <div className="activity-info">
                  <h4>Formulaire {formulaire.reference}</h4>
                  <p>{formulaire.description}</p>
                  <span className="activity-date">
                    {new Date(formulaire.date_creation).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className={`activity-status status-${formulaire.statut.toLowerCase()}`}>
                  {getStatutLabel(formulaire.statut)}
                </div>
              </div>
            ))}
            
            {/* Afficher les collectes récentes */}
            {collectes.slice(0, 2).map(collecte => (
              <div key={`collect-${collecte.id}`} className="activity-item">
                <div className="activity-info">
                  <h4>Collecte {collecte.reference}</h4>
                  <p>Collecte prévue le {new Date(collecte.date_collecte).toLocaleDateString('fr-FR')}</p>
                  <span className="activity-date">
                    {new Date(collecte.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className={`activity-status status-${collecte.statut.toLowerCase()}`}>
                  {getStatutLabel(collecte.statut)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Aucune activité pour le moment</p>
            <button 
              className="empty-state-button"
              onClick={() => setActiveSection('formulaire')}
            >
              Programmer une nouvelle collecte
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Section Formulaire de collecte
const FormulaireSection = ({ user, onSuccess }) => {
  const [formData, setFormData] = useState({
    type_dechets: '',
    description: '',
    quantite_estimee: '',
    mode_collecte: 'domicile',
    date_souhaitee: '',
    creneau_horaire: '',
    adresse_collecte: user?.address || '',
    telephone: user?.phone || '',
    instructions_speciales: '',
    photo1: null,
    photo2: null,
    photo3: null
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [pointsCollecte, setPointsCollecte] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Charger les points de collecte quand mode apport est sélectionné
  useEffect(() => {
    if (formData.mode_collecte === 'apport' && pointsCollecte.length === 0) {
      loadPointsCollecte();
    }
  }, [formData.mode_collecte]);

  const loadPointsCollecte = async () => {
    setLoadingPoints(true);
    try {
      const points = await wasteService.getPointsCollecte();
      setPointsCollecte(points);
    } catch (error) {
      console.error('Erreur lors du chargement des points de collecte:', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Valider les champs requis
      if (!formData.type_dechets || !formData.description || !formData.date_souhaitee) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      // Valider l'adresse pour collecte à domicile
      if (formData.mode_collecte === 'domicile' && !formData.adresse_collecte) {
        throw new Error('L\'adresse de collecte est obligatoire pour une collecte à domicile');
      }

      // Préparer les données selon le mode de collecte
      const dataToSend = {
        ...formData,
        // Si apport volontaire, ne pas envoyer l'adresse ou envoyer chaîne vide
        adresse_collecte: formData.mode_collecte === 'apport' ? '' : formData.adresse_collecte
      };

      // Créer le formulaire via l'API
      const response = await wasteService.createFormulaireCollecte(dataToSend);
      
      console.log('Formulaire créé:', response);
      setSuccess(true);
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      
      let errorMessage = 'Erreur lors de l\'envoi du formulaire';
      
      if (error.response?.data) {
        const serverError = error.response.data;
        if (typeof serverError === 'object') {
          // Extraire les erreurs de validation Django
          const errorMessages = [];
          Object.keys(serverError).forEach(field => {
            if (Array.isArray(serverError[field])) {
              errorMessages.push(`${field}: ${serverError[field][0]}`);
            } else {
              errorMessages.push(`${field}: ${serverError[field]}`);
            }
          });
          errorMessage = errorMessages.join(', ');
        } else {
          errorMessage = serverError;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La taille de l\'image ne doit pas dépasser 5MB');
        return;
      }
      
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner un fichier image valide');
        return;
      }
      
      setFormData({
        ...formData,
        [name]: file
      });
      
      // Créer l'aperçu de l'image
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews({
          ...photoPreviews,
          [name]: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (photoName) => {
    setFormData({
      ...formData,
      [photoName]: null
    });
    
    setPhotoPreviews({
      ...photoPreviews,
      [photoName]: null
    });
  };

  if (success) {
    return (
      <div className="success-message">
        <div className="success-icon">✅</div>
        <h2>Formulaire envoyé avec succès !</h2>
        <p>Votre demande de collecte a été enregistrée avec la référence qui vous sera communiquée par email.</p>
        <p>Vous allez être redirigé vers vos collectes...</p>
      </div>
    );
  }

  return (
    <div className="formulaire-section">
      <div className="section-header">
        <h2>Nouvelle demande de collecte</h2>
        <p>Remplissez ce formulaire pour programmer une collecte de vos déchets électroniques</p>
      </div>

      <form onSubmit={handleSubmit} className="collecte-form">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Mode de collecte */}
        <div className="mode-collecte-section">
          <h3>Mode de collecte</h3>
          <div className="mode-collecte-options">
            <label className={`mode-option ${formData.mode_collecte === 'domicile' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode_collecte"
                value="domicile"
                checked={formData.mode_collecte === 'domicile'}
                onChange={handleChange}
              />
              <div className="mode-content">
                <div className="mode-icon">🏠</div>
                <div className="mode-text">
                  <strong>Collecte à domicile</strong>
                  <p>Nous venons collecter vos déchets chez vous</p>
                </div>
              </div>
            </label>
            
            <label className={`mode-option ${formData.mode_collecte === 'apport' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="mode_collecte"
                value="apport"
                checked={formData.mode_collecte === 'apport'}
                onChange={handleChange}
              />
              <div className="mode-content">
                <div className="mode-icon">📍</div>
                <div className="mode-text">
                  <strong>Apport volontaire</strong>
                  <p>Vous apportez vos déchets à un point de collecte</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Points de collecte pour apport volontaire */}
        {formData.mode_collecte === 'apport' && (
          <div className="points-collecte-section">
            <h4>Points de collecte disponibles</h4>
            {loadingPoints ? (
              <div className="loading-points">Chargement des points de collecte...</div>
            ) : (
              <div className="points-collecte-list">
                {pointsCollecte.map((point, index) => (
                  <div key={index} className="point-collecte-card">
                    <h5>{point.nom}</h5>
                    <p><strong>Adresse:</strong> {point.adresse}</p>
                    <p><strong>Horaires:</strong> {point.horaires}</p>
                    <p><strong>Téléphone:</strong> {point.telephone}</p>
                    <p><strong>Types acceptés:</strong> {point.types_acceptes.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="type_dechets">Type de déchets *</label>
            <select
              id="type_dechets"
              name="type_dechets"
              required
              value={formData.type_dechets}
              onChange={handleChange}
            >
              <option value="">Sélectionnez le type</option>
              <option value="ordinateur">Ordinateur / Laptop</option>
              <option value="smartphone">Smartphone / Tablette</option>
              <option value="electromenager">Électroménager</option>
              <option value="televiseur">Téléviseur / Écran</option>
              <option value="composants">Composants électroniques</option>
              <option value="autres">Autres</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantite_estimee">Quantité estimée</label>
            <select
              id="quantite_estimee"
              name="quantite_estimee"
              value={formData.quantite_estimee}
              onChange={handleChange}
            >
              <option value="">Sélectionnez la quantité</option>
              <option value="1-5kg">1-5 kg</option>
              <option value="5-10kg">5-10 kg</option>
              <option value="10-20kg">10-20 kg</option>
              <option value="20kg+">Plus de 20 kg</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="date_souhaitee">
              {formData.mode_collecte === 'domicile' ? 'Date souhaitée *' : 'Date de dépôt prévue *'}
            </label>
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

          {formData.mode_collecte === 'domicile' && (
            <div className="form-group">
              <label htmlFor="creneau_horaire">Créneau horaire</label>
              <select
                id="creneau_horaire"
                name="creneau_horaire"
                value={formData.creneau_horaire}
                onChange={handleChange}
              >
                <option value="">Sélectionnez un créneau</option>
                <option value="matin">Matin (8h-12h)</option>
                <option value="apres_midi">Après-midi (14h-18h)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description détaillée *</label>
          <textarea
            id="description"
            name="description"
            required
            rows="4"
            value={formData.description}
            onChange={handleChange}
            placeholder="Décrivez précisément les déchets à collecter (marque, modèle, état, etc.)"
          />
        </div>

        {formData.mode_collecte === 'domicile' && (
          <div className="form-group">
            <label htmlFor="adresse_collecte">Adresse de collecte *</label>
            <textarea
              id="adresse_collecte"
              name="adresse_collecte"
              required
              rows="3"
              value={formData.adresse_collecte}
              onChange={handleChange}
              placeholder="Adresse complète où effectuer la collecte"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="telephone">Numéro de téléphone *</label>
          <input
            type="tel"
            id="telephone"
            name="telephone"
            required
            value={formData.telephone}
            onChange={handleChange}
            placeholder="Votre numéro de téléphone"
          />
        </div>

        <div className="form-group">
          <label htmlFor="instructions_speciales">Instructions spéciales</label>
          <textarea
            id="instructions_speciales"
            name="instructions_speciales"
            rows="3"
            value={formData.instructions_speciales}
            onChange={handleChange}
            placeholder={
              formData.mode_collecte === 'domicile' 
                ? "Instructions particulières pour la collecte (accès, étage, etc.)"
                : "Instructions particulières (horaire de dépôt préféré, etc.)"
            }
          />
        </div>

        {/* Section Photos */}
        <div className="photos-section">
          <h4>Photos des déchets (optionnel)</h4>
          <p className="photos-help">Ajoutez des photos pour nous aider à mieux identifier vos déchets</p>
          
          <div className="photos-upload">
            {[1, 2, 3].map(num => {
              const photoName = `photo${num}`;
              return (
                <div key={num} className="photo-upload-item">
                  <label htmlFor={photoName} className="photo-upload-label">
                    {photoPreviews[photoName] ? (
                      <div className="photo-preview">
                        <img src={photoPreviews[photoName]} alt={`Aperçu ${num}`} />
                        <button 
                          type="button" 
                          className="remove-photo"
                          onClick={() => removePhoto(photoName)}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="photo-placeholder">
                        <span className="photo-icon">📷</span>
                        <span>Photo {num}</span>
                      </div>
                    )}
                  </label>
                  <input
                    type="file"
                    id={photoName}
                    name={photoName}
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-eco"></span>
                Envoi en cours...
              </>
            ) : (
              'Envoyer la demande'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Section Mes collectes
const CollectesSection = ({ collectes, onOpenDetails }) => {
  return (
    <div className="collectes-section">
      <div className="section-header">
        <h2>Mes collectes</h2>
        <p>Suivez l'état de vos demandes de collecte</p>
      </div>

      {collectes.length > 0 ? (
        <div className="collectes-grid">
          {collectes.map(collecte => (
            <div key={collecte.id} className="collecte-card">
              <div className="collecte-card-header">
                <h3>{collecte.reference}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(collecte.statut) }}
                >
                  {getStatutLabel(collecte.statut)}
                </span>
              </div>
              
              <div className="collecte-details">
                <p><strong>Mode:</strong> {collecte.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}</p>
                <p><strong>Date de collecte:</strong> {new Date(collecte.date_collecte).toLocaleDateString('fr-FR')}</p>
                {collecte.adresse && (
                  <p><strong>Adresse:</strong> {collecte.adresse}</p>
                )}
                {collecte.transporteur_info && (
                  <p><strong>Transporteur:</strong> {collecte.transporteur_info.first_name} {collecte.transporteur_info.last_name}</p>
                )}
              </div>

              <div className="collecte-actions">
                <button 
                  className="action-btn secondary"
                  onClick={() => onOpenDetails(collecte)}
                >
                  Voir détails
                </button>
                {collecte.statut === 'EN_COURS' && (
                  <button className="action-btn primary">
                    Contacter transporteur
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Aucune collecte</h3>
          <p>Vous n'avez pas encore de collecte programmée.</p>
        </div>
      )}
    </div>
  );
};

// Section Formulaires - VERSION AMÉLIORÉE
// Remplacez la section FormulairesSection existante par ce code
const FormulairesSection = ({ formulaires, onRefresh }) => {
  const [selectedFormulaire, setSelectedFormulaire] = useState(null);
  const [filter, setFilter] = useState('all');

  const getStatutColor = (statut) => {
    const colors = {
      'SOUMIS': '#f59e0b',
      'EN_ATTENTE': '#f59e0b', 
      'VALIDE': '#10b981',
      'REJETE': '#ef4444',
      'EN_COURS': '#3b82f6',
      'TERMINE': '#10b981'
    };
    return colors[statut] || '#6b7280';
  };

  const getStatutIcon = (statut) => {
    const icons = {
      'SOUMIS': '📝',
      'EN_ATTENTE': '⏳',
      'VALIDE': '✅',
      'REJETE': '❌',
      'EN_COURS': '🔄',
      'TERMINE': '🎉'
    };
    return icons[statut] || '📄';
  };

  const getStatutLabel = (statut) => {
    const labels = {
      'SOUMIS': 'Soumis',
      'EN_ATTENTE': 'En attente',
      'VALIDE': 'Validé',
      'REJETE': 'Rejeté', 
      'EN_COURS': 'En cours',
      'TERMINE': 'Terminé'
    };
    return labels[statut] || statut;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'ordinateur': '💻',
      'smartphone': '📱',
      'electromenager': '🏠',
      'televiseur': '📺',
      'composants': '🔧',
      'autres': '📦'
    };
    return icons[type] || '📦';
  };

  const getTypeLabel = (type) => {
    const labels = {
      'ordinateur': 'Ordinateur / Laptop',
      'smartphone': 'Smartphone / Tablette',
      'electromenager': 'Électroménager',
      'televiseur': 'Téléviseur / Écran',
      'composants': 'Composants électroniques',
      'autres': 'Autres'
    };
    return labels[type] || type;
  };

  const filteredFormulaires = formulaires.filter(formulaire => {
    if (filter === 'all') return true;
    return formulaire.statut === filter;
  });

  const getFilterCounts = () => {
    return {
      all: formulaires.length,
      SOUMIS: formulaires.filter(f => f.statut === 'SOUMIS').length,
      VALIDE: formulaires.filter(f => f.statut === 'VALIDE').length,
      EN_COURS: formulaires.filter(f => f.statut === 'EN_COURS').length,
      TERMINE: formulaires.filter(f => f.statut === 'TERMINE').length,
      REJETE: formulaires.filter(f => f.statut === 'REJETE').length,
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="formulaires-section">
      <div className="section-header">
        <div className="header-content">
          <div className="header-title">
            <h2>📋 Mes formulaires</h2>
            <p>Suivez l'état de vos demandes de collecte</p>
          </div>
          <button onClick={onRefresh} className="refresh-btn">
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-container">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous <span className="count">{counts.all}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'SOUMIS' ? 'active' : ''}`}
            onClick={() => setFilter('SOUMIS')}
          >
            En attente <span className="count">{counts.SOUMIS}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'VALIDE' ? 'active' : ''}`}
            onClick={() => setFilter('VALIDE')}
          >
            Validés <span className="count">{counts.VALIDE}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'EN_COURS' ? 'active' : ''}`}
            onClick={() => setFilter('EN_COURS')}
          >
            En cours <span className="count">{counts.EN_COURS}</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'TERMINE' ? 'active' : ''}`}
            onClick={() => setFilter('TERMINE')}
          >
            Terminés <span className="count">{counts.TERMINE}</span>
          </button>
          {counts.REJETE > 0 && (
            <button 
              className={`filter-tab ${filter === 'REJETE' ? 'active' : ''}`}
              onClick={() => setFilter('REJETE')}
            >
              Rejetés <span className="count">{counts.REJETE}</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des formulaires */}
      {filteredFormulaires.length > 0 ? (
        <div className="formulaires-grid-improved">
          {filteredFormulaires.map(formulaire => (
            <div 
              key={formulaire.id} 
              className={`formulaire-card-improved ${formulaire.statut.toLowerCase()}`}
              onClick={() => setSelectedFormulaire(formulaire)}
            >
              {/* Header de la carte */}
              <div className="formulaire-card-header-improved">
                <div className="formulaire-reference-improved">
                  <span className="reference-number">{formulaire.reference}</span>
                  <div className="formulaire-type-improved">
                    <span className="type-icon">{getTypeIcon(formulaire.type_dechets)}</span>
                    <span className="type-label">{getTypeLabel(formulaire.type_dechets)}</span>
                  </div>
                </div>
                <div className="statut-container-improved">
                  <span 
                    className="status-badge-improved"
                    style={{ backgroundColor: getStatutColor(formulaire.statut) }}
                  >
                    <span className="status-icon">{getStatutIcon(formulaire.statut)}</span>
                    {getStatutLabel(formulaire.statut)}
                  </span>
                </div>
              </div>

              {/* Corps de la carte */}
              <div className="formulaire-body-improved">
                <div className="formulaire-description-improved">
                  <p>{formulaire.description}</p>
                </div>

                <div className="formulaire-details-improved">
                  <div className="detail-item-improved">
                    <span className="detail-icon">📍</span>
                    <span className="detail-text">
                      {formulaire.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}
                    </span>
                  </div>
                  
                  <div className="detail-item-improved">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">
                      {new Date(formulaire.date_souhaitee).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {formulaire.quantite_estimee && (
                    <div className="detail-item-improved">
                      <span className="detail-icon">⚖️</span>
                      <span className="detail-text">{formulaire.quantite_estimee}</span>
                    </div>
                  )}

                  {formulaire.creneau_horaire && formulaire.mode_collecte === 'domicile' && (
                    <div className="detail-item-improved">
                      <span className="detail-icon">🕐</span>
                      <span className="detail-text">
                        {formulaire.creneau_horaire === 'matin' ? 'Matin (8h-12h)' : 
                         formulaire.creneau_horaire === 'apres_midi' ? 'Après-midi (14h-18h)' : 
                         'Flexible'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Photos */}
                {formulaire.photos_count && formulaire.photos_count > 0 && (
                  <div className="formulaire-photos-improved">
                    <span className="photos-label">📸 {formulaire.photos_count} photo(s)</span>
                  </div>
                )}
              </div>

              {/* Footer de la carte */}
              <div className="formulaire-footer-improved">
                <div className="formulaire-dates-improved">
                  <span className="creation-date">
                    Créé le {new Date(formulaire.date_creation).toLocaleDateString('fr-FR')}
                  </span>
                  {formulaire.date_traitement && (
                    <span className="traitement-date">
                      Traité le {new Date(formulaire.date_traitement).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>

                <div className="formulaire-actions-improved">
                  <button className="action-btn-improved view-btn">
                    👁️ Détails
                  </button>
                  
                  {formulaire.collecte_info && (
                    <button className="action-btn-improved collecte-btn">
                      📦 Collecte
                    </button>
                  )}
                </div>
              </div>

              {/* Indicateur de collecte associée */}
              {formulaire.collecte_info && (
                <div className="collecte-indicator-improved">
                  <span className="collecte-badge">
                    📦 Collecte {formulaire.collecte_info.reference}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Aucun formulaire {filter !== 'all' ? 'avec ce statut' : ''}</h3>
          <p>
            {filter !== 'all' 
              ? `Vous n'avez pas encore de formulaire avec le statut "${getStatutLabel(filter)}".`
              : "Vous n'avez pas encore soumis de formulaire de collecte."
            }
          </p>
          {filter !== 'all' && (
            <button 
              className="empty-state-button"
              onClick={() => setFilter('all')}
            >
              Voir tous les formulaires
            </button>
          )}
        </div>
      )}

      {/* Modal de détails du formulaire */}
      {selectedFormulaire && (
        <FormulaireDetailsModal 
          formulaire={selectedFormulaire}
          onClose={() => setSelectedFormulaire(null)}
        />
      )}
    </div>
  );
};

// Modal pour les détails du formulaire
const FormulaireDetailsModal = ({ formulaire, onClose }) => {
  const getStatutColor = (statut) => {
    const colors = {
      'SOUMIS': '#f59e0b',
      'EN_ATTENTE': '#f59e0b',
      'VALIDE': '#10b981',
      'REJETE': '#ef4444',
      'EN_COURS': '#3b82f6',
      'TERMINE': '#10b981'
    };
    return colors[statut] || '#6b7280';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 Détails du formulaire {formulaire.reference}</h3>
          <button onClick={onClose} className="close-btn">❌</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h4>Informations générales</h4>
            <div className="detail-grid">
              <div className="detail-item-full">
                <strong>Statut:</strong>
                <span 
                  className="status-badge-improved"
                  style={{ backgroundColor: getStatutColor(formulaire.statut) }}
                >
                  {formulaire.statut}
                </span>
              </div>
              <div className="detail-item-full">
                <strong>Type de déchets:</strong> {formulaire.type_dechets}
              </div>
              <div className="detail-item-full">
                <strong>Description:</strong> {formulaire.description}
              </div>
              <div className="detail-item-full">
                <strong>Mode de collecte:</strong> 
                {formulaire.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}
              </div>
              <div className="detail-item-full">
                <strong>Date souhaitée:</strong> 
                {new Date(formulaire.date_souhaitee).toLocaleDateString('fr-FR')}
              </div>
              {formulaire.quantite_estimee && (
                <div className="detail-item-full">
                  <strong>Quantité estimée:</strong> {formulaire.quantite_estimee}
                </div>
              )}
              {formulaire.creneau_horaire && (
                <div className="detail-item-full">
                  <strong>Créneau horaire:</strong> {formulaire.creneau_horaire}
                </div>
              )}
            </div>
          </div>

          {formulaire.mode_collecte === 'domicile' && formulaire.adresse_collecte && (
            <div className="detail-section">
              <h4>Adresse de collecte</h4>
              <p>{formulaire.adresse_collecte}</p>
            </div>
          )}

          {formulaire.instructions_speciales && (
            <div className="detail-section">
              <h4>Instructions spéciales</h4>
              <p>{formulaire.instructions_speciales}</p>
            </div>
          )}

          {formulaire.photos && formulaire.photos.length > 0 && (
            <div className="detail-section">
              <h4>Photos</h4>
              <div className="photos-grid">
                {formulaire.photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Photo ${index + 1}`} className="detail-photo" />
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h4>Dates importantes</h4>
            <div className="detail-grid">
              <div className="detail-item-full">
                <strong>Créé le:</strong> {new Date(formulaire.date_creation).toLocaleString('fr-FR')}
              </div>
              {formulaire.date_modification && (
                <div className="detail-item-full">
                  <strong>Modifié le:</strong> {new Date(formulaire.date_modification).toLocaleString('fr-FR')}
                </div>
              )}
              {formulaire.date_traitement && (
                <div className="detail-item-full">
                  <strong>Traité le:</strong> {new Date(formulaire.date_traitement).toLocaleString('fr-FR')}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn secondary">Fermer</button>
        </div>
      </div>
    </div>
  );
};

// Section Profil
const ProfilSection = ({ user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const handleSave = async () => {
    try {
      // Simulation de sauvegarde (à remplacer par un vrai appel API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setEditing(false);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  return (
    <div className="profil-section">
      <div className="section-header">
        <h2>Mon profil</h2>
        <p>Gérez vos informations personnelles</p>
      </div>

      <div className="profil-card">
        <div className="profil-header">
          <div className="profil-avatar">
            <span className="avatar-text">
              {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <div className="profil-info">
            <h3>{user?.first_name} {user?.last_name} {(!user?.first_name && !user?.last_name) ? user?.username : ''}</h3>
            <span className="badge-particulier">Particulier</span>
          </div>
          <button 
            className="edit-btn"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        <div className="profil-details">
          {editing ? (
            <div className="edit-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Prénom</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <textarea
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <button className="save-btn" onClick={handleSave}>
                Sauvegarder
              </button>
            </div>
          ) : (
            <div className="view-form">
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Téléphone:</span>
                <span className="info-value">{user?.phone || 'Non renseigné'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Adresse:</span>
                <span className="info-value">{user?.address || 'Non renseignée'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Membre depuis:</span>
                <span className="info-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'Inconnu'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParticulierDashboard;