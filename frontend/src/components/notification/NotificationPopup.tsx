import { Card, Button, Stack } from 'react-bootstrap';
import { notificationStore } from '../../stores/notificationStore';
import { NotificationItem } from './NotificationItem';

interface NotificationPopupProps {
    onClose: () => void;
    onMarkAllRead: () => void;
}

export function NotificationPopup({ onClose, onMarkAllRead }: NotificationPopupProps) {
    const notifications = notificationStore((state) => state.notifications);
    const clearAll = notificationStore((state) => state.clearAll);

    const hasUnread = notifications.some(n => !n.isRead);

    return (
        <Card className="shadow-lg">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                <h6 className="mb-0 fw-bold">Уведомления</h6>
                <Stack direction="horizontal" gap={2}>
                    {hasUnread && (
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="text-primary p-0"
                            onClick={onMarkAllRead}
                        >
                            Отметить все
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="text-danger p-0"
                            onClick={clearAll}
                        >
                            Очистить
                        </Button>
                    )}
                    <Button 
                        variant="link" 
                        size="sm" 
                        className="text-secondary p-0"
                        onClick={onClose}
                    >
                        ✕
                    </Button>
                </Stack>
            </Card.Header>

            <Card.Body className="p-0" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <div className="text-center py-5">
                        <div style={{ fontSize: '48px' }}>🔕</div>
                        <p className="text-muted mt-3 mb-0">Нет уведомлений</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map((notification) => (
                            <NotificationItem 
                                key={notification.id}
                                notification={notification}
                            />
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}