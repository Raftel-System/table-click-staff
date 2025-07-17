export interface MenuConfig {
  sandwich?: string;
  boisson?: string;
  accompagnement?: string;
  dessert?: string;
}

export interface CartItem {
  id: string;
  nom: string;
  prix: number;
  quantite: number;
  envoye: boolean;
  note?: string;
  menuConfig?: MenuConfig;
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
  serviceType: 'SALLE' | 'TAKEAWAY';
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