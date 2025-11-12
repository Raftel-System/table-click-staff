import { useState, useEffect } from 'react';
import { orderService, type Order, type OrderItem } from '@/services/orderService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { rtDatabase  } from '@/lib/firebase';
import {get, ref, serverTimestamp, update} from "firebase/database";

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

        // Réinitialiser si les paramètres changent
        setIsInitialized(false);
        setCurrentOrder(null);

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

    const deleteOrderItem = async (itemIndex: number) => {
        if (!restaurantSlug || !currentOrder) return false;

        try {
            // Référence au chemin de la commande
            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${currentOrder.id}`);

            // Récupérer les données actuelles
            const snapshot = await get(orderRef);
            if (!snapshot.exists()) {
                console.error('❌ Document inexistant dans Realtime Database');
                return false;
            }

            const currentData = snapshot.val();
            if (!currentData.items || !currentData.items[itemIndex]) {
                console.error('❌ Article inexistant à cet index');
                return false;
            }

            // Créer l'article supprimé
            const deletedItem = {
                ...currentData.items[itemIndex],
                status: 'deleted',
                deletedAt: Date.now() // timestamp UNIX pour RTDB
            };

            // Mettre à jour le tableau
            const updatedItems = [...currentData.items];
            updatedItems[itemIndex] = deletedItem;

            // Mise à jour dans RTDB
            await update(orderRef, {
                items: updatedItems,
                updatedAt: Date.now()
            });

            console.log('✅ Article marqué comme supprimé dans Realtime Database');
            return true;
        } catch (err) {
            console.error('❌ Erreur suppression article dans RTDB:', err);
            return false;
        }
    };

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
        deleteOrderItem,

        // États
        isLoadingOrder,
        isAddingItems,
        error,
        clearError: () => setError(null),

        // Compatibilité (deprecated)
        isCreatingOrder: isAddingItems,
        sentOrders: currentOrder ? [currentOrder] : [],
        isLoadingOrders: isLoadingOrder
    };
};