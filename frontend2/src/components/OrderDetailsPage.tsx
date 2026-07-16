// OrderDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from 'react-bootstrap';
import { useOrderStore, type Order } from '../stores/orderStrore';
import { useSignalR } from "../hooks/useSignalR";

export function OrderDetailsPage() {
    const { id } = useParams<string>();
    const navigate = useNavigate();
    
    // ✅ Получаем orders из стора
    const orders = useOrderStore((state) => state.orders);
    const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
    const { onOrderStatusChanged, subscribeToOrder, unsubscribeFromOrder } = useSignalR();

    // ✅ Вычисляем currentOrder на основе orders из стора
    const currentOrder = orders.find(order => order.id === id);

    // ✅ Подписка на уведомления
    useEffect(() => {
        const unsubscribe = onOrderStatusChanged((data) => {
            console.log('📨 Получено обновление статуса:', data);
            updateOrderStatus(data.orderId, data.newStatus);
        });
        
        return unsubscribe;
    }, [onOrderStatusChanged, updateOrderStatus]);


    if (!id) {
        return <div>Order ID is missing</div>;
    }

    if (!currentOrder) {
        return <div>Loading order details...</div>;
    }

    return (
        <>
            <span>Number: {currentOrder.orderNumber}</span><br/>
            <span>Status: {currentOrder.status}</span><br/>
            <Button onClick={() => subscribeToOrder(id)}>Подписаться на уведомления</Button><br/>
            <Button onClick={() => unsubscribeFromOrder(id)}>Отписаться от уведомлений</Button><br/>
        </>
    );
}