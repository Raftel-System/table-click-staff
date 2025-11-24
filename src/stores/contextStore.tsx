import { create } from 'zustand';

export type ServiceType = 'DINING' | 'TAKEAWAY' | 'UNDEFINED';

interface ServiceTypeState {
    serviceType: ServiceType;
    creatingInProgress: boolean;
    setServiceType: (t: ServiceType) => void;
    setCreatingInProgress: (inProgress: boolean) => void;
    isTakeAway: () => boolean;
    isDining: () => boolean;
}

export const useServiceTypeContextStore = create<ServiceTypeState>((set, get) => ({
    serviceType: 'UNDEFINED',
    creatingInProgress: false,
    setServiceType: (t) => set({ serviceType: t }),
    setCreatingInProgress: (inProgress) => set({ creatingInProgress: inProgress }),
    isTakeAway: () => get().serviceType === 'TAKEAWAY',
    isDining: () => get().serviceType === 'DINING',
}));