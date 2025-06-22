import '../../styles/ParticulierDashboard.css';
import { useState, useEffect } from 'react';
import { authService, userService, wasteService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ParticulierDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [collectes, setCollectes] = useState([]);
  const [formulaires, setFormulaires] = useState([]);
  const [stats, setStats] = useState({});
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
      <header className="dashboard-header">
        <div className="dashboard-nav">
          <div className="dashboard-logo">
            <h1 className="dashboard-title">🌱 EcoTrace</h1>
            <span className="badge-particulier">Particulier</span>
          </div>
          
          <div className="dashboard-user-info">
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
          <CollectesSection collectes={collectes} />
        )}

        {/* Mes formulaires */}
        {activeSection === 'formulaires' && (
          <FormulairesSection formulaires={formulaires} onRefresh={refreshData} />
        )}

        {/* Profil */}
        {activeSection === 'profil' && (
          <ProfilSection user={user} setUser={setUser} />
        )}
      </main>
    </div>
  );
};

// Fonction utilitaire pour les labels de statut
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
const CollectesSection = ({ collectes }) => {
  const getStatusColor = (status) => {
    const colors = {
      'EN_COURS': '#f59e0b',
      'TERMINEE': '#10b981',
      'PLANIFIEE': '#3b82f6',
      'ANNULEE': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

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
                <button className="action-btn secondary">
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

// Section Formulaires
const FormulairesSection = ({ formulaires, onRefresh }) => {
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
    <div className="formulaires-section">
      <div className="section-header">
        <h2>Mes formulaires</h2>
        <p>Suivez l'état de vos demandes de collecte</p>
      </div>

      {formulaires.length > 0 ? (
        <div className="formulaires-grid">
          {formulaires.map(formulaire => (
            <div key={formulaire.id} className="formulaire-card">
              <div className="formulaire-card-header">
                <h3>{formulaire.reference}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatutColor(formulaire.statut) }}
                >
                  {getStatutLabel(formulaire.statut)}
                </span>
              </div>
              
              <div className="formulaire-details">
                <p><strong>Type:</strong> {formulaire.type_dechets}</p>
                <p><strong>Mode:</strong> {formulaire.mode_collecte === 'domicile' ? 'Collecte à domicile' : 'Apport volontaire'}</p>
                <p><strong>Date souhaitée:</strong> {new Date(formulaire.date_souhaitee).toLocaleDateString('fr-FR')}</p>
                <p><strong>Description:</strong> {formulaire.description}</p>
                {formulaire.photos_count > 0 && (
                  <p><strong>Photos:</strong> {formulaire.photos_count} photo(s) attachée(s)</p>
                )}
              </div>

              <div className="formulaire-actions">
                <button className="action-btn secondary">
                  Voir détails
                </button>
                {formulaire.statut === 'VALIDE' && (
                  <button 
                    className="action-btn primary"
                    onClick={() => {/* TODO: Voir la collecte associée */}}
                  >
                    Voir collecte
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>Aucun formulaire</h3>
          <p>Vous n'avez pas encore envoyé de demande de collecte.</p>
        </div>
      )}
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