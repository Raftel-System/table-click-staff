import { useState, useEffect } from 'react';
import { Plus, Minus, StickyNote } from 'lucide-react';
import type {MenuItem} from '../types';

interface AdjustmentPanelProps {
  selectedItem: MenuItem | null;
  onAddToCart: (item: MenuItem, quantity: number, note: string) => void;
  editingItem?: { id: string; nom: string; prix: number; quantite: number; note?: string } | null;
  onUpdateItem?: (id: string, quantity: number, note: string) => void;
  onCancelItem?: (id: string) => void;
}

export const AdjustmentPanel = ({ 
  selectedItem, 
  onAddToCart, 
  editingItem, 
  onUpdateItem, 
  onCancelItem 
}: AdjustmentPanelProps) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  // Utiliser les valeurs de l'item en cours d'édition
  const currentItem = editingItem || selectedItem;
  const isEditing = !!editingItem;

  // Mettre à jour les valeurs quand on change d'item
  useEffect(() => {
    if (editingItem) {
      setQuantity(editingItem.quantite);
      setNote(editingItem.note || '');
      setShowNote(!!editingItem.note);
    } else if (selectedItem) {
      setQuantity(1);
      setNote('');
      setShowNote(false);
    }
  }, [editingItem, selectedItem]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (isEditing && editingItem && onUpdateItem) {
      onUpdateItem(editingItem.id, quantity, note);
    } else if (selectedItem) {
      onAddToCart(selectedItem, quantity, note);
    }
    setQuantity(1);
    setNote('');
    setShowNote(false);
  };

  const handleCancelItem = () => {
    if (isEditing && editingItem && onCancelItem) {
      onCancelItem(editingItem.id);
    }
  };

  if (!currentItem) {
    return (
      <div className="w-24 theme-header-bg p-4 flex flex-col items-center justify-center">
        <div className="text-center theme-secondary-text text-xs mb-2">
          Ajust.
        </div>
        <div className="text-center theme-secondary-text text-xs">
          Sélectionnez un article
        </div>
      </div>
    );
  }

  return (
    <div className="w-24 theme-header-bg p-4 flex flex-col gap-4">
      {/* Titre section */}
      <div className="text-center">
        <div className="theme-foreground-text text-xs font-bold mb-2">
          Ajust.
        </div>
      </div>

      {/* Article sélectionné */}
      <div className="text-center">
        <div className="theme-foreground-text text-xs font-medium line-clamp-2 mb-2">
          {currentItem.nom}
        </div>
        <div className="theme-primary-text font-semibold text-sm">
          {currentItem.prix.toFixed(2)}€
        </div>
      </div>

      {/* Contrôles quantité */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => handleQuantityChange(1)}
          className="theme-button-primary w-8 h-8 rounded-full flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
        
        <div className="theme-foreground-text font-bold text-lg">
          {quantity}
        </div>
        
        <button
          onClick={() => handleQuantityChange(-1)}
          className="theme-button-secondary w-8 h-8 rounded-full flex items-center justify-center"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Note */}
      <button
        onClick={() => setShowNote(!showNote)}
        className={`theme-category-button p-2 rounded-lg flex items-center justify-center ${showNote ? 'active' : ''}`}
      >
        <StickyNote className="w-4 h-4" />
      </button>

      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note..."
          className="theme-input text-xs h-16 resize-none"
        />
      )}

      {/* Boutons d'action */}
      <button
        onClick={handleAddToCart}
        className="theme-button-primary py-2 px-3 rounded-lg text-xs font-semibold"
      >
        {isEditing ? 'Modifier' : 'Ajouter'}
      </button>

      {isEditing && (
        <button
          onClick={handleCancelItem}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors"
        >
          Annuler
        </button>
      )}
    </div>
  );
};