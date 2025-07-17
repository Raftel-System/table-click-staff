import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Zones from "./pages/Zones";
import ZoneDetail from "./pages/ZoneDetail";
import Commande from "./pages/Commande";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <Routes>
                    {/* Redirection racine vers un restaurant par défaut */}
                    <Route path="/" element={<Navigate to="/talya-bercy/zones" replace />} />

                    {/* Routes avec restaurant slug */}
                    <Route path="/:restaurantSlug/zones" element={<Zones />} />
                    <Route path="/:restaurantSlug/zones/:zoneId" element={<ZoneDetail />} />
                    <Route path="/:restaurantSlug/commande/:tableId" element={<Commande />} />
                    <Route path="/:restaurantSlug/commande/emporter/:orderId" element={<Commande />} />

                    {/* Catch-all route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;