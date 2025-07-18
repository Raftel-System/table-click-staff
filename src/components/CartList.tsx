import { Check, Clock } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { CancelModal } from './CancelModal';
import { useState } from 'react';
import type { Order } from '@/services/orderService';

interface CartListProps {
    onEditItem?: (item: { id: string; nom: string; prix: number; quantite: number; note?: string }) => void;
    onValidateOrder?: () => void;  // 🆕 Fonction pour envoyer la commande
    isValidating?: boolean;        // 🆕 État de validation/envoi
    currentOrder?: Order | null;   // 🆕 Commande actuelle de la base
    isLoadingOrder?: boolean;      // 🆕 Loading state
}

export const CartList = ({
                             onEditItem,
                             onValidateOrder,
                             isValidating = false,
                             currentOrder = null,
                             isLoadingOrder = false
                         }: CartListProps) => {
    const { items, total, removeItem } = useCartStore();
    const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; item: any | null }>({
        isOpen: false,
        item: null
    });

    // Items en attente = items du cart local qui ne sont pas envoyés
    const pendingItems = items.filter(item => !item.envoye);

    // 🆕 Vérifications de sécurité pour currentOrder
    const orderItems = currentOrder?.items || [];
    const orderTotal = currentOrder?.total || 0;
    const orderNumber = currentOrder?.number || 'Panier';

    const formatMenuConfig = (menuConfig: any) => {
        if (!menuConfig) return '';
        const config = Object.entries(menuConfig)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' • ');
        return config ? ` (${config})` : '';
    };

    const handleEditItem = (item: any) => {
        if (onEditItem) {
            onEditItem({
                id: item.id,
                nom: item.nom,
                prix: item.prix,
                quantite: item.quantite,
                note: item.note
            });
        }
    };

    const handleCancelSentItem = (item: any) => {
        setCancelModal({ isOpen: true, item });
    };

    const handleConfirmCancel = (informKitchen: boolean) => {
        if (cancelModal.item) {
            // TODO: Ici on devrait annuler dans la base de données aussi
            console.log(`Article annulé. Informer cuisine: ${informKitchen}`);
        }
        setCancelModal({ isOpen: false, item: null });
    };

    // 🆕 Gérer l'envoi de la commande
    const handleSendOrder = () => {
        if (onValidateOrder && pendingItems.length > 0) {
            onValidateOrder();
        }
    };

    return (
        <div className="w-80 theme-header-bg flex flex-col h-full">
            {/* Header Panier */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold theme-foreground-text">
                        {orderNumber}
                    </h3>
                    <div className="theme-primary-text font-bold">
                        {/* Affichage du total selon le contexte */}
                        {pendingItems.length > 0 ? (
                            <span>En cours: {total.toFixed(2)}€</span>
                        ) : currentOrder ? (
                            <span>Total: {orderTotal.toFixed(2)}€</span>
                        ) : (
                            <span>Total: {total.toFixed(2)}€</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Items scrollables */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-3">

                    {/* Loading state initial */}
                    {isLoadingOrder && (
                        <div className="text-center theme-secondary-text text-sm py-8">
                            Initialisation de la commande...
                        </div>
                    )}

                    {/* Items en attente (cart local) */}
                    {!isLoadingOrder && pendingItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold theme-secondary-text mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                En attente ({pendingItems.length})
                            </h4>
                            {pendingItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="theme-menu-card p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => handleEditItem(item)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="theme-foreground-text font-medium text-sm line-clamp-2">
                                                {item.nom}{formatMenuConfig(item.menuConfig)}
                                            </div>
                                            {item.note && (
                                                <div className="theme-secondary-text text-xs mt-1">
                                                    Note: {item.note}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="theme-foreground-text text-sm font-medium">
                                            Quantité: {item.quantite}
                                        </div>
                                        <div className="theme-primary-text font-semibold text-sm">
                                            {(item.prix * item.quantite).toFixed(2)}€
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🆕 Commande envoyée (affichage de la commande de la base) */}
                    {!isLoadingOrder && currentOrder && orderItems.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold theme-success-text mb-2 flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Envoyé • {currentOrder.status}
                            </h4>

                            <div className="theme-menu-card p-3 rounded-lg opacity-90">
                                {/* Heure de création */}
                                <div className="text-xs theme-secondary-text mb-3">
                                    Créé à {new Date(currentOrder.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                                    {currentOrder.lastUpdated && (
                                        <span> • Mis à jour à {new Date(currentOrder.lastUpdated).toLocaleTimeString('fr-FR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</span>
                                    )}
                                </div>

                                {/* Items de la commande */}
                                {orderItems.map((item, index) => (
                                    <div key={`${currentOrder.id}-${index}`} className="border-t border-gray-200 pt-2 mt-2 first:border-t-0 first:pt-0 first:mt-0">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="theme-foreground-text font-medium text-sm">
                                                    {item.nom}{formatMenuConfig(item.menuConfig)}
                                                </div>
                                                {item.note && (
                                                    <div className="theme-secondary-text text-xs mt-1">
                                                        Note: {item.note}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right ml-2">
                                                <div className="theme-foreground-text text-sm">x{item.quantite}</div>
                                                <div className="theme-primary-text font-semibold text-xs">
                                                    {(item.prix * item.quantite).toFixed(2)}€
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message si complètement vide */}
                    {!isLoadingOrder && pendingItems.length === 0 && orderItems.length === 0 && (
                        <div className="text-center theme-secondary-text text-sm py-8">
                            Aucun article
                        </div>
                    )}
                </div>
            </div>

            {/* 🆕 Footer fixe avec bouton ENVOYER */}
            <div className="p-4 border-t border-gray-200">
                {pendingItems.length > 0 && (
                    <button
                        onClick={handleSendOrder}
                        disabled={isValidating}
                        className={`w-full py-4 rounded-lg font-semibold transition-colors ${
                            isValidating
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'theme-button-primary'
                        }`}
                    >
                        {isValidating ? 'Envoi en cours...' : `Envoyer (${pendingItems.length})`}
                    </button>
                )}
            </div>

            <CancelModal
                isOpen={cancelModal.isOpen}
                onClose={() => setCancelModal({ isOpen: false, item: null })}
                onConfirm={handleConfirmCancel}
                item={cancelModal.item}
            />
        </div>
    );
};