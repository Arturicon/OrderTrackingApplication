import { create } from 'zustand';
import type { OrderStatusUpdate } from './orderStrore';

interface SignalRStore {
    handlers: ((data: OrderStatusUpdate) => void)[];
    addHandler: (handler: (data: OrderStatusUpdate) => void) => () => void;
    notify: (data: OrderStatusUpdate) => void;
    getHandlersCount: () => number;
}

export const signalRStore = create<SignalRStore>((set, get) => ({
    handlers: [],
    
    addHandler: (handler) => {
        set((state) => ({
            handlers: [...state.handlers, handler]
        }));
        
        return () => {
            set((state) => ({
                handlers: state.handlers.filter(h => h !== handler)
            }));
        };
    },
    getHandlersCount: () => {
        return get().handlers.length;
    },

    notify: (data: OrderStatusUpdate) => {
        get().handlers.forEach(handler => {
            try {
                handler(data);
            } catch (err) {
                console.error('Error in event handler:', err);
            }
        });
    }

    
}));