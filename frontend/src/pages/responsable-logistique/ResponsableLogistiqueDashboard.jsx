import '../../styles/ResponsableLogistiqueDashboard.css';
import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS, COLLECTE_STATUS } from '../../utils/constants';

const ResponsableLogistiqueDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Données
  const [stats, setStats] = useState({});
  const [collectes, setCollectes] = useState([]);
  const [dechets, setDechets] = useState([]);
  const [formulaires, setFormulaires] = useState([]);
  
  // États pour la planification
  const [showPlanificationModal, setShowPlanificationModal] = useState(false);
  const [selectedFormulaire, setSelectedFormulaire] = useState(null);
  const [planificationData, setPlanificationData] = useState({
    date_collecte: '',
    transporteur_id: '',
    instructions: ''
  });

  // États pour les filtres
  const [traceabilityFilter, setTraceabilityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'RESPONSABLE_LOGISTIQUE') {
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
        loadCollectes(),
        loadDechets(),
        loadFormulaires()
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

  const loadCollectes = async () => {
    try {
      const response = await wasteService.getAllCollectes();
      setCollectes(response.results || response);
    } catch (error) {
      console.error('Erreur collectes:', error);
    }
  };

  const loadDechets = async () => {
    try {
      const response = await wasteService.getAllDechets();
      setDechets(response.results || response);
    } catch (error) {
      console.error('Erreur déchets:', error);
    }
  };

  const loadFormulaires = async () => {
    try {
      const response = await wasteService.getAllFormulaires();
      const formulairesData = response.results || response;
      // Filtrer les formulaires validés sans collecte
      const formulairesValides = formulairesData.filter(f => 
        f.statut === 'VALIDE' && !f.collecte_associee
      );
      setFormulaires(formulairesValides);
    } catch (error) {
      console.error('Erreur formulaires:', error);
    }
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

  const planifierCollecte = async (formulaireId) => {
    const formulaire = formulaires.find(f => f.id === formulaireId);
    setSelectedFormulaire(formulaire);
    setPlanificationData({
      date_collecte: formulaire?.date_souhaitee || '',
      transporteur_id: '',
      instructions: formulaire?.instructions_speciales || ''
    });
    setShowPlanificationModal(true);
  };

  const confirmerPlanification = async () => {
    try {
      // Pour l'instant, on simule la création de collecte
      // Cette fonctionnalité sera complétée côté backend
      
      const collecteData = {
        utilisateur: selectedFormulaire.utilisateur.id,
        formulaire_origine: selectedFormulaire.id,
        date_collecte: planificationData.date_collecte,
        mode_collecte: selectedFormulaire.mode_collecte,
        adresse: selectedFormulaire.adresse_collecte,
        telephone: selectedFormulaire.telephone,
        statut: 'PLANIFIEE',
        instructions: planificationData.instructions
      };

      // TODO: Implémenter wasteService.createCollecte() côté backend
      console.log('Collecte à créer:', collecteData);
      
      setShowPlanificationModal(false);
      await Promise.all([loadCollectes(), loadFormulaires(), loadStats()]);
      
      alert('Collecte planifiée avec succès ! (Fonctionnalité en développement)');
    } catch (error) {
      console.error('Erreur planification:', error);
      alert('Erreur lors de la planification');
    }
  };

  const getFilteredDechets = () => {
    let filtered = [...dechets];
    
    if (traceabilityFilter !== 'all') {
      filtered = filtered.filter(d => d.etat === traceabilityFilter);
    }
    
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(today.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(d => new Date(d.created_at) >= filterDate);
    }
    
    return filtered;
  };

  const getEtatColor = (etat) => {
    const colors = {
      'COLLECTE': '#3b82f6',
      'TRI': '#f59e0b', 
      'A_RECYCLER': '#10b981',
      'RECYCLE': '#059669',
      'A_DETRUIRE': '#ef4444',
      'DETRUIT': '#dc2626'
    };
    return colors[etat] || '#6b7280';
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="section-header">
        <h2>Tableau de Bord Logistique</h2>
        <p>Gestion des collectes et suivi de la traçabilité</p>
      </div>

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{stats.formulaires_total || 0}</div>
            <div className="stat-label">Formulaires Total</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats.collectes_planifiees || 0}</div>
            <div className="stat-label">Collectes Planifiées</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-number">{stats.collectes_en_cours || 0}</div>
            <div className="stat-label">Collectes En Cours</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">♻️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.dechets_total || 0}</div>
            <div className="stat-label">Déchets Tracés</div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="quick-actions">
        <h3>Actions Rapides</h3>
        <div className="actions-grid">
          <button 
            className="action-btn primary"
            onClick={() => setActiveSection('planification')}
          >
            📅 Planifier Collectes
          </button>
          <button 
            className="action-btn secondary"
            onClick={() => setActiveSection('tracabilite')}
          >
            🔍 Suivre Traçabilité
          </button>
          <button 
            className="action-btn tertiary"
            onClick={() => setActiveSection('rapports')}
          >
            📊 Générer Rapports
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlanification = () => (
    <div className="planification-section">
      <div className="section-header">
        <h2>Planification des Collectes</h2>
        <p>Organiser les collectes à partir des formulaires validés</p>
      </div>

      {formulaires.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Aucun formulaire à planifier</h3>
          <p>Tous les formulaires validés ont déjà une collecte programmée.</p>
        </div>
      ) : (
        <div className="formulaires-grid">
          {formulaires.map(formulaire => (
            <div key={formulaire.id} className="formulaire-card">
              <div className="card-header">
                <h4>{formulaire.reference}</h4>
                <span className="status-badge valide">Validé</span>
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
                  <span className="label">Date souhaitée:</span>
                  <span>{new Date(formulaire.date_souhaitee).toLocaleDateString()}</span>
                </div>
                <div className="info-row">
                  <span className="label">Mode:</span>
                  <span>{formulaire.mode_collecte}</span>
                </div>
              </div>
              
              <div className="card-actions">
                <button 
                  className="btn-primary"
                  onClick={() => planifierCollecte(formulaire.id)}
                >
                  📅 Planifier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de planification */}
      {showPlanificationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Planifier une Collecte</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPlanificationModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Formulaire:</label>
                <div className="readonly-field">
                  {selectedFormulaire?.reference} - {selectedFormulaire?.utilisateur_nom}
                </div>
              </div>
              
              <div className="form-group">
                <label>Date de collecte:</label>
                <input
                  type="date"
                  value={planificationData.date_collecte}
                  onChange={(e) => setPlanificationData({
                    ...planificationData,
                    date_collecte: e.target.value
                  })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label>Instructions supplémentaires:</label>
                <textarea
                  value={planificationData.instructions}
                  onChange={(e) => setPlanificationData({
                    ...planificationData,
                    instructions: e.target.value
                  })}
                  placeholder="Instructions particulières pour la collecte..."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowPlanificationModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-primary"
                onClick={confirmerPlanification}
                disabled={!planificationData.date_collecte}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTracabilite = () => (
    <div className="tracabilite-section">
      <div className="section-header">
        <h2>Suivi de la Traçabilité</h2>
        <p>Suivre le parcours complet des déchets collectés</p>
      </div>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>État:</label>
          <select 
            value={traceabilityFilter}
            onChange={(e) => setTraceabilityFilter(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="COLLECTE">Collecté</option>
            <option value="TRI">En cours de tri</option>
            <option value="A_RECYCLER">À recycler</option>
            <option value="RECYCLE">Recyclé</option>
            <option value="A_DETRUIRE">À détruire</option>
            <option value="DETRUIT">Détruit</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Période:</label>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Toutes</option>
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="quarter">3 derniers mois</option>
          </select>
        </div>
      </div>

      {/* Tableau de traçabilité */}
      <div className="tracability-table">
        <div className="table-header">
          <div className="table-cell">ID</div>
          <div className="table-cell">Type</div>
          <div className="table-cell">Collecte</div>
          <div className="table-cell">État</div>
          <div className="table-cell">Technicien</div>
          <div className="table-cell">Date</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {getFilteredDechets().map(dechet => (
          <div key={dechet.id} className="table-row">
            <div className="table-cell">#{dechet.id}</div>
            <div className="table-cell">{dechet.type}</div>
            <div className="table-cell">
              {dechet.collecte?.reference || 'N/A'}
            </div>
            <div className="table-cell">
              <span 
                className="status-pill"
                style={{ backgroundColor: getEtatColor(dechet.etat) }}
              >
                {dechet.etat}
              </span>
            </div>
            <div className="table-cell">
              {dechet.technicien?.username || 'Non assigné'}
            </div>
            <div className="table-cell">
              {new Date(dechet.created_at).toLocaleDateString()}
            </div>
            <div className="table-cell">
              <button className="btn-icon" title="Voir détails">
                👁️
              </button>
            </div>
          </div>
        ))}
      </div>

      {getFilteredDechets().length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Aucun déchet trouvé</h3>
          <p>Aucun déchet ne correspond aux filtres sélectionnés.</p>
        </div>
      )}
    </div>
  );

  const renderRapports = () => (
    <div className="rapports-section">
      <div className="section-header">
        <h2>Rapports et Analytics</h2>
        <p>Consulter et générer des rapports détaillés</p>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon">📊</div>
          <h3>Rapport de Collectes</h3>
          <p>Vue d'ensemble des collectes par période</p>
          <button className="btn-primary">Générer</button>
        </div>
        
        <div className="report-card">
          <div className="report-icon">♻️</div>
          <h3>Rapport de Traçabilité</h3>
          <p>Suivi complet du traitement des déchets</p>
          <button className="btn-primary">Générer</button>
        </div>
        
        <div className="report-card">
          <div className="report-icon">📈</div>
          <h3>Tableau de Performance</h3>
          <p>Indicateurs clés de performance</p>
          <button className="btn-primary">Générer</button>
        </div>
        
        <div className="report-card">
          <div className="report-icon">🗓️</div>
          <h3>Planning Mensuel</h3>
          <p>Vue calendaire des collectes planifiées</p>
          <button className="btn-primary">Générer</button>
        </div>
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
            <span className="badge-logistique">Responsable Logistique</span>
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
            <span className="menu-icon">📊</span>
            Vue d'ensemble
          </button>
          <button 
            className={`menu-item ${activeSection === 'planification' ? 'active' : ''}`}
            onClick={() => setActiveSection('planification')}
          >
            <span className="menu-icon">📅</span>
            Planifier Collectes
          </button>
          <button 
            className={`menu-item ${activeSection === 'tracabilite' ? 'active' : ''}`}
            onClick={() => setActiveSection('tracabilite')}
          >
            <span className="menu-icon">🔍</span>
            Suivre Traçabilité
          </button>
          <button 
            className={`menu-item ${activeSection === 'rapports' ? 'active' : ''}`}
            onClick={() => setActiveSection('rapports')}
          >
            <span className="menu-icon">📈</span>
            Rapports
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'planification' && renderPlanification()}
        {activeSection === 'tracabilite' && renderTracabilite()}
        {activeSection === 'rapports' && renderRapports()}
      </main>
    </div>
  );
};

export default ResponsableLogistiqueDashboard;