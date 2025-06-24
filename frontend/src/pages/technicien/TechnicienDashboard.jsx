import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS } from '../../utils/constants';
import Logo from '../../components/common/Logo';
import '../../styles/TechnicienDashboard.css';

const TechnicienDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Données
  const [stats, setStats] = useState({});
  const [dechetsRecus, setDechetsRecus] = useState([]);
  const [processusValorisation, setProcessusValorisation] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // États pour la valorisation
  const [selectedDechet, setSelectedDechet] = useState(null);
  const [showValorisationModal, setShowValorisationModal] = useState(false);
  const [valorisationData, setValorisationData] = useState({
    typeValorisation: '',
    quantiteValorisee: '',
    rendement: '',
    notes: ''
  });

  // Filtres
  const [dechetFilter, setDechetFilter] = useState('tous');
  const [processusFilter, setProcessusFilter] = useState('en_cours');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'TECHNICIEN') {
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
        loadDechetsRecus(),
        loadProcessusValorisation(),
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
  };  const loadStats = async () => {
    try {
      const stats = await wasteService.getStatsTechnicien();
      setStats(stats);
    } catch (error) {
      console.error('Erreur stats:', error);
      // Données par défaut en cas d'erreur
      setStats({
        dechets_recus: 0,
        dechets_en_cours: 0,
        dechets_valorises: 0,
        dechets_recycles: 0,
        dechets_detruits: 0
      });
    }
  };  const loadDechetsRecus = async () => {
    try {
      const [dechetsRecus, dechetsEnCours, dechetsValorises] = await Promise.all([
        wasteService.getDechetsRecus(),
        wasteService.getDechetsEnCours(),
        wasteService.getDechetsValorises()
      ]);
      
      // Organiser les déchets par statut
      const tousLesDechets = [
        ...(dechetsRecus.dechets || []).map(d => ({ ...d, statut: 'nouveau', actionDisponible: true })),
        ...(dechetsEnCours.dechets || []).map(d => ({ ...d, statut: 'en_cours', actionDisponible: true })),
        ...(dechetsValorises.dechets || []).map(d => ({ ...d, statut: 'termine', actionDisponible: false }))
      ];
      
      setDechetsRecus(tousLesDechets);
    } catch (error) {
      console.error('Erreur déchets reçus:', error);
      setDechetsRecus([]);
    }
  };  const loadProcessusValorisation = async () => {
    try {
      const [dechetsEnCours, dechetsValorises] = await Promise.all([
        wasteService.getDechetsEnCours(),
        wasteService.getDechetsValorises()
      ]);
      
      // Créer des processus basés sur les déchets en cours et terminés
      const processus = [
        ...(dechetsEnCours.dechets || []).map(d => ({
          id: `process_${d.id}`,
          dechetId: d.id,
          typeValorisation: d.etat_display || d.etat,
          statut: 'en_cours',
          dateDebut: d.date_traitement || d.created_at,
          dateFin: null,
          dechetDetails: d,
          rendement: null
        })),
        ...(dechetsValorises.dechets || []).map(d => ({
          id: `process_${d.id}`,
          dechetId: d.id,
          typeValorisation: d.etat_display || d.etat,
          statut: 'termine',
          dateDebut: d.date_traitement || d.created_at,
          dateFin: d.date_traitement,
          dechetDetails: d,
          rendement: 85 // Mock rendement
        }))
      ];
      
      setProcessusValorisation(processus);
    } catch (error) {
      console.error('Erreur processus valorisation:', error);
      setProcessusValorisation([]);
    }
  };

  const loadNotifications = async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'nouveau_dechet',
        message: 'Nouveaux déchets électroniques reçus',
        time: '1h',
        unread: true
      },
      {
        id: 2,
        type: 'processus_termine',
        message: 'Processus de valorisation terminé - Lot #2024-003',
        time: '3h',
        unread: true
      },
      {
        id: 3,
        type: 'rappel',
        message: 'Contrôle qualité programmé demain',
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
  };  const commencerValorisation = async (dechet) => {
    try {
      if (dechet.statut === 'nouveau') {
        // D'abord démarrer la valorisation (assigner au technicien)
        await wasteService.demarrerValorisation(dechet.id);
      }
      
      setSelectedDechet(dechet);      setValorisationData({
        typeValorisation: 'A_RECYCLER', // Valeur par défaut
        quantiteValorisee: dechet.quantite || '',
        rendement: '85',
        notes: ''
      });
      setShowValorisationModal(true);
    } catch (error) {
      console.error('Erreur démarrage valorisation:', error);
      alert('Erreur lors du démarrage de la valorisation: ' + (error.response?.data?.error || error.message));
    }
  };  const validerValorisation = async () => {
    try {
      if (!valorisationData.typeValorisation) {
        alert('Veuillez sélectionner un type de valorisation');
        return;
      }

      // Préparer les données de valorisation
      const formData = {
        type_valorisation: valorisationData.typeValorisation,
        quantite_valorisee: valorisationData.quantiteValorisee || selectedDechet.quantite,
        rendement: valorisationData.rendement || '',
        methode_valorisation: valorisationData.typeValorisation === 'A_RECYCLER' ? 'Recyclage' : 'Destruction',
        notes_technicien: valorisationData.notes || ''
      };

      // Utiliser l'API pour finaliser la valorisation
      await wasteService.valoriserDechetComplet(selectedDechet.id, formData);

      setShowValorisationModal(false);
      
      // Recharger les données
      await Promise.all([
        loadDechetsRecus(),
        loadProcessusValorisation(),
        loadStats()
      ]);
      
      alert('Valorisation effectuée avec succès !');
    } catch (error) {
      console.error('Erreur valorisation:', error);
      alert('Erreur lors de la valorisation: ' + (error.response?.data?.error || error.message));
    }
  };
  const terminerProcessus = async (processusId) => {
    try {
      // Extraire l'ID du déchet du processusId
      const dechetId = processusId.replace('process_', '');
      
      // Finaliser la valorisation (marquer comme recyclé ou détruit selon le type)
      const processus = processusValorisation.find(p => p.id === processusId);
      const etatFinal = processus?.typeValorisation?.includes('RECYCL') ? 'RECYCLE' : 'DETRUIT';
      
      await wasteService.valoriserDechet(dechetId, etatFinal);

      // Recharger les données
      await Promise.all([
        loadDechetsRecus(),
        loadProcessusValorisation(),
        loadStats()
      ]);
      
      alert('Processus de valorisation terminé !');
    } catch (error) {
      console.error('Erreur terminer processus:', error);
      alert('Erreur lors de la finalisation: ' + (error.response?.data?.error || error.message));
    }
  };
  const getFilteredDechets = () => {
    if (dechetFilter === 'tous') return dechetsRecus;
    return dechetsRecus.filter(d => d.statut === dechetFilter);
  };

  const getFilteredProcessus = () => {
    if (processusFilter === 'tous') return processusValorisation;
    return processusValorisation.filter(p => p.statut === processusFilter);
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="section-header">
        <h2>Tableau de Bord Technicien</h2>
        <p>Valorisation et traitement des déchets</p>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-number">{stats.dechets_recus || 0}</div>
            <div className="stat-label">Déchets Reçus</div>
          </div>
        </div>
          <div className="stat-card">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.dechets_en_cours || 0}</div>
            <div className="stat-label">En Valorisation</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">♻️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.dechets_valorises || 0}</div>
            <div className="stat-label">Valorisés</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">
              {stats.dechets_recycles || 0}/{stats.dechets_detruits || 0}
            </div>
            <div className="stat-label">Recyclés/Détruits</div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <h3>Actions Rapides</h3>
        <div className="actions-grid">
          <button 
            className="action-btn primary"
            onClick={() => setActiveSection('dechets')}
          >
            📦 Déchets Reçus
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => setActiveSection('valorisation')}
          >
            ♻️ Processus Valorisation
          </button>
          <button 
            className="action-btn tertiary"
            onClick={() => setActiveSection('notifications')}
          >
            🔔 Notifications ({notifications.filter(n => n.unread).length})
          </button>
        </div>
      </div>

      {/* Processus en cours */}
      <div className="urgent-section">
        <h3>Processus en Cours</h3>
        <div className="urgent-list">
          {processusValorisation
            .filter(p => p.statut === 'en_cours')
            .slice(0, 3)
            .map(processus => (
              <div key={processus.id} className="urgent-item">                <div className="urgent-info">
                  <span className="urgent-ref">{processus.typeValorisation}</span>
                  <span className="urgent-date">
                    {processus.dechetDetails?.collecte?.utilisateur?.nom || 'Utilisateur inconnu'}
                  </span>
                </div>
                <button 
                  className="btn-urgent"
                  onClick={() => terminerProcessus(processus.id)}
                >
                  Terminer
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
  const renderDechets = () => (
    <div className="dechets-section">
      <div className="section-header">
        <h2>Déchets Reçus</h2>
        <p>Déchets livrés par les transporteurs en attente de valorisation</p>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Statut:</label>
          <select 
            value={dechetFilter}
            onChange={(e) => setDechetFilter(e.target.value)}
          >
            <option value="tous">Tous</option>
            <option value="nouveau">Nouveaux</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminés</option>
          </select>
        </div>
      </div>

      {/* Liste des déchets */}
      <div className="dechets-grid">
        {getFilteredDechets().map(dechet => (
          <div key={dechet.id} className="dechet-card">
            <div className="card-header">
              <h4>{dechet.collecte?.utilisateur?.nom || 'Utilisateur inconnu'}</h4>
              <span className={`status-badge ${dechet.statut}`}>
                {dechet.statut === 'nouveau' ? 'Nouveau' : 
                 dechet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
              </span>
            </div>
            
            <div className="card-content">
              <div className="info-row">
                <span className="label">Type de déchet:</span>
                <span>{dechet.type}</span>
              </div>
              <div className="info-row">
                <span className="label">Catégorie:</span>
                <span>{dechet.categorie}</span>
              </div>
              <div className="info-row">
                <span className="label">Quantité:</span>
                <span>{dechet.quantite} kg</span>
              </div>
              <div className="info-row">
                <span className="label">État:</span>
                <span>{dechet.etat_display}</span>
              </div>
              <div className="info-row">
                <span className="label">Collecte:</span>
                <span>{dechet.collecte?.reference}</span>
              </div>
              {dechet.description && (
                <div className="info-row">
                  <span className="label">Description:</span>
                  <span>{dechet.description}</span>
                </div>
              )}
            </div>
            
            <div className="card-actions">
              {dechet.actionDisponible && dechet.statut !== 'termine' && (
                <button 
                  className="btn-action primary"
                  onClick={() => commencerValorisation(dechet)}
                >
                  {dechet.statut === 'nouveau' ? 'Commencer Valorisation' : 'Continuer Valorisation'}
                </button>
              )}
            </div>
          </div>
        ))}
        
        {getFilteredDechets().length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>Aucun déchet reçu</h3>
            <p>Aucun déchet ne correspond aux filtres sélectionnés.</p>
          </div>
        )}      </div>

      {/* Modal de valorisation */}
      {showValorisationModal && selectedDechet && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Démarrer la Valorisation</h3>
              <button 
                className="modal-close"
                onClick={() => setShowValorisationModal(false)}
              >
                ✕
              </button>
            </div>
              <div className="modal-body">
              <div className="valorisation-details">
                <div className="detail-item">
                  <span className="label">Utilisateur:</span>
                  <span>{selectedDechet.collecte?.utilisateur?.nom || 'Utilisateur inconnu'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Type de déchet:</span>
                  <span>{selectedDechet.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Catégorie:</span>
                  <span>{selectedDechet.categorie}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantité disponible:</span>
                  <span>{selectedDechet.quantite} kg</span>
                </div>
                <div className="detail-item">
                  <span className="label">État actuel:</span>
                  <span>{selectedDechet.etat_display}</span>
                </div>
              </div>
                <div className="form-group">
                <label>Type de valorisation *:</label>
                <select
                  value={valorisationData.typeValorisation}
                  onChange={(e) => setValorisationData({
                    ...valorisationData,
                    typeValorisation: e.target.value
                  })}
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="A_RECYCLER">Préparer pour recyclage</option>
                  <option value="A_DETRUIRE">Préparer pour destruction</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantité valorisée (kg):</label>
                <input
                  type="number"
                  value={valorisationData.quantiteValorisee}
                  onChange={(e) => setValorisationData({
                    ...valorisationData,
                    quantiteValorisee: e.target.value
                  })}
                  placeholder="Quantité en kg"
                  max={selectedDechet.quantite}
                />
              </div>
              
              <div className="form-group">
                <label>Rendement estimé (%):</label>
                <input
                  type="number"
                  value={valorisationData.rendement}
                  onChange={(e) => setValorisationData({
                    ...valorisationData,
                    rendement: e.target.value
                  })}
                  placeholder="Pourcentage"
                  min="0"
                  max="100"
                />
              </div>
              
              <div className="form-group">
                <label>Notes techniques:</label>
                <textarea
                  value={valorisationData.notes}
                  onChange={(e) => setValorisationData({
                    ...valorisationData,
                    notes: e.target.value
                  })}
                  placeholder="Observations techniques..."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowValorisationModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-primary"
                onClick={validerValorisation}
              >
                Démarrer la Valorisation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderValorisation = () => (
    <div className="valorisation-section">
      <div className="section-header">
        <h2>Processus de Valorisation</h2>
        <p>Suivi des processus de valorisation en cours et terminés</p>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Statut:</label>
          <select 
            value={processusFilter}
            onChange={(e) => setProcessusFilter(e.target.value)}
          >
            <option value="tous">Tous</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminés</option>
          </select>
        </div>
      </div>      {/* Tableau des processus */}
      <div className="processus-table">
        <div className="table-header">
          <div className="table-cell">Utilisateur</div>
          <div className="table-cell">Type Déchet</div>
          <div className="table-cell">Quantité</div>
          <div className="table-cell">État Valorisation</div>
          <div className="table-cell">Date Début</div>
          <div className="table-cell">Statut</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {getFilteredProcessus().map(processus => (
          <div key={processus.id} className="table-row">
            <div className="table-cell">
              <strong>{processus.dechetDetails?.collecte?.utilisateur?.nom || 'Utilisateur inconnu'}</strong>
            </div>
            <div className="table-cell">
              {processus.dechetDetails?.type}
            </div>
            <div className="table-cell">
              {processus.dechetDetails?.quantite} kg
            </div>
            <div className="table-cell">
              {processus.typeValorisation}
            </div>
            <div className="table-cell">
              {new Date(processus.dateDebut).toLocaleDateString()}
            </div>
            <div className="table-cell">
              <span 
                className="status-pill"
                style={{ 
                  backgroundColor: processus.statut === 'termine' ? '#10b981' : '#f59e0b' 
                }}
              >
                {processus.statut === 'termine' ? 'Terminé' : 'En cours'}
              </span>
            </div>
            <div className="table-cell">
              <div className="action-buttons">
                {processus.statut === 'en_cours' && (
                  <button 
                    className="btn-sm primary"
                    onClick={() => terminerProcessus(processus.id)}
                  >
                    ✅ Terminer
                  </button>
                )}
                {processus.statut === 'termine' && (
                  <span className="completed-badge">
                    ✅ Terminé le {new Date(processus.dateFin).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {getFilteredProcessus().length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <h3>Aucun processus trouvé</h3>
          <p>Aucun processus ne correspond aux filtres sélectionnés.</p>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="notifications-section">
      <div className="section-header">
        <h2>Notifications</h2>
        <p>Alertes et messages techniques</p>
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.unread ? 'unread' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'nouveau_dechet' && '📦'}
              {notification.type === 'processus_termine' && '✅'}
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
            <Logo size="medium" className="dashboard-logo" />
            <span className="badge-technicien">Technicien</span>
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
            className={`menu-item ${activeSection === 'dechets' ? 'active' : ''}`}
            onClick={() => setActiveSection('dechets')}
          >
            <span className="menu-icon">📦</span>
            Déchets Reçus
          </button>
          <button 
            className={`menu-item ${activeSection === 'valorisation' ? 'active' : ''}`}
            onClick={() => setActiveSection('valorisation')}
          >
            <span className="menu-icon">♻️</span>
            Valoriser les Déchets
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
        {activeSection === 'dechets' && renderDechets()}
        {activeSection === 'valorisation' && renderValorisation()}
        {activeSection === 'notifications' && renderNotifications()}
      </main>
    </div>
  );
};

export default TechnicienDashboard;
