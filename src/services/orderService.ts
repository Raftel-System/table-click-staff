import { rtDatabase } from '@/lib/firebase';
import { ref, get, set, update, serverTimestamp, runTransaction, onValue, off } from 'firebase/database';
import { printService } from './printService';

export interface OrderItem {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string;
    menuConfig?: any;
}

export interface Order {
    id: string;
    number: string;
    serviceType: 'DINING' | 'TAKEAWAY';
    zoneId: string;
    tableId: string | null;
    status: 'pending' | 'sent' | 'preparing' | 'ready' | 'served' | 'cancelled';
    createdAt: string;
    items: OrderItem[];
    total: number;
    lastUpdated?: string;
}

class OrderService {
    // 🆕 Fonction pour nettoyer les valeurs undefined
    private cleanObject(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanObject(item));
        } else if (obj !== null && typeof obj === 'object') {
            const cleaned: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== undefined && value !== null) {
                    cleaned[key] = this.cleanObject(value);
                }
            }
            return cleaned;
        }
        return obj;
    }

    // Générer un ID unique basé sur la date
    private generateOrderId(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');

        return `${year}${month}${day}_${hours}${minutes}${seconds}_${ms}`;
    }

    // Générer et incrémenter le numéro de commande avec transaction
    async generateOrderNumber(restaurantSlug: string): Promise<string> {
        try {
            const counterRef = ref(rtDatabase, `restaurants/${restaurantSlug}/counters/orderNumber`);

            // Utiliser une transaction pour incrémenter de façon atomique
            const result = await runTransaction(counterRef, (currentValue) => {
                // Si la valeur n'existe pas, commencer à 1
                return (currentValue || 0) + 1;
            });

            if (result.committed && result.snapshot.exists()) {
                const newOrderNumber = result.snapshot.val();
                return `CMD_${newOrderNumber}`;
            } else if (result.committed) {
                // Premier numéro
                return 'CMD_1';
            } else {
                // Transaction a échoué
                throw new Error('Transaction échouée');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la génération du numéro:', error);
            throw new Error('Impossible de générer le numéro de commande');
        }
    }

    // 🆕 Créer ou récupérer la commande de session pour une table
    async getOrCreateSessionOrder(
        restaurantSlug: string,
        tableId: string | null,
        serviceType: 'DINING' | 'TAKEAWAY',
        zoneId: string
    ): Promise<Order> {
        try {
            // Créer une clé unique pour la session (table ou CMD)
            const sessionKey = tableId || 'takeaway_session';
            const sessionRef = ref(rtDatabase, `restaurants/${restaurantSlug}/sessions/${sessionKey}/currentOrder`);

            // Vérifier si une commande existe déjà pour cette session
            const sessionSnapshot = await get(sessionRef);

            if (sessionSnapshot.exists()) {
                const existingOrderId = sessionSnapshot.val();
                const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${existingOrderId}`);
                const orderSnapshot = await get(orderRef);

                if (orderSnapshot.exists()) {
                    const existingOrder = orderSnapshot.val() as Order;

                    // 🆕 Sécuriser la structure de la commande existante
                    const secureOrder: Order = {
                        ...existingOrder,
                        items: Array.isArray(existingOrder.items) ? existingOrder.items : [],
                        total: typeof existingOrder.total === 'number' ? existingOrder.total : 0
                    };
                    return secureOrder;
                }
            }

            // Créer une nouvelle commande vide
            const orderId = this.generateOrderId();
            const orderNumber = await this.generateOrderNumber(restaurantSlug);

            const newOrder: Order = {
                id: orderId,
                number: orderNumber,
                serviceType,
                zoneId,
                tableId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                items: [], // 🆕 Toujours initialiser comme tableau vide
                total: 0
            };

            // Sauvegarder la commande
            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);
            await set(orderRef, this.cleanObject(newOrder));

            // Associer cette commande à la session
            await set(sessionRef, orderId);

            console.log('✅ Nouvelle commande de session créée:', newOrder);
            return newOrder;
        } catch (error) {
            console.error('❌ Erreur lors de la création/récupération de commande:', error);
            throw new Error('Impossible de créer la commande de session');
        }
    }

    // 🆕 Ajouter des items à la commande existante
    async addItemsToOrder(
        restaurantSlug: string,
        orderId: string,
        newItems: OrderItem[]
    ): Promise<Order> {
        try {
            // Code existant pour ajouter des items
            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);

            // Récupérer la commande actuelle
            const orderSnapshot = await get(orderRef);
            if (!orderSnapshot.exists()) {
                throw new Error('Commande non trouvée');
            }

            const currentOrder = orderSnapshot.val() as Order;

            // Nettoyer les nouveaux items
            const cleanedNewItems = newItems.map(item => {
                const cleanedItem: any = {
                    id: item.id,
                    nom: item.nom,
                    prix: item.prix,
                    quantite: item.quantite
                };

                if (item.note && item.note.trim() !== '') {
                    cleanedItem.note = item.note;
                }

                if (item.menuConfig && Object.keys(item.menuConfig).length > 0) {
                    cleanedItem.menuConfig = this.cleanObject(item.menuConfig);
                }

                return cleanedItem;
            });

            // 🆕 Sécuriser l'accès aux items existants
            const existingItems = Array.isArray(currentOrder.items) ? currentOrder.items : [];
            const updatedItems = [...existingItems, ...cleanedNewItems];
            const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

            // Mettre à jour la commande
            const updatedOrder: Order = {
                ...currentOrder,
                items: updatedItems,
                total: updatedTotal,
                status: 'sent',
                lastUpdated: new Date().toISOString()
            };

            const cleanedUpdatedOrder = this.cleanObject(updatedOrder);
            await set(orderRef, cleanedUpdatedOrder);

            let zoneName = 'Zone inconnue';
            let tableNumber: number | undefined;

            if (currentOrder.serviceType === 'DINING' && currentOrder.tableId) {
                try {
                    // Récupérer les infos de la table (à adapter selon votre structure)
                    const tableRef = ref(rtDatabase, `restaurants/${restaurantSlug}/tables/${currentOrder.tableId}`);
                    const tableSnapshot = await get(tableRef);
                    if (tableSnapshot.exists()) {
                        const tableData = tableSnapshot.val();
                        tableNumber = tableData.numero;

                        // Récupérer les infos de la zone
                        const zoneRef = ref(rtDatabase, `restaurants/${restaurantSlug}/zones/${currentOrder.zoneId}`);
                        const zoneSnapshot = await get(zoneRef);
                        if (zoneSnapshot.exists()) {
                            zoneName = zoneSnapshot.val().nom || 'Zone inconnue';
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur lors de la récupération des infos table/zone:', error);
                }
            }

            // Appeler le service d'impression
            await printService.printNewItems(
                restaurantSlug,
                currentOrder.number,
                currentOrder.serviceType,
                zoneName,
                currentOrder.tableId,
                tableNumber,
                cleanedNewItems
            );

            return updatedOrder;
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout d\'items:', error);
            throw new Error('Impossible d\'ajouter les items');
        }
    }

    // Mettre à jour le statut d'une commande
    async updateOrderStatus(
        restaurantSlug: string,
        orderId: string,
        status: Order['status']
    ): Promise<void> {
        try {
            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);
            await update(orderRef, {
                status,
                lastUpdated: serverTimestamp()
            });

            console.log(`✅ Statut mis à jour: ${orderId} → ${status}`);
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour du statut:', error);
            throw new Error('Impossible de mettre à jour le statut');
        }
    }

    // 🆕 Écouter UNE commande spécifique en temps réel
    onOrderChange(
        restaurantSlug: string,
        orderId: string,
        callback: (order: Order | null) => void
    ): () => void {
        const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);

        const unsubscribe = onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                const orderData = snapshot.val() as Order;

                // 🆕 Sécuriser la structure de la commande reçue
                const secureOrder: Order = {
                    ...orderData,
                    items: Array.isArray(orderData.items) ? orderData.items : [],
                    total: typeof orderData.total === 'number' ? orderData.total : 0
                };

                callback(secureOrder);
            } else {
                callback(null);
            }
        });

        return () => off(orderRef, 'value', unsubscribe);
    }

    // 🆕 Nettoyer la session (optionnel - pour fin de service)
    async clearSession(
        restaurantSlug: string,
        tableId: string | null
    ): Promise<void> {
        try {
            const sessionKey = tableId || 'takeaway_session';
            const sessionRef = ref(rtDatabase, `restaurants/${restaurantSlug}/sessions/${sessionKey}`);
            await set(sessionRef, null);

            console.log('✅ Session nettoyée');
        } catch (error) {
            console.error('❌ Erreur lors du nettoyage de session:', error);
        }
    }
}

// Instance singleton
export const orderService = new OrderService();