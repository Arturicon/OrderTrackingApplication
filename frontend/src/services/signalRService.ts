import * as signalR from '@microsoft/signalr';
import type { Order, OrderStatus } from '../types/order';

interface StatusUpdateEvent {
    orderId: string;
    status: OrderStatus;
    updatedAt: string;
}

interface OrderCreatedEvent extends Order {}

interface OrderDeletedEvent {
    orderId: string;
    deletedAt: string;
}

type EventHandler<T = any> = (data: T) => void;

class SignalRService {
    private connection: signalR.HubConnection | null = null;
    private isConnected = false;
    private transport: string | undefined;
    private handlers: Map<string, Set<EventHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private hubUrl = "https://localhost:7099/orderHub"; //todo get from config
    private startPromise: Promise<void> | null = null; // Для ожидания завершения запуска

    constructor() {
        this.setupConnection();
    }

    private setupConnection(): void {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(this.hubUrl
                , {
                // Ограничиваем транспорт только WebSocket и SSE
                transport: signalR.HttpTransportType.WebSockets | 
                          signalR.HttpTransportType.ServerSentEvents,
                // Отключаем согласование для упрощения
                skipNegotiation: false, // Оставляем для определения лучшего транспорта
                withCredentials: true,
                timeout: 30000,
                headers: {
                    'X-SignalR-Transport': 'websockets,sse'
                }
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                        return null; // Прекращаем попытки переподключения
                    }
                    
                    const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
                    this.reconnectAttempts++;
                    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
                    return delay;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.registerConnectionEvents();
        this.registerHubEvents();
    }

    private registerConnectionEvents(): void {
        if (!this.connection) return;

        this.connection.onclose((error) => {
            this.isConnected = false;
            console.log('🔴 SignalR connection closed:', error);
            this.emit('connectionStateChanged', { state: 'disconnected', error });
        });

        this.connection.onreconnecting((error) => {
            console.log(`🔄 SignalR reconnecting (attempt ${this.reconnectAttempts}):`, error);
            this.emit('connectionStateChanged', { state: 'reconnecting', error });
        });

        this.connection.onreconnected((connectionId) => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log(`✅ SignalR reconnected. ConnectionId: ${connectionId}`);
            this.emit('connectionStateChanged', { state: 'reconnected', connectionId });
        });
    }

    private registerHubEvents(): void {
        if (!this.connection) return;

        // Обработчик подключения
        this.connection.on('Connected', (data: { connectionId: string; transport: string }) => {
            this.transport = data.transport;
            this.isConnected = true;
            console.log(`✅ Connected to SignalR. Transport: ${data.transport}`);
            this.emit('connected', data);
        });

        // Обработчик обновления статуса
        this.connection.on('StatusUpdated', (data: StatusUpdateEvent) => {
            console.log(`📨 Status updated:`, data);
            this.emit('statusUpdated', data);
        });

        // Обработчик создания заказа
        this.connection.on('OrderCreated', (data: OrderCreatedEvent) => {
            console.log(`📨 Order created:`, data);
            this.emit('orderCreated', data);
        });

        // Обработчик удаления заказа
        this.connection.on('OrderDeleted', (data: OrderDeletedEvent) => {
            console.log(`📨 Order deleted:`, data);
            this.emit('orderDeleted', data);
        });

        // Обработчик подтверждения подписки
        this.connection.on('Subscribed', (data: { orderId: string; success: boolean }) => {
            console.log(`📨 Subscribed to order:`, data);
            this.emit('subscribed', data);
        });

        // Обработчик отписки
        this.connection.on('Unsubscribed', (data: { orderId: string; success: boolean }) => {
            console.log(`📨 Unsubscribed from order:`, data);
            this.emit('unsubscribed', data);
        });

        // Обработчик Pong
        this.connection.on('Pong', (timestamp: string) => {
            console.log(`🏓 Pong received at: ${timestamp}`);
            this.emit('pong', { timestamp });
        });

        // Обработчик ошибок
        this.connection.on('Error', (error: any) => {
            console.error('❌ Hub error:', error);
            this.emit('error', error);
        });
    }

    // Подписка на события
    on<T = any>(event: string, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler as EventHandler);

        return () => {
            const handlers = this.handlers.get(event);
            if (handlers) {
                handlers.delete(handler as EventHandler);
                if (handlers.size === 0) {
                    this.handlers.delete(event);
                }
            }
        };
    }

    private emit<T = any>(event: string, data: T): void {
        const handlers = this.handlers.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }


    // Подключение
    async start(): Promise<void> {
        // Если уже есть запущенный процесс - возвращаем его
        if (this.startPromise) {
            return this.startPromise;
        }

        // Если уже подключены - выходим
        if (this.isConnected) {
            return;
        }

        // Запускаем и сохраняем Promise
        this.startPromise = this.connection!.start()
            .then(() => {
                this.isConnected = true;
                console.log('✅ SignalR connected');
            })
            .catch((err) => {
                console.error('❌ SignalR connection failed:', err);
                throw err;
            })
            .finally(() => {
                this.startPromise = null; // Очищаем после завершения
            });

        return this.startPromise;
    }

    // Отключение
    async stop(): Promise<void> {
        if (!this.connection || !this.isConnected) {
            return;
        }

        try {
            await this.connection.stop();
            this.isConnected = false;
            console.log('🔴 SignalR connection stopped');
        } catch (error) {
            console.error('❌ Error stopping SignalR connection:', error);
        }
    }

    // Проверка состояния
    isConnectionActive(): boolean {
        return this.isConnected && this.connection?.state === signalR.HubConnectionState.Connected;
    }

    getTransport(): string | undefined {
        return this.transport;
    }

    getConnectionId(): string|undefined|null {
        return this.connection?.connectionId;
    }

    // Подписка на заказ
    async subscribeToOrder(orderId: string): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('SubscribeToOrder', orderId);
    }

    // Отписка от заказа
    async unsubscribeFromOrder(orderId: string): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('UnsubscribeFromOrder', orderId);
    }

    // Получение статуса заказа
    async getOrderStatus(orderId: string): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('GetOrderStatus', orderId);
    }

    // Обновление статуса заказа
    async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('UpdateOrderStatus', orderId, status);
    }

    // Создание заказа
    async createOrder(orderData: { description: string; status?: OrderStatus }): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('CreateOrder', orderData);
    }

    // Удаление заказа
    async deleteOrder(orderId: string): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('DeleteOrder', orderId);
    }

    // Ping
    async ping(): Promise<void> {
        if (!this.isConnectionActive()) {
            throw new Error('Connection not active');
        }
        await this.connection!.invoke('Ping');
    }
}

// Создаем и экспортируем синглтон
export const signalRService = new SignalRService();
    // import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5000/orderHub'
// );