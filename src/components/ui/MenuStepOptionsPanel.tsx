import { useState } from 'react';
import { Check } from 'lucide-react';

interface MenuOption {
  id: string;
  nom: string;
  priceAdjustment: number;
}

interface MenuStep {
  id: string;
  nom: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: MenuOption[];
}

interface MenuStepSelections {
  [stepId: string]: string[]; // Array d'IDs des options sélectionnées
}

interface MenuStepOptionsPanelProps {
  currentStep: MenuStep | null;
  selections: string[]; // IDs des options sélectionnées pour ce step
  onToggleOption: (optionId: string) => void;
  basePrice: number;
  totalAdjustment: number;
}

export const MenuStepOptionsPanel = ({
  currentStep,
  selections,
  onToggleOption,
  basePrice,
  totalAdjustment
}: MenuStepOptionsPanelProps) => {
  if (!currentStep) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center theme-secondary-text">
          <div className="text-lg mb-2">Configuration de menu</div>
          <div className="text-sm">Sélectionnez un élément du menu à configurer</div>
        </div>
      </div>
    );
  }

  const isMinReached = selections.length >= currentStep.minSelections;
  const isMaxReached = selections.length >= currentStep.maxSelections;
  const canAddMore = !isMaxReached;

  const handleOptionClick = (option: MenuOption) => {
    const isSelected = selections.includes(option.id);
    
    if (isSelected) {
      // Toujours permettre de désélectionner
      onToggleOption(option.id);
    } else if (canAddMore) {
      // Permettre de sélectionner si on n'a pas atteint le max
      onToggleOption(option.id);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return '';
    return price > 0 ? `+${price.toFixed(2)}€` : `${price.toFixed(2)}€`;
  };

  const getSelectionStatusText = () => {
    const count = selections.length;
    if (currentStep.minSelections === currentStep.maxSelections) {
      return `${count}/${currentStep.maxSelections}`;
    }
    return `${count} sélectionné(s) (min: ${currentStep.minSelections}, max: ${currentStep.maxSelections})`;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header avec info step */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold theme-foreground-text">
            {currentStep.nom}
          </h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isMinReached ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
          }`}>
            {getSelectionStatusText()}
          </div>
        </div>
        
        {currentStep.required && !isMinReached && (
          <div className="text-xs theme-alert-text">
            ⚠️ Sélection obligatoire (minimum {currentStep.minSelections})
          </div>
        )}
      </div>

      {/* Grid des options - scrollable */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2">
          {currentStep.options.map((option) => {
            const isSelected = selections.includes(option.id);
            const isClickable = isSelected || canAddMore;
            
            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={!isClickable}
                className={`
                  relative p-3 rounded-lg border-2 transition-all duration-200
                  min-h-[80px] flex flex-col justify-between text-left
                  ${isSelected 
                    ? 'border-teal-500 bg-teal-50 theme-button-primary' 
                    : isClickable 
                      ? 'border-gray-200 theme-menu-card hover:border-teal-300' 
                      : 'border-gray-200 theme-menu-card opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {/* Icône de sélection */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Nom de l'option */}
                <div className={`text-sm font-medium mb-1 line-clamp-2 ${
                  isSelected ? 'text-white' : 'theme-foreground-text'
                }`}>
                  {option.nom}
                </div>

                {/* Prix */}
                <div className={`text-xs font-semibold ${
                  isSelected ? 'text-white' : 'theme-primary-text'
                }`}>
                  {formatPrice(option.priceAdjustment)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer avec prix total */}
      <div className="p-4 border-t border-gray-200 theme-header-bg flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="theme-secondary-text text-sm">
            Prix de base: {basePrice.toFixed(2)}€
          </div>
          <div className="theme-primary-text font-bold text-lg">
            Total: {(basePrice + totalAdjustment).toFixed(2)}€
          </div>
        </div>
        
        {totalAdjustment !== 0 && (
          <div className="text-xs theme-secondary-text mt-1 text-right">
            Supplément: {formatPrice(totalAdjustment)}
          </div>
        )}
      </div>
    </div>
  );
};