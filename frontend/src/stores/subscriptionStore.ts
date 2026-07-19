import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Состояние подписок на заказы.
 * Хранит ID заказов, на которые подписан пользователь.
 * Данные сохраняются в sessionStorage.
 */
interface SubscriptionStore {
    /** Массив ID заказов, на которые подписан пользователь */
    subscribedOrderIds: string[];
    /** Добавить подписку на заказ */
    addSubscription: (orderId: string) => void;
    /** Удалить подписку на заказ */
    removeSubscription: (orderId: string) => void;
    /** Очистить все подписки */
    clearSubscriptions: () => void;
    /** Проверить, подписан ли пользователь на заказ */
    isSubscribed: (orderId: string) => boolean;
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
            isSubscribed: (orderId) => 
                get().subscribedOrderIds.includes(orderId),
            clearSubscriptions: () => {
                set({ subscribedOrderIds: [] });
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => sessionStorage), 
        }
    )
);