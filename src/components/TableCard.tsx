import { useNavigate } from 'react-router-dom';

interface Table {
  id: string;
  numero: number;
  zoneId: string;
  capacite: number;
  statut: 'LIBRE' | 'OCCUPEE';
  active: boolean;
}

interface TableCardProps {
  table: Table;
  restaurantSlug: string;
}

export const TableCard = ({ table, restaurantSlug }: TableCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${restaurantSlug}/zones/${table.zoneId}/commande/${table.id}`);
  };

  return (
      <div
          onClick={handleClick}
          className={`
        theme-menu-card rounded-xl cursor-pointer p-6 h-32 w-40 
        flex flex-col justify-center items-center text-center 
        transition-all duration-300 hover:scale-105
        ${table.statut === 'OCCUPEE' ? 'border-2 border-orange-400' : ''}
      `}
      >
        <div className="text-2xl font-bold theme-foreground-text mb-1">
          {table.numero}
        </div>
        <div className="text-sm theme-secondary-text mb-2">
          {table.capacite} personnes
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${
            table.statut === 'LIBRE'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
        }`}>
          {table.statut === 'LIBRE' ? 'Libre' : 'Occupée'}
        </div>
      </div>
  );
};