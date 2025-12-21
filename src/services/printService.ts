// src/services/printService.ts

// Configuration pour le serveur d'impression
import type {OrderItem} from "@/services/orderService.ts";

// Type pour les données d'impression
export interface PrintData {
    ip: string;
    restaurantId: string;
    serviceType: 'DINING' | 'TAKEAWAY';
    orderNumber: string;
    tableInfo?: {
        tableId: string;
        tableNumber?: number;
        zoneName: string;
    } | null;
    timestamp: number;
    items: {
        name: string;
        quantity: number;
        note?: string;
        menuConfig?: any;
    }[];
}

interface PrintConfig {
    serverPrinterIp: string;
    printerIp: string;
}

class PrintService {
    /**
     * Récupère la configuration d'impression depuis Firestore
     */
    private async getPrintConfig(restaurantSlug: string): Promise<PrintConfig> {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const configRef = doc(db, `restaurants/${restaurantSlug}/settings/config`);
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const data = configSnap.data();
                return {
                    serverPrinterIp: data.serverPrinterIp || 'https://zeus-lab.tailfdaef5.ts.net/print-ticket',
                    printerIp: data.printerIp || '192.168.1.102'
                };
            } else {
                console.warn('⚠️ Config non trouvée, utilisation des valeurs par défaut');
                return {
                    serverPrinterIp: 'https://zeus-lab.tailfdaef5.ts.net/print-ticket',
                    printerIp: '192.168.1.102'
                };
            }
        } catch (error) {
            console.error('❌ Erreur récupération config impression:', error);
            return {
                serverPrinterIp: 'https://zeus-lab.tailfdaef5.ts.net/print-ticket',
                printerIp: '192.168.1.102'
            };
        }
    }

    /**
     * Envoie les nouveaux articles d'une commande au serveur d'impression
     */
    async printNewItems(
        restaurantSlug: string,
        orderNumber: string,
        serviceType: 'DINING' | 'TAKEAWAY',
        zoneName: string,
        tableId: string | null,
        tableNumber?: number,
        items?: OrderItem[]
    ): Promise<boolean> {
        if (!items || items.length === 0) {
            console.log('⚠️ Aucun article à imprimer');
            return false;
        }

        try {
            // Récupérer la configuration d'impression depuis Firestore
            const config = await this.getPrintConfig(restaurantSlug);

            console.log(`📄 Configuration d'impression récupérée:`, config);

            // Construction de l'objet printData
            const printData: PrintData = {
                ip: config.printerIp,
                restaurantId: restaurantSlug,
                serviceType,
                orderNumber,
                timestamp: Date.now(),
                items: items.map(item => ({
                    name: item.nom,
                    quantity: item.quantite,
                    note: item.note,
                    menuConfig: item.menuConfig
                }))
            };

            // Ajouter les informations de table si c'est pour une table
            if (tableId && serviceType === 'DINING') {
                printData.tableInfo = {
                    tableId,
                    tableNumber,
                    zoneName
                };
            }

            console.log(`📤 Envoi du ticket vers: ${config.serverPrinterIp}`);

            // Envoi au serveur d'impression
            const response = await fetch(config.serverPrinterIp, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            });

            if (!response.ok) {
                throw new Error(`Erreur serveur d'impression: ${response.status}`);
            }

            console.log('✅ Ticket envoyé avec succès');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'impression:', error);
            return false;
        }
    }
}

// Exporter une instance unique du service
export const printService = new PrintService();