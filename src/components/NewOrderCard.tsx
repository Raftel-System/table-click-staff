import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface NewOrderCardProps {
  restaurantSlug: string;
}

export const NewOrderCard = ({ restaurantSlug }: NewOrderCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const newOrderId = `CMD-${Date.now()}`;
    navigate(`/${restaurantSlug}/commande/emporter/${newOrderId}`);
  };

  return (
      <div
          onClick={handleClick}
          className="theme-menu-card rounded-lg p-4 h-32 w-48 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 border-dashed border-2 hover:border-solid"
      >
        <Plus className="w-8 h-8 theme-primary-text mb-2" />
        <span className="theme-foreground-text font-medium text-sm">
        Nouvelle commande
      </span>
      </div>
  );
};