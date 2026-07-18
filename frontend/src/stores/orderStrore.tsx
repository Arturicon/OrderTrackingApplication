import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {API_CONFIG} from '../utils/helpers'

export interface Order {
    id: string;
    orderNumber: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderStatusUpdate {
    orderId: string;
    orderNumber: string;
    oldStatus: string;
    newStatus: string;
    timestamp: string;
}

interface OrderStore {
    orders: Order[];
    addOrder: (order: Order) => void;
    fetchOrders: () => Promise<void>;
    getCurrentOrderById: (id: string) => Order | undefined;
    updateOrderStatus: (orderId: string, newStatus: string )=> void;
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
            name: 'order-storage', // ключ в localStorage
            storage: createJSONStorage(() => localStorage), // используем localStorage
            partialize: (state) => ({ 
                orders: state.orders // сохраняем только orders
            }),
        }
    )
);