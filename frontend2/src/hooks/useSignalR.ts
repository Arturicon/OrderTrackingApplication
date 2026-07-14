import { useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { OrderStatusUpdate } from '../stores/orderStrore';
import { signalRStore } from '../stores/signalRStore';

interface UseSignalRResult {
    subscribeToOrder: (orderId: string) => Promise<void>;
    unsubscribeFromOrder: (orderId: string) => Promise<void>;
    updateOrderStatus: (orderId: string, status: string) => Promise<void>;
    onOrderStatusChanged: (callback: (data: OrderStatusUpdate) => void) => () => void;
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

    // ✅ Инициализация подключения (один раз)
    useEffect(() => {
        if (globalConnection) {
            console.log('⏭️ Используем существующее подключение');
            connectionRef.current = globalConnection;
            return;
        }

        console.log('🔌 Создаём НОВОЕ подключение SignalR');
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7125/orderHub", {
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
            })
            .withAutomaticReconnect()
            .build();

        // ✅ Подписка на событие (через стор)
        connection.on("OrderStatusChanged", (data: OrderStatusUpdate) => {
            console.log('📨 Получено событие от сервера');
            notify(data); // ← вызывает ВСЕ обработчики из стора
        });

        globalConnection = connection;
        connectionRef.current = connection;

        if (!isConnectionStarted) {
            isConnectionStarted = true;
            connection.start()
                .then(() => console.log('✅ SignalR подключен'))
                .catch(err => console.error('❌ Ошибка:', err));
        }

        return () => {
            console.log('🧹 Хук размонтирован');
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
        ping,
    };
}

// export function useSignalR(): UseSignalRResult {
//     // const [isConnected, setIsConnected] = useState(signalRService.isConnectionActive());
//     // const [transport, setTransport] = useState(signalRService.getTransport());

//     const addHandler = signalRStore((state) => state.addHandler);
//     const connectionRef = useRef<signalR.HubConnection | null>(null);
//     const notify = signalRStore((state) => state.notify); // ← из стора

// useEffect(() => {
//     //todo address
//         const connection = new signalR.HubConnectionBuilder()
//             .withUrl("https://localhost:7125/orderHub",  {
//                 transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
//             })
//             .withAutomaticReconnect({
//                 nextRetryDelayInMilliseconds: (retryContext) => {
//                     const delays = [1000, 2000, 4000, 8000, 10000];
//                     if (retryContext.previousRetryCount >= delays.length) {
//                         return 10000;
//                     }
//                     return delays[retryContext.previousRetryCount];
//                 }
//             })
//             .build();

//         connectionRef.current = connection;

//         connection.on("OrderStatusChanged", (data: OrderStatusUpdate) => {
//             notify(data); // ← Используем стор
//         });

//         connection.start().catch(err => console.error('SignalR connection error:', err));

//         return () => {
//             if (connection.state === signalR.HubConnectionState.Connected) {
//                 connection.stop();
//             }
//             connectionRef.current = null;
//         };
//     }, [notify]);


//     const onOrderStatusChanged = useCallback((callback: (data: OrderStatusUpdate) => void) => {
//         return addHandler(callback);
//     }, []);

//     const subscribeToOrder = useCallback(async (orderId: string) => {
//         if(connectionRef.current)
//             connectionRef.current.invoke("subscribeToOrder", `${orderId}`)
//     }, []);

//     const unsubscribeFromOrder = useCallback(async (orderId: string) => {
//           if(connectionRef.current)
//             connectionRef.current.invoke("UnsubscribeFromOrder", `${orderId}`)
//     }, []);

//     const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
//         // await signalRService.updateOrderStatus(orderId, status);
//     }, []);

//     // const createOrder = useCallback(async (description: string, status: string = 'created') => {
//     //     await signalRService.createOrder({ description, status });
//     // }, []);

//     // const deleteOrder = useCallback(async (orderId: string) => {
//     //     await signalRService.deleteOrder(orderId);
//     // }, []);

//     const ping = useCallback(async () => {
//         // await signalRService.ping();
//     }, []);

//     return {
//         // isConnected,
//         // transport,
//         subscribeToOrder,
//         unsubscribeFromOrder,
//         updateOrderStatus,
//         onOrderStatusChanged,
//         // createOrder,
//         // deleteOrder,
//         ping,
//     };
// }