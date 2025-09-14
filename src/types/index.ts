export interface MenuConfig {
  sandwich?: string;
  boisson?: string;
  accompagnement?: string;
  dessert?: string;
  // 🆕 Support pour menus composés avec selections par step
  [stepId: string]: string | string[] | undefined;
}

export interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  envoye: boolean;
  note?: string;
  menuConfig?: MenuConfig | { [stepId: string]: string[] }; // 🆕 Support flexible
}

// 🆕 Types pour menus composés
export interface MenuOption {
  id: string;
  nom: string;
  priceAdjustment: number;
}

export interface MenuStep {
  id: string;
  nom: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: MenuOption[];
}

export interface ComposedMenuConfig {
  basePrice: number;
  steps: MenuStep[];
}

// 🆕 MenuItem mis à jour avec support menu composé
export interface MenuItem {
  id: string;
  nom: string;
  categorieId: string; // 🔄 Changé de 'categorie' à 'categorieId'
  prix: number;
  description?: string;
  disponible: boolean;
  ordre: number;
  isPopular?: boolean;
  isSpecial?: boolean;

  // 🆕 Champs pour menus composés
  isComposedMenu?: boolean;
  composedMenuConfig?: ComposedMenuConfig;

  // 🔄 Compatibilité avec ancien système
  categorie?: string; // Pour compatibilité temporaire
  image?: string;
  populaire?: boolean;
  special?: boolean;
  isMenu?: boolean;
  menuSteps?: string[];
}

export interface Table {
  id: string;
  numero: number;
  capacite: number;
  statut: 'LIBRE' | 'OCCUPEE';
  zoneId: string; // 🔄 Mis à jour pour nouvelle structure
  active: boolean;

  // 🔄 Compatibilité avec ancien système
  zone?: 'interieur' | 'terrasse';
}

export interface CommandeEmporter {
  id: string;
  numero: number;
  heure: string;
  duree: number; // en minutes
  statut: 'EN_COURS' | 'PRETE' | 'LIVREE';
}

export interface Zone {
  id: string;
  nom: string;
  serviceType: 'DINING' | 'TAKEAWAY';
  active: boolean;
  ordre: number;

  // 🔄 Compatibilité avec ancien système
  description?: string;
  icon?: string;
  path?: string;
}

export interface Category {
  id: string;
  nom: string;
  active: boolean;
  ordre: number;
  emoji?: string;

  // 🔄 Compatibilité avec ancien système
  icon?: string;
}

// 🆕 Types utilitaires pour la gestion des sélections
export interface MenuStepSelections {
  [stepId: string]: string[]; // Array d'IDs des options sélectionnées
}

export interface MenuValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StepValidationResult {
  stepId: string;
  stepName: string;
  isValid: boolean;
  selectedCount: number;
  minRequired: number;
  maxAllowed: number;
  missing: number;
  excess: number;
}

// 🆕 Types pour les props des composants de menu
export interface MenuStepOptionsPanelProps {
  currentStep: MenuStep | null;
  selections: string[];
  onToggleOption: (optionId: string) => void;
  basePrice: number;
  totalAdjustment: number;
}

export interface StepNavigationProps {
  currentStepIndex: number;
  totalSteps: number;
  onPreviousStep: () => void;
  onNextStep: () => void;
  onValidateMenu: () => void;
  canGoNext: boolean;
  canValidate: boolean;
}

// 🆕 Types pour les états de l'interface
export interface MenuConfigurationState {
  isMenuConfig: boolean;
  activeMenuStep: string;
  currentMenu: MenuItem | null;
  menuStepSelections: MenuStepSelections;
  currentStepIndex: number;
}

// 🔄 Export des types legacy pour compatibilité
export type { MenuConfig as LegacyMenuConfig };
export type { CartItem as LegacyCartItem };