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

interface MenuStepOptionsPanelProps {
    currentStep: MenuStep | null;
    selections: { [optionId: string]: number }; // optionId -> quantité
    onSelectOption: (optionId: string) => void; // Pour sélectionner une option
    selectedOption: string | null; // ID de l'option actuellement sélectionnée
    basePrice: number;
    totalAdjustment: number;
}

export const MenuStepOptionsPanel = ({
                                         currentStep,
                                         selections,
                                         onSelectOption,
                                         selectedOption,
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

    // Calculer le nombre total de sélections
    const totalSelectionsCount = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
    const isMinReached = totalSelectionsCount >= currentStep.minSelections;
    const isMaxReached = totalSelectionsCount >= currentStep.maxSelections;
    const canAddMore = !isMaxReached;

    const handleOptionClick = (option: MenuOption) => {
        onSelectOption(option.id);
    };

    const formatPrice = (price: number) => {
        if (price === 0) return '';
        return price > 0 ? `+${price.toFixed(2)}€` : `${price.toFixed(2)}€`;
    };

    const getSelectionStatusText = () => {
        if (currentStep.minSelections === currentStep.maxSelections) {
            return `${totalSelectionsCount}/${currentStep.maxSelections}`;
        }
        return `${totalSelectionsCount} sélectionné(s) (min: ${currentStep.minSelections}, max: ${currentStep.maxSelections})`;
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

                {/* 🆕 Info sur la sélection multiple */}
                {currentStep.maxSelections > 1 && (
                    <div className="text-xs theme-secondary-text mt-1">
                        💡 Cliquez sur une option pour ajuster sa quantité
                    </div>
                )}
            </div>

            {/* Grid des options - scrollable */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                    {currentStep.options.map((option) => {
                        const quantity = selections[option.id] || 0;
                        const isSelected = quantity > 0;
                        const isCurrentlySelected = selectedOption === option.id;
                        const isClickable = isSelected || canAddMore;

                        return (
                            <button
                                key={option.id}
                                onClick={() => handleOptionClick(option)}
                                disabled={!isClickable}
                                className={`
                  relative p-3 rounded-lg border-2 transition-all duration-200
                  min-h-[80px] flex flex-col justify-between text-left
                  ${isCurrentlySelected
                                    ? 'border-blue-500 bg-blue-100 shadow-lg scale-105'
                                    : isSelected
                                        ? 'border-teal-500 bg-teal-50'
                                        : isClickable
                                            ? 'border-gray-200 theme-menu-card hover:border-teal-300'
                                            : 'border-gray-200 theme-menu-card opacity-50 cursor-not-allowed'
                                }
                `}
                            >
                                {/* Badge de quantité (si > 0) */}
                                {isSelected && (
                                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                        isCurrentlySelected
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-teal-500 text-white'
                                    }`}>
                                        {quantity > 1 ? quantity : <Check className="w-3 h-3" />}
                                    </div>
                                )}

                                {/* Indicateur de sélection active */}
                                {isCurrentlySelected && (
                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                )}

                                {/* Nom de l'option */}
                                <div className={`text-sm font-medium mb-1 line-clamp-2 ${
                                    isCurrentlySelected
                                        ? 'text-blue-800 font-bold'
                                        : isSelected
                                            ? 'text-teal-800'
                                            : 'theme-foreground-text'
                                }`}>
                                    {option.nom}
                                </div>

                                {/* Prix */}
                                <div className={`text-xs font-semibold ${
                                    isCurrentlySelected
                                        ? 'text-blue-700'
                                        : isSelected
                                            ? 'text-teal-700'
                                            : 'theme-primary-text'
                                }`}>
                                    {formatPrice(option.priceAdjustment)}
                                </div>

                                {/* 🆕 Afficher la quantité totale si > 1 */}
                                {quantity > 1 && (
                                    <div className={`text-xs mt-1 font-medium ${
                                        isCurrentlySelected ? 'text-blue-700' : 'text-teal-700'
                                    }`}>
                                        Qté: {quantity}
                                    </div>
                                )}
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