import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft, Plus } from 'lucide-react';
import { OrderCard } from '../components/OrderCard';
import { NewOrderCard } from '../components/NewOrderCard';
import { commandesEmporter, getZoneStats } from '../data/mockData';

const ZoneEmporter = () => {
  const navigate = useNavigate();
  const stats = getZoneStats();

  return (
    <div className="flex h-screen theme-bg-gradient">
      {/* Sidebar gauche */}
      <div className="w-20 theme-header-bg flex flex-col items-center py-6 gap-6">
        <button
          onClick={() => navigate('/zones')}
          className="p-3 theme-menu-card rounded-lg hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-6 h-6 theme-primary-text" />
        </button>
        <button className="p-3 theme-menu-card rounded-lg hover:scale-105 transition-transform">
          <Settings className="w-6 h-6 theme-secondary-text" />
        </button>
        <button className="p-3 theme-menu-card rounded-lg hover:scale-105 transition-transform">
          <Plus className="w-6 h-6 theme-secondary-text" />
        </button>
        <button className="p-3 theme-menu-card rounded-lg hover:scale-105 transition-transform">
          <Plus className="w-6 h-6 theme-secondary-text" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 h-20">
          <div>
            <h1 className="text-3xl font-bold theme-gradient-text mb-2">Emporter</h1>
            <p className="theme-secondary-text">
              {stats.emporter.total} commandes • {stats.emporter.enCours} en cours • {stats.emporter.pretes} prêtes
            </p>
          </div>
          <button
            onClick={() => navigate('/zones')}
            className="theme-button-secondary px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour zones
          </button>
        </div>

        {/* Grid des commandes */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <NewOrderCard />
          {commandesEmporter.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ZoneEmporter;