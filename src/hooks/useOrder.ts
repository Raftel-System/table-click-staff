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

    // Créer ou récupérer la commande au chargement
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

                let sessionOrder: Order;

                // 🔧 CORRECTION: Utiliser la bonne méthode selon le type de service
                if (serviceType === 'DINING') {
                    // Pour les tables : utiliser le système de session
                    sessionOrder = await orderService.getOrCreateDiningOrder(
                        restaurantSlug,
                        tableId,
                        zoneId
                    );
                } else {
                    // Pour les takeaways : récupérer la commande par son ID
                    // tableId contient en fait l'ID de la commande pour les takeaways
                    const orderRef = await orderService.getOrderById(restaurantSlug, tableId);
                    if (!orderRef) {
                        throw new Error('Commande takeaway non trouvée');
                    }
                    sessionOrder = orderRef;
                }

                setCurrentOrder(sessionOrder);
                setIsInitialized(true);

                // Écouter les changements en temps réel
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

    // Ajouter des items à la commande existante
    const addItemsToCurrentOrder = async (items: OrderItem[]): Promise<boolean> => {
        if (!restaurantSlug || !currentOrder) {
            setError('Commande non initialisée');
            return false;
        }

        setIsAddingItems(true);
        setError(null);

        try {
            await orderService.addItemsToOrder(
                restaurantSlug,
                currentOrder.id,
                items
            );
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

    // Nettoyer la session (DINING uniquement)
    const clearCurrentSession = async (): Promise<void> => {
        if (!restaurantSlug || !tableId || serviceType !== 'DINING') return;

        try {
            await orderService.clearDiningSession(restaurantSlug, tableId);
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

        // Compatibilité (deprecated)
        isCreatingOrder: isAddingItems,
        createOrder: async () => null,
        sentOrders: currentOrder ? [currentOrder] : [],
        isLoadingOrders: isLoadingOrder
    };
};