import type { Order } from '../stores/orderStrore.js';
import { useOrderStore } from '../stores/orderStrore.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { useState } from 'react';
import { useSignalR } from "../hooks/useSignalR";
import { notificationStore } from '../stores/notificationStore';
import {useCreateOrder} from '../hooks/useCreateOrder.js';

export function OrderForm() {
    const addOrder = useOrderStore((state) => state.addOrder);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<string>('created');
    const [errors, setErrors] = useState<{ description?: string }>({});
    const {subscribeToOrder} = useSignalR();
    const { createOrder, isLoading, error, reset } = useCreateOrder();
    const addNotification = notificationStore((state) => state.addNotification);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { description?: string } = {};
        if (!description.trim()) {
            newErrors.description = 'Описание обязательно';
        } else if (description.trim().length < 3) {
            newErrors.description = 'Минимум 3 символа';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        setErrors({});
        reset();

        const newOrder = await createOrder(description.trim());
        
        if (newOrder) {
            addOrder(newOrder);
            setDescription('');
            setStatus('created');
            addNotification({
                orderId: newOrder.id,
                orderNumber: newOrder.orderNumber,
                title: 'Заказ создан',
                message: `Заказ #${newOrder.orderNumber} успешно создан`,
                type: 'success',
                link: `/order/${newOrder.id}`,
            });
            // subscribeToOrder(newOrder.id);

        } else {
            setErrors({ description: error || 'Ошибка создания' });
            addNotification({
                orderId: '',
                orderNumber: '',
                title: 'Ошибка',
                message: `Не удалось создать заказ`,
                type: 'error',
            });
        }
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
                <h5 className="mb-0">➕ Создать новый заказ</h5>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row g-3 align-items-end">
                        <div className="col-md-5">
                            <label htmlFor="orderDescription" className="form-label fw-semibold">
                                Описание
                            </label>
                            <input
                                id="orderDescription"
                                type="text"
                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                placeholder="Введите описание заказа..."
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    if (errors.description) setErrors({});
                                }}
                            />
                            {errors.description && (
                                <div className="invalid-feedback">{errors.description}</div>
                            )}
                        </div>

                        <div className="col-md-4">
                            <label htmlFor="orderStatus" className="form-label fw-semibold">
                                Статус
                            </label>
                            <select
                                id="orderStatus"
                                className="form-select"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as string)}
                            >
                                <option value="created">Создан</option>
                                <option value="shipped">Отправлен</option>
                                <option value="delivered">Доставлен</option>
                                <option value="cancelled">Отменен</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary w-100" disabled={isLoading}> 
                                Создать
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}