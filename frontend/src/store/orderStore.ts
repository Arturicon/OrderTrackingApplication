import { create } from 'zustand';
import type { Order, OrderStatus } from '../types/order';

interface OrderStore {
    orders: Order[];
    currentOrder: Order | null;
    isLoading: boolean;
    error: string | null;
    addOrder: (order: Order) => void;
    updateStatus: (id: string, newStatus: OrderStatus) => void;
    deleteOrder: (id: string) => void;
    deleteAllOrders: () => void;
    fetchAllOrders: () => Promise<void>;
    fetchOrder: (id: String) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set) => ({
    orders: [],
    currentOrder: null,
    isLoading: false,
    error: null,

    addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),

    updateStatus: (id, newStatus) =>
        set((state) => ({
            orders: state.orders.map((order) =>
                order.id === id
                    ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
                    : order
            ),
        })),

    deleteOrder: (id) =>
        set((state) => ({
            orders: state.orders.filter((order) => order.id !== id),
        })),

    deleteAllOrders: () => set({ orders: [] }),

    //todo вынести в отдельный сервис
    fetchAllOrders: async () =>{
        set({ isLoading: true, error: null });
        //todo
        let host ="https://localhost:7099" //import.meta.env.VITE_API_URL;
        try {
            const response = await fetch(`${host}/api/Orders/GetAllOrders`);
            const data = await response.json();
            set({ orders:data, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки заказов',
                isLoading: false,
            });
        }
    },
    
    fetchOrder: async (id: String) => {
        set({ isLoading: true, error: null });
        //todo
        let host ="https://localhost:7099" //import.meta.env.VITE_API_URL;
        try {
            const response = await fetch(`${host}/api/Orders/GetOrder/${id}`);
            const data = await response.json();
        set({ currentOrder: data, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Ошибка загрузки заказа',
                isLoading: false,
            });
        }
    }
}));