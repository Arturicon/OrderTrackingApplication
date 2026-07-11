import { useEffect, useState, useCallback } from 'react';
import { signalRService } from '../services/signalRService';
import type { Order, OrderStatus } from '../types/order';

interface UseSignalRResult {
    isConnected: boolean;
    transport: string | undefined;
    connectionId: string | undefined|null;
    lastStatusUpdate: { orderId: string; status: OrderStatus; updatedAt: string } | null;
    lastOrderCreated: Order | null;
    lastOrderDeleted: { orderId: string; deletedAt: string } | null;
    subscribeToOrder: (orderId: string) => Promise<void>;
    unsubscribeFromOrder: (orderId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
    createOrder: (description: string, status?: OrderStatus) => Promise<void>;
    deleteOrder: (orderId: string) => Promise<void>;
    ping: () => Promise<void>;
}

export function useSignalR(): UseSignalRResult {
    const [isConnected, setIsConnected] = useState(signalRService.isConnectionActive());
    const [transport, setTransport] = useState(signalRService.getTransport());
    const [connectionId, setConnectionId] = useState(signalRService.getConnectionId());
    const [lastStatusUpdate, setLastStatusUpdate] = useState<{ orderId: string; status: OrderStatus; updatedAt: string } | null>(null);
    const [lastOrderCreated, setLastOrderCreated] = useState<Order | null>(null);
    const [lastOrderDeleted, setLastOrderDeleted] = useState<{ orderId: string; deletedAt: string } | null>(null);

    useEffect(() => {
        // Подключаемся при монтировании
        const connect = async () => {
            try {
                await signalRService.start();
                setIsConnected(true);
                setTransport(signalRService.getTransport());
                setConnectionId(signalRService.getConnectionId());
            } catch (error) {
                console.error('Failed to connect:', error);
                setIsConnected(false);
            }
        };

        connect();

        // Подписка на события
        const unsubConnected = signalRService.on('connected', (data) => {
            setIsConnected(true);
            setTransport(data.transport);
            setConnectionId(data.connectionId);
            console.log('📡 Connected with transport:', data.transport);
        });

        const unsubStatusUpdate = signalRService.on('statusUpdated', (data) => {
            setLastStatusUpdate(data);
        });

        const unsubOrderCreated = signalRService.on('orderCreated', (data) => {
            setLastOrderCreated(data);
        });

        const unsubOrderDeleted = signalRService.on('orderDeleted', (data) => {
            setLastOrderDeleted(data);
        });

        const unsubConnectionState = signalRService.on('connectionStateChanged', ({ state }) => {
            if (state === 'disconnected') {
                setIsConnected(false);
            } else if (state === 'reconnected') {
                setIsConnected(true);
                setTransport(signalRService.getTransport());
                setConnectionId(signalRService.getConnectionId());
            }
        });

        return () => {
            unsubConnected();
            unsubStatusUpdate();
            unsubOrderCreated();
            unsubOrderDeleted();
            unsubConnectionState();
            signalRService.stop();
        };
    }, []);

    const subscribeToOrder = useCallback(async (orderId: string) => {
        await signalRService.subscribeToOrder(orderId);
    }, []);

    const unsubscribeFromOrder = useCallback(async (orderId: string) => {
        await signalRService.unsubscribeFromOrder(orderId);
    }, []);

    const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
        await signalRService.updateOrderStatus(orderId, status);
    }, []);

    const createOrder = useCallback(async (description: string, status: OrderStatus = 'created') => {
        await signalRService.createOrder({ description, status });
    }, []);

    const deleteOrder = useCallback(async (orderId: string) => {
        await signalRService.deleteOrder(orderId);
    }, []);

    const ping = useCallback(async () => {
        await signalRService.ping();
    }, []);

    return {
        isConnected,
        transport,
        connectionId,
        lastStatusUpdate,
        lastOrderCreated,
        lastOrderDeleted,
        subscribeToOrder,
        unsubscribeFromOrder,
        updateOrderStatus,
        createOrder,
        deleteOrder,
        ping,
    };
}