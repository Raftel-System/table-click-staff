import type { MenuItem } from '../types';

// Type pour les données Firebase
interface FirebaseMenuItem {
    id: string;
    nom: string;
    categorieId: string;
    prix: number;
    description?: string;
    disponible: boolean;
    ordre: number;
    isPopular?: boolean;
    isSpecial?: boolean;
    isComposedMenu?: boolean;
    composedMenuConfig?: any;
}

// Adapter pour convertir Firebase MenuItem vers le format attendu par ArticleGrid
export const adaptFirebaseMenuItemToLegacy = (firebaseItem: FirebaseMenuItem): MenuItem => {
    return {
        ...firebaseItem,
        // Mapper categorieId vers categorie pour compatibilité
        categorie: firebaseItem.categorieId,
        // Mapper les propriétés pour compatibilité
        populaire: firebaseItem.isPopular,
        special: firebaseItem.isSpecial,
        disponible: firebaseItem.disponible,
        // Garder aussi les nouvelles propriétés
        categorieId: firebaseItem.categorieId,
        isPopular: firebaseItem.isPopular,
        isSpecial: firebaseItem.isSpecial
    };
};

// Adapter pour convertir une liste
export const adaptFirebaseMenuItems = (firebaseItems: FirebaseMenuItem[]): MenuItem[] => {
    return firebaseItems.map(adaptFirebaseMenuItemToLegacy);
};