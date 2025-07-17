import { ArrowLeft } from 'lucide-react';

interface MenuCategory {
    id: string;
    nom: string;
    active: boolean;
    ordre: number;
    emoji?: string;
}

interface MenuStep {
    id: string;
    nom: string;
}

interface CategoryNavProps {
    categories: MenuCategory[];
    activeCategory: string;
    onCategoryChange: (categoryId: string) => void;
    isMenuConfig: boolean;
    menuSteps?: MenuStep[];
    activeMenuStep?: string;
    onMenuStepChange?: (stepId: string) => void;
    onReturnToCategories?: () => void;
}

export const CategoryNav = ({
                                categories,
                                activeCategory,
                                onCategoryChange,
                                isMenuConfig,
                                menuSteps,
                                activeMenuStep,
                                onMenuStepChange,
                                onReturnToCategories
                            }: CategoryNavProps) => {
    if (isMenuConfig && menuSteps) {
        return (
            <div className="w-40 theme-menu-bg p-3 flex flex-col gap-2">
                {/* Bouton retour vers les catégories */}
                <button
                    onClick={onReturnToCategories}
                    className="theme-button-secondary px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 mb-2"
                >
                    <ArrowLeft className="w-3 h-3" />
                    Catégories
                </button>

                <h3 className="text-xs font-semibold theme-foreground-text mb-3">
                    Configuration Menu
                </h3>
                {menuSteps.map((step) => (
                    <button
                        key={step.id}
                        onClick={() => onMenuStepChange?.(step.id)}
                        className={`
              h-12 w-full rounded-lg text-center transition-colors text-xs font-medium
              flex items-center justify-center
              ${activeMenuStep === step.id
                            ? 'theme-button-primary'
                            : 'theme-button-secondary'
                        }
            `}
                    >
                        <span className="leading-tight">{step.nom}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="w-40 theme-menu-bg p-3 flex flex-col gap-2">
            <h3 className="text-xs font-semibold theme-foreground-text mb-3">
                Catégories
            </h3>
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onCategoryChange(category.id)}
                    className={`
            h-12 w-full rounded-lg text-center transition-colors text-xs font-medium
            flex flex-col items-center justify-center gap-1
            ${activeCategory === category.id
                        ? 'theme-button-primary'
                        : 'theme-button-secondary'
                    }
          `}
                >
                    {category.emoji && (
                        <span className="text-sm">{category.emoji}</span>
                    )}
                    <span className="leading-tight">{category.nom}</span>
                </button>
            ))}
        </div>
    );
};