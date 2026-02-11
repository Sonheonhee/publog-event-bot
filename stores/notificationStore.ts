import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotificationState {
    // Notification enabled states
    realTimeStocksEnabled: boolean;
    tomorrowPicksEnabled: boolean;

    // Previous data for comparison (to detect new items)
    previousRealTimeStocks: string[];
    previousTomorrowPicks: string[];

    // Actions
    toggleRealTimeNotifications: () => void;
    toggleTomorrowPicksNotifications: () => void;
    updatePreviousRealTimeStocks: (symbols: string[]) => void;
    updatePreviousTomorrowPicks: (symbols: string[]) => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            realTimeStocksEnabled: false,
            tomorrowPicksEnabled: false,
            previousRealTimeStocks: [],
            previousTomorrowPicks: [],

            toggleRealTimeNotifications: () =>
                set((state) => ({
                    realTimeStocksEnabled: !state.realTimeStocksEnabled,
                })),

            toggleTomorrowPicksNotifications: () =>
                set((state) => ({
                    tomorrowPicksEnabled: !state.tomorrowPicksEnabled,
                })),

            updatePreviousRealTimeStocks: (symbols: string[]) =>
                set({ previousRealTimeStocks: symbols }),

            updatePreviousTomorrowPicks: (symbols: string[]) =>
                set({ previousTomorrowPicks: symbols }),
        }),
        {
            name: 'notification-storage',
        }
    )
);
