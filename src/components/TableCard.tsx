import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rtDatabase } from '@/lib/firebase';
import { ref, onValue, query, equalTo, off, orderByKey } from 'firebase/database';

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
  const [isOccupied, setIsOccupied] = useState(false);

  useEffect(() => {
    const ordersRef = ref(rtDatabase, `restaurants/${restaurantSlug}/sessions`);
    const tableOrdersQuery = query(
        ordersRef,
        orderByKey(),
        equalTo("table_"+table.id)
    );

    const unsubscribe = onValue(tableOrdersQuery, (snapshot) => {
      let hasActiveOrder = false;
      console.log("snapshot", snapshot);
      snapshot.forEach((childSnapshot) => {
        const order = childSnapshot.val();
        if (order.status !== 'served' && order.status !== 'cancelled') {
          hasActiveOrder = true;
        }
      });

      setIsOccupied(hasActiveOrder);
    });

    return () => off(tableOrdersQuery, 'value', unsubscribe);
  }, [restaurantSlug, table.id]);

  const handleClick = () => {
    navigate(`/${restaurantSlug}/zones/${table.zoneId}/commande/${table.id}`);
  };

  const currentStatus = isOccupied ? 'OCCUPEE' : 'LIBRE';

  return (
      <div
          onClick={handleClick}
          className={`
        theme-menu-card rounded-xl cursor-pointer p-6 h-32 w-40 
        flex flex-col justify-center items-center text-center 
        transition-all duration-300 hover:scale-105
        ${currentStatus === 'OCCUPEE' ? 'border-2 border-orange-400' : ''}
      `}
      >
        <div className="text-2xl font-bold theme-foreground-text mb-1">
          {table.numero}
        </div>
        <div className="text-sm theme-secondary-text mb-2">
          {table.capacite} personnes
        </div>
        <div className={`text-xs px-2 py-1 rounded-full ${
            currentStatus === 'LIBRE'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
        }`}>
          {currentStatus === 'LIBRE' ? 'Libre' : 'Occupée'}
        </div>
      </div>
  );
};