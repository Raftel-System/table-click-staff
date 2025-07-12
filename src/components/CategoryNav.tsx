import { Utensils, ChefHat, Pizza, IceCream, GlassWater, Menu } from 'lucide-react';
import type {Category} from '../types';

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  isMenuConfig?: boolean;
  menuSteps?: string[];
  activeMenuStep?: string;
  onMenuStepChange?: (step: string) => void;
}

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'utensils':
      return Utensils;
    case 'chef-hat':
      return ChefHat;
    case 'pizza':
      return Pizza;
    case 'ice-cream':
      return IceCream;
    case 'glass-water':
      return GlassWater;
    case 'menu':
      return Menu;
    default:
      return Utensils;
  }
};

export const CategoryNav = ({
  categories,
  activeCategory,
  onCategoryChange,
  isMenuConfig = false,
  menuSteps = [],
  activeMenuStep,
  onMenuStepChange
}: CategoryNavProps) => {
  if (isMenuConfig && menuSteps.length > 0 && onMenuStepChange) {
    return (
      <div className="w-24 theme-header-bg p-4 flex flex-col gap-3 overflow-y-auto">
        <h3 className="text-xs font-semibold theme-secondary-text mb-2">Config Menu</h3>
        {menuSteps.map((step) => (
          <button
            key={step}
            onClick={() => onMenuStepChange(step)}
            className={`
              theme-category-button p-3 rounded-lg text-xs font-medium transition-all duration-300
              ${activeMenuStep === step ? 'active' : ''}
            `}
          >
            {step}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-24 theme-header-bg p-4 flex flex-col gap-3 overflow-y-auto">
      {categories.map((category) => {
        const IconComponent = getCategoryIcon(category.icon);
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`
              theme-category-button p-3 rounded-lg flex flex-col items-center gap-2 text-xs font-medium transition-all duration-300
              ${activeCategory === category.id ? 'active' : ''}
            `}
          >
            <IconComponent className="w-5 h-5" />
            <span className="line-clamp-2 text-center">{category.nom}</span>
          </button>
        );
      })}
    </div>
  );
};