import { useState, useEffect } from 'react';
import { Plus, Minus, StickyNote, X, AlertTriangle } from 'lucide-react';
import type {MenuItem} from '../types';

interface AdjustmentPanelProps {
  selectedItem: MenuItem | null;
  onAddToCart: (item: MenuItem, quantity: number, note: string) => void;
  editingItem?: {
    id: string;
    nom: string;
    prix: number;
    quantite: number;
    note?: string;
    isSent?: boolean; // 🆕 Indique si l'article est déjà envoyé
  } | null;
  onUpdateItem?: (id: string, quantity: number, note: string) => void;
  onCancelItem?: (id: string) => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  action: 'modify' | 'delete';
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, action }: ConfirmationModalProps) => {
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPinCode('');
      setPinError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actionText = action === 'modify' ? 'modifier' : 'supprimer';
  const actionTextCapitalized = action === 'modify' ? 'Modifier' : 'Supprimer';
  const buttonColor = action === 'modify' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700';

  const handleConfirm = () => {
    if (action === 'delete') {
      // Vérifier le code PIN pour la suppression
      if (pinCode !== '0000') {
        setPinError(true);
        return;
      }
    }
    onConfirm();
    setPinCode('');
    setPinError(false);
  };

  return (
      <div className="fixed inset-0 theme-backdrop flex items-center justify-center z-50">
        <div className="theme-modal-bg rounded-lg p-6 max-w-md w-full mx-4 theme-shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold theme-foreground-text mb-2">
                {actionTextCapitalized} un article envoyé
              </h3>
              <p className="theme-secondary-text text-sm mb-3">
                Vous êtes sur le point de {actionText} <strong>"{itemName}"</strong> qui a déjà été envoyé en cuisine.
              </p>

              {action === 'delete' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium theme-foreground-text mb-2">
                      Code PIN requis :
                    </label>
                    <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinCode}
                        onChange={(e) => {
                          setPinCode(e.target.value);
                          setPinError(false);
                        }}
                        placeholder="0000"
                        className={`w-full px-3 py-2 border rounded-lg text-center text-lg tracking-widest ${
                            pinError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        autoFocus
                    />
                    {pinError && (
                        <p className="text-red-600 text-sm mt-2">
                          Code PIN incorrect. Veuillez réessayer.
                        </p>
                    )}
                  </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
                onClick={onClose}
                className="flex-1 theme-button-secondary py-2 px-4 rounded-lg"
            >
              Annuler
            </button>
            <button
                onClick={handleConfirm}
                className={`flex-1 ${buttonColor} text-white py-2 px-4 rounded-lg font-semibold transition-colors`}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
  );
};

export const AdjustmentPanel = ({
                                  selectedItem,
                                  onAddToCart,
                                  editingItem,
                                  onUpdateItem,
                                  onCancelItem
                                }: AdjustmentPanelProps) => {
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: 'modify' | 'delete';
  }>({
    isOpen: false,
    action: 'modify'
  });

  // Utiliser les valeurs de l'item en cours d'édition
  const currentItem = editingItem || selectedItem;
  const isEditing = !!editingItem;
  const isSentItem = editingItem?.isSent || false;

  // Mettre à jour les valeurs quand on change d'item
  useEffect(() => {
    if (editingItem) {
      setQuantity(editingItem.quantite);
      setNote(editingItem.note || '');
    } else if (selectedItem) {
      setQuantity(1);
      setNote('');
    }
  }, [editingItem, selectedItem]);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (isEditing && editingItem && onUpdateItem) {
      if (isSentItem) {
        // Article envoyé - demander confirmation
        setConfirmationModal({ isOpen: true, action: 'modify' });
      } else {
        // Article en attente - modification directe
        onUpdateItem(editingItem.id, quantity, note);
        setQuantity(1);
        setNote('');
      }
    } else if (selectedItem) {
      onAddToCart(selectedItem, quantity, note);
      setQuantity(1);
      setNote('');
    }
  };

  const handleCancelItem = () => {
    if (isEditing && editingItem && onCancelItem) {
      if (isSentItem) {
        // Article envoyé - demander confirmation
        setConfirmationModal({ isOpen: true, action: 'delete' });
      } else {
        // Article en attente - suppression directe
        onCancelItem(editingItem.id);
      }
    }
  };

  const handleConfirmAction = () => {
    if (!editingItem) return;

    if (confirmationModal.action === 'modify' && onUpdateItem) {
      onUpdateItem(editingItem.id, quantity, note);
      setQuantity(1);
      setNote('');
    } else if (confirmationModal.action === 'delete' && onCancelItem) {
      onCancelItem(editingItem.id);
    }

    setConfirmationModal({ isOpen: false, action: 'modify' });
  };

  const handleNoteClick = () => {
    setTempNote(note);
    setShowNotePopup(true);
  };

  const handleNoteConfirm = () => {
    setNote(tempNote);
    setShowNotePopup(false);
  };

  const handleNoteCancel = () => {
    setTempNote('');
    setShowNotePopup(false);
  };

  if (!currentItem) {
    return (
        <div className="w-28 theme-header-bg p-4 flex flex-col items-center justify-center">
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
      <>
        <div className="w-28 theme-header-bg p-4 flex flex-col gap-4">
          {/* Titre section */}
          <div className="text-center">
            <div className="theme-foreground-text text-xs font-bold mb-2">
              Ajust.
            </div>
            {/* 🆕 Indicateur si article envoyé */}
            {isSentItem && (
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mb-2">
                  Envoyé
                </div>
            )}
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
              onClick={handleNoteClick}
              className={`theme-category-button p-2 rounded-lg flex items-center justify-center relative ${note ? 'bg-blue-100 border-blue-300' : ''}`}
          >
            <StickyNote className={`w-4 h-4 ${note ? 'text-blue-600' : ''}`} />
            {note && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </button>

          {/* 🆕 Boutons d'action selon le contexte */}
          {isEditing ? (
              <>
                {/* Mode édition - Modifier */}
                <button
                    onClick={handleAddToCart}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isSentItem
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'theme-button-primary'
                    }`}
                >
                  {isSentItem ? 'Modifier*' : 'Modifier'}
                </button>

                {/* Mode édition - Supprimer */}
                <button
                    onClick={handleCancelItem}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors"
                >
                  {isSentItem ? 'Supprimer*' : 'Supprimer'}
                </button>

                {/* 🆕 Note explicative pour articles envoyés */}
                {isSentItem && (
                    <div className="text-xs theme-secondary-text text-center mt-2 leading-tight">
                      * Article déjà envoyé en cuisine
                    </div>
                )}
              </>
          ) : (
              /* Mode normal - Ajouter */
              <button
                  onClick={handleAddToCart}
                  className="theme-button-primary py-2 px-3 rounded-lg text-xs font-semibold"
              >
                Ajouter
              </button>
          )}
        </div>

        {/* Popup de confirmation pour articles envoyés */}
        <ConfirmationModal
            isOpen={confirmationModal.isOpen}
            onClose={() => setConfirmationModal({ isOpen: false, action: 'modify' })}
            onConfirm={handleConfirmAction}
            itemName={editingItem?.nom || ''}
            action={confirmationModal.action}
        />

        {/* Popup pour la note */}
        {showNotePopup && (
            <div className="fixed inset-0 theme-backdrop flex items-center justify-center z-50">
              <div className="theme-modal-bg rounded-lg p-6 max-w-md w-full mx-4 theme-shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold theme-foreground-text">
                    {isEditing && isSentItem ? 'Modifier la note (article envoyé)' : 'Ajouter une note'}
                  </h3>
                  <button
                      onClick={handleNoteCancel}
                      className="theme-secondary-text hover:theme-foreground-text"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="theme-foreground-text font-medium mb-2">
                    {currentItem.nom}
                  </div>
                  {isEditing && isSentItem && (
                      <div className="bg-orange-100 text-orange-800 text-sm p-2 rounded-lg mb-3">
                        ⚠️ Cet article a déjà été envoyé en cuisine
                      </div>
                  )}
                  <textarea
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="Ajoutez votre note ici..."
                      className="w-full h-24 theme-input resize-none"
                      autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  <button
                      onClick={handleNoteCancel}
                      className="flex-1 theme-button-secondary py-2 px-4 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                      onClick={handleNoteConfirm}
                      className="flex-1 theme-button-primary py-2 px-4 rounded-lg"
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </div>
        )}
      </>
  );
};