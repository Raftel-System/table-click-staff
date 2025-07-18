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
import type { MenuItem, MenuConfig } from '../types';

const Commande = () => {
  const { restaurantSlug, tableId } = useParams<{ restaurantSlug: string; tableId: string }>();
  const navigate = useNavigate();
  const { addItem, updateItem, removeItem, loadExistingItems } = useCartStore();

  // Firebase hooks
  const { categories, loading: categoriesLoading } = useMenuCategories(restaurantSlug || '');
  const { menuItems, loading: itemsLoading } = useMenuItems(restaurantSlug || '');

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

  // Filtrer les articles par catégorie
  const filteredItems = useMemo(() => {
    if (isMenuConfig && activeMenuStep) {
      // Pour menu composé, afficher les options de l'étape actuelle
      // TODO: Logique pour menu composé
      return [];
    }
    return menuItems.filter(item => item.categorieId === activeCategory);
  }, [menuItems, activeCategory, isMenuConfig, activeMenuStep]);

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
        numero: tableId.replace('CMD-', '#')
      };
    }

    return {
      zone: 'Table',
      table: tableId ? `Table ${tableId}` : '',
      numero: '#1247'
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

          <button className="theme-button-primary px-6 py-2 rounded-lg">
            Terminer
          </button>
        </div>

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

          {/* Panier */}
          <CartList onEditItem={handleEditItem} />
        </div>
      </div>
  );
};

export default Commande;