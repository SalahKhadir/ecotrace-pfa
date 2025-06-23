import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS } from '../../utils/constants';
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
  };

  const loadStats = async () => {
    try {
      const data = await wasteService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
      // Données simulées pour les stats
      setStats({
        dechets_recus: 45,
        en_valorisation: 12,
        valorises: 28,
        taux_valorisation: 85
      });
    }
  };

  const loadDechetsRecus = async () => {
    try {
      // Charger les déchets livrés par les transporteurs
      const validatedCollections = JSON.parse(localStorage.getItem('validatedCollections') || '[]');
      const dechetsLivres = validatedCollections.filter(c => c.statut === 'livre');
      setDechetsRecus(dechetsLivres);
    } catch (error) {
      console.error('Erreur déchets reçus:', error);
    }
  };

  const loadProcessusValorisation = async () => {
    try {
      const processus = JSON.parse(localStorage.getItem('processusValorisation') || '[]');
      setProcessusValorisation(processus);
    } catch (error) {
      console.error('Erreur processus valorisation:', error);
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
  };

  const commencerValorisation = (dechet) => {
    setSelectedDechet(dechet);
    setValorisationData({
      typeValorisation: '',
      quantiteValorisee: '',
      rendement: '',
      notes: ''
    });
    setShowValorisationModal(true);
  };

  const validerValorisation = async () => {
    try {
      if (!valorisationData.typeValorisation || !valorisationData.quantiteValorisee) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const processus = {
        id: Date.now().toString(),
        dechetId: selectedDechet.id,
        dechetDetails: selectedDechet,
        typeValorisation: valorisationData.typeValorisation,
        quantiteValorisee: valorisationData.quantiteValorisee,
        rendement: valorisationData.rendement,
        notes: valorisationData.notes,
        statut: 'en_cours',
        dateDebut: new Date().toISOString(),
        technicienId: user.id
      };

      // Sauvegarder le processus
      const processusExistants = JSON.parse(localStorage.getItem('processusValorisation') || '[]');
      processusExistants.push(processus);
      localStorage.setItem('processusValorisation', JSON.stringify(processusExistants));

      // Mettre à jour le statut du déchet
      const validatedCollections = JSON.parse(localStorage.getItem('validatedCollections') || '[]');
      const updatedCollections = validatedCollections.map(c => 
        c.id === selectedDechet.id 
          ? { ...c, statut: 'en_valorisation', dateDebutValorisation: new Date().toISOString() }
          : c
      );
      localStorage.setItem('validatedCollections', JSON.stringify(updatedCollections));

      setShowValorisationModal(false);
      await loadDechetsRecus();
      await loadProcessusValorisation();
      
      alert('Processus de valorisation démarré avec succès !');
    } catch (error) {
      console.error('Erreur valorisation:', error);
      alert('Erreur lors du démarrage de la valorisation');
    }
  };

  const terminerProcessus = async (processusId) => {
    try {
      const processusExistants = JSON.parse(localStorage.getItem('processusValorisation') || '[]');
      const updatedProcessus = processusExistants.map(p => 
        p.id === processusId 
          ? { ...p, statut: 'termine', dateFin: new Date().toISOString() }
          : p
      );
      localStorage.setItem('processusValorisation', JSON.stringify(updatedProcessus));

      await loadProcessusValorisation();
      alert('Processus de valorisation terminé !');
    } catch (error) {
      console.error('Erreur terminer processus:', error);
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
            <div className="stat-number">{stats.en_valorisation || 0}</div>
            <div className="stat-label">En Valorisation</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">♻️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.valorises || 0}</div>
            <div className="stat-label">Valorisés</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats.taux_valorisation || 0}%</div>
            <div className="stat-label">Taux de Valorisation</div>
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
              <div key={processus.id} className="urgent-item">
                <div className="urgent-info">
                  <span className="urgent-ref">{processus.typeValorisation}</span>
                  <span className="urgent-date">
                    {processus.dechetDetails?.formDetails?.entrepriseNom}
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
            <option value="livre">Livrés</option>
            <option value="en_valorisation">En valorisation</option>
          </select>
        </div>
      </div>

      {/* Liste des déchets */}
      <div className="dechets-grid">
        {getFilteredDechets().map(dechet => (
          <div key={dechet.id} className="dechet-card">
            <div className="card-header">
              <h4>{dechet.formDetails?.entrepriseNom}</h4>
              <span className={`status-badge ${dechet.statut}`}>
                {dechet.statut === 'livre' ? 'Livré' : 'En valorisation'}
              </span>
            </div>
            
            <div className="card-content">
              <div className="info-row">
                <span className="label">Type de déchet:</span>
                <span>{dechet.formDetails?.typeDechet}</span>
              </div>
              <div className="info-row">
                <span className="label">Quantité collectée:</span>
                <span>{dechet.quantiteCollectee} kg</span>
              </div>
              <div className="info-row">
                <span className="label">Date livraison:</span>
                <span>{new Date(dechet.dateLivraison).toLocaleDateString()}</span>
              </div>
              <div className="info-row">
                <span className="label">Transporteur:</span>
                <span>Transport #{dechet.transporteurId}</span>
              </div>
            </div>
            
            <div className="card-actions">
              {dechet.statut === 'livre' && (
                <button 
                  className="btn-primary"
                  onClick={() => commencerValorisation(dechet)}
                >
                  ♻️ Valoriser
                </button>
              )}
              {dechet.statut === 'en_valorisation' && (
                <span className="processing-badge">En cours de valorisation</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {getFilteredDechets().length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>Aucun déchet reçu</h3>
          <p>Aucun déchet ne correspond aux filtres sélectionnés.</p>
        </div>
      )}

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
                  <span className="label">Entreprise:</span>
                  <span>{selectedDechet.formDetails?.entrepriseNom}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Type de déchet:</span>
                  <span>{selectedDechet.formDetails?.typeDechet}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Quantité disponible:</span>
                  <span>{selectedDechet.quantiteCollectee} kg</span>
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
                  <option value="recyclage">Recyclage</option>
                  <option value="compostage">Compostage</option>
                  <option value="valorisation_energetique">Valorisation énergétique</option>
                  <option value="reparation">Réparation/Réutilisation</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Quantité à valoriser (kg) *:</label>
                <input
                  type="number"
                  value={valorisationData.quantiteValorisee}
                  onChange={(e) => setValorisationData({
                    ...valorisationData,
                    quantiteValorisee: e.target.value
                  })}
                  max={selectedDechet.quantiteCollectee}
                  placeholder="Quantité en kg"
                  required
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
                  placeholder="Pourcentage de rendement"
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
      </div>

      {/* Tableau des processus */}
      <div className="processus-table">
        <div className="table-header">
          <div className="table-cell">Entreprise</div>
          <div className="table-cell">Type Valorisation</div>
          <div className="table-cell">Quantité</div>
          <div className="table-cell">Rendement</div>
          <div className="table-cell">Date Début</div>
          <div className="table-cell">Statut</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {getFilteredProcessus().map(processus => (
          <div key={processus.id} className="table-row">
            <div className="table-cell">
              <strong>{processus.dechetDetails?.formDetails?.entrepriseNom}</strong>
            </div>
            <div className="table-cell">
              {processus.typeValorisation}
            </div>
            <div className="table-cell">
              {processus.quantiteValorisee} kg
            </div>
            <div className="table-cell">
              {processus.rendement}%
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
            <h1 className="dashboard-title">🌱 EcoTrace</h1>
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
