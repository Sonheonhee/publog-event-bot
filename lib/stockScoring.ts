import { AIAnalysis, TechnicalIndicators, Stock } from '@/types/stock';
import { calculateTechnicalScore } from './indicators';

/**
 * Calculate comprehensive stock score
 * Combines technical analysis (40%), AI analysis (40%), and momentum (20%)
 */
export function calculateStockScore(
    stock: Stock,
    indicators: TechnicalIndicators,
    aiAnalysis?: AIAnalysis
): number {
    // Technical Score (40%)
    const technicalScore = calculateTechnicalScore(indicators, stock.price) * 0.4;

    // AI Score (40%)
    let aiScore = 50; // Default neutral score
    if (aiAnalysis) {
        const predictionScore = aiAnalysis.prediction === 'BUY' ? 100 :
            aiAnalysis.prediction === 'SELL' ? 0 : 50;
        aiScore = (predictionScore * 0.6 + aiAnalysis.confidence * 0.4);
    }
    const weightedAIScore = aiScore * 0.4;

    // Momentum Score (20%)
    const momentumScore = calculateMomentumScore(stock, indicators) * 0.2;

    const totalScore = technicalScore + weightedAIScore + momentumScore;
    return Math.min(100, Math.max(0, totalScore));
}

/**
 * Calculate momentum score based on price action and volume
 */
function calculateMomentumScore(stock: Stock, indicators: TechnicalIndicators): number {
    let score = 50; // Start neutral

    // Price momentum (0-50 points)
    const priceChange = stock.changePercent;
    if (priceChange > 5) {
        score += 25;
    } else if (priceChange > 2) {
        score += 15;
    } else if (priceChange > 0) {
        score += 10;
    } else if (priceChange < -5) {
        score -= 25;
    } else if (priceChange < -2) {
        score -= 15;
    } else if (priceChange < 0) {
        score -= 10;
    }

    // Volume momentum (0-50 points)
    const volumeRatio = stock.volume / indicators.volumeAvg;
    if (volumeRatio > 2) {
        score += 25; // High volume
    } else if (volumeRatio > 1.5) {
        score += 15;
    } else if (volumeRatio > 1) {
        score += 10;
    } else if (volumeRatio < 0.5) {
        score -= 10; // Low volume
    }

    return Math.min(100, Math.max(0, score));
}

/**
 * Rank stocks by score
 */
export function rankStocks<T extends { score: number }>(stocks: T[]): T[] {
    return [...stocks].sort((a, b) => b.score - a.score);
}

/**
 * Filter high-score stocks
 */
export function filterHighScoreStocks<T extends { score: number }>(
    stocks: T[],
    threshold: number = 70
): T[] {
    return stocks.filter(stock => stock.score >= threshold);
}

/**
 * Get score category
 */
export function getScoreCategory(score: number): {
    label: string;
    color: string;
    emoji: string;
} {
    if (score >= 80) {
        return {
            label: '매우 강함',
            color: 'text-green-500',
            emoji: '🔥',
        };
    } else if (score >= 70) {
        return {
            label: '강함',
            color: 'text-green-400',
            emoji: '✨',
        };
    } else if (score >= 60) {
        return {
            label: '양호',
            color: 'text-blue-400',
            emoji: '👍',
        };
    } else if (score >= 50) {
        return {
            label: '보통',
            color: 'text-gray-400',
            emoji: '➖',
        };
    } else if (score >= 40) {
        return {
            label: '약함',
            color: 'text-orange-400',
            emoji: '⚠️',
        };
    } else {
        return {
            label: '매우 약함',
            color: 'text-red-500',
            emoji: '❌',
        };
    }
}
