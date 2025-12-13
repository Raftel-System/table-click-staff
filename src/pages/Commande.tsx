import {useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {AlertTriangle, ArrowLeft} from 'lucide-react';
import {CategoryNav} from '../components/CategoryNav';
import {ArticleGrid} from '../components/ArticleGrid';
import {AdjustmentPanel} from '../components/AdjustmentPanel';
import {CartList} from '../components/CartList';
import {useCartStore} from '../stores/cartStore';
import {useMenuCategories} from '../hooks/useMenuCategories';
import {useMenuItems} from '../hooks/useMenuItems';
import {useOrder} from '../hooks/useOrder';
import {useZones} from '@/hooks/useZones';
import type {MenuItem} from '@/types';
import {MenuStepOptionsPanel} from '@/components/ui/MenuStepOptionsPanel';

// Types pour la gestion des menus composés
interface MenuStepSelections {
  [stepId: string]: string[]; // Array d'IDs des options sélectionnées
}

// Composant Modal de confirmation
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
  const { restaurantSlug, zoneId, tableId } = useParams<{
    restaurantSlug: string;
    zoneId: string;
    tableId: string;
  }>();
  const navigate = useNavigate();
  const { addItem, updateItem, removeItem, items, validateOrder, clearCart } = useCartStore();

  // Firebase hooks
  const { categories, loading: categoriesLoading } = useMenuCategories(restaurantSlug || '');
  const { menuItems, loading: itemsLoading } = useMenuItems(restaurantSlug || '');
  const { zones, loading: zonesLoading } = useZones(restaurantSlug || '');

  // États pour la table et zone trouvées
  const [tableInfo, setTableInfo] = useState<{table: any, zone: any} | null>(null);
  const [tableSearchLoading, setTableSearchLoading] = useState(true);

  // États pour la gestion normale
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // États pour la gestion des menus composés
  const [isMenuConfig, setIsMenuConfig] = useState(false);
  const [activeMenuStep, setActiveMenuStep] = useState<string>('');
  const [currentMenu, setCurrentMenu] = useState<MenuItem | null>(null);
  const [menuStepSelections, setMenuStepSelections] = useState<MenuStepSelections>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [editingItem, setEditingItem] = useState<{
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string;
    isSent?: boolean;
  } | null>(null);

  // États pour le modal de confirmation
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const currentZone = zones.find(zone => zone.id === zoneId);
  const serviceType = currentZone?.serviceType || 'DINING';

  // Effet pour trouver la table et sa zone
  useEffect(() => {
    const findTableAndZone = async () => {
      if (!restaurantSlug || !tableId || tableId.startsWith('CMD') || zones.length === 0) {
        setTableSearchLoading(false);
        return;
      }

      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');

        const tablesRef = collection(db, `restaurants/${restaurantSlug}/tables`);
        const tableQuery = query(tablesRef, where('active', '==', true));
        const tablesSnapshot = await getDocs(tableQuery);
        let foundTable: { zoneId?: any; id?: string; } | null = null;

        tablesSnapshot.forEach((doc) => {
          if (doc.id === tableId) {
            foundTable = { id: doc.id, ...doc.data() };
          }
        });

        if (foundTable) {
          const correspondingZone = zones.find(z => z.id === foundTable?.zoneId);
          setTableInfo({ table: foundTable, zone: correspondingZone });
        }
      } catch (error) {
        console.error('❌ Erreur lors de la recherche de table:', error);
      }

      setTableSearchLoading(false);
    };

    findTableAndZone();
  }, [restaurantSlug, tableId, zones]);


  // Hook pour la gestion des commandes avec temps réel
  const {
    currentOrder,
    currentOrderNumber,
    addItemsToCurrentOrder,
    updateOrderStatus,
    clearCurrentSession,
    deleteOrderItem,
    isLoadingOrder,
    isAddingItems,
    error,
    clearError
  } = useOrder(restaurantSlug || '', tableId, serviceType, zoneId);

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

  // Filtrer les articles par catégorie (seulement si pas en mode menu config)
  const filteredItems = useMemo(() => {
    if (isMenuConfig) {
      return []; // Pas d'articles normaux en mode config
    }
    return menuItems.filter(item => item.categorieId === activeCategory);
  }, [menuItems, activeCategory, isMenuConfig]);

  // Calculer le step actuel et les sélections
  const currentStep = useMemo(() => {
    if (!currentMenu?.composedMenuConfig?.steps || !activeMenuStep) {
      return null;
    }
    return currentMenu.composedMenuConfig.steps.find(step => step.id === activeMenuStep) || null;
  }, [currentMenu, activeMenuStep]);

  const currentSelections = menuStepSelections[activeMenuStep] || [];

  // Calculer le prix total du menu en cours de configuration
  const totalMenuPrice = useMemo(() => {
    if (!currentMenu?.composedMenuConfig) return 0;

    const basePrice = currentMenu.composedMenuConfig.basePrice;
    const adjustments = Object.entries(menuStepSelections).reduce((total, [stepId, selectedIds]) => {
      const step = currentMenu.composedMenuConfig?.steps.find(s => s.id === stepId);
      if (!step) return total;

      return total + selectedIds.reduce((stepTotal, optionId) => {
        const option = step.options.find(o => o.id === optionId);
        return stepTotal + (option?.priceAdjustment || 0);
      }, 0);
    }, 0);

    return basePrice + adjustments;
  }, [currentMenu, menuStepSelections]);

  const currentAdjustment = useMemo(() => {
    if (!currentStep) return 0;
    return currentSelections.reduce((total, optionId) => {
      const option = currentStep.options.find(o => o.id === optionId);
      return total + (option?.priceAdjustment || 0);
    }, 0);
  }, [currentStep, currentSelections]);

  // Fonctions pour gérer la sélection d'articles normaux
  const handleItemSelect = (item: MenuItem) => {
    setEditingItem(null);
    setSelectedItem(item);

    if (item.isComposedMenu && item.composedMenuConfig) {
      setIsMenuConfig(true);
      setCurrentMenu(item);
      setMenuStepSelections({});
      setCurrentStepIndex(0);

      const firstStepId = item.composedMenuConfig.steps[0]?.id || '';
      setActiveMenuStep(firstStepId);
    }
  };

  const handleAddToCart = (item: MenuItem, quantity: number, note: string) => {
    addItem({
      nom: item.nom,
      prix: item.prix,
      quantite: quantity,
      note
    });
    setSelectedItem(null);
  };

  // Fonctions pour gérer la navigation des menus composés
  const handleMenuStepChange = (stepId: string) => {
    const stepIndex = currentMenu?.composedMenuConfig?.steps.findIndex(s => s.id === stepId) || 0;
    setCurrentStepIndex(stepIndex);
    setActiveMenuStep(stepId);
    setSelectedItem(null);
  };

  const handleToggleOption = (optionId: string) => {
    setMenuStepSelections(prev => {
      const currentSelections = prev[activeMenuStep] || [];
      const isSelected = currentSelections.includes(optionId);

      if (isSelected) {
        // Retirer la sélection
        return {
          ...prev,
          [activeMenuStep]: currentSelections.filter(id => id !== optionId)
        };
      } else {
        // Ajouter la sélection
        const newSelections = [...currentSelections, optionId];
        return {
          ...prev,
          [activeMenuStep]: newSelections
        };
      }
    });
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      const newStepId = currentMenu?.composedMenuConfig?.steps[newIndex]?.id;
      if (newStepId) {
        setCurrentStepIndex(newIndex);
        setActiveMenuStep(newStepId);
      }
    }
  };

  const handleNextStep = () => {
    if (currentMenu?.composedMenuConfig?.steps && currentStepIndex < currentMenu.composedMenuConfig.steps.length - 1) {
      const newIndex = currentStepIndex + 1;
      const newStepId = currentMenu.composedMenuConfig.steps[newIndex]?.id;
      if (newStepId) {
        setCurrentStepIndex(newIndex);
        setActiveMenuStep(newStepId);
      }
    }
  };

  const handleValidateMenu = () => {
    if (!currentMenu) return;

    // Créer menuConfig avec les NOMS au lieu des IDs
    const menuConfigWithNames: { [stepId: string]: string[] } = {};

    Object.entries(menuStepSelections).forEach(([stepId, selectedIds]) => {
      const step = currentMenu.composedMenuConfig?.steps.find(s => s.id === stepId);
      if (step) {
        menuConfigWithNames[stepId] = selectedIds
            .map(optionId => step.options.find(o => o.id === optionId)?.nom)
            .filter(Boolean) as string[];
      }
    });

    // Ajouter au panier - la quantité et la note seront gérées par l'AdjustmentPanel
    // Cette fonction n'est appelée que par le bouton "Valider" de l'AdjustmentPanel
    // qui a déjà la quantité et la note
    handleReturnToCategories();
  };

  const handleReturnToCategories = () => {
    setIsMenuConfig(false);
    setCurrentMenu(null);
    setActiveMenuStep('');
    setMenuStepSelections({});
    setCurrentStepIndex(0);
    setSelectedItem(null);
  };

  // Validation pour les steps
  const canGoNext = currentStep ?
      menuStepSelections[activeMenuStep]?.length >= currentStep.minSelections : false;

  const canValidateMenu = useMemo(() => {
    if (!currentMenu?.composedMenuConfig?.steps) return false;

    return currentMenu.composedMenuConfig.steps.every(step => {
      const selections = menuStepSelections[step.id] || [];
      return selections.length >= step.minSelections && selections.length <= step.maxSelections;
    });
  }, [currentMenu, menuStepSelections]);

  // Autres fonctions (inchangées)
  const handleSendItems = async () => {
    if (!currentOrder) {
      console.error('❌ Commande non initialisée, tentative de réinitialisation...');
      return;
    }

    const pendingItems = items.filter(item => !item.envoye);
    if (pendingItems.length === 0) return;

    const orderItems = pendingItems.map(item => ({
      id: item.id,
      nom: item.nom,
      prix: item.prix,
      quantite: item.quantite,
      note: item.note,
      menuConfig: item.menuConfig
    }));

    try {
      const success = await addItemsToCurrentOrder(orderItems);
      if (success) {
        validateOrder();
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la commande:', error);
    }
  };

  const handleTerminateOrder = async () => {
    if (!currentOrder) return;
    setIsTerminating(true);

    try {
      const pendingItems = items.filter(item => !item.envoye);
      if (pendingItems.length > 0) {
        await handleSendItems();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await updateOrderStatus('served');
      await clearCurrentSession();
      clearCart();
      navigate(`/${restaurantSlug}/zones`);
    } catch (error) {
      console.error('❌ Erreur lors de la finalisation:', error);
    } finally {
      setIsTerminating(false);
      setShowTerminateModal(false);
    }
  };

  const handleEditItem = (item: {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string
  }) => {
    setSelectedItem(null);
    const isSent = currentOrder?.items?.some((_, index) =>
        `${currentOrder.id}-${index}` === item.id
    ) || false;
    setEditingItem({ ...item, isSent });
  };

  const handleUpdateItem = (id: string, quantity: number, note: string) => {
    if (id.includes('-') && currentOrder && id.startsWith(currentOrder.id)) {
      console.log('🔄 Mise à jour article serveur:', { id, quantity, note });
    } else {
      updateItem(id, quantity, note);
    }
    setEditingItem(null);
  };

  const handleCancelEditingItem = async (id: string) => {
    if (id.includes('-') && currentOrder && id.startsWith(currentOrder.id)) {
      const itemIndex = parseInt(id.split('-').pop() || '0');
      const success = await deleteOrderItem(itemIndex);
      if (success) {
        console.log('✅ Article supprimé avec succès');
      }
    } else {
      removeItem(id);
    }
    setEditingItem(null);
  };

  const getRetourPath = () => `/${restaurantSlug}/zones`;

  const getHeaderInfo = () => {
    const currentZone = zones.find(zone => zone.id === zoneId);
    if (!currentZone) {
      return {
        zone: 'Zone inconnue',
        table: null,
        numero: currentOrderNumber,
        fullInfo: 'Zone inconnue',
      };
    }

    if (currentZone.serviceType === 'TAKEAWAY') {
      return {
        zone: currentZone?.nom,
        table: null,
        numero: currentOrderNumber,
        fullInfo: `${currentZone?.nom}`,
      };
    }

    const zoneName = tableInfo?.zone?.nom || 'Zone inconnue';
    const tableNum = tableInfo?.table?.numero || 'inconnue';
    const tableInfoStr = `Table ${tableNum}`;

    return {
      zone: zoneName,
      table: tableInfoStr,
      numero: currentOrderNumber,
      fullInfo: `${zoneName} • ${tableInfoStr}`,
    };
  };

  // Loading states
  if (categoriesLoading || itemsLoading || zonesLoading || tableSearchLoading) {
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
              <span>{headerInfo.numero}</span>
            </div>
          </div>

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

          {/* Panel central - Articles normaux OU options de menu */}
          {isMenuConfig ? (
              <MenuStepOptionsPanel
                  currentStep={currentStep}
                  selections={currentSelections}
                  onToggleOption={handleToggleOption}
                  basePrice={currentMenu?.composedMenuConfig?.basePrice || 0}
                  totalAdjustment={currentAdjustment}
              />
          ) : (
              <ArticleGrid
                  items={filteredItems}
                  onItemSelect={handleItemSelect}
              />
          )}

          {/* 🆕 Ajustement Panel - Toujours affiché avec support des menus composés */}
          <AdjustmentPanel
              selectedItem={isMenuConfig && currentMenu ? { ...currentMenu, prix: totalMenuPrice } : selectedItem}
              onAddToCart={(item, quantity, note) => {
                if (isMenuConfig && currentMenu) {
                  // Menu composé : créer menuConfig et ajouter au panier
                  const menuConfigWithNames: { [stepId: string]: string[] } = {};

                  Object.entries(menuStepSelections).forEach(([stepId, selectedIds]) => {
                    const step = currentMenu.composedMenuConfig?.steps.find(s => s.id === stepId);
                    if (step) {
                      menuConfigWithNames[stepId] = selectedIds
                          .map(optionId => step.options.find(o => o.id === optionId)?.nom)
                          .filter(Boolean) as string[];
                    }
                  });

                  addItem({
                    nom: currentMenu.nom,
                    prix: totalMenuPrice,
                    quantite: quantity,
                    note: note,
                    menuConfig: menuConfigWithNames
                  });

                  handleReturnToCategories();
                } else {
                  // Article normal
                  handleAddToCart(item, quantity, note);
                }
              }}
              editingItem={editingItem}
              onUpdateItem={handleUpdateItem}
              onCancelItem={handleCancelEditingItem}
              isMenuConfig={isMenuConfig}
              currentStepIndex={currentStepIndex}
              totalSteps={currentMenu?.composedMenuConfig?.steps.length || 0}
              onPreviousStep={handlePreviousStep}
              onNextStep={handleNextStep}
              onValidateMenu={handleValidateMenu}
              canGoNext={canGoNext}
              canValidate={canValidateMenu}
          />

          {/* Panier */}
          <CartList
              onEditItem={handleEditItem}
              onValidateOrder={handleSendItems}
              isValidating={isAddingItems}
              currentOrder={currentOrder}
              isLoadingOrder={isLoadingOrder}
          />
        </div>

        {/* Modal de confirmation */}
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