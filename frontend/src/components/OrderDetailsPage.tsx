// src/components/OrderDetailsPage.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderStatusTracker } from './OrderStatusTracker';
import { useOrderStore } from '../store/orderStore';
import { formatDate } from '../utils/helpers';
import { statusLabels, statusColors } from '../constants/orderConstants';
import type { OrderStatus } from '../types/order';

export function OrderDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = useOrderStore((state) => state.fetchOrder);
    const currentOrder = useOrderStore((state) => state.currentOrder);
    const updateStatus = useOrderStore((state) => state.updateStatus);

    useEffect(() => {
        if (!id) return;

        const loadOrder = async () => {
            setLoading(true);
            setError(null);
            try {
                await fetchOrder(id);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки заказа');
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [id, fetchOrder]);

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!id) return;
        try {
            await updateStatus(id, newStatus);
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    if (loading) {
        return (
            <div className="container py-4">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                    <p className="text-muted mt-2">Загрузка данных заказа...</p>
                </div>
            </div>
        );
    }

    if (error || !currentOrder) {
        return (
            <div className="container py-4">
                <div className="alert alert-danger">
                    <h5>❌ Ошибка</h5>
                    <p>{error || 'Заказ не найден'}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        На главную
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Навигация */}
            <div className="mb-4">
                <button className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                    ← Назад к списку
                </button>
            </div>

            {/* Заголовок */}
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h1 className="display-6 fw-bold">📦 Детали заказа</h1>
                    <p className="text-muted">Заказ #{currentOrder.orderNumber}</p>
                </div>
                <div className="text-end">
                    <span className={`badge bg-${statusColors[currentOrder.status]} fs-5 p-2`}>
                        {statusLabels[currentOrder.status]}
                    </span>
                </div>
            </div>

            <div className="row">
                {/* Основная информация - передаем отдельные поля */}
                <div className="col-lg-8">
                    <OrderStatusTracker 
                        orderId={currentOrder.id}
                        currentStatus={currentOrder.status}
                        createdAt={currentOrder.createdAt}
                        updatedAt={currentOrder.updatedAt}
                        orderNumber={currentOrder.orderNumber}
                        onStatusUpdate={handleStatusChange}
                    />
                </div>

                {/* Дополнительная информация */}
                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-light">
                            <h6 className="mb-0">ℹ️ Информация о заказе</h6>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <small className="text-muted d-block">Номер заказа</small>
                                <strong>{currentOrder.orderNumber}</strong>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Описание</small>
                                <p className="mb-0">{currentOrder.description}</p>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Дата создания</small>
                                <span>{formatDate(currentOrder.createdAt)}</span>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">Последнее обновление</small>
                                <span>{formatDate(currentOrder.updatedAt)}</span>
                            </div>
                            <div>
                                <small className="text-muted d-block">Статус</small>
                                <span className={`badge bg-${statusColors[currentOrder.status]}`}>
                                    {statusLabels[currentOrder.status]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}