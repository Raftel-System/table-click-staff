import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import {db} from "@/lib/firebase.ts";

interface Table {
    id: string;
    numero: number;
    zoneId: string;
    capacite: number;
    statut: 'LIBRE' | 'OCCUPEE';
    active: boolean;
    order: number;
}

export const useTables = (restaurantSlug: string, zoneId: string) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantSlug || !zoneId) {
            setLoading(false);
            return;
        }

        const tablesRef = collection(db, `restaurants/${restaurantSlug}/tables`);
        const q = query(
            tablesRef,
            where('zoneId', '==', zoneId),
            where('active', '==', true),
            orderBy('numero', 'asc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const tablesData: Table[] = [];
                snapshot.forEach((doc) => {
                    tablesData.push({
                        id: doc.id,
                        ...doc.data()
                    } as Table);
                });
                setTables(tablesData);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Erreur lors de la récupération des tables:', err);
                setError('Erreur lors du chargement des tables');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [restaurantSlug, zoneId]);

    return { tables, loading, error };
};