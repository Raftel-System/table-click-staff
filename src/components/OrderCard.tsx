import { useNavigate } from 'react-router-dom';
import { Clock, Package } from 'lucide-react';
import type {Order} from "@/services/orderService.ts";

interface OrderCardProps {
  order: Order;
  restaurantSlug: string;
  zoneId: string;
}

export const OrderCard = ({ order, restaurantSlug, zoneId }: OrderCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${restaurantSlug}/zones/${zoneId}/commande/${order.id}`);
  };

  const getStatusColor = () => {
    switch (order.status) {
      case 'ready':
        return 'border-green-200 bg-green-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'sent':
            return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusText = () => {
    switch (order.status) {
      case 'ready':
        return 'Prête';
      case 'pending':
        return 'En cours';
      case "sent":
          return 'En cours';
        default:
        return 'Livrée';
    }
  };

  const getStatusTextColor = () => {
    switch (order.status) {
      case 'ready':
        return 'text-green-700';
      case 'pending':
        return 'text-yellow-700';
      case 'sent':
            return 'text-yellow-700';
      default:
        return 'text-gray-700';
    }
  };

  const formatDateFr = (isoString: string) => {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fr-FR');
  }

    const toDate = (value: string | number | undefined): Date | null => {
        if (value == null) return null;
        const d = typeof value === 'number' ? new Date(value) : new Date(value);
        return isNaN(d.getTime()) ? null : d;
    };

    const diffInMinutes = (fromIso: string | number | undefined, toIso: string | number | undefined): number => {
        const from = toDate(fromIso);
        const to = toDate(toIso) || new Date();
        if (!from) return 0;
        const ms = to.getTime() - from.getTime();
        return Math.max(0, Math.floor(ms / 60000));
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}H ${m.toString().padStart(2, '0')}`;
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
            # {order.number}
          </h3>
          <Package className="w-5 h-5 theme-primary-text" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 theme-secondary-text text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatDateFr(order.createdAt)}</span>
          </div>
          <div className="theme-secondary-text text-xs">
            Durée: {formatDuration(diffInMinutes(order.createdAt, order.lastUpdated))}
          </div>
        </div>

        <div className={`text-xs font-semibold ${getStatusTextColor()}`}>
          {getStatusText()}
        </div>
      </div>
  );
};