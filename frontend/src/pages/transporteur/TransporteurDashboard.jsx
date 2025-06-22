import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS, COLLECTE_STATUS } from '../../utils/constants';

const TransporteurDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Données
  const [stats, setStats] = useState({});
  const [formulaires, setFormulaires] = useState([]);
  const [collectes, setCollectes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // États pour la vérification des formulaires
  const [selectedFormulaire, setSelectedFormulaire] = useState(null);
  const [showFormulaireModal, setShowFormulaireModal] = useState(false);
  
  // États pour la confirmation
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedCollecte, setSelectedCollecte] = useState(null);
  const [confirmationType, setConfirmationType] = useState('reception'); // reception ou emission
  const [confirmationData, setConfirmationData] = useState({
    notes: '',
    photo: null
  });

  // Filtres
  const [formulaireFilter, setFormulaireFilter] = useState('tous');
  const [collecteFilter, setCollecteFilter] = useState('assignees');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'TRANSPORTEUR') {
      navigate('/login');
      return;
    }
    
    loadInitialData();
  }, [navigate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUserData(),
        loadStats(),
        loadFormulaires(),
        loadCollectes(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const userData = await userService.getDashboardInfo();
      setUser(userData.user);
    } catch (error) {
      console.error('Erreur utilisateur:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await wasteService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const loadFormulaires = async () => {
    try {
      const response = await wasteService.getAllFormulaires();
      const formulairesData = response.results || response;
      // Filtrer les formulaires validés pour les transporteurs
      const formulairesValides = formulairesData.filter(f => 
        f.statut === 'VALIDE' || f.statut === 'EN_COURS'
      );
      setFormulaires(formulairesValides);
    } catch (error) {
      console.error('Erreur formulaires:', error);
    }
  };

  const loadCollectes = async () => {
    try {
      const response = await wasteService.getAllCollectes();
      const collectesData = response.results || response;
      setCollectes(collectesData);
    } catch (error) {
      console.error('Erreur collectes:', error);
    }
  };

  const loadNotifications = async () => {
    // Simuler des notifications - à terme, cela viendra d'une API dédiée
    const mockNotifications = [
      {
        id: 1,
        type: 'nouvelle_collecte',
        message: 'Nouvelle collecte disponible dans votre secteur',
        time: '2h',
        unread: true
      },
      {
        id: 2,
        type: 'collecte_urgent',
        message: 'Collecte urgente à confirmer avant 18h',
        time: '4h',
        unread: true
      },
      {
        id: 3,
        type: 'rappel',
        message: 'Rappel: Collecte planifiée demain à 9h',
        time: '1j',
        unread: false
      }
    ];
    setNotifications(mockNotifications);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      navigate('/');
    }
  };

  const voirFormulaireDetails = (formulaire) => {
    setSelectedFormulaire(formulaire);
    setShowFormulaireModal(true);
  };

  const assignerCollecte = async (collecteId) => {
    try {
      await wasteService.assignerTransporteur(collecteId);
      await loadCollectes();
      alert('Collecte assignée avec succès !');
    } catch (error) {
      console.error('Erreur assignation:', error);
      alert('Erreur lors de l\'assignation');
    }
  };

  const confirmerReceptionEmission = (collecte, type) => {
    setSelectedCollecte(collecte);
    setConfirmationType(type);
    setConfirmationData({ notes: '', photo: null });
    setShowConfirmationModal(true);
  };

  const validerConfirmation = async () => {
    try {
      const nouveauStatut = confirmationType === 'reception' ? 'EN_COURS' : 'TERMINEE';
      
      await wasteService.changerStatutCollecte(selectedCollecte.id, nouveauStatut);

      setShowConfirmationModal(false);
      await loadCollectes();
      
      const action = confirmationType === 'reception' ? 'réception' : 'émission';
      alert(`${action} confirmée avec succès !`);
    } catch (error) {
      console.error('Erreur confirmation:', error);
      alert('Erreur lors de la confirmation');
    }
  };

  const getFilteredFormulaires = () => {
    if (formulaireFilter === 'tous') return formulaires;
    return formulaires.filter(f => f.statut === formulaireFilter);
  };

  const getFilteredCollectes = () => {
    if (collecteFilter === 'assignees') {
      return collectes.filter(c => c.transporteur?.id === user?.id);
    } else if (collecteFilter === 'disponibles') {
      return collectes.filter(c => !c.transporteur && c.statut === 'PLANIFIEE');
    }
    return collectes;
  };

  const getStatutColor = (statut) => {
    const colors = {
      'PLANIFIEE': '#3b82f6',
      'EN_COURS': '#f59e0b',
      'TERMINEE': '#10b981',
      'ANNULEE': '#ef4444'
    };
    return colors[statut] || '#6b7280';
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="section-header">
        <h2>Tableau de Bord Transporteur</h2>
        <p>Gestion des collectes et vérification des formulaires</p>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats.formulaires_a_verifier || 0}</div>
            <div className="stat-label">Formulaires à Vérifier</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-number">{stats.collectes_assignees || 0}</div>
            <div className="stat-label">Mes Collectes</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats.collectes_en_attente || 0}</div>
            <div className="stat-label">En Attente</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.collectes_terminees || 0}</div>
            <div className="stat-label">Terminées</div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <h3>Actions Rapides</h3>
        <div className="actions-grid">
          <button 
            className="action-btn primary"
            onClick={() => setActiveSection('formulaires')}
          >
            📝 Vérifier Formulaires
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => setActiveSection('collectes')}
          >
            🚛 Mes Collectes
          </button>
          <button 
            className="action-btn tertiary"
            onClick={() => setActiveSection('notifications')}
          >
            🔔 Notifications ({notifications.filter(n => n.unread).length})
          </button>
        </div>
      </div>

      {/* Collectes urgentes */}
      <div className="urgent-section">
        <h3>Collectes Urgentes</h3>
        <div className="urgent-list">
          {collectes
            .filter(c => c.transporteur?.id === user?.id && c.statut === 'EN_COURS')
            .slice(0, 3)
            .map(collecte => (
              <div key={collecte.id} className="urgent-item">
                <div className="urgent-info">
                  <span className="urgent-ref">{collecte.reference}</span>
                  <span className="urgent-date">
                    {new Date(collecte.date_collecte).toLocaleDateString()}
                  </span>
                </div>
                <button 
                  className="btn-urgent"
                  onClick={() => confirmerReceptionEmission(collecte, 'emission')}
                >
                  Confirmer
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderFormulaires = () => (
    <div className="formulaires-section">
      <div className="section-header">
        <h2>Vérification des Formulaires</h2>
        <p>Examiner et valider les formulaires de collecte</p>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Statut:</label>
          <select 
            value={formulaireFilter}
            onChange={(e) => setFormulaireFilter(e.target.value)}
          >
            <option value="tous">Tous</option>
            <option value="VALIDE">Validés</option>
            <option value="EN_COURS">En cours</option>
          </select>
        </div>
      </div>

      {/* Liste des formulaires */}
      <div className="formulaires-grid">
        {getFilteredFormulaires().map(formulaire => (
          <div key={formulaire.id} className="formulaire-card">
            <div className="card-header">
              <h4>{formulaire.reference}</h4>
              <span className={`status-badge ${formulaire.statut.toLowerCase()}`}>
                {formulaire.statut}
              </span>
            </div>
            
            <div className="card-content">
              <div className="info-row">
                <span className="label">Client:</span>
                <span>{formulaire.utilisateur_nom}</span>
              </div>
              <div className="info-row">
                <span className="label">Type:</span>
                <span>{formulaire.type_dechets}</span>
              </div>
              <div className="info-row">
                <span className="label">Mode:</span>
                <span>{formulaire.mode_collecte}</span>
              </div>
              <div className="info-row">
                <span className="label">Date:</span>
                <span>{new Date(formulaire.date_souhaitee).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="card-actions">
              <button 
                className="btn-secondary"
                onClick={() => voirFormulaireDetails(formulaire)}
              >
                🔍 Détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {getFilteredFormulaires().length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Aucun formulaire à vérifier</h3>
          <p>Tous les formulaires ont été traités.</p>
        </div>
      )}

      {/* Modal détails formulaire */}
      {showFormulaireModal && selectedFormulaire && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>Détails du Formulaire - {selectedFormulaire.reference}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFormulaireModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="formulaire-details">
                <div className="details-section">
                  <h4>Informations Client</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Nom:</span>
                      <span>{selectedFormulaire.utilisateur_nom}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Téléphone:</span>
                      <span>{selectedFormulaire.telephone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Adresse:</span>
                      <span>{selectedFormulaire.adresse_collecte}</span>
                    </div>
                  </div>
                </div>
                
                <div className="details-section">
                  <h4>Détails de la Collecte</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Type de déchets:</span>
                      <span>{selectedFormulaire.type_dechets}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Quantité estimée:</span>
                      <span>{selectedFormulaire.quantite_estimee || 'Non spécifiée'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Description:</span>
                      <span>{selectedFormulaire.description}</span>
                    </div>
                  </div>
                </div>
                
                {selectedFormulaire.instructions_speciales && (
                  <div className="details-section">
                    <h4>Instructions Spéciales</h4>
                    <p>{selectedFormulaire.instructions_speciales}</p>
                  </div>
                )}
                
                {selectedFormulaire.photos_count > 0 && (
                  <div className="details-section">
                    <h4>Photos ({selectedFormulaire.photos_count})</h4>
                    <div className="photos-grid">
                      {/* Les photos seraient affichées ici */}
                      <div className="photo-placeholder">📷 Photo 1</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowFormulaireModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCollectes = () => (
    <div className="collectes-section">
      <div className="section-header">
        <h2>Gestion des Collectes</h2>
        <p>Suivre et confirmer vos collectes assignées</p>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Afficher:</label>
          <select 
            value={collecteFilter}
            onChange={(e) => setCollecteFilter(e.target.value)}
          >
            <option value="assignees">Mes collectes</option>
            <option value="disponibles">Disponibles</option>
            <option value="toutes">Toutes</option>
          </select>
        </div>
      </div>

      {/* Tableau des collectes */}
      <div className="collectes-table">
        <div className="table-header">
          <div className="table-cell">Référence</div>
          <div className="table-cell">Client</div>
          <div className="table-cell">Date</div>
          <div className="table-cell">Statut</div>
          <div className="table-cell">Adresse</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {getFilteredCollectes().map(collecte => (
          <div key={collecte.id} className="table-row">
            <div className="table-cell">
              <strong>{collecte.reference}</strong>
            </div>
            <div className="table-cell">
              {collecte.utilisateur_nom}
            </div>
            <div className="table-cell">
              {new Date(collecte.date_collecte).toLocaleDateString()}
            </div>
            <div className="table-cell">
              <span 
                className="status-pill"
                style={{ backgroundColor: getStatutColor(collecte.statut) }}
              >
                {STATUS_LABELS[collecte.statut]}
              </span>
            </div>
            <div className="table-cell">
              {collecte.adresse?.substring(0, 30)}...
            </div>
            <div className="table-cell">
              <div className="action-buttons">
                {!collecte.transporteur && collecte.statut === 'PLANIFIEE' && (
                  <button 
                    className="btn-sm primary"
                    onClick={() => assignerCollecte(collecte.id)}
                  >
                    Assigner
                  </button>
                )}
                
                {collecte.transporteur?.id === user?.id && collecte.statut === 'PLANIFIEE' && (
                  <button 
                    className="btn-sm secondary"
                    onClick={() => confirmerReceptionEmission(collecte, 'reception')}
                  >
                    📦 Réception
                  </button>
                )}
                
                {collecte.transporteur?.id === user?.id && collecte.statut === 'EN_COURS' && (
                  <button 
                    className="btn-sm tertiary"
                    onClick={() => confirmerReceptionEmission(collecte, 'emission')}
                  >
                    🚚 Émission
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {getFilteredCollectes().length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <h3>Aucune collecte trouvée</h3>
          <p>Aucune collecte ne correspond aux filtres sélectionnés.</p>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmationModal && selectedCollecte && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                Confirmer la {confirmationType === 'reception' ? 'Réception' : 'Émission'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowConfirmationModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="confirmation-details">
                <div className="detail-item">
                  <span className="label">Collecte:</span>
                  <span>{selectedCollecte.reference}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Client:</span>
                  <span>{selectedCollecte.utilisateur_nom}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Action:</span>
                  <span>
                    {confirmationType === 'reception' ? 
                      'Confirmer la réception des déchets' : 
                      'Confirmer l\'émission vers le centre de tri'
                    }
                  </span>
                </div>
              </div>
              
              <div className="form-group">
                <label>Notes (optionnel):</label>
                <textarea
                  value={confirmationData.notes}
                  onChange={(e) => setConfirmationData({
                    ...confirmationData,
                    notes: e.target.value
                  })}
                  placeholder="Ajouter des observations..."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowConfirmationModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-primary"
                onClick={validerConfirmation}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="notifications-section">
      <div className="section-header">
        <h2>Notifications</h2>
        <p>Alertes et messages importants</p>
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.unread ? 'unread' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'nouvelle_collecte' && '🚛'}
              {notification.type === 'collecte_urgent' && '⚠️'}
              {notification.type === 'rappel' && '🔔'}
            </div>
            <div className="notification-content">
              <p>{notification.message}</p>
              <span className="notification-time">Il y a {notification.time}</span>
            </div>
            {notification.unread && <div className="unread-indicator"></div>}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">
            <h1 className="dashboard-title">🌱 EcoTrace</h1>
            <span className="badge-transporteur">Transporteur</span>
          </div>
          
          <div className="dashboard-user-info">
            <span className="user-welcome">
              Bonjour, {user?.first_name || user?.username}
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <nav className="dashboard-sidebar">
        <div className="sidebar-menu">
          <button 
            className={`menu-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <span className="menu-icon">🏠</span>
            Vue d'ensemble
          </button>
          <button 
            className={`menu-item ${activeSection === 'formulaires' ? 'active' : ''}`}
            onClick={() => setActiveSection('formulaires')}
          >
            <span className="menu-icon">📝</span>
            Vérifier Formulaires
          </button>
          <button 
            className={`menu-item ${activeSection === 'collectes' ? 'active' : ''}`}
            onClick={() => setActiveSection('collectes')}
          >
            <span className="menu-icon">🚛</span>
            Mes Collectes
          </button>
          <button 
            className={`menu-item ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            <span className="menu-icon">🔔</span>
            Notifications
            {notifications.filter(n => n.unread).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'formulaires' && renderFormulaires()}
        {activeSection === 'collectes' && renderCollectes()}
        {activeSection === 'notifications' && renderNotifications()}
      </main>
    </div>
  );
};

export default TransporteurDashboard;