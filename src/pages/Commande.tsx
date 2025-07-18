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
  const zoneId = isEmporter ? 'emporter' : 'terrasse'; // TODO: récupérer vraie zoneId

  // 🆕 Hook pour la gestion des commandes avec temps réel
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
  const [editingItem, setEditingItem] = useState<{ id: string; nom: string; prix: number; quantite: number; note?: string } | null>(null);

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
      // Pour menu composé, afficher les options de l'étape actuelle
      // TODO: Logique pour menu composé
      return [];
    }
    return menuItems.filter(item => item.categorieId === activeCategory);
  }, [menuItems, activeCategory, isMenuConfig, activeMenuStep]);

  // 🆕 Fonction pour valider et envoyer la commande
  const handleValidateOrder = async () => {
    const pendingItems = items.filter(item => !item.envoye);

    if (pendingItems.length === 0) {
      console.log("Aucun article à envoyer !");
      return;
    }

    // Préparer les items pour le service
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

      // Ajouter les items à la commande existante
      const success = await addItemsToCurrentOrder(orderItems);

      if (success) {
        console.log('✅ Items ajoutés avec succès à la commande');

        // Marquer les items comme envoyés dans le cart local
        validateOrder();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la commande:', error);
    }
  };

  const handleItemSelect = (item: MenuItem) => {
    console.log('🎯 handleItemSelect - item:', item);

    // Toujours réinitialiser l'état d'édition et sélectionner le nouvel article
    setEditingItem(null);
    setSelectedItem(item);

    if (item.isComposedMenu && item.composedMenuConfig) {
      console.log('🎯 handleItemSelect - composedMenuConfig:', item.composedMenuConfig);

      // Commencer la configuration du menu composé
      setIsMenuConfig(true);
      setCurrentMenu(item);

      const firstStepId = item.composedMenuConfig.steps[0]?.id || '';
      console.log('🎯 handleItemSelect - firstStepId:', firstStepId);

      setActiveMenuStep(firstStepId);
      setMenuConfig({});

      // Force un re-render pour déclencher filteredItems
      setTimeout(() => {
        console.log('🔄 Force re-render after menu config');
      }, 100);
    }
  };

  const handleAddToCart = (item: MenuItem, quantity: number, note: string) => {
    if (isMenuConfig && currentMenu && activeMenuStep) {
      // TODO: Logique pour menu composé
      setSelectedItem(null);
    } else {
      // Article normal
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

  const handleEditItem = (item: { id: string; nom: string; prix: number; quantite: number; note?: string }) => {
    // Basculer vers le mode édition et effacer la sélection normale
    setSelectedItem(null);
    setEditingItem(item);
  };

  const handleUpdateItem = (id: string, quantity: number, note: string) => {
    updateItem(id, quantity, note);
    setEditingItem(null);
  };

  const handleCancelEditingItem = (id: string) => {
    removeItem(id);
    setEditingItem(null);
  };

  const getRetourPath = () => {
    if (tableId?.startsWith('CMD')) {
      // Commande emporter - retour vers zones
      return `/${restaurantSlug}/zones`;
    }
    // Pour les tables, retour vers zones (on pourrait améliorer pour retourner vers la zone spécifique)
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

          {/* 🆕 Bouton Terminer avec loading state */}
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

        {/* 🆕 Affichage des erreurs */}
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

          {/* 🆕 Panier avec nouveau système */}
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