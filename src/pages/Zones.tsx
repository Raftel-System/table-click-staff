import { Settings, ArrowLeft, Plus } from 'lucide-react';
import { ZoneCard } from '../components/ZoneCard';
import { zones } from '../data/mockData';

const Zones = () => {
  return (
    <div className="flex h-screen theme-bg-gradient">
      {/* Sidebar gauche */}
      <div className="w-20 theme-header-bg flex flex-col items-center py-6 gap-6">
        <button className="p-3 theme-menu-card rounded-lg hover:scale-105 transition-transform">
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

      {/* Zone principale */}
      <div className="flex-1 flex items-center justify-center p-15">
        <div className="grid grid-cols-3 gap-10">
          {zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Zones;