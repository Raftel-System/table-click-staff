import { useState } from 'react';
import { X } from 'lucide-react';
import type {CartItem} from '../types';

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (informKitchen: boolean) => void;
  item: CartItem | null;
}

export const CancelModal = ({ isOpen, onClose, onConfirm, item }: CancelModalProps) => {
  const [informKitchen, setInformKitchen] = useState(true);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    onConfirm(informKitchen);
    setInformKitchen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 theme-backdrop flex items-center justify-center z-50">
      <div className="theme-modal-bg rounded-lg p-6 max-w-md w-full mx-4 theme-shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold theme-foreground-text">
            Annuler l'article
          </h3>
          <button
            onClick={onClose}
            className="theme-secondary-text hover:theme-foreground-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="theme-menu-card p-3 rounded-lg mb-4">
            <div className="theme-foreground-text font-medium">
              {item.nom}
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="theme-secondary-text text-sm">
                Quantité: {item.quantite}
              </span>
              <span className="theme-primary-text font-semibold">
                {(item.prix * item.quantite).toFixed(2)}€
              </span>
            </div>
          </div>

          <p className="theme-secondary-text text-sm mb-4">
            Voulez-vous vraiment annuler cet article ?
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={informKitchen}
              onChange={(e) => setInformKitchen(e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <span className="theme-foreground-text text-sm">
              Informer la cuisine
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 theme-button-secondary py-2 px-4 rounded-lg"
          >
            Non
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
          >
            Oui, annuler
          </button>
        </div>
      </div>
    </div>
  );
};