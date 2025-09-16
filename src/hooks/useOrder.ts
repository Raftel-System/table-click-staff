import { useState, useEffect } from 'react';
import { orderService, type Order, type OrderItem } from '@/services/orderService';

export const useOrder = (
    restaurantSlug: string,
    tableId?: string | null,
    serviceType?: 'DINING' | 'TAKEAWAY',
    zoneId?: string
) => {
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isAddingItems, setIsAddingItems] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // 🆕 Créer ou récupérer la commande de session au chargement
    useEffect(() => {
        if (!restaurantSlug || !tableId || !serviceType || !zoneId) return;
        if (isInitialized) return;

        const initializeOrder = async () => {
            setIsLoadingOrder(true);
            setError(null);

            try {
                console.log('🚀 Initialisation commande:', {
                    restaurantSlug,
                    tableId,
                    serviceType,
                    zoneId
                });

                const sessionOrder = await orderService.getOrCreateSessionOrder(
                    restaurantSlug,
                    tableId, // Utiliser tableId directement
                    serviceType,
                    zoneId
                );

                setCurrentOrder(sessionOrder);
                setIsInitialized(true);

                // Écouter les changements de CETTE commande en temps réel
                const unsubscribe = orderService.onOrderChange(
                    restaurantSlug,
                    sessionOrder.id,
                    (updatedOrder) => {
                        if (updatedOrder) {
                            setCurrentOrder(updatedOrder);
                        }
                    }
                );

                return () => {
                    console.log('🧹 Nettoyage listener commande');
                    unsubscribe();
                };
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
                setError(errorMessage);
                console.error('❌ Erreur lors de l\'initialisation:', err);
            } finally {
                setIsLoadingOrder(false);
            }
        };

        initializeOrder();

        return () => {
            setIsInitialized(false);
        };
    }, [restaurantSlug, tableId, serviceType, zoneId]);

    // 🆕 Ajouter des items à la commande existante
    const addItemsToCurrentOrder = async (items: OrderItem[]): Promise<boolean> => {
        if (!restaurantSlug || !currentOrder) {
            setError('Commande non initialisée');
            return false;
        }

        setIsAddingItems(true);
        setError(null);

        try {
            const updatedOrder = await orderService.addItemsToOrder(
                restaurantSlug,
                currentOrder.id,
                items
            );

            console.log('✅ Items ajoutés avec succès');
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('❌ Erreur lors de l\'ajout d\'items:', err);
            return false;
        } finally {
            setIsAddingItems(false);
        }
    };

    // Mettre à jour le statut d'une commande
    const updateOrderStatus = async (status: Order['status']): Promise<boolean> => {
        if (!restaurantSlug || !currentOrder) {
            setError('Commande non initialisée');
            return false;
        }

        try {
            await orderService.updateOrderStatus(restaurantSlug, currentOrder.id, status);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            setError(errorMessage);
            console.error('❌ Erreur lors de la mise à jour du statut:', err);
            return false;
        }
    };

    // 🆕 Nettoyer la session (fin de service)
    const clearCurrentSession = async (): Promise<void> => {
        if (!restaurantSlug || !tableId) return;

        try {
            // 🔧 CORRECTION: Passer tableId tel quel pour le nettoyage
            await orderService.clearSession(restaurantSlug, tableId);
            setCurrentOrder(null);
        } catch (err) {
            console.error('❌ Erreur lors du nettoyage de session:', err);
        }
    };

    return {
        currentOrder,
        currentOrderNumber: currentOrder?.number || 'CMD_1',

        // Actions
        addItemsToCurrentOrder,
        updateOrderStatus,
        clearCurrentSession,

        // États
        isLoadingOrder,
        isAddingItems,
        error,
        clearError: () => setError(null),

        // 🔄 Compatibilité (deprecated - à supprimer plus tard)
        isCreatingOrder: isAddingItems,
        createOrder: async () => null,
        sentOrders: currentOrder ? [currentOrder] : [],
        isLoadingOrders: isLoadingOrder
    };
};