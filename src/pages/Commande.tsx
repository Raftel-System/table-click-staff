import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CategoryNav } from '../components/CategoryNav';
import { ArticleGrid } from '../components/ArticleGrid';
import { AdjustmentPanel } from '../components/AdjustmentPanel';
import { CartList } from '../components/CartList';
import { useCartStore } from '../stores/cartStore';
import { useMenuCategories } from '../hooks/useMenuCategories';
import { useMenuItems } from '../hooks/useMenuItems';
import { useOrder } from '../hooks/useOrder';
import type { MenuItem, MenuConfig } from '../types';

const Commande = () => {
  const { restaurantSlug, tableId } = useParams<{ restaurantSlug: string; tableId: string }>();
  const navigate = useNavigate();
  const { addItem, updateItem, removeItem, items, validateOrder } = useCartStore();

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
    isSent?: boolean; // 🆕 Nouveau champ
  } | null>(null);

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

  // Fonction pour valider et envoyer la commande
  const handleValidateOrder = async () => {
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

  // 🆕 Fonction mise à jour pour gérer les articles envoyés
  const handleEditItem = (item: {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string
  }) => {
    setSelectedItem(null);

    // 🆕 Déterminer si l'article est envoyé en vérifiant s'il fait partie de currentOrder
    const isSent = currentOrder?.items?.some((orderItem, index) =>
        `${currentOrder.id}-${index}` === item.id
    ) || false;

    setEditingItem({
      ...item,
      isSent
    });
  };

  const handleUpdateItem = (id: string, quantity: number, note: string) => {
    // Vérifier si c'est un article du cart local ou de la commande serveur
    if (id.includes('-') && currentOrder && id.startsWith(currentOrder.id)) {
      // Article de la commande serveur - TODO: implémenter la mise à jour côté serveur
      console.log('🔄 Mise à jour article serveur:', { id, quantity, note });
      // Pour l'instant, on peut juste fermer le mode édition
    } else {
      // Article du cart local
      updateItem(id, quantity, note);
    }
    setEditingItem(null);
  };

  const handleCancelEditingItem = (id: string) => {
    // Vérifier si c'est un article du cart local ou de la commande serveur
    if (id.includes('-') && currentOrder && id.startsWith(currentOrder.id)) {
      // Article de la commande serveur - TODO: implémenter la suppression côté serveur
      console.log('🗑️ Suppression article serveur:', id);
      // Pour l'instant, on peut juste fermer le mode édition
    } else {
      // Article du cart local
      removeItem(id);
    }
    setEditingItem(null);
  };

  const getRetourPath = () => {
    if (tableId?.startsWith('CMD')) {
      return `/${restaurantSlug}/zones`;
    }
    return `/${restaurantSlug}/zones`;
  };

  const getHeaderInfo = () => {
    if (tableId?.startsWith('CMD')) {
      return {
        zone: 'Emporter',
        table: '',
        numero: currentOrderNumber
      };
    }

    return {
      zone: 'Table',
      table: tableId ? `Table ${tableId}` : '',
      numero: currentOrderNumber
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

  return (
      <div className="flex flex-col h-screen theme-bg-gradient">
        {/* Top navbar */}
        <div className="theme-header-bg h-15 flex items-center justify-between px-6">
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

          {/* Bouton Terminer avec loading state */}
          <button
              onClick={handleValidateOrder}
              disabled={pendingItemsCount === 0 || isAddingItems}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  pendingItemsCount > 0 && !isAddingItems
                      ? 'theme-button-primary'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isAddingItems ? 'Envoi...' : `Envoyer (${pendingItemsCount})`}
          </button>
        </div>

        {/* Affichage des erreurs */}
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-6 mt-2 rounded">
              {error}
            </div>
        )}

        {/* Content */}
        <div className="flex flex-1">
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

          {/* Panier avec nouveau système */}
          <CartList
              onEditItem={handleEditItem}
              onValidateOrder={handleValidateOrder}
              isValidating={isAddingItems}
              currentOrder={currentOrder}
              isLoadingOrder={isLoadingOrder}
          />
        </div>
      </div>
  );
};

export default Commande;