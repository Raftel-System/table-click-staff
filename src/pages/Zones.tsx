import { Settings, ArrowLeft, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ZoneCard } from '../components/ZoneCard';
import { useZones } from '../hooks/useZones';

const Zones = () => {
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const { zones, loading, error } = useZones(restaurantSlug || '');


  if (loading) {
    return (
        <div className="flex h-screen theme-bg-gradient items-center justify-center">
          <div className="text-xl theme-foreground-text">Chargement des zones...</div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex h-screen theme-bg-gradient items-center justify-center">
          <div className="text-xl text-red-500">{error}</div>
        </div>
    );
  }

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
          {zones.length === 0 ? (
              <div className="text-xl theme-secondary-text">
                Aucune zone disponible pour {restaurantSlug}
              </div>
          ) : (
              <div className="grid grid-cols-3 gap-10">
                {zones.map((zone) => (
                    <ZoneCard key={zone.id} zone={zone} restaurantSlug={restaurantSlug || ''} />
                ))}
              </div>
          )}
        </div>
      </div>
  );
};

export default Zones;