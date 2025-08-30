import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { CategoryNav } from '../components/CategoryNav';
import { ArticleGrid } from '../components/ArticleGrid';
import { AdjustmentPanel } from '../components/AdjustmentPanel';
import { CartList } from '../components/CartList';
import { useCartStore } from '../stores/cartStore';
import { useMenuCategories } from '../hooks/useMenuCategories';
import { useMenuItems } from '../hooks/useMenuItems';
import { useOrder } from '../hooks/useOrder';
import type { MenuItem, MenuConfig } from '../types';

// 🆕 Composant Modal de confirmation
const TerminateOrderModal = ({
                               isOpen,
                               onClose,
                               onConfirm,
                               isLoading,
                               orderNumber,
                               tableInfo
                             }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  orderNumber: string;
  tableInfo: string;
}) => {
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 theme-backdrop flex items-center justify-center z-50">
        <div className="theme-modal-bg rounded-lg p-6 max-w-md w-full mx-4 theme-shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold theme-foreground-text mb-2">
                Terminer la commande
              </h3>
              <p className="theme-secondary-text text-sm mb-3">
                Vous êtes sur le point de terminer définitivement la commande <strong>{orderNumber}</strong> pour <strong>{tableInfo}</strong>.
              </p>
              <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-3 rounded-lg">
                ⚠️ Cette action est irréversible. La commande sera marquée comme terminée et la session sera fermée.
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 theme-button-secondary py-2 px-4 rounded-lg disabled:opacity-50"
            >
              Annuler
            </button>
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Finalisation...' : 'Terminer'}
            </button>
          </div>
        </div>
      </div>
  );
};

