import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {API_CONFIG} from '../utils/helpers'
import type { Order } from '../types/types.js';

/**
 * Хранилище заказов с поддержкой персистентности в localStorage.
 */
interface OrderStore {
    /** Список заказов */
    orders: Order[];
    /** Добавить новый заказ */
    addOrder: (order: Order) => void;
    /** Загрузить заказы с сервера */
    fetchOrders: () => Promise<void>;
    /** Получить заказ по ID */
    getCurrentOrderById: (id: string) => Order | undefined;
    /** Обновить статус заказа */
    updateOrderStatus: (orderId: string, newStatus: string) => void;
}

export const useOrderStore = create<OrderStore>()(
    persist(
        (set, get) => ({
            orders: [],
            
            updateOrderStatus: (orderId: string, newStatus: string) => {
                set((state) => ({
                    orders: state.orders.map(order => 
                        order.id === orderId 
                            ? { ...order, status: newStatus }
                            : order
                    )
                }));
            },
            
            addOrder: (order) => set((state) => ({ 
                orders: [order, ...state.orders] 
            })),
            
            fetchOrders: async () => {
                try {
                    const response = await fetch(`${API_CONFIG.backendUrl}/${API_CONFIG.endpoints.allOrders}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    set({ orders: data });
                } catch (error) {
                    console.error("Failed to fetch orders:", error);
                }
            },
            
            getCurrentOrderById: (id: string): Order | undefined => {
                const { orders } = get();
                return orders.find(order => order.id === id);
            },
        }),
        {
            name: 'order-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                orders: state.orders
            }),
        }
    )
);