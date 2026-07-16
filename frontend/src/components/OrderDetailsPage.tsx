// OrderDetailsPage.tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button, Card, Badge, Container, Row, Col, Stack } from 'react-bootstrap';
import { ArrowLeft, Bell, BellSlash, Clock, Calendar, Hash, FileText, Tag } from 'react-bootstrap-icons';
import { useOrderStore} from '../stores/orderStrore';
import { useSignalR } from "../hooks/useSignalR";

export function OrderDetailsPage() {
    const { id } = useParams<string>();
    const navigate = useNavigate();
    
    // ✅ Получаем orders из стора
    const orders = useOrderStore((state) => state.orders);
    const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
    const { onOrderStatusChanged, subscribeToOrder, unsubscribeFromOrder} = useSignalR();

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

    // Форматирование даты
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    // Получение цвета статуса
    const getStatusColor = (status: string): string => {
        const colors: Record<string, string> = {
            'Pending': 'warning',
            'Processing': 'info',
            'Shipped': 'primary',
            'Delivered': 'success',
            'Cancelled': 'danger',
            'Completed': 'success',
            'Created': 'secondary',
            'Paid': 'success',
            'Refunded': 'warning',
        };
        return colors[status] || 'secondary';
    };

    // Получение статуса на русском
    const getStatusLabel = (status: string): string => {
        const labels: Record<string, string> = {
            'Pending': 'Ожидает',
            'Processing': 'В обработке',
            'Shipped': 'Отправлен',
            'Delivered': 'Доставлен',
            'Cancelled': 'Отменён',
            'Completed': 'Завершён',
            'Created': 'Создан',
            'Paid': 'Оплачен',
            'Refunded': 'Возвращён',
        };
        return labels[status] || status;
    };

    if (!id) {
        return (
            <Container className="py-5 text-center">
                <Card className="shadow-sm">
                    <Card.Body className="py-5">
                        <h3 className="text-muted">❌ ID заказа отсутствует</h3>
                        <Button variant="primary" onClick={() => navigate('/')} className="mt-3">
                            <ArrowLeft className="me-2" />
                            Вернуться к списку
                        </Button>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    if (!currentOrder) {
        return (
            <Container className="py-5 text-center">
                <Card className="shadow-sm">
                    <Card.Body className="py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h4 className="mt-3 text-muted">Загрузка деталей заказа...</h4>
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Card className="shadow-sm">
                <Card.Header className="bg-white py-3">
                    <Row className="align-items-center">
                        <Col>
                            <Stack direction="horizontal" gap={3}>
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => navigate('/')}
                                    className="d-flex align-items-center"
                                >
                                    <ArrowLeft size={20} />
                                </Button>
                                <div>
                                    <h4 className="mb-0 fw-bold">
                                        Заказ #{currentOrder.orderNumber}
                                    </h4>
                                    <small className="text-muted">
                                        <Hash size={14} className="me-1" />
                                        ID: {currentOrder.id}
                                    </small>
                                </div>
                            </Stack>
                        </Col>
                        <Col xs="auto">
                            <Badge 
                                bg={getStatusColor(currentOrder.status)} 
                                className="fs-6 px-3 py-2"
                            >
                                {getStatusLabel(currentOrder.status)}
                            </Badge>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body>
                    <Row>
                        <Col lg={8}>
                            {/* Основная информация */}
                            <h5 className="fw-bold mb-3">
                                <FileText className="me-2" />
                                Информация о заказе
                            </h5>
                            
                            <Card className="bg-light border-0 mb-4">
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <small className="text-muted d-block">Описание</small>
                                                <span className="fw-medium">
                                                    {currentOrder.description || 'Без описания'}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <small className="text-muted d-block">Статус</small>
                                                <Badge bg={getStatusColor(currentOrder.status)}>
                                                    {getStatusLabel(currentOrder.status)}
                                                </Badge>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            {/* Дата и время */}
                            <h5 className="fw-bold mb-3">
                                <Clock className="me-2" />
                                Временная информация
                            </h5>
                            
                            <Card className="bg-light border-0">
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <small className="text-muted d-block">
                                                    <Calendar className="me-1" size={14} />
                                                    Дата создания
                                                </small>
                                                <span className="fw-medium">
                                                    {formatDate(currentOrder.createdAt)}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="mb-3">
                                                <small className="text-muted d-block">
                                                    <Clock className="me-1" size={14} />
                                                    Последнее обновление
                                                </small>
                                                <span className="fw-medium">
                                                    {formatDate(currentOrder.updatedAt)}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={4}>
                            {/* Управление подпиской */}
                            <Card className="border-0 bg-light">
                                <Card.Body>
                                    <h5 className="fw-bold mb-3">
                                        <Bell className="me-2" />
                                        Уведомления
                                    </h5>
                                    
                                    <Stack direction="vertical" gap={2}>
                                        <Button 
                                            variant="primary" 
                                            onClick={() => subscribeToOrder(id)}
                                            className="d-flex align-items-center justify-content-center gap-2" >
                                            <Bell size={18} />
                                            Подписаться на уведомления
                                        </Button>
                                        
                                        <Button 
                                            variant="outline-secondary" 
                                            onClick={() => unsubscribeFromOrder(id)}
                                            className="d-flex align-items-center justify-content-center gap-2"
                                        >
                                            <BellSlash size={18} />
                                            Отписаться от уведомлений
                                        </Button>
                                    </Stack>

                                    <hr className="my-3" />
                                    
                                    <div className="text-muted small">
                                        <Tag size={14} className="me-1" />
                                        Подписка позволяет получать обновления статуса заказа в реальном времени
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>

                <Card.Footer className="bg-white py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <small className="text-muted">
                            <Clock size={14} className="me-1" />
                            Последнее обновление: {formatDate(currentOrder.updatedAt)}
                        </small>
                        <Button 
                            variant="outline-secondary" 
                            size="sm"
                            onClick={() => window.location.reload()}
                        >
                            Обновить
                        </Button>
                    </div>
                </Card.Footer>
            </Card>
        </Container>
    );
}