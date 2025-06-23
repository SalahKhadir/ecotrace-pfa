import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { STATUS_LABELS, DEMANDE_STATUS, DEMANDE_STATUS_LABELS, DETAILED_WASTE_TYPES, ROLE_COLORS, ROLE_LABELS } from '../../utils/constants';
import '../../styles/AdministrateurDashboard.css';

const AdministrateurDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    // Données
    const [stats, setStats] = useState({});
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [demandes, setDemandes] = useState([]);
    const [collectes, setCollectes] = useState([]);
    const [sousTraitants, setSousTraitants] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // États pour la gestion des profils
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [userAction, setUserAction] = useState(''); // 'create', 'edit', 'view'
    const [userFormData, setUserFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        role: '',
        is_active: true
    });

    // États pour la planification
    const [showPlanificationModal, setShowPlanificationModal] = useState(false);
    const [selectedDemande, setSelectedDemande] = useState(null);
    const [planificationData, setPlanificationData] = useState({
        date_collecte: '',
        transporteur: '',
        notes: ''
    });

    // États pour la gestion des demandes
    const [showDemandeModal, setShowDemandeModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalAction, setApprovalAction] = useState(''); // 'approve' or 'reject'
    const [approvalData, setApprovalData] = useState({
        motif: '',
        notes: '',
        priorite: 'normale'
    });    // Filtres
    const [userFilter, setUserFilter] = useState('tous');
    const [demandeFilter, setDemandeFilter] = useState('tous');
    const [collecteFilter, setCollecteFilter] = useState('toutes');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const role = localStorage.getItem('userRole');
        if (!token || role !== 'ADMINISTRATEUR') {
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
                loadUtilisateurs(),
                loadDemandes(),
                loadCollectes(),
                loadSousTraitants(),
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
            // Données simulées
            setStats({
                total_utilisateurs: 156,
                demandes_en_attente: 8,
                collectes_planifiees: 23,
                sous_traitants_actifs: 12
            });
        }
    };    const loadUtilisateurs = async () => {
        try {
            const data = await userService.getAllUsers();
            setUtilisateurs(data.results || data);
        } catch (error) {
            console.error('Erreur utilisateurs:', error);
            // Données simulées en cas d'erreur
            const mockUsers = [
                { id: 1, username: 'entreprise1', email: 'contact@entreprise1.com', first_name: 'Jean', last_name: 'Dupont', role: 'ENTREPRISE', is_active: true, date_joined: '2024-01-15' },
                { id: 2, username: 'transporteur1', email: 'transport@logistic.com', first_name: 'Marie', last_name: 'Martin', role: 'TRANSPORTEUR', is_active: true, date_joined: '2024-02-01' },
                { id: 3, username: 'particulier1', email: 'pierre@email.com', first_name: 'Pierre', last_name: 'Durand', role: 'PARTICULIER', is_active: false, date_joined: '2024-01-20' }
            ];
            setUtilisateurs(mockUsers);
        }
    };    const loadDemandes = async () => {
        try {
            // Charger les vraies demandes depuis le backend
            const data = await wasteService.getAllFormulaires();
            const formulaires = data.results || data;
            
            // Mapper les vraies données pour correspondre au format attendu
            const mappedFormulaires = formulaires.map(form => ({
                id: form.id,
                entrepriseNom: form.utilisateur_info?.company_name || 
                             `${form.utilisateur_info?.first_name || ''} ${form.utilisateur_info?.last_name || ''}`.trim() || 
                             form.utilisateur_info?.username || 'Utilisateur inconnu',
                utilisateur_nom: `${form.utilisateur_info?.first_name || ''} ${form.utilisateur_info?.last_name || ''}`.trim() || 
                               form.utilisateur_info?.username || 'Utilisateur inconnu',
                email: form.utilisateur_info?.email || 'Non spécifié',
                telephone: form.telephone || form.utilisateur_info?.phone || 'Non spécifié',
                typeDechet: form.type_dechets?.toUpperCase() || 'AUTRES',
                quantite: form.quantite_estimee || 'Non spécifiée',
                description: form.description || 'Aucune description',
                adresse_collecte: form.adresse_collecte || 'Non spécifiée',
                date_souhaitee: form.date_souhaitee,
                statut: form.statut === 'SOUMIS' ? 'EN_ATTENTE' : 
                        form.statut === 'VALIDE' ? 'APPROUVEE' : 
                        form.statut === 'REJETE' ? 'REJETEE' : form.statut,
                date_creation: form.date_creation,
                urgence: form.urgence || 'normale',
                instructions_speciales: form.instructions_speciales || '',
                motif_rejet: form.motif_rejet,
                notes_admin: form.notes_admin,
                date_traitement: form.date_validation || form.date_traitement
            }));

            // Combiner avec les demandes stockées localement (pour compatibilité)
            const savedForms = localStorage.getItem('collectionForms') || '[]';
            const localForms = JSON.parse(savedForms);

            // Simuler des demandes supplémentaires pour la démo si pas de vraies données
            if (mappedFormulaires.length === 0) {
                const mockDemandes = [
                    {
                        id: 'DEM-001',
                        entrepriseNom: 'EcoTech Solutions',
                        utilisateur_nom: 'Marie Dubois',
                        email: 'marie@ecotech.fr',
                        telephone: '01 23 45 67 89',
                        typeDechet: 'ELECTRONIQUE',
                        quantite: 150,
                        description: 'Ordinateurs et équipements électroniques obsolètes',
                        adresse_collecte: '15 Rue de la Innovation, 75011 Paris',
                        date_souhaitee: '2024-02-15',
                        statut: 'EN_ATTENTE',
                        date_creation: '2024-02-01T10:30:00Z',
                        urgence: 'normale',
                        instructions_speciales: 'Accès par la cour arrière'
                    },
                    {
                        id: 'DEM-002',
                        entrepriseNom: 'GreenPlastic Corp',
                        utilisateur_nom: 'Jean Martin',
                        email: 'jean@greenplastic.com',
                        telephone: '01 34 56 78 90',
                        typeDechet: 'PLASTIQUE',
                        quantite: 500,
                        description: 'Déchets plastiques industriels recyclables',
                        adresse_collecte: '42 Avenue des Plastiques, 69000 Lyon',
                        date_souhaitee: '2024-02-20',
                        statut: 'EN_ATTENTE',
                        date_creation: '2024-02-03T14:15:00Z',
                        urgence: 'haute',
                        instructions_speciales: 'Matières dangereuses - équipement spécialisé requis'
                    }
                ];
                setDemandes([...localForms, ...mockDemandes]);
            } else {
                setDemandes([...mappedFormulaires, ...localForms]);
            }
        } catch (error) {
            console.error('Erreur demandes:', error);
            
            // Charger les demandes depuis localStorage en fallback
            const savedForms = localStorage.getItem('collectionForms') || '[]';
            const forms = JSON.parse(savedForms);

            // Simuler des demandes supplémentaires pour la démo en cas d'erreur
            const mockDemandes = [
                {
                    id: 'DEM-001',
                    entrepriseNom: 'EcoTech Solutions',
                    utilisateur_nom: 'Marie Dubois',
                    email: 'marie@ecotech.fr',
                    telephone: '01 23 45 67 89',
                    typeDechet: 'ELECTRONIQUE',
                    quantite: 150,
                    description: 'Ordinateurs et équipements électroniques obsolètes',
                    adresse_collecte: '15 Rue de la Innovation, 75011 Paris',
                    date_souhaitee: '2024-02-15',
                    statut: 'EN_ATTENTE',
                    date_creation: '2024-02-01T10:30:00Z',
                    urgence: 'normale',
                    instructions_speciales: 'Accès par la cour arrière'
                },
                {
                    id: 'DEM-002',
                    entrepriseNom: 'GreenPlastic Corp',
                    utilisateur_nom: 'Jean Martin',
                    email: 'jean@greenplastic.com',
                    telephone: '01 34 56 78 90',
                    typeDechet: 'PLASTIQUE',
                    quantite: 500,
                    description: 'Déchets plastiques industriels recyclables',
                    adresse_collecte: '42 Avenue des Plastiques, 69000 Lyon',
                    date_souhaitee: '2024-02-20',
                    statut: 'EN_ATTENTE',
                    date_creation: '2024-02-03T14:15:00Z',
                    urgence: 'haute',
                    instructions_speciales: 'Matières dangereuses - équipement spécialisé requis'
                }
            ];

            setDemandes([...forms, ...mockDemandes]);
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

    const loadSousTraitants = async () => {
        try {
            // Charger les sous-traitants (transporteurs et techniciens)
            const mockSousTraitants = [
                { id: 1, nom: 'Transport Vert', type: 'TRANSPORTEUR', secteur: 'Nord', statut: 'actif', collectes_mois: 45, note: 4.5 },
                { id: 2, nom: 'EcoRecycle Tech', type: 'TECHNICIEN', secteur: 'Centre', statut: 'actif', traitements_mois: 32, note: 4.8 },
                { id: 3, nom: 'Logistics Pro', type: 'TRANSPORTEUR', secteur: 'Sud', statut: 'inactif', collectes_mois: 0, note: 3.9 }
            ];
            setSousTraitants(mockSousTraitants);
        } catch (error) {
            console.error('Erreur sous-traitants:', error);
        }
    };

    const loadNotifications = async () => {
        const mockNotifications = [
            {
                id: 1,
                type: 'nouveau_utilisateur',
                message: 'Nouvelle inscription entreprise en attente de validation',
                time: '30min',
                unread: true
            },
            {
                id: 2,
                type: 'demande_urgente',
                message: 'Demande de collecte urgente - déchets dangereux',
                time: '2h',
                unread: true
            },
            {
                id: 3,
                type: 'rapport_mensuel',
                message: 'Rapport mensuel disponible',
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

    const ouvrirModalUtilisateur = (user = null, action = 'view') => {
        setSelectedUser(user);
        setUserAction(action);
        if (user) {
            setUserFormData({
                username: user.username || '',
                email: user.email || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                role: user.role || '',
                is_active: user.is_active || false
            });
        } else {
            setUserFormData({
                username: '',
                email: '',
                first_name: '',
                last_name: '',
                role: '',
                is_active: true
            });
        }
        setShowUserModal(true);
    };    const sauvegarderUtilisateur = async () => {
        try {
            if (userAction === 'create') {
                // Créer un nouvel utilisateur via l'API
                const newUser = await userService.createUser(userFormData);
                setUtilisateurs([...utilisateurs, newUser.user]);
                alert('Utilisateur créé avec succès !');
            } else if (userAction === 'edit') {
                // Modifier l'utilisateur existant via l'API
                const updatedUser = await userService.updateUser(selectedUser.id, userFormData);
                const updatedUsers = utilisateurs.map(u =>
                    u.id === selectedUser.id ? updatedUser.user || updatedUser : u
                );
                setUtilisateurs(updatedUsers);
                alert('Utilisateur modifié avec succès !');
            }

            setShowUserModal(false);
        } catch (error) {
            console.error('Erreur sauvegarde utilisateur:', error);
            alert(`Erreur lors de la sauvegarde: ${error.response?.data?.error || error.message}`);
        }
    };    const toggleUserStatus = async (userId) => {
        try {
            const result = await userService.toggleUserStatus(userId);
            const updatedUsers = utilisateurs.map(u =>
                u.id === userId ? result.user : u
            );
            setUtilisateurs(updatedUsers);
            alert('Statut utilisateur modifié !');
        } catch (error) {
            console.error('Erreur toggle status:', error);
            alert(`Erreur: ${error.response?.data?.error || error.message}`);
        }
    };

    const planifierCollecte = (demande) => {
        setSelectedDemande(demande);
        setPlanificationData({
            date_collecte: '',
            transporteur: '',
            notes: ''
        });
        setShowPlanificationModal(true);
    };

    const validerPlanification = async () => {
        try {
            if (!planificationData.date_collecte || !planificationData.transporteur) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }

            // Créer une nouvelle collecte planifiée
            const nouvelleCollecte = {
                id: Date.now().toString(),
                demande_id: selectedDemande.id,
                reference: `COL-${Date.now()}`,
                date_collecte: planificationData.date_collecte,
                transporteur: planificationData.transporteur,
                notes: planificationData.notes,
                statut: 'PLANIFIEE',
                date_creation: new Date().toISOString(),
                utilisateur_nom: selectedDemande.utilisateur_nom,
                adresse: selectedDemande.adresse_collecte
            };

            setCollectes([...collectes, nouvelleCollecte]);

            // Mettre à jour le statut de la demande
            const updatedDemandes = demandes.map(d =>
                d.id === selectedDemande.id ? { ...d, statut: 'PLANIFIEE' } : d
            );
            setDemandes(updatedDemandes);

            setShowPlanificationModal(false);
            alert('Collecte planifiée avec succès !');
        } catch (error) {
            console.error('Erreur planification:', error);
            alert('Erreur lors de la planification');
        }
    };

    const voirDemandeDetails = (demande) => {
        setSelectedDemande(demande);
        setShowDemandeModal(true);
    };

    const ouvrirModalApprobation = (demande, action) => {
        setSelectedDemande(demande);
        setApprovalAction(action);
        setApprovalData({
            motif: '',
            notes: '',
            priorite: demande.urgence || 'normale'
        });
        setShowApprovalModal(true);
    };    const validerApprobation = async () => {
        try {
            if (approvalAction === 'reject' && !approvalData.motif) {
                alert('Veuillez spécifier un motif de rejet');
                return;
            }

            let result;
            if (approvalAction === 'approve') {
                result = await wasteService.approuverDemande(selectedDemande.id, {
                    notes: approvalData.notes,
                    priorite: approvalData.priorite
                });
            } else {
                result = await wasteService.rejeterDemande(selectedDemande.id, {
                    motif: approvalData.motif,
                    notes: approvalData.notes
                });
            }

            // Mettre à jour la liste des demandes
            await loadDemandes();

            // Si approuvée, ajouter à la liste des demandes disponibles pour RespoLogistique
            if (approvalAction === 'approve') {
                const approvedRequests = JSON.parse(localStorage.getItem('approvedRequests') || '[]');
                approvedRequests.push({
                    ...selectedDemande,
                    statut: 'APPROUVEE',
                    date_approbation: new Date().toISOString(),
                    priorite: approvalData.priorite,
                    notes_admin: approvalData.notes
                });
                localStorage.setItem('approvedRequests', JSON.stringify(approvedRequests));
            }

            setShowApprovalModal(false);

            const action = approvalAction === 'approve' ? 'approuvée' : 'rejetée';
            alert(`Demande ${action} avec succès !`);
        } catch (error) {
            console.error('Erreur approbation:', error);
            alert(`Erreur lors du traitement: ${error.response?.data?.error || error.message}`);
        }
    };    const getFilteredDemandes = () => {
        if (demandeFilter === 'tous') return demandes;
        if (demandeFilter === 'en_attente') return demandes.filter(d => d.statut === 'EN_ATTENTE');
        return demandes.filter(d => d.statut === demandeFilter);
    };

    const getStatutColor = (statut) => {
        const colors = {
            'EN_ATTENTE': '#f59e0b',
            'APPROUVEE': '#10b981',
            'REJETEE': '#ef4444',
            'PLANIFIEE': '#3b82f6'
        };
        return colors[statut] || '#6b7280';
    };

    const getUrgenceColor = (urgence) => {
        const colors = {
            'faible': '#10b981',
            'normale': '#f59e0b',
            'haute': '#ef4444'
        };
        return colors[urgence] || '#6b7280';
    };

    const renderOverview = () => (
        <div className="overview-section">
            <div className="section-header">
                <h2>Tableau de Bord Administrateur</h2>
                <p>Gestion globale de la plateforme EcoTrace</p>
            </div>

            {/* Statistiques */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.total_utilisateurs || 0}</div>
                        <div className="stat-label">Utilisateurs</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.demandes_en_attente || 0}</div>
                        <div className="stat-label">Demandes en Attente</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.collectes_planifiees || 0}</div>
                        <div className="stat-label">Collectes Planifiées</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-content">
                        <div className="stat-number">{stats.sous_traitants_actifs || 0}</div>
                        <div className="stat-label">Sous-traitants Actifs</div>
                    </div>
                </div>
            </div>

            {/* Actions rapides */}
            <div className="quick-actions">
                <h3>Actions Rapides</h3>
                <div className="actions-grid">
                    <button
                        className="action-btn primary"
                        onClick={() => setActiveSection('utilisateurs')}
                    >
                        👥 Gérer Profils
                    </button>
                    <button
                        className="action-btn secondary"
                        onClick={() => setActiveSection('demandes')}
                    >
                        📋 Gérer Demandes
                    </button>
                    <button
                        className="action-btn tertiary"
                        onClick={() => setActiveSection('collectes')}
                    >
                        📅 Planifier Collectes
                    </button>
                    <button
                        className="action-btn quaternary"
                        onClick={() => setActiveSection('sous-traitants')}
                    >
                        🏢 Superviser Sous-traitants
                    </button>
                </div>
            </div>

            {/* Activité récente */}
            <div className="urgent-section">
                <h3>Activité Récente</h3>
                <div className="urgent-list">
                    <div className="urgent-item">
                        <div className="urgent-info">
                            <span className="urgent-ref">Nouvelle inscription</span>
                            <span className="urgent-date">Entreprise EcoTech</span>
                        </div>
                        <button className="btn-urgent">Valider</button>
                    </div>
                    <div className="urgent-item">
                        <div className="urgent-info">
                            <span className="urgent-ref">Demande urgente</span>
                            <span className="urgent-date">Déchets dangereux</span>
                        </div>
                        <button className="btn-urgent">Traiter</button>
                    </div>
                    <div className="urgent-item">
                        <div className="urgent-info">
                            <span className="urgent-ref">Rapport mensuel</span>
                            <span className="urgent-date">Janvier 2024</span>
                        </div>
                        <button className="btn-urgent">Consulter</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDemandes = () => (
        <div className="demandes-section">
            <div className="section-header">
                <h2>Gérer les Demandes</h2>
                <p>Examiner et approuver les demandes de collecte soumises</p>
            </div>

            {/* Filtres */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Statut:</label>
                    <select 
                        value={demandeFilter}
                        onChange={(e) => setDemandeFilter(e.target.value)}
                    >
                        <option value="tous">Toutes</option>
                        <option value="EN_ATTENTE">En attente</option>
                        <option value="APPROUVEE">Approuvées</option>
                        <option value="REJETEE">Rejetées</option>
                        <option value="PLANIFIEE">Planifiées</option>
                    </select>
                </div>
            </div>

            {/* Tableau des demandes */}
            <div className="demandes-table">
                <div className="table-header">
                    <div className="table-cell">Référence</div>
                    <div className="table-cell">Entreprise</div>
                    <div className="table-cell">Type Déchet</div>
                    <div className="table-cell">Quantité</div>
                    <div className="table-cell">Date Souhaitée</div>
                    <div className="table-cell">Urgence</div>
                    <div className="table-cell">Statut</div>
                    <div className="table-cell">Actions</div>
                </div>
                
                {getFilteredDemandes().map(demande => (
                    <div key={demande.id} className="table-row">
                        <div className="table-cell">
                            <strong>{demande.id}</strong>
                        </div>                        <div className="table-cell">
                            <div>
                                <div className="enterprise-name">
                                    {demande.entrepriseNom !== 'Utilisateur inconnu' ? 
                                        demande.entrepriseNom : 
                                        'Particulier'
                                    }
                                </div>
                                <div className="contact-name">
                                    {demande.utilisateur_nom !== 'Utilisateur inconnu' ? 
                                        demande.utilisateur_nom : 
                                        'Contact non spécifié'
                                    }
                                </div>
                            </div>
                        </div>
                        <div className="table-cell">
                            <span className="waste-type-badge">
                                {DETAILED_WASTE_TYPES[demande.typeDechet] || demande.typeDechet}
                            </span>
                        </div>                        <div className="table-cell">
                            {demande.quantite === 'Non spécifiée' || !demande.quantite ? 
                                'Non spécifiée' : 
                                demande.quantite
                            }
                        </div>
                        <div className="table-cell">
                            {new Date(demande.date_souhaitee).toLocaleDateString()}
                        </div>
                        <div className="table-cell">
                            <span 
                                className="urgence-badge"
                                style={{ backgroundColor: getUrgenceColor(demande.urgence) }}
                            >
                                {demande.urgence || 'normale'}
                            </span>
                        </div>
                        <div className="table-cell">
                            <span 
                                className="status-pill"
                                style={{ backgroundColor: getStatutColor(demande.statut) }}
                            >
                                {DEMANDE_STATUS_LABELS[demande.statut] || demande.statut}
                            </span>
                        </div>
                        <div className="table-cell">
                            <div className="action-buttons">
                                <button 
                                    className="btn-sm secondary"
                                    onClick={() => voirDemandeDetails(demande)}
                                >
                                    👁️ Voir
                                </button>
                                
                                {demande.statut === 'EN_ATTENTE' && (
                                    <>
                                        <button 
                                            className="btn-sm success"
                                            onClick={() => ouvrirModalApprobation(demande, 'approve')}
                                        >
                                            ✅ Approuver
                                        </button>
                                        <button 
                                            className="btn-sm danger"
                                            onClick={() => ouvrirModalApprobation(demande, 'reject')}
                                        >
                                            ❌ Rejeter
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {getFilteredDemandes().length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>Aucune demande trouvée</h3>
                    <p>Aucune demande ne correspond aux filtres sélectionnés.</p>
                </div>
            )}

            {/* Modal détails demande */}
            {showDemandeModal && selectedDemande && (
                <div className="modal-overlay">
                    <div className="modal-content large">
                        <div className="modal-header">
                            <h3>Détails de la Demande - {selectedDemande.id}</h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowDemandeModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="demande-details">
                                <div className="details-section">
                                    <h4>Informations Entreprise</h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="label">Entreprise:</span>
                                            <span>{selectedDemande.entrepriseNom}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Contact:</span>
                                            <span>{selectedDemande.utilisateur_nom}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Email:</span>
                                            <span>{selectedDemande.email}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Téléphone:</span>
                                            <span>{selectedDemande.telephone}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h4>Détails de la Collecte</h4>
                                    <div className="details-grid">
                                        <div className="detail-item">
                                            <span className="label">Type de déchets:</span>
                                            <span>{DETAILED_WASTE_TYPES[selectedDemande.typeDechet] || selectedDemande.typeDechet}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Quantité estimée:</span>
                                            <span>{selectedDemande.quantite} kg</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Date souhaitée:</span>
                                            <span>{new Date(selectedDemande.date_souhaitee).toLocaleDateString()}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Urgence:</span>
                                            <span className="urgence-badge" style={{ backgroundColor: getUrgenceColor(selectedDemande.urgence) }}>
                                                {selectedDemande.urgence || 'normale'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="details-section">
                                    <h4>Adresse de Collecte</h4>
                                    <p>{selectedDemande.adresse_collecte}</p>
                                </div>

                                {selectedDemande.description && (
                                    <div className="details-section">
                                        <h4>Description</h4>
                                        <p>{selectedDemande.description}</p>
                                    </div>
                                )}

                                {selectedDemande.instructions_speciales && (
                                    <div className="details-section">
                                        <h4>Instructions Spéciales</h4>
                                        <p>{selectedDemande.instructions_speciales}</p>
                                    </div>
                                )}

                                {selectedDemande.statut !== 'EN_ATTENTE' && (
                                    <div className="details-section">
                                        <h4>Traitement Administratif</h4>
                                        <div className="details-grid">
                                            <div className="detail-item">
                                                <span className="label">Statut:</span>
                                                <span>{DEMANDE_STATUS_LABELS[selectedDemande.statut]}</span>
                                            </div>
                                            {selectedDemande.date_traitement && (
                                                <div className="detail-item">
                                                    <span className="label">Date de traitement:</span>
                                                    <span>{new Date(selectedDemande.date_traitement).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {selectedDemande.motif_rejet && (
                                                <div className="detail-item">
                                                    <span className="label">Motif de rejet:</span>
                                                    <span>{selectedDemande.motif_rejet}</span>
                                                </div>
                                            )}
                                            {selectedDemande.notes_admin && (
                                                <div className="detail-item">
                                                    <span className="label">Notes admin:</span>
                                                    <span>{selectedDemande.notes_admin}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            {selectedDemande.statut === 'EN_ATTENTE' && (
                                <>
                                    <button
                                        className="btn-success"
                                        onClick={() => {
                                            setShowDemandeModal(false);
                                            ouvrirModalApprobation(selectedDemande, 'approve');
                                        }}
                                    >
                                        ✅ Approuver
                                    </button>
                                    <button
                                        className="btn-danger"
                                        onClick={() => {
                                            setShowDemandeModal(false);
                                            ouvrirModalApprobation(selectedDemande, 'reject');
                                        }}
                                    >
                                        ❌ Rejeter
                                    </button>
                                </>
                            )}
                            <button
                                className="btn-secondary"
                                onClick={() => setShowDemandeModal(false)}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'approbation/rejet */}
            {showApprovalModal && selectedDemande && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {approvalAction === 'approve' ? 'Approuver' : 'Rejeter'} la Demande
                            </h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowApprovalModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="approval-details">
                                <div className="detail-item">
                                    <span className="label">Demande:</span>
                                    <span>{selectedDemande.id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Entreprise:</span>
                                    <span>{selectedDemande.entrepriseNom}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Type de déchet:</span>
                                    <span>{DETAILED_WASTE_TYPES[selectedDemande.typeDechet] || selectedDemande.typeDechet}</span>
                                </div>
                            </div>

                            {approvalAction === 'approve' && (
                                <div className="form-group">
                                    <label>Priorité:</label>
                                    <select
                                        value={approvalData.priorite}
                                        onChange={(e) => setApprovalData({
                                            ...approvalData,
                                            priorite: e.target.value
                                        })}
                                    >
                                        <option value="faible">Faible</option>
                                        <option value="normale">Normale</option>
                                        <option value="haute">Haute</option>
                                    </select>
                                </div>
                            )}

                            {approvalAction === 'reject' && (
                                <div className="form-group">
                                    <label>Motif de rejet *:</label>
                                    <select
                                        value={approvalData.motif}
                                        onChange={(e) => setApprovalData({
                                            ...approvalData,
                                            motif: e.target.value
                                        })}
                                        required
                                    >
                                        <option value="">Sélectionner un motif</option>
                                        <option value="informations_insuffisantes">Informations insuffisantes</option>
                                        <option value="type_dechet_non_accepte">Type de déchet non accepté</option>
                                        <option value="quantite_inadequate">Quantité inadéquate</option>
                                        <option value="zone_non_couverte">Zone non couverte</option>
                                        <option value="non_conforme_reglementation">Non conforme à la réglementation</option>
                                        <option value="autre">Autre</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Notes additionnelles:</label>
                                <textarea
                                    value={approvalData.notes}
                                    onChange={(e) => setApprovalData({
                                        ...approvalData,
                                        notes: e.target.value
                                    })}
                                    placeholder="Commentaires pour l'entreprise..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowApprovalModal(false)}
                            >
                                Annuler
                            </button>
                            <button
                                className={`btn-${approvalAction === 'approve' ? 'success' : 'danger'}`}
                                onClick={validerApprobation}
                            >
                                {approvalAction === 'approve' ? 'Approuver' : 'Rejeter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUtilisateurs = () => (
        <div className="utilisateurs-section">
            <div className="section-header">
                <h2>Gérer les Profils Utilisateurs</h2>
                <p>Administration des comptes utilisateurs de la plateforme</p>
                <button 
                    className="btn-primary"
                    onClick={() => ouvrirModalUtilisateur(null, 'create')}
                >
                    + Nouveau Utilisateur
                </button>
            </div>

            {/* Filtres */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Rôle:</label>
                    <select 
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                    >
                        <option value="tous">Tous</option>
                        <option value="PARTICULIER">Particuliers</option>
                        <option value="ENTREPRISE">Entreprises</option>
                        <option value="TRANSPORTEUR">Transporteurs</option>
                        <option value="TECHNICIEN">Techniciens</option>
                        <option value="RESPONSABLE_LOGISTIQUE">Responsables Logistique</option>
                        <option value="ADMINISTRATEUR">Administrateurs</option>
                    </select>
                </div>
            </div>

            {/* Tableau des utilisateurs */}
            <div className="users-table">
                <div className="table-header">
                    <div className="table-cell">Nom d'utilisateur</div>
                    <div className="table-cell">Nom complet</div>
                    <div className="table-cell">Email</div>
                    <div className="table-cell">Rôle</div>
                    <div className="table-cell">Statut</div>
                    <div className="table-cell">Date d'inscription</div>
                    <div className="table-cell">Actions</div>
                </div>
                
                {utilisateurs
                    .filter(u => userFilter === 'tous' || u.role === userFilter)
                    .map(utilisateur => (
                    <div key={utilisateur.id} className="table-row">
                        <div className="table-cell">
                            <strong>{utilisateur.username}</strong>
                        </div>
                        <div className="table-cell">
                            {utilisateur.first_name} {utilisateur.last_name}
                        </div>
                        <div className="table-cell">
                            {utilisateur.email}
                        </div>
                        <div className="table-cell">
                            <span className="role-badge" style={{ backgroundColor: ROLE_COLORS[utilisateur.role] }}>
                                {ROLE_LABELS[utilisateur.role]}
                            </span>
                        </div>
                        <div className="table-cell">
                            <span className={`status-pill ${utilisateur.is_active ? 'active' : 'inactive'}`}>
                                {utilisateur.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                        <div className="table-cell">
                            {new Date(utilisateur.date_joined).toLocaleDateString()}
                        </div>
                        <div className="table-cell">
                            <div className="action-buttons">
                                <button 
                                    className="btn-sm secondary"
                                    onClick={() => ouvrirModalUtilisateur(utilisateur, 'view')}
                                >
                                    👁️ Voir
                                </button>
                                <button 
                                    className="btn-sm primary"
                                    onClick={() => ouvrirModalUtilisateur(utilisateur, 'edit')}
                                >
                                    ✏️ Modifier
                                </button>
                                <button 
                                    className={`btn-sm ${utilisateur.is_active ? 'warning' : 'success'}`}
                                    onClick={() => toggleUserStatus(utilisateur.id)}
                                >
                                    {utilisateur.is_active ? '❌ Désactiver' : '✅ Activer'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {utilisateurs.filter(u => userFilter === 'tous' || u.role === userFilter).length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>Aucun utilisateur trouvé</h3>
                    <p>Aucun utilisateur ne correspond aux filtres sélectionnés.</p>
                </div>
            )}

            {/* Modal utilisateur */}
            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>
                                {userAction === 'create' ? 'Créer un utilisateur' :
                                 userAction === 'edit' ? 'Modifier l\'utilisateur' :
                                 'Détails de l\'utilisateur'}
                            </h3>
                            <button
                                className="modal-close"
                                onClick={() => setShowUserModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="user-form">
                                <div className="form-group">
                                    <label>Nom d'utilisateur:</label>
                                    <input
                                        type="text"
                                        value={userFormData.username}
                                        onChange={(e) => setUserFormData({
                                            ...userFormData,
                                            username: e.target.value
                                        })}
                                        disabled={userAction === 'view'}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Prénom:</label>
                                        <input
                                            type="text"
                                            value={userFormData.first_name}
                                            onChange={(e) => setUserFormData({
                                                ...userFormData,
                                                first_name: e.target.value
                                            })}
                                            disabled={userAction === 'view'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nom:</label>
                                        <input
                                            type="text"
                                            value={userFormData.last_name}
                                            onChange={(e) => setUserFormData({
                                                ...userFormData,
                                                last_name: e.target.value
                                            })}
                                            disabled={userAction === 'view'}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Email:</label>
                                    <input
                                        type="email"
                                        value={userFormData.email}
                                        onChange={(e) => setUserFormData({
                                            ...userFormData,
                                            email: e.target.value
                                        })}
                                        disabled={userAction === 'view'}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Rôle:</label>
                                    <select
                                        value={userFormData.role}
                                        onChange={(e) => setUserFormData({
                                            ...userFormData,
                                            role: e.target.value
                                        })}
                                        disabled={userAction === 'view'}
                                        required
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        <option value="PARTICULIER">Particulier</option>
                                        <option value="ENTREPRISE">Entreprise</option>
                                        <option value="TRANSPORTEUR">Transporteur</option>
                                        <option value="TECHNICIEN">Technicien</option>
                                        <option value="RESPONSABLE_LOGISTIQUE">Responsable Logistique</option>
                                        <option value="ADMINISTRATEUR">Administrateur</option>
                                    </select>
                                </div>

                                {userAction !== 'view' && (
                                    <div className="form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={userFormData.is_active}
                                                onChange={(e) => setUserFormData({
                                                    ...userFormData,
                                                    is_active: e.target.checked
                                                })}
                                            />
                                            Compte actif
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            {userAction !== 'view' && (
                                <button
                                    className="btn-primary"
                                    onClick={sauvegarderUtilisateur}
                                >
                                    {userAction === 'create' ? 'Créer' : 'Sauvegarder'}
                                </button>
                            )}
                            <button
                                className="btn-secondary"
                                onClick={() => setShowUserModal(false)}
                            >
                                {userAction === 'view' ? 'Fermer' : 'Annuler'}
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
                <h2>Planifier une Collecte</h2>
                <p>Gestion et planification des collectes de déchets</p>
            </div>

            {/* Filtres */}
            <div className="filters-bar">
                <div className="filter-group">
                    <label>Statut:</label>
                    <select 
                        value={collecteFilter}
                        onChange={(e) => setCollecteFilter(e.target.value)}
                    >
                        <option value="toutes">Toutes</option>
                        <option value="PLANIFIEE">Planifiées</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="TERMINEE">Terminées</option>
                        <option value="ANNULEE">Annulées</option>
                    </select>
                </div>
            </div>

            {/* Tableau des collectes */}
            <div className="collectes-table">
                <div className="table-header">
                    <div className="table-cell">Référence</div>
                    <div className="table-cell">Demande</div>
                    <div className="table-cell">Date Collecte</div>
                    <div className="table-cell">Transporteur</div>
                    <div className="table-cell">Adresse</div>
                    <div className="table-cell">Statut</div>
                    <div className="table-cell">Actions</div>
                </div>
                
                {collectes
                    .filter(c => collecteFilter === 'toutes' || c.statut === collecteFilter)
                    .map(collecte => (
                    <div key={collecte.id} className="table-row">
                        <div className="table-cell">
                            <strong>{collecte.reference || collecte.id}</strong>
                        </div>
                        <div className="table-cell">
                            {collecte.demande_id}
                        </div>
                        <div className="table-cell">
                            {new Date(collecte.date_collecte).toLocaleDateString()}
                        </div>
                        <div className="table-cell">
                            {collecte.transporteur || 'Non assigné'}
                        </div>
                        <div className="table-cell">
                            {collecte.adresse}
                        </div>
                        <div className="table-cell">
                            <span 
                                className="status-pill"
                                style={{ backgroundColor: getStatutColor(collecte.statut) }}
                            >
                                {STATUS_LABELS[collecte.statut] || collecte.statut}
                            </span>
                        </div>
                        <div className="table-cell">
                            <div className="action-buttons">
                                <button className="btn-sm secondary">
                                    👁️ Voir
                                </button>
                                <button className="btn-sm primary">
                                    ✏️ Modifier
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {collectes.filter(c => collecteFilter === 'toutes' || c.statut === collecteFilter).length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>Aucune collecte trouvée</h3>
                    <p>Aucune collecte ne correspond aux filtres sélectionnés.</p>
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
                    <h1 className="dashboard-title">🌱 EcoTrace</h1>
                    <span className="badge-administrateur">Administrateur</span>
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
                    className={`menu-item ${activeSection === 'utilisateurs' ? 'active' : ''}`}
                    onClick={() => setActiveSection('utilisateurs')}
                >
                    <span className="menu-icon">👥</span>
                    Gérer les Profils Utilisateurs
                </button>
                <button
                    className={`menu-item ${activeSection === 'demandes' ? 'active' : ''}`}
                    onClick={() => setActiveSection('demandes')}
                >
                    <span className="menu-icon">📋</span>
                    Gérer les Demandes
                </button>
                <button
                    className={`menu-item ${activeSection === 'collectes' ? 'active' : ''}`}
                    onClick={() => setActiveSection('collectes')}
                >
                    <span className="menu-icon">📅</span>
                    Planifier une Collecte
                </button>
                <button
                    className={`menu-item ${activeSection === 'sous-traitants' ? 'active' : ''}`}
                    onClick={() => setActiveSection('sous-traitants')}
                >
                    <span className="menu-icon">🏢</span>
                    Superviser les Sous-traitants
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
            {activeSection === 'demandes' && renderDemandes()}
            {activeSection === 'utilisateurs' && renderUtilisateurs()}
            {activeSection === 'collectes' && renderCollectes()}
            {/* Additional sections would be implemented here */}
        </main>
    </div>
);
};

export default AdministrateurDashboard;