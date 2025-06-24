import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS, COLLECTE_STATUS } from '../../utils/constants';
import Logo from '../../components/common/Logo';
import '../../styles/TransporteurDashboard.css';

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
  
  // États pour la modal
  const [selectedFormulaire, setSelectedFormulaire] = useState(null);
  const [showFormulaireModal, setShowFormulaireModal] = useState(false);
    // États pour la confirmation
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedCollecte, setSelectedCollecte] = useState(null);
  const [confirmationType, setConfirmationType] = useState('reception'); // reception ou emission
  const [confirmationData, setConfirmationData] = useState({
    notes: '',
    photo: null,
    quantite_reelle: '',
    dechets_supplementaires: []
  });// Filtres
  const [formulaireFilter, setFormulaireFilter] = useState('tous');
  const [collecteFilter, setCollecteFilter] = useState('assignees');
  const [dateFilter, setDateFilter] = useState('tous'); // nouveau filtre par date

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'TRANSPORTEUR') {
      navigate('/login');
      return;
    }
    
    loadInitialData();
  }, [navigate]);  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load user data first
      const userData = await loadUserData();
      // Then load other data (transporteur endpoints don't need user data passed)
      await Promise.all([
        loadStats(),
        loadNotifications(),
        loadFormulaires(),
        loadCollectes()
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
      return userData.user; // Return user data for immediate use
    } catch (error) {
      console.error('Erreur utilisateur:', error);
      return null;
    }
  };

  const loadStats = async () => {
    try {
      const data = await wasteService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };  const loadFormulaires = async (currentUser = null) => {
    try {
      // Use the specific transporteur endpoint
      const formulairesData = await wasteService.getFormulairesTransporteur();
      
      console.log('Formulaires from transporteur endpoint:', formulairesData);
      
      setFormulaires(formulairesData);
    } catch (error) {
      console.error('Erreur formulaires:', error);
    }
  };

  const loadCollectes = async () => {
    try {
      // Use the specific transporteur endpoint
      const collectesData = await wasteService.getCollectesTransporteur();
      
      console.log('Collectes from transporteur endpoint:', collectesData);
      
      // Convert the organized data back to a flat array for compatibility with existing code
      const allCollectes = [
        ...(collectesData.assignees || []),
        ...(collectesData.en_cours || []),
        ...(collectesData.terminees || [])
      ];
      
      setCollectes(allCollectes);
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
    setConfirmationData({ 
      notes: '', 
      photo: null,
      quantite_reelle: collecte.formulaire_origine?.quantite_estimee || '',
      dechets_supplementaires: []
    });
    setShowConfirmationModal(true);
  };

  const validerConfirmation = async () => {
    try {
      const nouveauStatut = confirmationType === 'reception' ? 'EN_COURS' : 'TERMINEE';
      
      // Pour la livraison, inclure les informations sur les déchets
      const payload = {
        statut: nouveauStatut,
        notes: confirmationData.notes
      };
      
      if (confirmationType === 'emission') {
        payload.quantite_reelle = confirmationData.quantite_reelle;
        payload.dechets_supplementaires = confirmationData.dechets_supplementaires;
      }
      
      await wasteService.changerStatutCollecte(selectedCollecte.id, payload);

      setShowConfirmationModal(false);
      await loadCollectes();
      
      const action = confirmationType === 'reception' ? 'réception' : 'livraison';
      alert(`${action} confirmée avec succès !${confirmationType === 'emission' ? ' Les déchets ont été transmis au technicien.' : ''}`);
    } catch (error) {
      console.error('Erreur confirmation:', error);
      alert('Erreur lors de la confirmation');
    }
  };

  const ajouterDechetSupplementaire = () => {
    setConfirmationData({
      ...confirmationData,
      dechets_supplementaires: [
        ...confirmationData.dechets_supplementaires,
        { type: '', categorie: '', description: '', quantite: '' }
      ]
    });
  };

  const supprimerDechetSupplementaire = (index) => {
    const nouveauxDechets = confirmationData.dechets_supplementaires.filter((_, i) => i !== index);
    setConfirmationData({
      ...confirmationData,
      dechets_supplementaires: nouveauxDechets
    });
  };

  const modifierDechetSupplementaire = (index, field, value) => {
    const nouveauxDechets = [...confirmationData.dechets_supplementaires];
    nouveauxDechets[index][field] = value;
    setConfirmationData({
      ...confirmationData,
      dechets_supplementaires: nouveauxDechets
    });
  };
  const getFilteredFormulaires = () => {
    let filtered = formulaires;
    
    // Filtre par statut
    if (formulaireFilter !== 'tous') {
      filtered = filtered.filter(f => f.statut === formulaireFilter);
    }
    
    // Filtre par date
    if (dateFilter !== 'tous') {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      
      filtered = filtered.filter(f => {
        const dateSouhaitee = new Date(f.date_souhaitee);
        
        switch (dateFilter) {
          case 'aujourd_hui':
            return dateSouhaitee.toDateString() === today.toDateString();
          case 'demain':
            return dateSouhaitee.toDateString() === tomorrow.toDateString();
          case 'cette_semaine':
            return dateSouhaitee >= today && dateSouhaitee <= weekFromNow;
          case 'urgent':
            // Formulaires avec date souhaitée dans les prochaines 24h
            return dateSouhaitee <= tomorrow && dateSouhaitee >= today;
          default:
            return true;
        }
      });
    }
    
    return filtered;
  };
  const getFilteredCollectes = () => {
    if (collecteFilter === 'assignees') {
      return collectes.filter(c => isMyCollecte(c));
    } else if (collecteFilter === 'disponibles') {
      return collectes.filter(c => !c.transporteur && !c.transporteur_info && c.statut === 'PLANIFIEE');
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
  };  // Helper function to check if a collecte is assigned to the current user
  // Since we're using the transporteur-specific endpoint, all collectes are already filtered
  const isMyCollecte = (collecte) => {
    return true; // All collectes from the transporteur endpoint are already mine
  };

  // Helper function to check if a formulaire is urgent (date souhaitée dans les prochaines 24h)
  const isFormulaireUrgent = (formulaire) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateSouhaitee = new Date(formulaire.date_souhaitee);
    
    return dateSouhaitee <= tomorrow && dateSouhaitee >= today;
  };

  // Helper function to get priority class for formulaire
  const getFormulairePriorityClass = (formulaire) => {
    if (isFormulaireUrgent(formulaire)) return 'formulaire-urgent';
    
    const today = new Date();
    const dateSouhaitee = new Date(formulaire.date_souhaitee);
    const diffDays = Math.ceil((dateSouhaitee - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 2) return 'formulaire-priorite-haute';
    if (diffDays <= 7) return 'formulaire-priorite-moyenne';
    return '';
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="section-header">
        <h2>Tableau de Bord Transporteur</h2>
        <p>Gestion des collectes et vérification des formulaires</p>
      </div>      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{formulaires.length || 0}</div>
            <div className="stat-label">Mes Formulaires</div>
          </div>
        </div>
          <div className="stat-card">
          <div className="stat-icon">🚛</div>
          <div className="stat-content">
            <div className="stat-number">{collectes.filter(c => isMyCollecte(c)).length || 0}</div>
            <div className="stat-label">Mes Collectes</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{collectes.filter(c => isMyCollecte(c) && c.statut === 'PLANIFIEE').length || 0}</div>
            <div className="stat-label">En Attente</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{collectes.filter(c => isMyCollecte(c) && c.statut === 'TERMINEE').length || 0}</div>
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
        <h3>Collectes Urgentes</h3>        <div className="urgent-list">
          {collectes
            .filter(c => isMyCollecte(c) && c.statut === 'EN_COURS')
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
  );  const renderFormulaires = () => (
    <div className="formulaires-section">
      <div className="section-header">
        <h2>Mes Formulaires de Collecte</h2>
        <p>Formulaires des collectes qui vous sont assignées</p>
      </div>

      {/* Contrôles de filtrage */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Filtrer par statut:</label>
            <select 
              value={formulaireFilter} 
              onChange={(e) => setFormulaireFilter(e.target.value)}
              className="filter-select"
            >
              <option value="tous">Tous les statuts</option>
              <option value="VALIDE">Validés</option>
              <option value="EN_COURS">En cours</option>
              <option value="TERMINEE">Terminés</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Filtrer par date:</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="tous">Toutes les dates</option>
              <option value="urgent">🔴 Urgent (24h)</option>
              <option value="aujourd_hui">📅 Aujourd'hui</option>
              <option value="demain">⏰ Demain</option>
              <option value="cette_semaine">📆 Cette semaine</option>
            </select>
          </div>
          
          <div className="filter-stats">
            <span className="results-count">
              {getFilteredFormulaires().length} formulaire(s) trouvé(s)
            </span>
          </div>
        </div>
      </div>      {/* Liste des formulaires avec détails */}
      <div className="formulaires-grid">
        {getFilteredFormulaires().map(formulaire => (
          <div key={formulaire.id} className={`formulaire-card ${getFormulairePriorityClass(formulaire)}`}>
            <div className="card-header">
              <div className="reference-and-priority">
                <h4>{formulaire.reference}</h4>
                {isFormulaireUrgent(formulaire) && (
                  <span className="priority-badge urgent">
                    🔴 URGENT
                  </span>
                )}
                {!isFormulaireUrgent(formulaire) && getFormulairePriorityClass(formulaire) === 'formulaire-priorite-haute' && (
                  <span className="priority-badge high">
                    🟠 Priorité haute
                  </span>
                )}
              </div>
              <div className="status-info">
                <span className={`status-badge ${formulaire.statut.toLowerCase()}`}>
                  {formulaire.statut}
                </span>
                {formulaire.collecte && (
                  <span 
                    className="collecte-status"
                    style={{ backgroundColor: getStatutColor(formulaire.collecte.statut) }}
                  >
                    {formulaire.collecte.statut}
                  </span>
                )}
              </div>
            </div>
            
            <div className="card-content">
              <div className="info-row">
                <span className="label">Client:</span>
                <span>{formulaire.utilisateur_info?.first_name} {formulaire.utilisateur_info?.last_name}</span>
              </div>
              <div className="info-row">
                <span className="label">Email:</span>
                <span>{formulaire.utilisateur_info?.email}</span>
              </div>
              <div className="info-row">
                <span className="label">Téléphone:</span>
                <span>{formulaire.telephone}</span>
              </div>
              <div className="info-row">
                <span className="label">Type de déchets:</span>
                <span>{formulaire.type_dechets}</span>
              </div>
              <div className="info-row">
                <span className="label">Quantité estimée:</span>
                <span>{formulaire.quantite_estimee || 'Non spécifiée'}</span>
              </div>
              <div className="info-row">
                <span className="label">Mode de collecte:</span>
                <span>{formulaire.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}</span>
              </div>
              <div className="info-row">
                <span className="label">Date souhaitée:</span>
                <span>{new Date(formulaire.date_souhaitee).toLocaleDateString()}</span>
              </div>
              {formulaire.collecte && (
                <div className="info-row">
                  <span className="label">Date de collecte:</span>
                  <span>{new Date(formulaire.collecte.date_collecte).toLocaleDateString()}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Adresse:</span>
                <span>{formulaire.adresse_collecte}</span>
              </div>
              {formulaire.instructions_speciales && (
                <div className="info-row">
                  <span className="label">Instructions:</span>
                  <span className="instructions">{formulaire.instructions_speciales}</span>
                </div>
              )}
            </div>
            
            <div className="card-actions">
              <button 
                className="btn-secondary"
                onClick={() => voirFormulaireDetails(formulaire)}
              >
                🔍 Voir Détails
              </button>
              {formulaire.collecte && formulaire.collecte.statut === 'PLANIFIEE' && (
                <button 
                  className="btn-primary"
                  onClick={() => confirmerReceptionEmission(formulaire.collecte, 'reception')}
                >
                  ✅ Confirmer Réception
                </button>
              )}
              {formulaire.collecte && formulaire.collecte.statut === 'EN_COURS' && (
                <button 
                  className="btn-success"
                  onClick={() => confirmerReceptionEmission(formulaire.collecte, 'emission')}
                >
                  🚚 Confirmer Livraison
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {getFilteredFormulaires().length === 0 && formulaires.length > 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Aucun formulaire trouvé</h3>
          <p>Aucun formulaire ne correspond aux filtres sélectionnés.</p>
          <button 
            className="btn-secondary"
            onClick={() => {
              setFormulaireFilter('tous');
              setDateFilter('tous');
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {formulaires.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Aucune collecte assignée</h3>
          <p>Vous n'avez pas de collecte assignée pour le moment.</p>
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
                      <span>{selectedFormulaire.utilisateur_info?.first_name} {selectedFormulaire.utilisateur_info?.last_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Email:</span>
                      <span>{selectedFormulaire.utilisateur_info?.email}</span>
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
                      <span className="label">Mode de collecte:</span>
                      <span>{selectedFormulaire.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Date souhaitée:</span>
                      <span>{new Date(selectedFormulaire.date_souhaitee).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Créneau horaire:</span>
                      <span>{selectedFormulaire.creneau_horaire || 'Non spécifié'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Description:</span>
                      <span>{selectedFormulaire.description}</span>
                    </div>
                  </div>
                </div>

                {selectedFormulaire.collecte && (
                  <div className="details-section">
                    <h4>Informations de la Collecte</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="label">Référence collecte:</span>
                        <span>{selectedFormulaire.collecte.reference}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Date de collecte:</span>
                        <span>{new Date(selectedFormulaire.collecte.date_collecte).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Statut collecte:</span>
                        <span 
                          className="status-pill"
                          style={{ backgroundColor: getStatutColor(selectedFormulaire.collecte.statut) }}
                        >
                          {selectedFormulaire.collecte.statut}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedFormulaire.instructions_speciales && (
                  <div className="details-section">
                    <h4>Instructions Spéciales</h4>
                    <p>{selectedFormulaire.instructions_speciales}</p>
                  </div>
                )}
                
                {selectedFormulaire.photos && selectedFormulaire.photos.length > 0 && (
                  <div className="details-section">
                    <h4>Photos ({selectedFormulaire.photos.length})</h4>
                    <div className="photos-grid">
                      {selectedFormulaire.photos.map((photo, index) => (
                        <div key={index} className="photo-item">
                          <img src={photo} alt={`Photo ${index + 1}`} />
                        </div>
                      ))}
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
              {selectedFormulaire.collecte && selectedFormulaire.collecte.statut === 'PLANIFIEE' && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setShowFormulaireModal(false);
                    confirmerReceptionEmission(selectedFormulaire.collecte, 'reception');
                  }}
                >
                  ✅ Confirmer Réception
                </button>
              )}
              {selectedFormulaire.collecte && selectedFormulaire.collecte.statut === 'EN_COURS' && (
                <button 
                  className="btn-success"
                  onClick={() => {
                    setShowFormulaireModal(false);
                    confirmerReceptionEmission(selectedFormulaire.collecte, 'emission');
                  }}
                >
                  🚚 Confirmer Livraison
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  const renderCollectes = () => (
    <div className="collectes-section">
      <div className="section-header">
        <h2>Mes Collectes</h2>
        <p>Gestion et suivi de vos collectes assignées</p>
      </div>

      {/* Tableau des collectes */}
      <div className="collectes-table">
        <div className="table-header">
          <div className="table-cell">Référence</div>
          <div className="table-cell">Formulaire</div>
          <div className="table-cell">Client</div>
          <div className="table-cell">Date Collecte</div>
          <div className="table-cell">Statut</div>
          <div className="table-cell">Actions</div>
        </div>        {collectes.filter(c => isMyCollecte(c)).map(collecte => {
          return (
            <div key={collecte.id} className="table-row">
              <div className="table-cell">
                <strong>{collecte.reference}</strong>
              </div>
              <div className="table-cell">
                {collecte.formulaire_origine?.reference || 'N/A'}
              </div>
              <div className="table-cell">
                {collecte.utilisateur?.nom || 'N/A'}
              </div>
              <div className="table-cell">
                {new Date(collecte.date_collecte).toLocaleDateString()}
              </div>
              <div className="table-cell">
                <span 
                  className="status-pill"
                  style={{ backgroundColor: getStatutColor(collecte.statut) }}
                >
                  {collecte.statut}
                </span>
              </div>
              <div className="table-cell">
                <div className="action-buttons">
                  {collecte.statut === 'PLANIFIEE' && (
                    <button 
                      className="btn-sm primary"
                      onClick={() => confirmerReceptionEmission(collecte, 'reception')}
                    >
                      ✅ Confirmer Réception
                    </button>
                  )}
                  {collecte.statut === 'EN_COURS' && (
                    <button 
                      className="btn-sm success"
                      onClick={() => confirmerReceptionEmission(collecte, 'emission')}
                    >
                      🚚 Confirmer Livraison
                    </button>
                  )}
                  {collecte.statut === 'TERMINEE' && (
                    <span className="delivered-badge">
                      ✅ Terminée
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>      {collectes.filter(c => isMyCollecte(c)).length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚛</div>
          <h3>Aucune collecte assignée</h3>
          <p>Vous n'avez pas de collecte assignée pour le moment.</p>
        </div>
      )}      {/* Modal de confirmation */}
      {showConfirmationModal && selectedCollecte && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>
                {confirmationType === 'reception' ? 'Confirmer la Réception' : 'Confirmer la Livraison'}
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
                  <span className="label">Date:</span>
                  <span>{new Date(selectedCollecte.date_collecte).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Statut actuel:</span>
                  <span>{selectedCollecte.statut}</span>
                </div>
                {selectedCollecte.formulaire_origine && (
                  <div className="detail-item">
                    <span className="label">Type de déchets:</span>
                    <span>{selectedCollecte.formulaire_origine.type_dechets}</span>
                  </div>
                )}
              </div>
              
              {confirmationType === 'emission' && (
                <div className="dechets-section">
                  <h4>📦 Détails des Déchets Collectés</h4>
                  
                  <div className="form-group">
                    <label>Quantité réelle collectée:</label>
                    <select
                      value={confirmationData.quantite_reelle}
                      onChange={(e) => setConfirmationData({
                        ...confirmationData,
                        quantite_reelle: e.target.value
                      })}
                      className="form-select"
                    >
                      <option value="1-5kg">1-5 kg</option>
                      <option value="5-10kg">5-10 kg</option>
                      <option value="10-20kg">10-20 kg</option>
                      <option value="20kg+">Plus de 20 kg</option>
                    </select>
                  </div>
                  
                  <div className="dechets-supplementaires">
                    <div className="dechets-header">
                      <h5>Déchets supplémentaires trouvés</h5>
                      <button 
                        type="button"
                        className="btn-add-dechet"
                        onClick={ajouterDechetSupplementaire}
                      >
                        ➕ Ajouter un déchet
                      </button>
                    </div>
                    
                    {confirmationData.dechets_supplementaires.map((dechet, index) => (
                      <div key={index} className="dechet-supplementaire">
                        <div className="dechet-row">
                          <select
                            value={dechet.type}
                            onChange={(e) => modifierDechetSupplementaire(index, 'type', e.target.value)}
                            className="form-select small"
                          >
                            <option value="">Type de déchet</option>
                            <option value="ordinateur">Ordinateur / Laptop</option>
                            <option value="smartphone">Smartphone / Tablette</option>
                            <option value="electromenager">Électroménager</option>
                            <option value="televiseur">Téléviseur / Écran</option>
                            <option value="composants">Composants électroniques</option>
                            <option value="autres">Autres</option>
                          </select>
                          
                          <input
                            type="text"
                            placeholder="Description"
                            value={dechet.description}
                            onChange={(e) => modifierDechetSupplementaire(index, 'description', e.target.value)}
                            className="form-input small"
                          />
                          
                          <input
                            type="number"
                            placeholder="Quantité (kg)"
                            value={dechet.quantite}
                            onChange={(e) => modifierDechetSupplementaire(index, 'quantite', e.target.value)}
                            className="form-input small"
                            min="0"
                            step="0.1"
                          />
                          
                          <button 
                            type="button"
                            className="btn-remove-dechet"
                            onClick={() => supprimerDechetSupplementaire(index)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="form-group">
                <label>Notes (optionnel):</label>
                <textarea
                  value={confirmationData.notes}
                  onChange={(e) => setConfirmationData({
                    ...confirmationData,
                    notes: e.target.value
                  })}
                  placeholder={
                    confirmationType === 'reception' 
                      ? "Observations sur la réception..." 
                      : "Observations sur la livraison et l'état des déchets..."
                  }
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
                {confirmationType === 'reception' ? 'Confirmer Réception' : 'Confirmer Livraison et Transmettre aux Techniciens'}
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
        <p>Messages et alertes concernant vos collectes</p>
      </div>

      <div className="notifications-list">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.unread ? 'unread' : ''}`}
          >
            <div className="notification-icon">
              {notification.type === 'nouvelle_collecte' && '📦'}
              {notification.type === 'collecte_urgent' && '🚨'}
              {notification.type === 'rappel' && '⏰'}
            </div>
            <div className="notification-content">
              <p className="notification-message">{notification.message}</p>
              <span className="notification-time">Il y a {notification.time}</span>
            </div>
            {notification.unread && <div className="unread-badge"></div>}
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>Aucune notification</h3>
          <p>Vous n'avez pas de notifications pour le moment.</p>
        </div>
      )}
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