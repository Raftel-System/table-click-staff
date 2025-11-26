import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useZones } from '../hooks/useZones';
import { useTables } from '../hooks/useTables';
import { TableCard } from '../components/TableCard';
import { OrderCard } from '../components/OrderCard';
import { NewOrderCard } from '../components/NewOrderCard';
import {useTakeAwayOrders} from "@/hooks/useTakeAwayOrders.tsx";
import type {Order} from "@/services/orderService.ts";
import {useServiceTypeContextStore} from "@/stores/contextStore.tsx";
import {useEffect} from "react";

const ZoneDetail = () => {
    const { restaurantSlug, zoneId } = useParams<{ restaurantSlug: string; zoneId: string }>();
    const { setServiceType } = useServiceTypeContextStore();
    const navigate = useNavigate();

    const { zones, loading: zonesLoading } = useZones(restaurantSlug || '');
    const { tables, loading: tablesLoading } = useTables(restaurantSlug || '', zoneId || '');

    // Trouver la zone actuelle
    const currentZone = zones.find(zone => zone.id === zoneId);

    const { orders: takeAwayOrders } = useTakeAwayOrders(
        restaurantSlug,
        zoneId,
        currentZone?.serviceType === 'TAKEAWAY'
    );

    useEffect(() => {
        console.log("Current Zone Service Type:", currentZone?.serviceType);
        if (currentZone?.serviceType) {
            console.log("Setting service type in context store:", currentZone.serviceType);
            setServiceType(currentZone?.serviceType);
        }
    }, [currentZone?.serviceType, setServiceType]);

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
        if (currentZone.serviceType === 'DINING') {
            // Zone avec tables
            const tablesLibres = tables.filter(t => t.statut === 'LIBRE');
            const tablesOccupees = tables.filter(t => t.statut === 'OCCUPEE');

            return (
                <>
                    <div className="flex justify-between items-center mb-8 h-20">
                        <div>
                            <h1 className="text-3xl font-bold theme-gradient-text mb-2">{currentZone.nom}</h1>
                            <p className="theme-secondary-text">
                                {tables.length} tables ({tablesOccupees.length} occupées • {tablesLibres.length} libres)
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
                    <div className="flex flex-wrap gap-2">
                        {tables.map((table) => (
                            <TableCard key={table.id} table={table} restaurantSlug={restaurantSlug || ''} />
                        ))}
                    </div>
                </>
            );
        } else {

            const enCours = takeAwayOrders.filter(o => ['IN_PROGRESS', 'preparing', 'pending', 'sent']
                    .includes(o.status || '')).length;
            const pretes = takeAwayOrders.filter(o => ['READY', 'ready', 'served']
                .includes(o.status || '')).length;

            return (
                <>
                    <div className="flex justify-between items-center mb-8 h-20">
                        <div>
                            <h1 className="text-3xl font-bold theme-gradient-text mb-2">{currentZone.nom}</h1>
                            <p className="theme-secondary-text">
                                Totale des commandes : {enCours} en cours
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
                    <div className="flex flex-wrap gap-2">
                        <NewOrderCard restaurantSlug={restaurantSlug || ''} />
                        {takeAwayOrders
                            .filter(o => o.status !== 'served')
                            .map((order: Order) => (
                                <OrderCard key={order.id} order={order} restaurantSlug={restaurantSlug || ''} zoneId={zoneId} />
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