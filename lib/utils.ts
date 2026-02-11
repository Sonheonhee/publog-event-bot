import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/**
 * Format number as Korean Won (KRW)
 */
export function formatKRW(value: number): string {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format number as compact KRW (e.g., 1.2억)
 */
export function formatCompactKRW(value: number): string {
    if (value >= 100000000) {
        return `${(value / 100000000).toFixed(1)}억`;
    } else if (value >= 10000) {
        return `${(value / 10000).toFixed(1)}만`;
    }
    return formatKRW(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers (volume, market cap)
 */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('ko-KR').format(value);
}

/**
 * Get color class based on value (positive/negative)
 */
export function getChangeColor(value: number): string {
    if (value > 0) return 'text-red-500'; // 상승 (빨강)
    if (value < 0) return 'text-blue-500'; // 하락 (파랑)
    return 'text-gray-400'; // 보합
}

/**
 * Get background color class based on value
 */
export function getChangeBgColor(value: number): string {
    if (value > 0) return 'bg-red-500/10';
    if (value < 0) return 'bg-blue-500/10';
    return 'bg-gray-500/10';
}

/**
 * Format date/time
 */
export function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
}

/**
 * Format time only
 */
export function formatTime(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(date);
}

/**
 * Format date only
 */
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

/**
 * Calculate time ago
 */
export function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}초 전`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                await sleep(delay * Math.pow(2, i));
            }
        }
    }

    throw lastError!;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
