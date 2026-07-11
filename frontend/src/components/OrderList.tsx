import { useOrderStore } from '../store/orderStore';
import { statusLabels, statusColors, statusOptions } from '../constants/orderConstants';
import { formatDate } from '../utils/helpers.js';
import { Link, useNavigate } from 'react-router-dom';
import { useSignalR } from '../hooks/useSignalR';
import type { OrderStatus } from '../types/order';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export function OrderList() {
    const navigate = useNavigate();
    const orders = useOrderStore((state) => state.orders);
    const updateStatus = useOrderStore((state) => state.updateStatus);
    const deleteOrder = useOrderStore((state) => state.deleteOrder);
    const { isConnected, updateOrderStatus, deleteOrder: deleteOrderSignalR } = useSignalR();

    const handleViewDetails = (id: string) => {
        navigate(`/order/${id}`);
    };

    // ✅ Используем эту функцию для обновления статуса
    const handleStatusChange = async (id: string, status: OrderStatus) => {
        try {
            if (isConnected) {
                await updateOrderStatus(id, status);
            } else {
                await updateStatus(id, status);
            }
            console.log(`✅ Status updated to ${status} for order ${id}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Ошибка обновления статуса');
        }
    };

    const handleDeleteOrder = async (id: string) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
            return;
        }

        try {
            if (isConnected) {
                await deleteOrderSignalR(id);
            } else {
                await deleteOrder(id);
            }
            console.log(`✅ Order ${id} deleted`);
        } catch (error) {
            console.error('Failed to delete order:', error);
            alert('Ошибка удаления заказа');
        }
    };

    if (!orders || orders.length === 0) {
        return (
            <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                    <p className="text-muted mb-0 fs-5">📭 Нет заказов</p>
                    <small className="text-muted">Создайте первый заказ с помощью формы выше</small>
                </div>
            </div>
        );
    }

    return (
        <div className="card shadow-sm">
            <div className="card-header bg-light">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📋 Список заказов</h5>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary rounded-pill">{orders.length}</span>
                        {isConnected && (
                            <span className="badge bg-success">🟢 Online</span>
                        )}
                        {!isConnected && (
                            <span className="badge bg-secondary">⚪ Offline</span>
                        )}
                    </div>
                </div>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>№ заказа</th>
                                <th>Описание</th>
                                <th>Статус</th>
                                <th>Создан</th>
                                <th>Изменён</th>
                                <th className="text-center">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <Link 
                                            to={`/order/${order.id}`}
                                            className="fw-semibold text-decoration-none"
                                        >
                                            {order.orderNumber}
                                        </Link>
                                    </td>
                                    <td>{order.description}</td>
                                    <td>
                                        <span className={`badge bg-${statusColors[order.status]}`}>
                                            {statusLabels[order.status]}
                                        </span>
                                    </td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>{formatDate(order.updatedAt)}</td>
                                    <td>
                                        <div className="d-flex justify-content-center gap-1 flex-wrap">
                                            <Link 
                                                to={`/order/${order.id}`}
                                                className="btn btn-sm btn-outline-info"
                                            >
                                                🔍 Детали
                                            </Link>
                                            <div className="dropdown">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                    type="button"
                                                    data-bs-toggle="dropdown"
                                                    aria-expanded="false"
                                                    disabled={!isConnected}
                                                >
                                                    Статус
                                                </button>
                                                <ul className="dropdown-menu">
                                                    {statusOptions.map((s) => (
                                                        <li key={s}>
                                                            <button
                                                                className={`dropdown-item ${s === order.status ? 'active' : ''}`}
                                                                onClick={() => handleStatusChange(order.id, s)} // ← Используем handleStatusChange
                                                            >
                                                                <span className={`badge bg-${statusColors[s]} me-2`}>
                                                                    {statusLabels[s]}
                                                                </span>
                                                                {s === order.status && ' ✓'}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteOrder(order.id)} // ← Используем handleDeleteOrder
                                                title="Удалить заказ"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}