import type { OrderStatus, Order } from '../types/order.js';
import { useOrderStore } from '../store/orderStore';
import { generateOrderNumber } from '../utils/helpers.js';
import { useState } from 'react';

export function OrderForm() {
    const addOrder = useOrderStore((state) => state.addOrder);
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<OrderStatus>('created');
    const [errors, setErrors] = useState<{ description?: string }>({});

    const handleSubmit = (e: React.FormEvent) => {
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

        const now = new Date().toISOString();
        const newOrder: Order = {
            id: crypto.randomUUID(),
            orderNumber: generateOrderNumber(),
            description: description.trim(),
            status,
            createdAt: now,
            updatedAt: now,
        };

        addOrder(newOrder);
        setDescription('');
        setStatus('created');
        setErrors({});
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
                                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                            >
                                <option value="created">Создан</option>
                                <option value="shipped">Отправлен</option>
                                <option value="delivered">Доставлен</option>
                                <option value="cancelled">Отменен</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <button type="submit" className="btn btn-primary w-100">
                                Создать
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}