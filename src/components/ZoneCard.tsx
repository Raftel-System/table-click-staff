import { useNavigate } from 'react-router-dom';

interface Zone {
  id: string;
  nom: string;
  serviceType: 'DINING' | 'TAKEAWAY';
  active: boolean;
  ordre: number;
}

interface ZoneCardProps {
  zone: Zone;
  restaurantSlug: string;
}

export const ZoneCard = ({ zone, restaurantSlug }: ZoneCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${restaurantSlug}/zones/${zone.id}`);
  };

  return (
      <div
          onClick={handleClick}
          className="theme-menu-card rounded-xl cursor-pointer p-8 h-48 w-80 flex flex-col justify-center items-center text-center transition-all duration-300"
      >
        {/* Icône commentée pour l'instant */}
        {/* <IconComponent className="w-12 h-12 theme-primary-text mb-4" /> */}

        <h3 className="text-xl font-bold theme-foreground-text mb-2">
          {zone.nom}
        </h3>

        {/* Description commentée pour l'instant */}
        {/* <p className="theme-secondary-text text-sm">
        {zone.description}
      </p> */}

        <p className="theme-secondary-text text-sm">
          {zone.serviceType === 'DINING' ? 'Service en salle' : 'À emporter'}
        </p>
      </div>
  );
};