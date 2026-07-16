// hooks/useSignalR.ts
import { useEffect, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import type { OrderStatusUpdate } from '../stores/orderStrore';
import { signalRStore } from '../stores/signalRStore';
import { subscriptionStore } from '../stores/subscriptionStore';

interface UseSignalRResult {
    subscribeToOrder: (orderId: string) => Promise<void>;
    unsubscribeFromOrder: (orderId: string) => Promise<void>;
    onOrderStatusChanged: (callback: (data: OrderStatusUpdate) => void) => () => void;
    connection: signalR.HubConnection | null;
} 

// 🌍 Глобальный экземпляр подключения (один на всё приложение)
let globalConnection: signalR.HubConnection | null = null;
let isConnectionStarted = false;
let isGlobalHandlerRegistered = false;
let isReconnectHandlerRegistered = false;

export function useSignalR(): UseSignalRResult {
    const addHandler = signalRStore((state) => state.addHandler);
    const notify = signalRStore((state) => state.notify);
    const { addSubscription, removeSubscription } = subscriptionStore();
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const hookId = useRef(`hook_${Date.now()}_${Math.random()}`);

    // ✅ Функция восстановления подписок
    const restoreSubscriptions = useCallback(async (connection: signalR.HubConnection) => {
        const orderIds = subscriptionStore.getState().subscribedOrderIds;
        
        if (orderIds.length === 0) {
            console.log('ℹ️ Нет сохранённых подписок для восстановления');
            return;
        }

        console.log(`🔄 Восстанавливаем подписки для заказов: ${orderIds.join(', ')}`);

        for (const orderId of orderIds) {
            try {
                await connection.invoke("SubscribeToOrder", orderId);
                console.log(`✅ Восстановлена подписка на заказ ${orderId}`);
            } catch (err) {
                console.error(`❌ Ошибка восстановления подписки на заказ ${orderId}:`, err);
            }
        }
    }, []);

    // ✅ ИНИЦИАЛИЗАЦИЯ ПОДКЛЮЧЕНИЯ
    useEffect(() => {
        console.log(`🔍 [${hookId.current}] Эффект инициализации`);

        // Если уже есть глобальное подключение
        if (globalConnection) {
            console.log(`⏭️ [${hookId.current}] Используем существующее подключение`);
            connectionRef.current = globalConnection;
            
            const state = globalConnection.state;
            console.log(`🔍 [${hookId.current}] Состояние глобального подключения: ${state}`);
            
            if (state === signalR.HubConnectionState.Connected) {
                console.log(`✅ [${hookId.current}] Соединение уже установлено`);
                
                // ✅ Восстанавливаем подписки при подключении
                restoreSubscriptions(globalConnection);
            } else if (state === signalR.HubConnectionState.Connecting) {
                console.log(`⏳ [${hookId.current}] Соединение в процессе установки...`);
                // Подписываемся на событие, чтобы узнать когда подключится
                const checkConnection = setInterval(() => {
                    if (globalConnection?.state === signalR.HubConnectionState.Connected) {
                        console.log(`✅ [${hookId.current}] Соединение установлено (проверка)`);
                        restoreSubscriptions(globalConnection);
                        clearInterval(checkConnection);
                    }
                }, 500);
                
                return () => clearInterval(checkConnection);
            } else if (state === signalR.HubConnectionState.Disconnected) {
                console.log(`🔄 [${hookId.current}] Соединение отключено, пробуем переподключиться...`);
                
                globalConnection.start()
                    .then(() => {
                        console.log(`✅ [${hookId.current}] Переподключение успешно`);
                        restoreSubscriptions(globalConnection!);
                    })
                    .catch(err => {
                        console.error(`❌ [${hookId.current}] Ошибка переподключения:`, err);
                    });
            }
            return;
        }

        // ✅ СОЗДАЁМ НОВОЕ ПОДКЛЮЧЕНИЕ
        console.log(`🔌 [${hookId.current}] Создаём НОВОЕ подключение SignalR`);
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7125/orderHub", {
                transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: (retryContext) => {
                    if (retryContext.previousRetryCount === undefined) return 0;
                    return Math.min(10000, 1000 * Math.pow(2, retryContext.previousRetryCount));
                }
            })
            .build();

        // ✅ РЕГИСТРИРУЕМ ГЛОБАЛЬНЫЙ ОБРАБОТЧИК (ТОЛЬКО 1 РАЗ)
        if (!isGlobalHandlerRegistered) {
            isGlobalHandlerRegistered = true;
            console.log(`📡 [${hookId.current}] РЕГИСТРИРУЕМ ГЛОБАЛЬНЫЙ ОБРАБОТЧИК`);
            
            connection.on("OrderStatusChanged", (data: OrderStatusUpdate) => {
                console.log('📨 Получено событие от сервера (ГЛОБАЛЬНЫЙ)');
                console.log('📨 Данные:', data);
                notify(data);
            });
        }

        // ✅ ОБРАБОТЧИК ПЕРЕПОДКЛЮЧЕНИЯ (ТОЛЬКО 1 РАЗ)
        if (!isReconnectHandlerRegistered) {
            isReconnectHandlerRegistered = true;
            console.log(`🔄 [${hookId.current}] РЕГИСТРИРУЕМ ОБРАБОТЧИК ПЕРЕПОДКЛЮЧЕНИЯ`);
            
            connection.onreconnected((connectionId) => {
                console.log(`✅ [${hookId.current}] SignalR переподключился. ConnectionId: ${connectionId}`);          
                // ✅ ВАЖНО: Восстанавливаем подписки после переподключения
                console.log('🔄 Восстанавливаем подписки после переподключения...');
                const orderIds = subscriptionStore.getState().subscribedOrderIds;
                if (orderIds.length > 0) {
                    restoreSubscriptions(connection);
                }
            });
        }

        connection.onreconnecting(() => {
            console.log(`🔄 [${hookId.current}] SignalR переподключается...`);
        });

        connection.onclose(() => {
            console.log(`🔌 [${hookId.current}] SignalR отключился`);
        });

        globalConnection = connection;
        connectionRef.current = connection;

        // ✅ ЗАПУСКАЕМ ПОДКЛЮЧЕНИЕ
        if (!isConnectionStarted) {
            isConnectionStarted = true;
            console.log(`🚀 [${hookId.current}] Запускаем подключение...`);
            
            connection.start()
                .then(() => {
                    console.log(`✅ [${hookId.current}] SignalR подключен`);                    
                    // ✅ Восстанавливаем подписки после первого подключения
                    restoreSubscriptions(connection);
                })
                .catch(err => {
                    console.error(`❌ [${hookId.current}] Ошибка подключения:`, err);
                    
                    // ✅ Повторная попытка через 5 секунд
                    setTimeout(() => {
                        console.log(`🔄 [${hookId.current}] Повторная попытка подключения...`);
                        if (globalConnection) {
                            globalConnection.start()
                                .then(() => {
                                    console.log(`✅ [${hookId.current}] Повторное подключение успешно`);
                                    restoreSubscriptions(globalConnection!);
                                })
                                .catch(err => console.error('❌ Ошибка повторного подключения:', err));
                        }
                    }, 5000);
                });
        }

        return () => {
            console.log(`🧹 [${hookId.current}] Хук размонтирован`);
            // ❗ НЕ закрываем глобальное соединение
        };
    }, [restoreSubscriptions]);

    // ✅ Метод подписки на событие (через стор)
    const onOrderStatusChanged = useCallback((callback: (data: OrderStatusUpdate) => void) => {
        console.log(`📝 [${hookId.current}] Регистрация callback в сторе`);
        return addHandler(callback);
    }, [addHandler]);

    // ✅ Подписка на заказ (с сохранением в store)
    const subscribeToOrder = useCallback(async (orderId: string) => {
        console.log(`🔍 [${hookId.current}] subscribeToOrder вызван для заказа ${orderId}`);
        
        const connection = connectionRef.current || globalConnection;
        if (!connection) {
            console.warn(`⚠️ [${hookId.current}] SignalR не инициализирован`);
            return;
        }

        // ✅ Сохраняем ID заказа в store ДЛЯ ВОССТАНОВЛЕНИЯ
        addSubscription(orderId);
        console.log(`💾 [${hookId.current}] Сохранена подписка на заказ ${orderId} в store`);

        // Проверяем состояние соединения
        console.log(`🔍 [${hookId.current}] Состояние соединения: ${connection.state}`);

        if (connection.state !== signalR.HubConnectionState.Connected) {
            console.warn(`⚠️ [${hookId.current}] SignalR не подключен, пытаемся подключиться...`);
            try {
                await connection.start();
                console.log(`✅ [${hookId.current}] Подключение успешно`);

            } catch (err) {
                console.error(`❌ [${hookId.current}] Не удалось подключиться:`, err);
                return;
            }
        }

        try {
            await connection.invoke("SubscribeToOrder", orderId);
            console.log(`📡 [${hookId.current}] Подписались на заказ ${orderId}`);
        } catch (err) {
            console.error(`❌ [${hookId.current}] Ошибка подписки на заказ ${orderId}:`, err);
        }
    }, [addSubscription]);

    // ✅ Отписка от заказа (с удалением из store)
    const unsubscribeFromOrder = useCallback(async (orderId: string) => {
        console.log(`🔍 [${hookId.current}] unsubscribeFromOrder вызван для заказа ${orderId}`);
        
        const connection = connectionRef.current || globalConnection;
        if (!connection) {
            console.warn('⚠️ SignalR не инициализирован');
            return;
        }

        // ✅ Удаляем ID заказа из store
        removeSubscription(orderId);
        console.log(`🗑️ [${hookId.current}] Удалена подписка на заказ ${orderId} из store`);

        if (connection.state !== signalR.HubConnectionState.Connected) {
            console.warn(`⚠️ [${hookId.current}] SignalR не подключен`);
            return;
        }

        try {
            await connection.invoke("UnsubscribeFromOrder", orderId);
            console.log(`📡 [${hookId.current}] Отписались от заказа ${orderId}`);
        } catch (err) {
            console.error(`❌ [${hookId.current}] Ошибка отписки от заказа ${orderId}:`, err);
        }
    }, [removeSubscription]);



    return {
        subscribeToOrder,
        unsubscribeFromOrder,
        onOrderStatusChanged,
        connection: connectionRef.current || globalConnection,
    };
}