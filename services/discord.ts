import axios from 'axios';
import { DiscordNotification } from '@/types/stock';

/**
 * Discord Notification Service
 */
export class DiscordService {
    private webhookUrl: string;

    constructor() {
        this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    }

    /**
     * Send notification to Discord
     */
    async sendNotification(notification: DiscordNotification): Promise<void> {
        if (!this.webhookUrl) {
            console.warn('Discord webhook URL not configured');
            return;
        }

        try {
            await axios.post(this.webhookUrl, {
                embeds: [{
                    title: notification.title,
                    description: notification.description,
                    color: notification.color,
                    fields: notification.fields || [],
                    timestamp: notification.timestamp || new Date().toISOString(),
                    footer: {
                        text: 'Premium Quant Dashboard',
                    },
                }],
            });
        } catch (error) {
            console.error('Failed to send Discord notification:', error);
        }
    }

    /**
     * Send high-score stock alert
     */
    async sendHighScoreAlert(
        symbol: string,
        name: string,
        score: number,
        price: number,
        changePercent: number
    ): Promise<void> {
        await this.sendNotification({
            title: '🎯 고점수 종목 발견!',
            description: `**${name} (${symbol})**이(가) 높은 점수를 기록했습니다.`,
            color: 0x00ff00, // Green
            fields: [
                {
                    name: '종합 점수',
                    value: `${score.toFixed(1)}/100`,
                    inline: true,
                },
                {
                    name: '현재가',
                    value: `${price.toLocaleString()}원`,
                    inline: true,
                },
                {
                    name: '등락률',
                    value: `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
                    inline: true,
                },
            ],
        });
    }

    /**
     * Send suspended stock warning
     */
    async sendSuspendedStockWarning(
        symbol: string,
        name: string
    ): Promise<void> {
        await this.sendNotification({
            title: '⚠️ 거래정지 종목 경고',
            description: `**${name} (${symbol})**이(가) 거래정지되었습니다.`,
            color: 0xff0000, // Red
        });
    }

    /**
     * Send AI prediction accuracy report
     */
    async sendAccuracyReport(
        totalPredictions: number,
        correctPredictions: number,
        accuracy: number,
        avgReturn: number
    ): Promise<void> {
        await this.sendNotification({
            title: '📊 AI 예측 정확도 리포트',
            description: 'AI 모델의 예측 성능을 분석했습니다.',
            color: 0x0099ff, // Blue
            fields: [
                {
                    name: '총 예측 수',
                    value: `${totalPredictions}건`,
                    inline: true,
                },
                {
                    name: '정확한 예측',
                    value: `${correctPredictions}건`,
                    inline: true,
                },
                {
                    name: '정확도',
                    value: `${accuracy.toFixed(1)}%`,
                    inline: true,
                },
                {
                    name: '평균 수익률',
                    value: `${avgReturn > 0 ? '+' : ''}${avgReturn.toFixed(2)}%`,
                    inline: true,
                },
            ],
        });
    }

    /**
     * Send daily market summary
     */
    async sendMarketSummary(summary: string, topGainers: string[]): Promise<void> {
        await this.sendNotification({
            title: '📈 오늘의 시장 요약',
            description: summary,
            color: 0xffa500, // Orange
            fields: [
                {
                    name: '주요 상승 종목',
                    value: topGainers.join('\n'),
                },
            ],
        });
    }

    /**
     * Send system status
     */
    async sendSystemStatus(
        status: 'online' | 'error',
        message: string
    ): Promise<void> {
        await this.sendNotification({
            title: status === 'online' ? '✅ 시스템 정상' : '❌ 시스템 오류',
            description: message,
            color: status === 'online' ? 0x00ff00 : 0xff0000,
        });
    }

    /**
     * Send prediction result
     */
    async sendPredictionResult(
        symbol: string,
        name: string,
        prediction: string,
        confidence: number,
        reasoning: string
    ): Promise<void> {
        const emoji = prediction === 'BUY' ? '🟢' : prediction === 'SELL' ? '🔴' : '🟡';

        await this.sendNotification({
            title: `${emoji} AI 예측: ${name}`,
            description: reasoning,
            color: prediction === 'BUY' ? 0x00ff00 : prediction === 'SELL' ? 0xff0000 : 0xffff00,
            fields: [
                {
                    name: '종목',
                    value: `${name} (${symbol})`,
                    inline: true,
                },
                {
                    name: '예측',
                    value: prediction,
                    inline: true,
                },
                {
                    name: '신뢰도',
                    value: `${confidence}%`,
                    inline: true,
                },
            ],
        });
    }

    /**
     * Send batch stock alerts (multiple stocks in one message)
     */
    async sendBatchStockAlerts(
        stocks: Array<{
            symbol: string;
            name: string;
            score: number;
            price: number;
            changePercent: number;
        }>
    ): Promise<void> {
        if (stocks.length === 0) return;

        const fields = stocks.map((stock) => ({
            name: `${stock.name} (${stock.symbol})`,
            value: `점수: ${stock.score.toFixed(0)} | 가격: ${stock.price.toLocaleString()}원 | ${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
            inline: false,
        }));

        await this.sendNotification({
            title: `🎯 고점수 종목 ${stocks.length}개 발견!`,
            description: '다음 종목들이 높은 점수를 기록했습니다.',
            color: 0x00ff00,
            fields: fields.slice(0, 10), // Discord limit: max 10 fields
        });
    }

    /**
     * Send monitoring status update
     */
    async sendMonitoringStatus(
        status: 'started' | 'running' | 'stopped' | 'error',
        details?: string
    ): Promise<void> {
        const statusEmoji = {
            started: '▶️',
            running: '✅',
            stopped: '⏸️',
            error: '❌',
        };

        const statusColor = {
            started: 0x00ff00,
            running: 0x0099ff,
            stopped: 0xffa500,
            error: 0xff0000,
        };

        await this.sendNotification({
            title: `${statusEmoji[status]} 모니터링 ${status === 'started' ? '시작' : status === 'running' ? '실행 중' : status === 'stopped' ? '중지' : '오류'}`,
            description: details || `백그라운드 모니터링 상태: ${status}`,
            color: statusColor[status],
        });
    }
}

// Singleton instance
export const discordService = new DiscordService();

