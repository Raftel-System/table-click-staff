import type {Table, CommandeEmporter, MenuItem, Category, Zone} from '../types';

// Tables intérieur (8 tables)
export const tablesInterieur: Table[] = [
  { id: 'T1', numero: 1, capacite: 4, statut: 'LIBRE', zone: 'interieur' },
  { id: 'T2', numero: 2, capacite: 2, statut: 'OCCUPEE', zone: 'interieur' },
  { id: 'T3', numero: 3, capacite: 6, statut: 'LIBRE', zone: 'interieur' },
  { id: 'T4', numero: 4, capacite: 4, statut: 'LIBRE', zone: 'interieur' },
  { id: 'T5', numero: 5, capacite: 8, statut: 'OCCUPEE', zone: 'interieur' },
  { id: 'T6', numero: 6, capacite: 2, statut: 'LIBRE', zone: 'interieur' },
  { id: 'T7', numero: 7, capacite: 4, statut: 'LIBRE', zone: 'interieur' },
  { id: 'T8', numero: 8, capacite: 6, statut: 'OCCUPEE', zone: 'interieur' },
];

// Tables terrasse (12 tables)
export const tablesTerrasse: Table[] = [
  { id: 'T9', numero: 9, capacite: 2, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T10', numero: 10, capacite: 4, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T11', numero: 11, capacite: 6, statut: 'OCCUPEE', zone: 'terrasse' },
  { id: 'T12', numero: 12, capacite: 2, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T13', numero: 13, capacite: 4, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T14', numero: 14, capacite: 8, statut: 'OCCUPEE', zone: 'terrasse' },
  { id: 'T15', numero: 15, capacite: 2, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T16', numero: 16, capacite: 4, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T17', numero: 17, capacite: 6, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T18', numero: 18, capacite: 2, statut: 'OCCUPEE', zone: 'terrasse' },
  { id: 'T19', numero: 19, capacite: 4, statut: 'LIBRE', zone: 'terrasse' },
  { id: 'T20', numero: 20, capacite: 6, statut: 'OCCUPEE', zone: 'terrasse' },
];

// Commandes emporter
export const commandesEmporter: CommandeEmporter[] = [
  { id: 'CMD1', numero: 1247, heure: '14:30', duree: 25, statut: 'EN_COURS' },
  { id: 'CMD2', numero: 1248, heure: '14:45', duree: 10, statut: 'PRETE' },
  { id: 'CMD3', numero: 1249, heure: '15:00', duree: 5, statut: 'EN_COURS' },
  { id: 'CMD4', numero: 1250, heure: '15:15', duree: 20, statut: 'EN_COURS' },
  { id: 'CMD5', numero: 1251, heure: '15:30', duree: 15, statut: 'PRETE' },
  { id: 'CMD6', numero: 1252, heure: '15:45', duree: 12, statut: 'EN_COURS' },
];

// Zones
export const zones: Zone[] = [
  {
    id: 'interieur',
    nom: 'Intérieur',
    description: '8 tables • 3 occupées • 5 libres',
    icon: 'home',
    path: '/zones/interieur'
  },
  {
    id: 'terrasse',
    nom: 'Terrasse',
    description: '12 tables • 5 occupées • 7 libres',
    icon: 'trees',
    path: '/zones/terrasse'
  },
  {
    id: 'emporter',
    nom: 'Emporter',
    description: 'Commandes takeaway • 2 en cours',
    icon: 'shopping-bag',
    path: '/zones/emporter'
  }
];

// Catégories
export const categories: Category[] = [
  { id: 'entrees', nom: 'Entrées', icon: 'utensils' },
  { id: 'plats', nom: 'Plats', icon: 'chef-hat' },
  { id: 'pizzas', nom: 'Pizzas', icon: 'pizza' },
  { id: 'desserts', nom: 'Desserts', icon: 'ice-cream' },
  { id: 'boissons', nom: 'Boissons', icon: 'glass-water' },
  { id: 'menus', nom: 'Menus', icon: 'menu' },
];

// Articles menu
export const menuItems: MenuItem[] = [
  // Entrées
  {
    id: 'E1',
    nom: 'Houmous',
    prix: 6.50,
    description: 'Houmous maison aux pois chiches',
    categorie: 'entrees',
    disponible: true,
    populaire: true
  },
  {
    id: 'E2',
    nom: 'Falafel',
    prix: 7.00,
    description: 'Boulettes de pois chiches épicées',
    categorie: 'entrees',
    disponible: true
  },
  {
    id: 'E3',
    nom: 'Taboulé',
    prix: 5.50,
    description: 'Salade de persil, tomates, menthe',
    categorie: 'entrees',
    disponible: true
  },
  {
    id: 'E4',
    nom: 'Mezze',
    prix: 12.00,
    description: 'Assortiment d\'entrées méditerranéennes',
    categorie: 'entrees',
    disponible: true,
    special: true
  },

  // Plats
  {
    id: 'P1',
    nom: 'Couscous Royal',
    prix: 18.50,
    description: 'Couscous avec agneau, merguez, poulet',
    categorie: 'plats',
    disponible: true,
    populaire: true
  },
  {
    id: 'P2',
    nom: 'Tagine Agneau',
    prix: 16.00,
    description: 'Tagine d\'agneau aux pruneaux',
    categorie: 'plats',
    disponible: true
  },
  {
    id: 'P3',
    nom: 'Brochettes Mixtes',
    prix: 15.50,
    description: 'Agneau, poulet, kefta avec riz',
    categorie: 'plats',
    disponible: true
  },
  {
    id: 'P4',
    nom: 'Poisson Grillé',
    prix: 19.00,
    description: 'Dorade grillée aux herbes',
    categorie: 'plats',
    disponible: true,
    special: true
  },

  // Pizzas
  {
    id: 'PZ1',
    nom: 'Pizza Margherita',
    prix: 12.50,
    description: 'Tomate, mozzarella, basilic',
    categorie: 'pizzas',
    disponible: true,
    populaire: true
  },
  {
    id: 'PZ2',
    nom: 'Pizza Orientale',
    prix: 14.00,
    description: 'Merguez, poivrons, olives',
    categorie: 'pizzas',
    disponible: true
  },
  {
    id: 'PZ3',
    nom: 'Pizza Végétarienne',
    prix: 13.50,
    description: 'Légumes grillés, chèvre',
    categorie: 'pizzas',
    disponible: true
  },

  // Desserts
  {
    id: 'D1',
    nom: 'Tiramisu',
    prix: 6.50,
    description: 'Tiramisu maison aux amaretti',
    categorie: 'desserts',
    disponible: true
  },
  {
    id: 'D2',
    nom: 'Baklava',
    prix: 5.50,
    description: 'Pâtisserie aux amandes et miel',
    categorie: 'desserts',
    disponible: true,
    populaire: true
  },
  {
    id: 'D3',
    nom: 'Mousse Chocolat',
    prix: 5.00,
    description: 'Mousse au chocolat noir',
    categorie: 'desserts',
    disponible: true
  },
  {
    id: 'D4',
    nom: 'Crème Brûlée',
    prix: 6.00,
    description: 'Crème brûlée à la vanille',
    categorie: 'desserts',
    disponible: true
  },

  // Boissons
  {
    id: 'B1',
    nom: 'Coca Cola',
    prix: 2.50,
    description: 'Coca Cola 33cl',
    categorie: 'boissons',
    disponible: true
  },
  {
    id: 'B2',
    nom: 'Eau Plate',
    prix: 2.00,
    description: 'Eau plate 50cl',
    categorie: 'boissons',
    disponible: true
  },
  {
    id: 'B3',
    nom: 'Thé Glacé',
    prix: 3.00,
    description: 'Thé glacé à la menthe',
    categorie: 'boissons',
    disponible: true
  },
  {
    id: 'B4',
    nom: 'Jus Orange',
    prix: 3.50,
    description: 'Jus d\'orange pressé',
    categorie: 'boissons',
    disponible: true
  },
  {
    id: 'B5',
    nom: 'Café',
    prix: 2.00,
    description: 'Café expresso',
    categorie: 'boissons',
    disponible: true
  },

  // Menus
  {
    id: 'M1',
    nom: 'Menu Sandwich',
    prix: 12.00,
    description: 'Sandwich + Boisson + Accompagnement',
    categorie: 'menus',
    disponible: true,
    isMenu: true,
    menuSteps: ['Sandwich', 'Boisson', 'Accompagnement']
  },
  {
    id: 'M2',
    nom: 'Menu Déjeuner',
    prix: 18.00,
    description: 'Entrée + Plat + Dessert + Boisson',
    categorie: 'menus',
    disponible: true,
    isMenu: true,
    menuSteps: ['Entrée', 'Plat', 'Dessert', 'Boisson']
  }
];

// Fonction utilitaire pour obtenir les statistiques des zones
export const getZoneStats = () => ({
  interieur: {
    total: tablesInterieur.length,
    occupees: tablesInterieur.filter(t => t.statut === 'OCCUPEE').length,
    libres: tablesInterieur.filter(t => t.statut === 'LIBRE').length
  },
  terrasse: {
    total: tablesTerrasse.length,
    occupees: tablesTerrasse.filter(t => t.statut === 'OCCUPEE').length,
    libres: tablesTerrasse.filter(t => t.statut === 'LIBRE').length
  },
  emporter: {
    total: commandesEmporter.length,
    enCours: commandesEmporter.filter(c => c.statut === 'EN_COURS').length,
    pretes: commandesEmporter.filter(c => c.statut === 'PRETE').length
  }
});