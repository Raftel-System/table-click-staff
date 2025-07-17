import { Check, Clock } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { CancelModal } from './CancelModal';
import { useState } from 'react';

interface CartListProps {
  onEditItem?: (item: { id: string; nom: string; prix: number; quantite: number; note?: string }) => void;
}

export const CartList = ({ onEditItem }: CartListProps) => {
  const { items, total, removeItem, validateOrder, clearSentItems } = useCartStore();
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; item: any | null }>({
    isOpen: false,
    item: null
  });

  const pendingItems = items.filter(item => !item.envoye);
  const sentItems = items.filter(item => item.envoye);

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
      // Ici on pourrait envoyer une notification à la cuisine si informKitchen est true
      removeItem(cancelModal.item.id);
      console.log(`Article annulé. Informer cuisine: ${informKitchen}`);
    }
    setCancelModal({ isOpen: false, item: null });
  };

  return (
      <div className="w-80 theme-header-bg p-4 flex flex-col h-full">
        {/* Header Panier */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold theme-foreground-text">Panier</h3>
          <div className="theme-primary-text font-bold">
            Total: {total.toFixed(2)}€
          </div>
        </div>

        {/* Items en attente */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {pendingItems.length > 0 && (
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

                      {/* Quantité et prix */}
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

          {/* Items envoyés */}
          {sentItems.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold theme-success-text flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Envoyés ({sentItems.length})
                  </h4>
                  <button
                      onClick={clearSentItems}
                      className="text-xs theme-secondary-text hover:theme-primary-text"
                  >
                    Effacer
                  </button>
                </div>
                {sentItems.map((item) => (
                    <div key={item.id} className="theme-menu-card p-3 rounded-lg opacity-75">
                      <div className="flex justify-between items-center">
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
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="theme-foreground-text text-sm">x{item.quantite}</div>
                            <div className="theme-success-text text-xs">✓ Envoyé</div>
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
              </div>
          )}

          {items.length === 0 && (
              <div className="text-center theme-secondary-text text-sm py-8">
                Panier vide
              </div>
          )}
        </div>

        {/* Bouton Valider */}
        {pendingItems.length > 0 && (
            <button
                onClick={validateOrder}
                className="theme-button-primary py-4 rounded-lg font-semibold mt-4"
            >
              Valider Commande
            </button>
        )}

        <CancelModal
            isOpen={cancelModal.isOpen}
            onClose={() => setCancelModal({ isOpen: false, item: null })}
            onConfirm={handleConfirmCancel}
            item={cancelModal.item}
        />
      </div>
  );
};