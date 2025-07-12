import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import type {Table} from '../types';

interface TableCardProps {
  table: Table;
}

export const TableCard = ({ table }: TableCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Permettre de cliquer sur toutes les tables (libre ou occupée)
    navigate(`/commande/${table.id}`);
  };

  const getStatusColor = () => {
    return table.statut === 'LIBRE' 
      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
      : 'border-red-200 bg-red-50';
  };

  const getStatusText = () => {
    return table.statut === 'LIBRE' ? 'LIBRE' : 'OCCUPÉE';
  };

  const getStatusTextColor = () => {
    return table.statut === 'LIBRE' ? 'text-green-700' : 'text-red-700';
  };

  return (
    <div
      onClick={handleClick}
      className={`
        theme-menu-card rounded-lg p-4 h-32 w-40 flex flex-col justify-between
        transition-all duration-300 ${getStatusColor()}
        cursor-pointer
      `}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold theme-foreground-text">
          Table {table.numero}
        </h3>
      </div>
      
      <div className="flex items-center gap-2 theme-secondary-text text-sm">
        <Users className="w-4 h-4" />
        <span>{table.capacite} places</span>
      </div>
      
      <div className={`text-xs font-semibold ${getStatusTextColor()}`}>
        {getStatusText()}
      </div>
    </div>
  );
};