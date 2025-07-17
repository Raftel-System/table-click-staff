import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {db} from "@/lib/firebase.ts";

interface Zone {
    id: string;
    nom: string;
    serviceType: 'SALLE' | 'TAKEAWAY';
    active: boolean;
    ordre: number;
}

export const useZones = (restaurantId: string) => {
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!restaurantId) {
            setLoading(false);
            return;
        }

        const fetchZones = async () => {
            try {
                const zonesRef = collection(db, `restaurants/${restaurantId}/zones`);

                // Simplified query - just get active zones without orderBy for now
                const q = query(
                    zonesRef,
                    where('active', '==', true)
                );

                const snapshot = await getDocs(q);

                const zonesData: Zone[] = [];
                snapshot.forEach((doc) => {
                    zonesData.push({
                        id: doc.id,
                        ...doc.data()
                    } as Zone);
                });

                // Sort manually by ordre
                zonesData.sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

                setZones(zonesData);
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error('❌ useZones - Error:', err);
                setError(`Erreur lors du chargement des zones: ${err.message}`);
                setLoading(false);
            }
        };

        fetchZones();
    }, [restaurantId]);

    return { zones, loading, error };
};