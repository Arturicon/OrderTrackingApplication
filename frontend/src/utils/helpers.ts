export const generateOrderNumber = (): string => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${datePart}-${random}`;
};

export const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const API_CONFIG = {
    // Получаем URL из переменной окружения или используем дефолтное значение
    backendUrl: import.meta.env.BACKEND_URL || 'https://localhost:7099',
    notifyUrl: import.meta.env.NOTIFY_URL || "https://localhost:7125",
    endpoints: {
        allOrders: 'api/Orders/GetAllOrders',
        createOrder: 'api/Orders/CreateOrder',
        orderHub: 'orderHub'
    }
};