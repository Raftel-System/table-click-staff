import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TableCard } from '../components/TableCard';
import { tablesTerrasse, getZoneStats } from '../data/mockData';

const ZoneTerrasse = () => {
  const navigate = useNavigate();
  const stats = getZoneStats();

  return (
    <div className="h-screen theme-bg-gradient p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 h-20">
        <div>
          <h1 className="text-3xl font-bold theme-gradient-text mb-2">Terrasse</h1>
          <p className="theme-secondary-text">
            {stats.terrasse.total} tables • {stats.terrasse.occupees} occupées • {stats.terrasse.libres} libres
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

      {/* Grid des tables */}
      <div className="grid grid-cols-auto-fill gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {tablesTerrasse.map((table) => (
          <TableCard key={table.id} table={table} />
        ))}
      </div>
    </div>
  );
};

export default ZoneTerrasse;