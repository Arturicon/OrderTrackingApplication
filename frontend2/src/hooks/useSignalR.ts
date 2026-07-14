import { useEffect, useState, useCallback, useRef  } from 'react';
import * as signalR from '@microsoft/signalr';
import type {OrderStatusUpdate} from '../stores/orderStrore'
import { data } from 'react-router';
import { signalRStore } from '../stores/signalRStore';

interface UseSignalRResult {
    // isConnected: boolean;
    // transport: string | undefined;
    subscribeToOrder: (orderId: string) => Promise<void>;
    unsubscribeFromOrder: (orderId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: string) => Promise<void>;
    onOrderStatusChanged: (callback: (data: OrderStatusUpdate) => void) => () => void;
    // createOrder: (description: string, status?: string) => Promise<void>;
    // deleteOrder: (orderId: string) => Promise<void>;
    ping: () => Promise<void>;
}

export function useSignalR(): UseSignalRResult {
    // const [isConnected, setIsConnected] = useState(signalRService.isConnectionActive());
    // const [transport, setTransport] = useState(signalRService.getTransport());

    const addHandler = signalRStore((state) => state.addHandler);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const notify = signalRStore((state) => state.notify); // ← из стора

useEffect(() => {
    //todo address
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7125/orderHub",  {
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    const delays = [1000, 2000, 4000, 8000, 10000];
                    if (retryContext.previousRetryCount >= delays.length) {
                        return 10000;
                    }
                    return delays[retryContext.previousRetryCount];
                }
            })
            .build();

        connectionRef.current = connection;

        connection.on("OrderStatusChanged", (data: OrderStatusUpdate) => {
            notify(data); // ← Используем стор
        });

        connection.start().catch(err => console.error('SignalR connection error:', err));

        return () => {
            if (connection.state === signalR.HubConnectionState.Connected) {
                connection.stop();
            }
            connectionRef.current = null;
        };
    }, [notify]);


    const onOrderStatusChanged = useCallback((callback: (data: OrderStatusUpdate) => void) => {
        return addHandler(callback);
    }, [addHandler]);

    const subscribeToOrder = useCallback(async (orderId: string) => {
        if(connectionRef.current)
            connectionRef.current.invoke("subscribeToOrder", `${orderId}`)
    }, []);

    const unsubscribeFromOrder = useCallback(async (orderId: string) => {
          if(connectionRef.current)
            connectionRef.current.invoke("UnsubscribeFromOrder", `${orderId}`)
    }, []);

    const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
        // await signalRService.updateOrderStatus(orderId, status);
    }, []);

    // const createOrder = useCallback(async (description: string, status: string = 'created') => {
    //     await signalRService.createOrder({ description, status });
    // }, []);

    // const deleteOrder = useCallback(async (orderId: string) => {
    //     await signalRService.deleteOrder(orderId);
    // }, []);

    const ping = useCallback(async () => {
        // await signalRService.ping();
    }, []);

    return {
        // isConnected,
        // transport,
        subscribeToOrder,
        unsubscribeFromOrder,
        updateOrderStatus,
        onOrderStatusChanged,
        // createOrder,
        // deleteOrder,
        ping,
    };
}