import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {db} from "@/lib/firebase.ts";

interface MenuCategory {
    id: string;
    nom: string;
    active: boolean;
    ordre: number;
    emoji?: string;
}

export const useMenuCategories = (restaurantSlug: string) => {
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            if (!restaurantSlug) {
                setLoading(false);
                return;
            }

            try {
                const categoriesRef = collection(db, `restaurants/${restaurantSlug}/menuCategories`);
                const q = query(
                    categoriesRef,
                    where('active', '==', true)
                );

                const snapshot = await getDocs(q);
                const categoriesData: MenuCategory[] = [];

                snapshot.forEach((doc) => {
                    categoriesData.push({
                        id: doc.id,
                        ...doc.data()
                    } as MenuCategory);
                });

                // Sort by ordre manually
                categoriesData.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
                setCategories(categoriesData);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching categories:', err);
                setError('Erreur lors du chargement des catégories');
                setLoading(false);
            }
        };

        fetchCategories();
    }, [restaurantSlug]);

    return { categories, loading, error };
};