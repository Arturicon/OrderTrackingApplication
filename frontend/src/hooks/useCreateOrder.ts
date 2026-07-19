import { useState } from 'react';
import { orderService } from '../services/orderService.js';
import type { Order } from '../types/types.js';

/**
 * Результат хука useCreateOrder.
 */
interface UseCreateOrderResult {
    /** Создать новый заказ */
    createOrder: (description: string) => Promise<Order | null>;
    /** Флаг загрузки */
    isLoading: boolean;
    /** Сообщение об ошибке */
    error: string | null;
    /** Сбросить состояние */
    reset: () => void;
}

/**
 * Хук для создания нового заказа.
 */
export function useCreateOrder(): UseCreateOrderResult {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOrder = async (description: string): Promise<Order | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const newOrder = await orderService.fetchCreateOrder(description.trim());
            return newOrder;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Ошибка создания';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setIsLoading(false);
    };

    return { createOrder, isLoading, error, reset };
}