import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {CartItem, MenuConfig} from '../types';

interface CartStore {
  items: CartItem[];
  total: number;
  addItem: (item: Omit<CartItem, 'id' | 'envoye'>) => void;
  updateQuantity: (id: string, quantite: number) => void;
  removeItem: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  updateItem: (id: string, quantite: number, note: string) => void;
  validateOrder: () => void;
  clearCart: () => void;
  clearSentItems: () => void;
  loadExistingItems: (tableId: string) => void;
}

const generateId = () => `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.prix * item.quantite), 0);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (cartItem) => 
              cartItem.nom === item.nom && 
              !cartItem.envoye &&
              JSON.stringify(cartItem.menuConfig) === JSON.stringify(item.menuConfig)
          );

          let newItems: CartItem[];
          
          if (existingItem) {
            newItems = state.items.map((cartItem) =>
              cartItem.id === existingItem.id
                ? { ...cartItem, quantite: cartItem.quantite + item.quantite }
                : cartItem
            );
          } else {
            const newItem: CartItem = {
              ...item,
              id: generateId(),
              envoye: false,
            };
            newItems = [...state.items, newItem];
          }

          return {
            items: newItems,
            total: calculateTotal(newItems),
          };
        });
      },

      updateQuantity: (id, quantite) => {
        set((state) => {
          if (quantite <= 0) {
            const newItems = state.items.filter((item) => item.id !== id);
            return {
              items: newItems,
              total: calculateTotal(newItems),
            };
          }

          const newItems = state.items.map((item) =>
            item.id === id ? { ...item, quantite } : item
          );

          return {
            items: newItems,
            total: calculateTotal(newItems),
          };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const newItems = state.items.filter((item) => item.id !== id);
          return {
            items: newItems,
            total: calculateTotal(newItems),
          };
        });
      },

      updateNote: (id, note) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, note } : item
          ),
        }));
      },

      validateOrder: () => {
        set((state) => {
          const newItems = state.items.map((item) =>
            !item.envoye ? { ...item, envoye: true } : item
          );
          return {
            items: newItems,
            total: calculateTotal(newItems),
          };
        });
      },

      clearCart: () => {
        set({
          items: [],
          total: 0,
        });
      },

      clearSentItems: () => {
        set((state) => {
          const newItems = state.items.filter((item) => !item.envoye);
          return {
            items: newItems,
            total: calculateTotal(newItems),
          };
        });
      },

      updateItem: (id, quantite, note) => {
        set((state) => {
          const newItems = state.items.map((item) =>
            item.id === id ? { ...item, quantite, note } : item
          );
          return {
            items: newItems,
            total: calculateTotal(newItems),
          };
        });
      },

      loadExistingItems: (tableId) => {
        // Simuler le chargement d'articles existants pour une table occupée
        if (tableId === 'T2' || tableId === 'T5') {
          const existingItems: CartItem[] = [
            {
              id: `existing-1-${Date.now()}`,
              nom: 'Pizza Margherita',
              prix: 12.50,
              quantite: 1,
              envoye: true,
              note: 'Sans olives'
            },
            {
              id: `existing-2-${Date.now()}`,
              nom: 'Coca-Cola',
              prix: 3.50,
              quantite: 2,
              envoye: true
            }
          ];

          set((state) => ({
            items: [...existingItems, ...state.items.filter(item => !item.id.startsWith('existing-'))],
            total: calculateTotal([...existingItems, ...state.items.filter(item => !item.id.startsWith('existing-'))])
          }));
        }
      },
    }),
    {
      name: 'restaurant-cart',
      version: 1,
    }
  )
);