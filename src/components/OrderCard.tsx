import { useNavigate } from 'react-router-dom';
import { Clock, Package } from 'lucide-react';
import type {CommandeEmporter} from '../types';

interface OrderCardProps {
  order: CommandeEmporter;
  restaurantSlug: string;
}

export const OrderCard = ({ order, restaurantSlug }: OrderCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${restaurantSlug}/commande/emporter/${order.id}`);
  };

  const getStatusColor = () => {
    switch (order.statut) {
      case 'PRETE':
        return 'border-green-200 bg-green-50';
      case 'EN_COURS':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusText = () => {
    switch (order.statut) {
      case 'PRETE':
        return 'Prête';
      case 'EN_COURS':
        return 'En cours';
      default:
        return 'Livrée';
    }
  };

  const getStatusTextColor = () => {
    switch (order.statut) {
      case 'PRETE':
        return 'text-green-700';
      case 'EN_COURS':
        return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  };

  return (
      <div
          onClick={handleClick}
          className={`
        theme-menu-card rounded-lg p-4 h-32 w-48 flex flex-col justify-between
        cursor-pointer transition-all duration-300 ${getStatusColor()}
      `}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold theme-foreground-text">
            #{order.numero}
          </h3>
          <Package className="w-5 h-5 theme-primary-text" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 theme-secondary-text text-sm">
            <Clock className="w-4 h-4" />
            <span>{order.heure}</span>
          </div>
          <div className="theme-secondary-text text-xs">
            Durée: {formatDuration(order.duree)}
          </div>
        </div>

        <div className={`text-xs font-semibold ${getStatusTextColor()}`}>
          {getStatusText()}
        </div>
      </div>
  );
};