import { useEffect, useCallback, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import type { OrderStatusUpdate } from '../stores/orderStrore';
import { signalRStore } from '../stores/signalRStore';

interface UseSignalRResult {
    subscribeToOrder: (orderId: string) => Promise<void>;
    unsubscribeFromOrder: (orderId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: string) => Promise<void>;
    onOrderStatusChanged: (callback: (data: OrderStatusUpdate) => void) => () => void;
    isConnected : boolean
    ping: () => Promise<void>;
}

// 🌍 Глобальный экземпляр подключения (один на всё приложение)
let globalConnection: signalR.HubConnection | null = null;
let isConnectionStarted = false;

export function useSignalR(): UseSignalRResult {
    // ✅ Локальный реф для хранения обработчиков (НЕ в сторе!)
    const addHandler = signalRStore((state) => state.addHandler);
    const notify = signalRStore((state) => state.notify);
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // ✅ Инициализация подключения (один раз)
    useEffect(() => {
        if (globalConnection) {
            console.log('⏭️ Используем существующее подключение');
            connectionRef.current = globalConnection;
            return;
        }

        //todo address
        console.log('🔌 Создаём НОВОЕ подключение SignalR');
        connectionRef.current = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7125/orderHub", {
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
            })
            .withAutomaticReconnect()
            .build();


        connectionRef.current.on("OrderStatusChanged", (data: OrderStatusUpdate) => {
            console.log('📨 Получено событие от сервера');
            notify(data); 
        });

        globalConnection = connectionRef.current;


        if (!isConnectionStarted) {
            isConnectionStarted = true;
            connectionRef.current.start()
                .then(() =>{setIsConnected(true); console.log('✅ SignalR подключен')})
                .catch(err => console.error('❌ Ошибка:', err));
        }
        connectionRef.current.onreconnected(() => {
            setIsConnected(true);
        });
        return () => {
            console.log('🧹 Хук размонтирован');
            setIsConnected(false);
        };
    }, [notify]);

    // ✅ Метод подписки (через стор)
    const onOrderStatusChanged = useCallback((callback: (data: OrderStatusUpdate) => void) => {
        return addHandler(callback);
    }, [addHandler]);

    // ✅ Подписка на заказ
    const subscribeToOrder = useCallback(async (orderId: string) => {
        const connection = connectionRef.current || globalConnection;
        if (!connection) {
            console.warn('⚠️ SignalR не инициализирован');
            return;
        }
        try {
            await connection.invoke("SubscribeToOrder", orderId);
            console.log(`📡 Подписались на заказ ${orderId}`);
        } catch (err) {
            console.error(`❌ Ошибка подписки на заказ ${orderId}:`, err);
        }
    }, []);

    // ✅ Отписка от заказа
    const unsubscribeFromOrder = useCallback(async (orderId: string) => {
        const connection = connectionRef.current || globalConnection;
        if (!connection) {
            console.warn('⚠️ SignalR не инициализирован');
            return;
        }
        try {
            await connection.invoke("UnsubscribeFromOrder", orderId);
            console.log(`📡 Отписались от заказа ${orderId}`);
        } catch (err) {
            console.error(`❌ Ошибка отписки от заказа ${orderId}:`, err);
        }
    }, []);

    const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
        // TODO: реализация
        console.log('updateOrderStatus:', orderId, status);
    }, []);

    const ping = useCallback(async () => {
        // TODO: реализация
        console.log('ping');
    }, []);

    return {
        subscribeToOrder,
        unsubscribeFromOrder,
        updateOrderStatus,
        onOrderStatusChanged,
        isConnected,
        ping,
    };
}