const Commande = () => {
  const { restaurantSlug, tableId } = useParams<{ restaurantSlug: string; tableId: string }>();
  const navigate = useNavigate();
  const { addItem, updateItem, removeItem, items, validateOrder, clearCart } = useCartStore();

  // Firebase hooks
  const { categories, loading: categoriesLoading } = useMenuCategories(restaurantSlug || '');
  const { menuItems, loading: itemsLoading } = useMenuItems(restaurantSlug || '');

  // Déterminer le serviceType et zoneId
  const isEmporter = tableId?.startsWith('CMD');
  const serviceType = isEmporter ? 'TAKEAWAY' : 'DINING';
  const zoneId = isEmporter ? 'emporter' : 'terrasse';

  // Hook pour la gestion des commandes avec temps réel
  const {
    currentOrder,
    currentOrderNumber,
    addItemsToCurrentOrder,
    updateOrderStatus,
    clearCurrentSession,
    isLoadingOrder,
    isAddingItems,
    error,
    clearError
  } = useOrder(restaurantSlug || '', tableId, serviceType, zoneId);

  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isMenuConfig, setIsMenuConfig] = useState(false);
  const [activeMenuStep, setActiveMenuStep] = useState<string>('');
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>({});
  const [editingItem, setEditingItem] = useState<{
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string;
    isSent?: boolean;
  } | null>(null);

  // 🆕 États pour le modal de confirmation
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  // Set first category as active when categories load
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Effacer les erreurs après un délai
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Filtrer les articles par catégorie
  const filteredItems = useMemo(() => {
    if (isMenuConfig && activeMenuStep) {
      return [];
    }
    return menuItems.filter(item => item.categorieId === activeCategory);
  }, [menuItems, activeCategory, isMenuConfig, activeMenuStep]);

  // 🆕 Fonction pour envoyer des articles (différente de terminer)
  const handleSendItems = async () => {
    const pendingItems = items.filter(item => !item.envoye);

    if (pendingItems.length === 0) {
      console.log("Aucun article à envoyer !");
      return;
    }

    const orderItems = pendingItems.map(item => ({
      id: item.id,
      nom: item.nom,
      prix: item.prix,
      quantite: item.quantite,
      note: item.note,
      menuConfig: item.menuConfig
    }));

    try {
      console.log('🚀 Envoi des items vers la commande:', orderItems);

      const success = await addItemsToCurrentOrder(orderItems);

      if (success) {
        console.log('✅ Items ajoutés avec succès à la commande');
        validateOrder();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la commande:', error);
    }
  };

  // 🆕 Fonction pour terminer définitivement la commande
  const handleTerminateOrder = async () => {
    if (!currentOrder) {
      console.error('❌ Pas de commande active à terminer');
      return;
    }

    setIsTerminating(true);

    try {
      // 1. D'abord envoyer les articles en attente s'il y en a
      const pendingItems = items.filter(item => !item.envoye);
      if (pendingItems.length > 0) {
        console.log('📤 Envoi des articles en attente avant finalisation...');
        await handleSendItems();

        // Attendre un peu pour que les items soient bien ajoutés
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // 2. Changer le statut à "served" (commande terminée)
      console.log('🏁 Finalisation de la commande...');
      await updateOrderStatus('served');

      // 3. Sauvegarder dans Firestore (si nécessaire - déjà fait par le service)
      console.log('💾 Commande sauvegardée dans Firestore');

      // 4. Nettoyer la session
      console.log('🧹 Nettoyage de la session...');
      await clearCurrentSession();

      // 5. Nettoyer le panier local
      clearCart();

      console.log('✅ Commande terminée avec succès !');

      // 6. Rediriger vers la page d'accueil
      navigate(`/${restaurantSlug}/zones`);

    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
      // Vous pourriez afficher un message d'erreur à l'utilisateur ici
    } finally {
      setIsTerminating(false);
      setShowTerminateModal(false);
    }
  };

  const handleItemSelect = (item: MenuItem) => {
    console.log('🎯 handleItemSelect - item:', item);

    setEditingItem(null);
    setSelectedItem(item);

    if (item.isComposedMenu && item.composedMenuConfig) {
      console.log('🎯 handleItemSelect - composedMenuConfig:', item.composedMenuConfig);

      setIsMenuConfig(true);
      setCurrentMenu(item);

      const firstStepId = item.composedMenuConfig.steps[0]?.id || '';
      console.log('🎯 handleItemSelect - firstStepId:', firstStepId);

      setActiveMenuStep(firstStepId);
      setMenuConfig({});

      setTimeout(() => {
        console.log('🔄 Force re-render after menu config');
      }, 100);
    }
  };

  const handleAddToCart = (item: MenuItem, quantity: number, note: string) => {
    if (isMenuConfig && currentMenu && activeMenuStep) {
      setSelectedItem(null);
    } else {
      addItem({
        nom: item.nom,
        prix: item.prix,
        quantite: quantity,
        note
      });
      setSelectedItem(null);
    }
  };

  const handleMenuStepChange = (step: string) => {
    setActiveMenuStep(step);
    setSelectedItem(null);
  };

  const handleReturnToCategories = () => {
    setIsMenuConfig(false);
    setCurrentMenu(null);
    setActiveMenuStep('');
    setMenuConfig({});
    setSelectedItem(null);
  };

  const handleEditItem = (item: {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string
  }) => {
    setSelectedItem(null);

    const isSent = currentOrder?.items?.some((orderItem, index) =>
        `${currentOrder.id}-${index}` === item.id
    ) || false;

    setEditingItem({
      ...item,
      isSent
    });
  };

  const handleUpdateItem = (id: string, quantity: number, note: string) => {
    if (id.includes('-') && currentOrder && id.startsWith(currentOrder.id)) {
      console.log('🔄 Mise à jour article serveur:', { id, quantity, note });
    } else {
      updateItem(id, quantity, note);
    }
    setEditingItem(null);
  };

  const handleCancelEditingItem = (id: string) => {
    if (id.includes('-') && currentOrder && id.startsWith(currentOrder.id)) {
      console.log('🗑️ Suppression article serveur:', id);
    } else {
      removeItem(id);
    }
    setEditingItem(null);
  };

  const getRetourPath = () => {
    return `/${restaurantSlug}/zones`;
  };

  const getHeaderInfo = () => {
    if (tableId?.startsWith('CMD')) {
      return {
        zone: 'Emporter',
        table: '',
        numero: currentOrderNumber,
        fullInfo: 'Emporter'
      };
    }

    // Extraire le numéro de table du tableId (ex: "T2" -> "2")
    const tableNumber = tableId?.replace(/^T/, '') || '';
    const tableInfo = tableNumber ? `Table ${tableNumber}` : '';
    return {
      zone: 'Table',
      table: tableInfo,
      numero: currentOrderNumber,
      fullInfo: tableInfo
    };
  };

  // Loading states
  if (categoriesLoading || itemsLoading) {
    return (
        <div className="flex h-screen theme-bg-gradient items-center justify-center">
          <div className="text-xl theme-foreground-text">Chargement du menu...</div>
        </div>
    );
  }

  const headerInfo = getHeaderInfo();
  const pendingItemsCount = items.filter(item => !item.envoye).length;
  const hasActiveOrder = currentOrder && currentOrder.items && currentOrder.items.length > 0;

  return (
      <div className="flex flex-col h-screen theme-bg-gradient overflow-hidden">
        {/* Top navbar */}
        <div className="theme-header-bg h-15 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
                onClick={() => navigate(getRetourPath())}
                className="theme-button-secondary px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="flex items-center gap-2 theme-secondary-text">
              <span>{headerInfo.zone}</span>
              {headerInfo.table && (
                  <>
                    <span>•</span>
                    <span>{headerInfo.table}</span>
                  </>
              )}
              <span>•</span>
              <span>Commande {headerInfo.numero}</span>
            </div>
          </div>

          {/* 🆕 Bouton Terminer la commande */}
          <button
              onClick={() => setShowTerminateModal(true)}
              disabled={!hasActiveOrder && pendingItemsCount === 0}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  (hasActiveOrder || pendingItemsCount > 0)
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            Terminer la commande
          </button>
        </div>

        {/* Affichage des erreurs */}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-6 mt-2 rounded flex-shrink-0">
              {error}
            </div>
        )}

        {/* Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Catégories */}
          <CategoryNav
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              isMenuConfig={isMenuConfig}
              menuSteps={currentMenu?.composedMenuConfig?.steps || []}
              activeMenuStep={activeMenuStep}
              onMenuStepChange={handleMenuStepChange}
              onReturnToCategories={handleReturnToCategories}
          />

          {/* Catalogue */}
          <ArticleGrid
              items={filteredItems}
              onItemSelect={handleItemSelect}
          />

          {/* Ajustement */}
          <AdjustmentPanel
              selectedItem={selectedItem}
              onAddToCart={handleAddToCart}
              editingItem={editingItem}
              onUpdateItem={handleUpdateItem}
              onCancelItem={handleCancelEditingItem}
          />

          {/* 🔄 Panier avec fonction d'envoi séparée */}
          <CartList
              onEditItem={handleEditItem}
              onValidateOrder={handleSendItems}
              isValidating={isAddingItems}
              currentOrder={currentOrder}
              isLoadingOrder={isLoadingOrder}
          />
        </div>

        {/* 🆕 Modal de confirmation */}
        <TerminateOrderModal
            isOpen={showTerminateModal}
            onClose={() => setShowTerminateModal(false)}
            onConfirm={handleTerminateOrder}
            isLoading={isTerminating}
            orderNumber={currentOrderNumber}
            tableInfo={headerInfo.fullInfo}
        />
      </div>
  );
};

export default Commande;