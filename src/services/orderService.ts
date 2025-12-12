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
    status: any;
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
    // Fonction pour nettoyer les valeurs undefined
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

    // ========================================
    // MÉTHODES POUR TAKEAWAY (sans sessions)
    // ========================================

    /**
     * Créer une commande à emporter
     * Chaque commande takeaway est unique et indépendante (PAS de session)
     */
    async createTakeawayOrder(
        restaurantSlug: string,
        zoneId: string
    ): Promise<Order> {
        try {
            const orderId = this.generateOrderId();
            const orderNumber = await this.generateOrderNumber(restaurantSlug);

            const newOrder: Order = {
                id: orderId,
                number: orderNumber,
                serviceType: 'TAKEAWAY',
                zoneId,
                tableId: null,
                status: 'pending',
                createdAt: new Date().toISOString(),
                items: [],
                total: 0
            };

            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);
            await set(orderRef, this.cleanObject(newOrder));

            return newOrder;
        } catch (error) {
            console.error('❌ Erreur création commande takeaway:', error);
            throw new Error('Impossible de créer la commande à emporter');
        }
    }

    // ========================================
    // MÉTHODES POUR DINING (avec sessions)
    // ========================================

    /**
     * Créer ou récupérer la commande de session pour une TABLE (DINING uniquement)
     * Une table = une session = une commande en cours
     */
    async getOrCreateDiningOrder(
        restaurantSlug: string,
        tableId: string,
        zoneId: string,
    ): Promise<Order> {
        try {
            const sessionKey = `table_${tableId}`;

            const sessionRef = ref(rtDatabase, `restaurants/${restaurantSlug}/sessions/${sessionKey}/currentOrder`);
            const sessionSnapshot = await get(sessionRef);

            // Vérifier si une commande existe déjà pour cette table
            if (sessionSnapshot.exists()) {
                const existingOrderId = sessionSnapshot.val();
                const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${existingOrderId}`);
                const orderSnapshot = await get(orderRef);

                if (orderSnapshot.exists()) {
                    const existingOrder = orderSnapshot.val() as Order;

                    const secureOrder: Order = {
                        ...existingOrder,
                        items: Array.isArray(existingOrder.items) ? existingOrder.items : [],
                        total: typeof existingOrder.total === 'number' ? existingOrder.total : 0
                    };
                    return secureOrder;
                }
            }

            // Créer une nouvelle commande pour cette table
            const orderId = this.generateOrderId();
            const orderNumber = await this.generateOrderNumber(restaurantSlug);

            const newOrder: Order = {
                id: orderId,
                number: orderNumber,
                serviceType: 'DINING',
                zoneId,
                tableId,
                status: 'pending',
                createdAt: new Date().toISOString(),
                items: [],
                total: 0
            };

            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);
            await set(orderRef, this.cleanObject(newOrder));

            // Associer cette commande à la session de la table
            await set(sessionRef, orderId);

            return newOrder;
        } catch (error) {
            console.error('❌ Erreur création/récupération commande DINING:', error);
            throw new Error('Impossible de créer la commande de table');
        }
    }

    // ========================================
    // MÉTHODES COMMUNES
    // ========================================

    /**
     * Ajouter des items à une commande existante (DINING ou TAKEAWAY)
     */
    async addItemsToOrder(
        restaurantSlug: string,
        orderId: string,
        newItems: OrderItem[]
    ): Promise<Order> {
        try {
            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);
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

            const existingItems = Array.isArray(currentOrder.items) ? currentOrder.items : [];
            const updatedItems = [...existingItems, ...cleanedNewItems];
            const updatedTotal = updatedItems.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

            const updatedOrder: Order = {
                ...currentOrder,
                items: updatedItems,
                total: updatedTotal,
                status: 'sent',
                lastUpdated: new Date().toISOString()
            };

            await set(orderRef, this.cleanObject(updatedOrder));

            // Récupérer les infos pour l'impression
            let zoneName = 'Zone inconnue';
            let tableNumber: number | undefined;

            if (currentOrder.serviceType === 'DINING' && currentOrder.tableId) {
                try {
                    // Import dynamique de Firestore
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');

                    // Récupérer les infos de la table depuis Firestore
                    const tableRef = doc(db, `restaurants/${restaurantSlug}/tables`, currentOrder.tableId);
                    const tableSnapshot = await getDoc(tableRef);

                    if (tableSnapshot.exists()) {
                        const tableData = tableSnapshot.data();
                        tableNumber = tableData.numero;

                        // Récupérer les infos de la zone depuis Firestore
                        const zoneRef = doc(db, `restaurants/${restaurantSlug}/zones`, currentOrder.zoneId);
                        const zoneSnapshot = await getDoc(zoneRef);

                        if (zoneSnapshot.exists()) {
                            const zoneData = zoneSnapshot.data();
                            zoneName = zoneData.nom || 'Zone inconnue';
                        }
                    }
                } catch (error) {
                    console.error('❌ Erreur récupération infos table/zone:', error);
                }
            }

            // Impression
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
            console.error('❌ Erreur ajout items:', error);
            throw new Error('Impossible d\'ajouter les items');
        }
    }

    /**
     * Mettre à jour le statut d'une commande
     */
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

        } catch (error) {
            console.error('❌ Erreur mise à jour statut:', error);
            throw new Error('Impossible de mettre à jour le statut');
        }
    }

    /**
     * Écouter une commande en temps réel
     */
    onOrderChange(
        restaurantSlug: string,
        orderId: string,
        callback: (order: Order | null) => void
    ): () => void {
        const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);

        const unsubscribe = onValue(orderRef, (snapshot) => {
            if (snapshot.exists()) {
                const orderData = snapshot.val() as Order;

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

    /**
     * Récupérer une commande par son ID (utilisé pour TAKEAWAY)
     */
    async getOrderById(
        restaurantSlug: string,
        orderId: string
    ): Promise<Order | null> {
        try {
            const orderRef = ref(rtDatabase, `restaurants/${restaurantSlug}/orders/${orderId}`);
            const orderSnapshot = await get(orderRef);

            if (!orderSnapshot.exists()) {
                console.warn('⚠️ Commande non trouvée:', orderId);
                return null;
            }

            const orderData = orderSnapshot.val() as Order;

            // Sécuriser les données
            const secureOrder: Order = {
                ...orderData,
                items: Array.isArray(orderData.items) ? orderData.items : [],
                total: typeof orderData.total === 'number' ? orderData.total : 0
            };

            return secureOrder;
        } catch (error) {
            console.error('❌ Erreur récupération commande:', error);
            throw new Error('Impossible de récupérer la commande');
        }
    }

    /**
     * Nettoyer la session d'une table (DINING uniquement)
     * Appelé quand une table est libérée
     */
    async clearDiningSession(
        restaurantSlug: string,
        tableId: string
    ): Promise<void> {
        try {
            const sessionKey = `table_${tableId}`;

            const sessionRef = ref(rtDatabase, `restaurants/${restaurantSlug}/sessions/${sessionKey}`);
            await set(sessionRef, null);

        } catch (error) {
            console.error('❌ Erreur nettoyage session:', error);
        }
    }
}

// Instance singleton
export const orderService = new OrderService();