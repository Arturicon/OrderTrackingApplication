import type { Notification } from '../../stores/notificationStore';
import { notificationStore } from '../../stores/notificationStore';
import { Link } from 'react-router-dom';
import { Stack, Badge } from 'react-bootstrap';

interface NotificationItemProps {
    notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
    const markAsRead = notificationStore((state) => state.markAsRead);

    const handleClick = () => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
    };

    const getTypeVariant = (type: string): string => {
        switch (type) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'danger';
            default: return 'info';
        }
    };

    const getTypeIcon = (type: string): string => {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return '📦';
        }
    };

    const timeAgo = (date: string): string => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'только что';
        if (minutes < 60) return `${minutes} мин назад`;
        if (hours < 24) return `${hours} ч назад`;
        return `${days} д назад`;
    };

    const content = (
        <div
            className={`p-3 border-bottom ${!notification.isRead ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : ''}`}
            onClick={handleClick}
            style={{ cursor: 'pointer', transition: 'background-color 0.15s' }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notification.isRead ? 'transparent' : 'rgba(13, 110, 253, 0.05)';
            }}
        >
            <Stack direction="horizontal" gap={3}>
                <div style={{ fontSize: '20px' }}>{getTypeIcon(notification.type)}</div>
                <div className="flex-grow-1">
                    <div className="fw-semibold small">{notification.title}</div>
                    <div className="text-secondary small">{notification.message}</div>
                    <div className="text-muted small mt-1">{timeAgo(notification.createdAt)}</div>
                </div>
                {!notification.isRead && (
                    <Badge bg="primary" pill className="align-self-start">
                        Новое
                    </Badge>
                )}
            </Stack>
        </div>
    );

    if (notification.link) {
        return (
            <Link 
                to={notification.link} 
                className="text-decoration-none text-dark"
                onClick={handleClick}
            >
                {content}
            </Link>
        );
    }

    return content;
}