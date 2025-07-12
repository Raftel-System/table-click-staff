import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Zones from "./pages/Zones";
import ZoneInterieur from "./pages/ZoneInterieur";
import ZoneTerrasse from "./pages/ZoneTerrasse";
import ZoneEmporter from "./pages/ZoneEmporter";
import Commande from "./pages/Commande";
import NotFound from "./pages/NotFound";
import './App.css'

const queryClient = new QueryClient();


function App() {

  return (
      <QueryClientProvider client={queryClient}>
          <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                  <Routes>
                      <Route path="/" element={<Navigate to="/zones" replace />} />
                      <Route path="/zones" element={<Zones />} />
                      <Route path="/zones/interieur" element={<ZoneInterieur />} />
                      <Route path="/zones/terrasse" element={<ZoneTerrasse />} />
                      <Route path="/zones/emporter" element={<ZoneEmporter />} />
                      <Route path="/commande/:tableId" element={<Commande />} />
                      <Route path="/commande/emporter/:orderId" element={<Commande />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                  </Routes>
              </BrowserRouter>
          </TooltipProvider>
      </QueryClientProvider>
  )
}

export default App
