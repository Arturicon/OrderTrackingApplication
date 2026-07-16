// stores/subscriptionStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SubscriptionStore {
    subscribedOrderIds: string[];
    addSubscription: (orderId: string) => void;
    removeSubscription: (orderId: string) => void;
    clearSubscriptions: () => void;
}

export const subscriptionStore = create<SubscriptionStore>()(
    persist(
        (set, get) => ({
            subscribedOrderIds: [],
            
            addSubscription: (orderId: string) => {
                set((state) => ({
                    subscribedOrderIds: [...new Set([...state.subscribedOrderIds, orderId])]
                }));
            },
            
            removeSubscription: (orderId: string) => {
                set((state) => ({
                    subscribedOrderIds: state.subscribedOrderIds.filter(id => id !== orderId)
                }));
            },
            
            clearSubscriptions: () => {
                set({ subscribedOrderIds: [] });
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => sessionStorage), // ✅ sessionStorage - живёт только в текущей вкладке
        }
    )
);