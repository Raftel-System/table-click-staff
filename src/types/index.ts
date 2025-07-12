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

export interface MenuItem {
  id: string;
  nom: string;
  prix: number;
  description?: string;
  categorie: string;
  image?: string;
  disponible: boolean;
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
  zone: 'interieur' | 'terrasse';
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
  description: string;
  icon: string;
  path: string;
}

export interface Category {
  id: string;
  nom: string;
  icon: string;
}