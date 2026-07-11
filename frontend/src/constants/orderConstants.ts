// src/constants/orderConstants.ts
import type { OrderStatus } from '../types/order'; // ← добавили type

export const statusLabels: Record<OrderStatus, string> = {
    created: 'Создан',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
};

export const statusColors: Record<OrderStatus, string> = {
    created: 'secondary',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
};

export const statusOptions: OrderStatus[] = ['created', 'shipped', 'delivered', 'cancelled'];

// Новые константы для статусов
export const statusSteps: OrderStatus[] = ['created', 'shipped', 'delivered', 'cancelled'];
export const statusIcons: Record<OrderStatus, string> = {
    created: '📝',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '❌',
};

export const statusDescriptions: Record<OrderStatus, string> = {
    created: 'Заказ создан и ожидает обработки',
    shipped: 'Заказ отправлен и находится в пути',
    delivered: 'Заказ доставлен получателю',
    cancelled: 'Заказ отменен',
};

