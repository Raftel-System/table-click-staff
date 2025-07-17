import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useZones } from '../hooks/useZones';
import { useTables } from '../hooks/useTables';
import { TableCard } from '../components/TableCard';
import { OrderCard } from '../components/OrderCard';
import { NewOrderCard } from '../components/NewOrderCard';

const ZoneDetail = () => {
    const { restaurantSlug, zoneId } = useParams<{ restaurantSlug: string; zoneId: string }>();
    const navigate = useNavigate();

    const { zones, loading: zonesLoading } = useZones(restaurantSlug || '');
    const { tables, loading: tablesLoading } = useTables(restaurantSlug || '', zoneId || '');

    // Trouver la zone actuelle
    const currentZone = zones.find(zone => zone.id === zoneId);

    if (zonesLoading || tablesLoading) {
        return (
            <div className="flex h-screen theme-bg-gradient items-center justify-center">
                <div className="text-xl theme-foreground-text">Chargement...</div>
            </div>
        );
    }

    if (!currentZone) {
        return (
            <div className="flex h-screen theme-bg-gradient items-center justify-center">
                <div className="text-xl text-red-500">Zone non trouvée</div>
            </div>
        );
    }

    const handleBackToZones = () => {
        navigate(`/${restaurantSlug}/zones`);
    };

    const renderContent = () => {
        if (currentZone.serviceType === 'SALLE') {
            // Zone avec tables
            const tablesLibres = tables.filter(t => t.statut === 'LIBRE');
            const tablesOccupees = tables.filter(t => t.statut === 'OCCUPEE');

            return (
                <>
                    <div className="flex justify-between items-center mb-8 h-20">
                        <div>
                            <h1 className="text-3xl font-bold theme-gradient-text mb-2">{currentZone.nom}</h1>
                            <p className="theme-secondary-text">
                                {tables.length} tables • {tablesOccupees.length} occupées • {tablesLibres.length} libres
                            </p>
                        </div>
                        <button
                            onClick={handleBackToZones}
                            className="theme-button-secondary px-6 py-3 rounded-lg flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Retour zones
                        </button>
                    </div>

                    {/* Grid des tables */}
                    <div className="grid grid-cols-auto-fill gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                        {tables.map((table) => (
                            <TableCard key={table.id} table={table} restaurantSlug={restaurantSlug || ''} />
                        ))}
                    </div>
                </>
            );
        } else {
            // Zone takeaway (pas de tables)
            // TODO: Récupérer les commandes emporter depuis Firebase
            const mockOrders = []; // Remplacer par vraies données

            return (
                <>
                    <div className="flex justify-between items-center mb-8 h-20">
                        <div>
                            <h1 className="text-3xl font-bold theme-gradient-text mb-2">{currentZone.nom}</h1>
                            <p className="theme-secondary-text">
                                {mockOrders.length} commandes • 0 en cours • 0 prêtes
                            </p>
                        </div>
                        <button
                            onClick={handleBackToZones}
                            className="theme-button-secondary px-6 py-3 rounded-lg flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Retour zones
                        </button>
                    </div>

                    {/* Grid des commandes */}
                    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <NewOrderCard restaurantSlug={restaurantSlug || ''} />
                        {mockOrders.map((order: any) => (
                            <OrderCard key={order.id} order={order} restaurantSlug={restaurantSlug || ''} />
                        ))}
                    </div>
                </>
            );
        }
    };

    return (
        <div className="h-screen theme-bg-gradient p-10">
            {renderContent()}
        </div>
    );
};

export default ZoneDetail;