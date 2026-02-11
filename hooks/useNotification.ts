import { useState, useEffect, useCallback } from 'react';

export type NotificationPermission = 'granted' | 'denied' | 'default';

export function useNotification() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if browser supports notifications
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.warn('Notifications are not supported in this browser');
            return 'denied';
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }, [isSupported]);

    const sendNotification = useCallback(
        (title: string, options?: NotificationOptions) => {
            if (!isSupported) {
                console.warn('Notifications are not supported');
                return null;
            }

            if (permission !== 'granted') {
                console.warn('Notification permission not granted');
                return null;
            }

            try {
                const notification = new Notification(title, {
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    ...options,
                });

                return notification;
            } catch (error) {
                console.error('Error sending notification:', error);
                return null;
            }
        },
        [isSupported, permission]
    );

    return {
        permission,
        isSupported,
        requestPermission,
        sendNotification,
    };
}
