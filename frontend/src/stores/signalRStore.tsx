import { create } from 'zustand';
import type { OrderStatusUpdate } from '../types/types.js';

/**
 * Хранилище для управления обработчиками событий SignalR.
 * Реализует паттерн Pub/Sub для обновлений статуса заказов.
 */
interface SignalRStore {
    /** Массив зарегистрированных обработчиков */
    handlers: ((data: OrderStatusUpdate) => void)[];
    /** Добавить обработчик и вернуть функцию для его удаления */
    addHandler: (handler: (data: OrderStatusUpdate) => void) => () => void;
    /** Вызвать все обработчики с новыми данными */
    notify: (data: OrderStatusUpdate) => void;
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