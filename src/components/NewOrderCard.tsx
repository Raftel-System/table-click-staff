import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useState } from "react";
import { orderService } from "@/services/orderService.ts";
import { useZones } from "@/hooks/useZones.ts";

interface NewOrderCardProps {
    restaurantSlug: string;
}

export const NewOrderCard = ({ restaurantSlug }: NewOrderCardProps) => {
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const { zones } = useZones(restaurantSlug);

    const handleClick = async () => {
        if (isCreating) return;

        setIsCreating(true);

        try {
            // Trouver la zone takeaway
            const takeawayZone = zones.find(zone => zone.serviceType === 'TAKEAWAY');
            const zoneId = takeawayZone?.id || 'emporter';


            // 🔧 Créer une commande TAKEAWAY sans passer par les sessions
            const newOrder = await orderService.createTakeawayOrder(
                restaurantSlug,
                zoneId
            );

            // Rediriger vers la commande créée
            navigate(`/${restaurantSlug}/zones/${zoneId}/commande/${newOrder.id}`);

        } catch (error) {
            console.error('❌ Erreur lors de la création de commande:', error);
            alert('Erreur lors de la création de la commande');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`theme-menu-card rounded-lg p-4 h-32 w-48 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 border-dashed border-2 hover:border-solid ${
                isCreating ? 'opacity-50 cursor-wait' : ''
            }`}
        >
            <Plus className="w-8 h-8 theme-primary-text mb-2" />
            <span className="theme-foreground-text font-medium text-sm">
                {isCreating ? 'Création...' : 'Nouvelle commande'}
            </span>
        </div>
    );
};