// src/services/printService.ts


// Configuration pour le serveur d'impression
import type {OrderItem} from "@/services/orderService.ts";

const PRINT_SERVER_URL = 'http://localhost:3001/print-ticket'; // À remplacer par l'URL réelle de votre serveur d'impression

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

class PrintService {
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
            // Construction de l'objet printData
            const printData: PrintData = {
                ip: "192.168.1.102",
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


            // Envoi au serveur d'impression
            const response = await fetch(PRINT_SERVER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            });

            if (!response.ok) {
                throw new Error(`Erreur serveur d'impression: ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'impression:', error);
            return false;
        }
    }
}

// Exporter une instance unique du service
export const printService = new PrintService();