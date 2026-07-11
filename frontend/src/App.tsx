import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderList } from './components/OrderList';
import { OrderForm } from './components/OrderForm';
import { OrderDetailsPage } from './components/OrderDetailsPage';
import { SignalRStatus } from './components/SignalRStatus';
import { useOrderStore } from './store/orderStore';
import { useSignalR } from './hooks/useSignalR';
import { HubConnectionBuilder, HubConnection} from "@microsoft/signalr";

function App() {
    const fetchOrders = useOrderStore((state) => state.fetchAllOrders);
    const { isConnected, ping } = useSignalR();

    useEffect(() => {
        fetchOrders();
    }, []);

    // Пинг для проверки соединения
    useEffect(() => {
        const interval = setInterval(() => {
            if (isConnected) {
                ping().catch(console.error);
            }
        }, 30000); // Каждые 30 секунд

        return () => clearInterval(interval);
    }, [isConnected, ping]);

    return (
        <div className="container py-4" style={{ maxWidth: '1200px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-6 fw-bold">📦 Управление заказами</h1>
                {/* <SignalRStatus /> */}
            </div>

            <Routes>
                <Route path="/" element={
                    <>
                        <OrderForm />
                        <OrderList />
                    </>
                } />
                <Route path="/order/:id" element={<OrderDetailsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default App;