import { useNavigate } from 'react-router-dom';
import { Home, Trees, ShoppingBag } from 'lucide-react';
import type {Zone} from '../types';

interface ZoneCardProps {
  zone: Zone;
}

const getZoneIcon = (iconName: string) => {
  switch (iconName) {
    case 'home':
      return Home;
    case 'trees':
      return Trees;
    case 'shopping-bag':
      return ShoppingBag;
    default:
      return Home;
  }
};

export const ZoneCard = ({ zone }: ZoneCardProps) => {
  const navigate = useNavigate();
  const IconComponent = getZoneIcon(zone.icon);

  const handleClick = () => {
    navigate(zone.path);
  };

  return (
    <div
      onClick={handleClick}
      className="theme-menu-card rounded-xl cursor-pointer p-8 h-48 w-80 flex flex-col justify-center items-center text-center transition-all duration-300"
    >
      <IconComponent className="w-12 h-12 theme-primary-text mb-4" />
      <h3 className="text-xl font-bold theme-foreground-text mb-2">
        {zone.nom}
      </h3>
      <p className="theme-secondary-text text-sm">
        {zone.description}
      </p>
    </div>
  );
};