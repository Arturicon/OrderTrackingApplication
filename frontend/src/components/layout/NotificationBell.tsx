// components/Layout/NotificationBell.tsx
import { useState, useRef } from 'react';
import { Button, Badge } from 'react-bootstrap';
import { notificationStore } from '../../stores/notificationStore';
import { NotificationPopup } from '../notification/NotificationPopup';

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const targetRef = useRef<HTMLDivElement>(null);
    
    const unreadCount = notificationStore((state) => state.unreadCount);
    const markAllAsRead = notificationStore((state) => state.markAllAsRead);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <div ref={targetRef} className="position-relative d-inline-block">
            <Button
                variant="light"
                className="position-relative rounded-circle p-2 border-0"
                onClick={handleToggle}
                aria-label="Уведомления"
            >
                <span style={{ fontSize: '24px' }}>🔔</span>
                {unreadCount > 0 && (
                    <Badge
                        bg="danger"
                        pill
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '12px' }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <div 
                    className="position-absolute top-100 end-0 mt-2"
                    style={{ 
                        width: '420px', 
                        maxHeight: '500px',
                        zIndex: 1050,
                    }}
                >
                    <NotificationPopup 
                        onClose={handleClose}
                        onMarkAllRead={markAllAsRead}
                    />
                </div>
            )}
        </div>
    );
}