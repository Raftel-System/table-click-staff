import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {db} from "@/lib/firebase.ts";

interface MenuOption {
    id: string;
    nom: string;
    priceAdjustment: number;
}

interface MenuStep {
    id: string;
    nom: string;
    required: boolean;
    minSelections: number;
    maxSelections: number;
    options: MenuOption[];
}

interface ComposedMenuConfig {
    basePrice: number;
    steps: MenuStep[];
}

interface MenuItem {
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
    composedMenuConfig?: ComposedMenuConfig;
}

export const useMenuItems = (restaurantSlug: string) => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMenuItems = async () => {
            if (!restaurantSlug) {
                setLoading(false);
                return;
            }

            try {
                const itemsRef = collection(db, `restaurants/${restaurantSlug}/menuItems`);
                const q = query(
                    itemsRef,
                    where('disponible', '==', true)
                );

                const snapshot = await getDocs(q);
                const itemsData: MenuItem[] = [];

                snapshot.forEach((doc) => {
                    itemsData.push({
                        id: doc.id,
                        ...doc.data()
                    } as MenuItem);
                });

                // Sort by ordre manually
                itemsData.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

                setMenuItems(itemsData);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching menu items:', err);
                setError('Erreur lors du chargement des articles');
                setLoading(false);
            }
        };

        fetchMenuItems();
    }, [restaurantSlug]);

    return { menuItems, loading, error };
};