import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Notification } from '../types/types.js';

/**
 * Хранилище уведомлений с персистентностью в localStorage.
 */
interface NotificationStore {
    /** Список уведомлений */
    notifications: Notification[];
    /** Количество непрочитанных уведомлений */
    unreadCount: number;
    
    /** Добавить новое уведомление */
    addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
    /** Отметить уведомление как прочитанное */
    markAsRead: (id: string) => void;
    /** Отметить все уведомления как прочитанные */
    markAllAsRead: () => void;
    /** Удалить уведомление */
    removeNotification: (id: string) => void;
    /** Очистить все уведомления */
    clearAll: () => void;
    /** Получить количество непрочитанных */
    getUnreadCount: () => number;
    /** Получить все уведомления */
    getNotifications: () => Notification[];
}

export const notificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],
            unreadCount: 0,

            addNotification: (notification) => {
                const newNotification: Notification = {
                    ...notification,
                    id: crypto.randomUUID(),
                    isRead: false,
                    createdAt: new Date().toISOString(),
                };

                set((state) => ({
                    notifications: [newNotification, ...state.notifications],
                    unreadCount: state.unreadCount + 1,
                }));
            },

            markAsRead: (id: string) => {
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    ),
                    unreadCount: state.unreadCount - 1,
                }));
            },

            markAllAsRead: () => {
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                    unreadCount: 0,
                }));
            },

            removeNotification: (id: string) => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                    unreadCount: state.unreadCount - (state.notifications.find(n => n.id === id)?.isRead ? 0 : 1),
                }));
            },

            clearAll: () => {
                set({ notifications: [], unreadCount: 0 });
            },

            getUnreadCount: () => {
                return get().unreadCount;
            },

            getNotifications: () => {
                return get().notifications;
            },
        }),
        {
            name: 'notification-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                notifications: state.notifications,
                unreadCount: state.unreadCount,
            }),
        }
    )
);