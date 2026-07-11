export type OrderStatus = 'created' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
    id: string;
    orderNumber: string;
    description: string;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}


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

export type WebSocketMessageType = 
    | 'status_update' 
    | 'order_created' 
    | 'order_deleted'
    | 'connected'
    | 'subscribed'
    | 'unsubscribed'
    | 'error';

export interface WebSocketMessage {
    type: WebSocketMessageType;
    payload: {
        orderId?: string;
        order?: Order;
        status?: OrderStatus;
        timestamp: string;
        message?: string;
        error?: string;
    };
}