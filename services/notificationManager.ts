import { discordService } from './discord';

/**
 * Notification Manager
 * Handles deduplication, rate limiting, and smart filtering for notifications
 */

interface NotificationHistory {
    symbol: string;
    type: 'high_score' | 'suspended' | 'prediction';
    timestamp: number;
    score?: number;
}

interface StockNotificationData {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    score: number;
    isSuspended?: boolean;
    aiAnalysis?: {
        prediction: string;
        confidence: number;
        reasoning: string;
    };
}

export class NotificationManager {
    private notificationHistory: NotificationHistory[] = [];
    private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    private readonly HIGH_SCORE_THRESHOLD = 80;
    private readonly MAX_HISTORY_SIZE = 1000;

    /**
     * Check if notification should be sent based on cooldown
     */
    private shouldNotify(symbol: string, type: NotificationHistory['type']): boolean {
        const now = Date.now();
        const recentNotification = this.notificationHistory.find(
            (n) => n.symbol === symbol && n.type === type && now - n.timestamp < this.COOLDOWN_MS
        );

        return !recentNotification;
    }

    /**
     * Add notification to history
     */
    private addToHistory(notification: NotificationHistory): void {
        this.notificationHistory.push(notification);

        // Cleanup old history
        if (this.notificationHistory.length > this.MAX_HISTORY_SIZE) {
            this.notificationHistory = this.notificationHistory.slice(-this.MAX_HISTORY_SIZE);
        }
    }

    /**
     * Send high score stock notification
     */
    async notifyHighScoreStock(stock: StockNotificationData): Promise<boolean> {
        // Only notify for high scores
        if (stock.score < this.HIGH_SCORE_THRESHOLD) {
            return false;
        }

        // Check cooldown
        if (!this.shouldNotify(stock.symbol, 'high_score')) {
            console.log(`[NotificationManager] Skipping duplicate notification for ${stock.symbol}`);
            return false;
        }

        try {
            await discordService.sendHighScoreAlert(
                stock.symbol,
                stock.name,
                stock.score,
                stock.price,
                stock.changePercent
            );

            this.addToHistory({
                symbol: stock.symbol,
                type: 'high_score',
                timestamp: Date.now(),
                score: stock.score,
            });

            console.log(`[NotificationManager] Sent high score notification for ${stock.symbol}`);
            return true;
        } catch (error) {
            console.error(`[NotificationManager] Failed to send notification:`, error);
            return false;
        }
    }

    /**
     * Send suspended stock notification
     */
    async notifySuspendedStock(stock: StockNotificationData): Promise<boolean> {
        if (!stock.isSuspended) {
            return false;
        }

        // Check cooldown
        if (!this.shouldNotify(stock.symbol, 'suspended')) {
            return false;
        }

        try {
            await discordService.sendSuspendedStockWarning(stock.symbol, stock.name);

            this.addToHistory({
                symbol: stock.symbol,
                type: 'suspended',
                timestamp: Date.now(),
            });

            console.log(`[NotificationManager] Sent suspended stock notification for ${stock.symbol}`);
            return true;
        } catch (error) {
            console.error(`[NotificationManager] Failed to send suspended notification:`, error);
            return false;
        }
    }

    /**
     * Send AI prediction notification
     */
    async notifyPrediction(stock: StockNotificationData): Promise<boolean> {
        if (!stock.aiAnalysis) {
            return false;
        }

        // Only notify for high confidence predictions on high score stocks
        if (stock.score < this.HIGH_SCORE_THRESHOLD || stock.aiAnalysis.confidence < 70) {
            return false;
        }

        // Check cooldown
        if (!this.shouldNotify(stock.symbol, 'prediction')) {
            return false;
        }

        try {
            await discordService.sendPredictionResult(
                stock.symbol,
                stock.name,
                stock.aiAnalysis.prediction,
                stock.aiAnalysis.confidence,
                stock.aiAnalysis.reasoning
            );

            this.addToHistory({
                symbol: stock.symbol,
                type: 'prediction',
                timestamp: Date.now(),
            });

            console.log(`[NotificationManager] Sent prediction notification for ${stock.symbol}`);
            return true;
        } catch (error) {
            console.error(`[NotificationManager] Failed to send prediction notification:`, error);
            return false;
        }
    }

    /**
     * Process stock and send appropriate notifications
     */
    async processStock(stock: StockNotificationData): Promise<void> {
        // Check for suspended stock first (highest priority)
        if (stock.isSuspended) {
            await this.notifySuspendedStock(stock);
            return;
        }

        // Check for high score
        const highScoreSent = await this.notifyHighScoreStock(stock);

        // If high score notification was sent and AI analysis exists, send prediction too
        if (highScoreSent && stock.aiAnalysis) {
            // Add small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await this.notifyPrediction(stock);
        }
    }

    /**
     * Get notification statistics
     */
    getStats(): {
        totalNotifications: number;
        recentNotifications: number;
        notificationsByType: Record<string, number>;
    } {
        const now = Date.now();
        const recentNotifications = this.notificationHistory.filter(
            (n) => now - n.timestamp < this.COOLDOWN_MS
        );

        const notificationsByType = this.notificationHistory.reduce(
            (acc, n) => {
                acc[n.type] = (acc[n.type] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        return {
            totalNotifications: this.notificationHistory.length,
            recentNotifications: recentNotifications.length,
            notificationsByType,
        };
    }

    /**
     * Clear old history (for maintenance)
     */
    clearOldHistory(olderThanMs: number = 24 * 60 * 60 * 1000): void {
        const now = Date.now();
        this.notificationHistory = this.notificationHistory.filter(
            (n) => now - n.timestamp < olderThanMs
        );
        console.log(`[NotificationManager] Cleared old history, remaining: ${this.notificationHistory.length}`);
    }
}

// Singleton instance
export const notificationManager = new NotificationManager();
