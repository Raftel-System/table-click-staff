// src/services/printService.ts

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { OrderItem } from "@/services/orderService.ts";

// Configuration par défaut (fallback si Firestore n'est pas accessible)
const DEFAULT_PRINT_SERVER_URL = 'http://localhost:3001/';
const DEFAULT_PRINTER_IP = '192.168.1.102';

// Interface pour la configuration d'impression
export interface PrintConfig {
    printerIp: string;
    serverPrintIp: string; // URL HTTPS du serveur d'impression
}

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
    private configCache: Map<string, PrintConfig> = new Map();

    /**
     * Récupère la configuration d'impression depuis Firestore
     * Chemin: /restaurants/{restaurantSlug}/settings/config
     * Champs récupérés: printerIp, serverPrintIp
     */
    async getPrintConfig(restaurantSlug: string): Promise<PrintConfig> {
        // Vérifier le cache
        if (this.configCache.has(restaurantSlug)) {
            console.log('📦 Config impression depuis cache');
            return this.configCache.get(restaurantSlug)!;
        }

        try {
            // Récupérer depuis Firestore
            const configRef = doc(db, `restaurants/${restaurantSlug}/settings/config`);
            const configSnap = await getDoc(configRef);

            if (configSnap.exists()) {
                const data = configSnap.data();
                const config: PrintConfig = {
                    printerIp: data.printerIp || DEFAULT_PRINTER_IP,
                    serverPrintIp: data.serverPrintIp || DEFAULT_PRINT_SERVER_URL
                };
                console.log("COnfig ,", config);

                // Mettre en cache
                this.configCache.set(restaurantSlug, config);
                console.log('✅ Config impression récupérée:', config);
                return config;
            } else {
                console.warn('⚠️ Config non trouvée dans Firestore, utilisation des valeurs par défaut');
            }
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la config d\'impression:', error);
        }

        // Configuration par défaut
        const defaultConfig: PrintConfig = {
            printerIp: DEFAULT_PRINTER_IP,
            serverPrintIp: DEFAULT_PRINT_SERVER_URL
        };

        return defaultConfig;
    }

    /**
     * Vide le cache de configuration
     * À appeler après une mise à jour de la config dans Firestore
     */
    clearConfigCache(restaurantSlug?: string) {
        if (restaurantSlug) {
            this.configCache.delete(restaurantSlug);
            console.log(`🗑️ Cache vidé pour ${restaurantSlug}`);
        } else {
            this.configCache.clear();
            console.log('🗑️ Cache complet vidé');
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
            const printConfig = await this.getPrintConfig(restaurantSlug);

            // Construire l'URL du serveur d'impression
            // serverPrintIp peut être une URL complète ou juste un domaine
            const printServerUrl = printConfig.serverPrintIp.startsWith('http')
                ? `${printConfig.serverPrintIp}/print-ticket`
                : `https://${printConfig.serverPrintIp}/print-ticket`;

            // Construction de l'objet printData
            const printData: PrintData = {
                ip: printConfig.printerIp, // IP de l'imprimante récupérée depuis Firestore
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

            console.log('🖨️ Envoi à l\'impression:', {
                server: printServerUrl,
                printer: printConfig.printerIp,
                orderNumber,
                itemsCount: items.length
            });

            // Envoi au serveur d'impression
            const response = await fetch(printServerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur serveur d'impression (${response.status}): ${errorText}`);
            }

            console.log('✅ Impression envoyée avec succès');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'impression:', error);
            return false;
        }
    }
}

// Exporter une instance unique du service
export const printService = new PrintService();