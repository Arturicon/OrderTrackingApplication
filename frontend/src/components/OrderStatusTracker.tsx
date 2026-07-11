import { useEffect, useState } from 'react';
import type { Order, OrderStatus } from '../types/order';
import { statusLabels, statusColors, statusIcons, statusSteps } from '../constants/orderConstants';
import { formatDate } from '../utils/helpers';
import { useSignalR } from '../hooks/useSignalR';

interface OrderStatusTrackerProps {
    orderId: string;
    currentStatus: OrderStatus;
    createdAt?: string;
    updatedAt?: string;
    orderNumber?: string;
    onStatusUpdate?: (newStatus: OrderStatus) => void;
}

export function OrderStatusTracker({ 
    orderId, 
    currentStatus, 
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
    orderNumber = orderId.slice(0, 8),
    onStatusUpdate }: OrderStatusTrackerProps) {
    const { 
        isConnected, 
        subscribeToOrder, 
        unsubscribeFromOrder, 
        lastStatusUpdate,
        updateOrderStatus 
    } = useSignalR();

    // Состояние для отслеживания текущего статуса
    const [status, setStatus] = useState<OrderStatus>(currentStatus);

    // Обновляем статус при изменении пропса
    useEffect(() => {
        setStatus(currentStatus);
    }, [currentStatus]);

    // Подписка на обновления заказа через WebSocket
    useEffect(() => {
        if (isConnected && orderId) {
            subscribeToOrder(orderId);
            console.log(`📡 Subscribed to order ${orderId}`);
        }

        return () => {
            if (isConnected && orderId) {
                unsubscribeFromOrder(orderId);
                console.log(`📡 Unsubscribed from order ${orderId}`);
            }
        };
    }, [isConnected, orderId, subscribeToOrder, unsubscribeFromOrder]);

    // Обработка обновления статуса через WebSocket
    useEffect(() => {
        if (lastStatusUpdate && lastStatusUpdate.orderId === orderId) {
            console.log(`🔄 Status updated via WebSocket: ${lastStatusUpdate.status}`);
            const newStatus = lastStatusUpdate.status as OrderStatus;
            setStatus(newStatus);
            onStatusUpdate?.(newStatus);
        }
    }, [lastStatusUpdate, orderId, onStatusUpdate]);

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!isConnected) {
            console.warn('⚠️ Cannot update status: SignalR not connected');
            alert('Нет подключения к серверу');
            return;
        }

        try {
            await updateOrderStatus(orderId, newStatus);
            console.log(`✅ Status update requested: ${newStatus}`);
            // Статус обновится через WebSocket
        } catch (error) {
            console.error('❌ Failed to update status:', error);
            alert('Не удалось обновить статус заказа');
        }
    };

    // Вспомогательные функции для отображения статуса
    const getStepStatus = (step: OrderStatus): 'completed' | 'current' | 'pending' | 'cancelled' => {
        const stepIndex = statusSteps.indexOf(step);
        const currentIndex = statusSteps.indexOf(status);

        if (status === 'cancelled') {
            if (step === 'cancelled') return 'cancelled';
            return 'pending';
        }

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'pending';
    };

    const getStepClass = (step: OrderStatus): string => {
        const stepStatus = getStepStatus(step);
        switch (stepStatus) {
            case 'completed':
                return 'bg-success text-white';
            case 'current':
                return 'bg-primary text-white pulse';
            case 'cancelled':
                return 'bg-danger text-white';
            default:
                return 'bg-light text-muted';
        }
    };

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📊 Статус заказа #{orderNumber}</h5>
                    {isConnected ? (
                        <span className="badge bg-success">🟢 Онлайн</span>
                    ) : (
                        <span className="badge bg-danger">🔴 Офлайн</span>
                    )}
                </div>
            </div>
            <div className="card-body">
                {/* Текущий статус */}
                <div className="mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <span className="display-4">{statusIcons[status]}</span>
                        <div>
                            <h4 className="mb-0">
                                <span className={`badge bg-${statusColors[status]} fs-5 p-2`}>
                                    {statusLabels[status]}
                                </span>
                            </h4>
                            <small className="text-muted">
                                Обновлен: {formatDate(updatedAt)}
                            </small>
                        </div>
                    </div>
                </div>

                {/* Шаговая индикация */}
                <div className="position-relative">
                    <div className="d-flex justify-content-between align-items-center">
                        {statusSteps.map((step, index) => {
                            const stepStatus = getStepStatus(step);
                            const isLast = index === statusSteps.length - 1;
                            const isCancelled = status === 'cancelled' && step === 'cancelled';

                            return (
                                <div key={step} className="d-flex flex-column align-items-center flex-grow-1">
                                    {/* Линия */}
                                    {!isLast && (
                                        <div 
                                            className="position-absolute" 
                                            style={{
                                                top: '20px',
                                                left: `${(index / (statusSteps.length - 1)) * 100}%`,
                                                width: `${100 / (statusSteps.length - 1)}%`,
                                                height: '4px',
                                                backgroundColor: stepStatus === 'pending' && !isCancelled ? '#e9ecef' : 
                                                    stepStatus === 'cancelled' ? '#dc3545' : '#0d6efd',
                                                transform: 'translateY(-50%)',
                                                transition: 'background-color 0.3s ease',
                                            }} 
                                        />
                                    )}

                                    {/* Шаг */}
                                    <div className="d-flex flex-column align-items-center" style={{ position: 'relative', zIndex: 1 }}>
                                        <div
                                            className={`rounded-circle d-flex align-items-center justify-content-center ${getStepClass(step)}`}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                border: stepStatus === 'current' ? '3px solid #0d6efd' : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            {stepStatus === 'completed' ? '✓' : 
                                             stepStatus === 'cancelled' ? '✗' :
                                             statusIcons[step]}
                                        </div>
                                        <div className="text-center mt-2">
                                            <div className="fw-semibold small">{statusLabels[step]}</div>
                                            {stepStatus === 'completed' && (
                                                <small className="text-success">✓</small>
                                            )}
                                            {stepStatus === 'current' && (
                                                <small className="text-primary">◉ Выполняется</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-4 pt-3 border-top">
                    <div className="row g-2">
                        <div className="col-md-6">
                            <small className="text-muted d-block">Дата создания</small>
                            <span>{formatDate(createdAt)}</span>
                        </div>
                        <div className="col-md-6">
                            <small className="text-muted d-block">Последнее обновление</small>
                            <span>{formatDate(updatedAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Кнопки действий */}
                {onStatusUpdate && (
                    <div className="mt-3">
                        <div className="btn-group w-100 flex-wrap">
                            {statusSteps
                                .filter(s => s !== status && s !== 'cancelled')
                                .map((statusOption) => (
                                    <button
                                        key={statusOption}
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => handleStatusChange(statusOption)}
                                        disabled={status === 'cancelled' || status === 'delivered' || !isConnected}
                                    >
                                        {statusIcons[statusOption]} {statusLabels[statusOption]}
                                    </button>
                                ))}
                            {status !== 'cancelled' && status !== 'delivered' && (
                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleStatusChange('cancelled')}
                                    disabled={!isConnected}
                                >
                                    ❌ Отменить
                                </button>
                            )}
                        </div>
                        {!isConnected && (
                            <small className="text-danger d-block mt-2">
                                ⚠️ Нет подключения к серверу. Обновление статуса недоступно.
                            </small>
                        )}
                    </div>
                )}
            </div>

            {/* Стили для анимации */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
                .pulse {
                    animation: pulse 2s infinite;
                }
            `}</style>
        </div>
    );
}