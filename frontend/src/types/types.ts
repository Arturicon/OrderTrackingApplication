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

export interface Notification {
    id: string;
    orderId: string;
    orderNumber: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

export const statusRuss: Record<string, string> = {
    'created': 'Создан',
    'shipped': 'Отправлен',
    'delivered': 'Доставлен',
    'cancelled': 'Отменён',
};