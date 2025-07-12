import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CategoryNav } from '../components/CategoryNav';
import { ArticleGrid } from '../components/ArticleGrid';
import { AdjustmentPanel } from '../components/AdjustmentPanel';
import { CartList } from '../components/CartList';
import { useCartStore } from '../stores/cartStore';
import { categories, menuItems, tablesInterieur, tablesTerrasse } from '../data/mockData';
import type {MenuItem, MenuConfig} from '../types';

const Commande = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { addItem, updateItem, removeItem, loadExistingItems } = useCartStore();

  const [activeCategory, setActiveCategory] = useState('entrees');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isMenuConfig, setIsMenuConfig] = useState(false);
  const [activeMenuStep, setActiveMenuStep] = useState<string>('');
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);
  const [menuConfig, setMenuConfig] = useState<MenuConfig>({});
  const [editingItem, setEditingItem] = useState<{ id: string; nom: string; prix: number; quantite: number; note?: string } | null>(null);

  // Trouver la table
  const table = useMemo(() => {
    const allTables = [...tablesInterieur, ...tablesTerrasse];
    return allTables.find(t => t.id === tableId);
  }, [tableId]);

  // Charger les articles existants si la table est occupée
  useEffect(() => {
    if (tableId && table?.statut === 'OCCUPEE') {
      loadExistingItems(tableId);
    }
  }, [tableId, table?.statut, loadExistingItems]);

  // Filtrer les articles par catégorie
  const filteredItems = useMemo(() => {
    if (isMenuConfig && activeMenuStep) {
      // Filtrer selon l'étape du menu
      const stepToCategory: { [key: string]: string } = {
        'Sandwich': 'plats',
        'Entrée': 'entrees',
        'Plat': 'plats',
        'Dessert': 'desserts',
        'Boisson': 'boissons',
        'Accompagnement': 'entrees'
      };
      const categoryForStep = stepToCategory[activeMenuStep] || 'entrees';
      return menuItems.filter(item => item.categorie === categoryForStep && !item.isMenu);
    }
    return menuItems.filter(item => item.categorie === activeCategory);
  }, [activeCategory, isMenuConfig, activeMenuStep]);

  const handleItemSelect = (item: MenuItem) => {
    if (item.isMenu && item.menuSteps) {
      // Commencer la configuration du menu
      setIsMenuConfig(true);
      setCurrentMenu(item);
      setActiveMenuStep(item.menuSteps[0]);
      setMenuConfig({});
      setSelectedItem(null);
    } else {
      setSelectedItem(item);
    }
  };

  const handleAddToCart = (item: MenuItem, quantity: number, note: string) => {
    if (isMenuConfig && currentMenu && activeMenuStep) {
      // Ajouter à la configuration du menu
      const newMenuConfig = {
        ...menuConfig,
        [activeMenuStep.toLowerCase()]: item.nom
      };
      setMenuConfig(newMenuConfig);

      // Passer à l'étape suivante ou finaliser
      const currentStepIndex = currentMenu.menuSteps!.indexOf(activeMenuStep);
      if (currentStepIndex < currentMenu.menuSteps!.length - 1) {
        setActiveMenuStep(currentMenu.menuSteps![currentStepIndex + 1]);
      } else {
        // Menu complet, ajouter au panier
        addItem({
          nom: currentMenu.nom,
          prix: currentMenu.prix,
          quantite: quantity,
          note,
          menuConfig: newMenuConfig
        });
        
        // Réinitialiser
        setIsMenuConfig(false);
        setCurrentMenu(null);
        setActiveMenuStep('');
        setMenuConfig({});
      }
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
    setEditingItem(item);
    setSelectedItem(null);
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
    if (tableId?.startsWith('T')) {
      const tableNumber = parseInt(tableId.substring(1));
      return tableNumber <= 8 ? '/zones/interieur' : '/zones/terrasse';
    }
    return '/zones/emporter';
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
      zone: table?.zone === 'interieur' ? 'Intérieur' : 'Terrasse',
      table: `Table ${table?.numero}`,
      numero: '#1247'
    };
  };

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

          {isMenuConfig && currentMenu && (
            <button
              onClick={handleReturnToCategories}
              className="theme-button-secondary px-3 py-1 rounded text-sm"
            >
              ← Catégories
            </button>
          )}
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
          menuSteps={currentMenu?.menuSteps}
          activeMenuStep={activeMenuStep}
          onMenuStepChange={handleMenuStepChange}
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