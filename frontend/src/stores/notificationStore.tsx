// stores/notificationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Notification {
    id: string;
    orderId: string;
    orderNumber: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    isRead: boolean;
    createdAt: string;
    link?: string;
}

interface NotificationStore {
    notifications: Notification[]; //todo должны храниться где-то на сервере?
    unreadCount: number;
    
    addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    getUnreadCount: () => number;
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