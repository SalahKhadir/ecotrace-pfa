// Types d'utilisateurs (rôles)
export const USER_ROLES = {
  PARTICULIER: 'PARTICULIER',
  ENTREPRISE: 'ENTREPRISE', 
  TRANSPORTEUR: 'TRANSPORTEUR',
  TECHNICIEN: 'TECHNICIEN',
  ADMINISTRATEUR: 'ADMINISTRATEUR',
  RESPONSABLE_LOGISTIQUE: 'RESPONSABLE_LOGISTIQUE'
};

// Routes par rôle
export const ROLE_ROUTES = {
  [USER_ROLES.PARTICULIER]: '/dashboard/particulier',
  [USER_ROLES.ENTREPRISE]: '/dashboard/entreprise',
  [USER_ROLES.TRANSPORTEUR]: '/dashboard/transporteur', 
  [USER_ROLES.TECHNICIEN]: '/dashboard/technicien',
  [USER_ROLES.ADMINISTRATEUR]: '/dashboard/administrateur',
  [USER_ROLES.RESPONSABLE_LOGISTIQUE]: '/dashboard/responsable-logistique'
};

// Labels des rôles pour l'affichage
export const ROLE_LABELS = {
  [USER_ROLES.PARTICULIER]: 'Particulier',
  [USER_ROLES.ENTREPRISE]: 'Entreprise',
  [USER_ROLES.TRANSPORTEUR]: 'Transporteur',
  [USER_ROLES.TECHNICIEN]: 'Technicien', 
  [USER_ROLES.ADMINISTRATEUR]: 'Administrateur',
  [USER_ROLES.RESPONSABLE_LOGISTIQUE]: 'Responsable Logistique'
};

// API Base URL
export const API_BASE_URL = 'http://localhost:8000/api';

// États des collectes
export const COLLECTE_STATUS = {
  PLANIFIEE: 'PLANIFIEE',
  EN_COURS: 'EN_COURS', 
  TERMINEE: 'TERMINEE',
  ANNULEE: 'ANNULEE'
};

// Types de déchets
export const WASTE_TYPES = {
  A_RECYCLER: 'A_RECYCLER',
  DETRUIT: 'DETRUIT'
};

// Labels des statuts pour l'affichage
export const STATUS_LABELS = {
  [COLLECTE_STATUS.PLANIFIEE]: 'Planifiée',
  [COLLECTE_STATUS.EN_COURS]: 'En cours',
  [COLLECTE_STATUS.TERMINEE]: 'Terminée',
  [COLLECTE_STATUS.ANNULEE]: 'Annulée'
};

// Couleurs par rôle (pour les badges)
export const ROLE_COLORS = {
  [USER_ROLES.PARTICULIER]: '#3b82f6',      // Bleu
  [USER_ROLES.ENTREPRISE]: '#f59e0b',       // Orange  
  [USER_ROLES.TRANSPORTEUR]: '#10b981',     // Vert
  [USER_ROLES.TECHNICIEN]: '#8b5cf6',       // Violet
  [USER_ROLES.ADMINISTRATEUR]: '#ef4444',   // Rouge
  [USER_ROLES.RESPONSABLE_LOGISTIQUE]: '#6366f1'  // Indigo
};