import { useEffect, useState } from 'react';
import {rtDatabase} from '@/lib/firebase';
import type {Order} from "@/services/orderService.ts";
import { ref, query, orderByChild, equalTo, onValue, off, DataSnapshot } from 'firebase/database';


interface UseTakeAwayOrdersResult {
    orders: Order[];
    loading: boolean;
}

export function useTakeAwayOrders(restaurantSlug: string | undefined,
                                  zoneId: string | undefined,
                                  enabled: boolean): UseTakeAwayOrdersResult {

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(enabled);

    useEffect(() => {
        if (!enabled || !restaurantSlug || !zoneId) return;

        const ordersRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders`);
        const q = query(ordersRef, orderByChild('serviceType'), equalTo('TAKEAWAY'));

        const handleSnapshot = (snap: DataSnapshot) => {
            if (!snap.exists()) {
                setOrders([]);
                setLoading(false);
                return;
            }

            const raw = snap.val() as Record<string, Order>;
            const list = Object.entries(raw)
                .map(([id, data]) => ({
                    id,
                    ...data,
                    items: Array.isArray(data.items) ? data.items : [],
                    total: typeof data.total === 'number' ? data.total : 0
                }))
                .filter(o => (zoneId ? o.zoneId === zoneId : true))
                .sort((a, b) => {
                    const ca = a.createdAt ?? 0;
                    const cb = b.createdAt ?? 0;
                    return ca > cb ? -1 : 1;
                });
            setOrders(list);
            setLoading(false);
        }

        onValue(q, handleSnapshot);
        return () => off(q, 'value', handleSnapshot);
        }, [restaurantSlug, zoneId, enabled]);
    return { orders, loading };
}