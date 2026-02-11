import { CandlestickData, CandlePattern, PatternDetection } from '@/types/stock';

/**
 * Detect Bullish Engulfing Pattern
 * 상승 장악형: 하락 캔들 다음에 더 큰 상승 캔들이 나타남
 */
export function detectBullishEngulfing(candles: CandlestickData[]): boolean {
    if (candles.length < 2) return false;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    // Previous candle is bearish
    const prevBearish = prev.close < prev.open;
    // Current candle is bullish
    const currBullish = curr.close > curr.open;
    // Current body engulfs previous body
    const engulfs = curr.open <= prev.close && curr.close >= prev.open;

    return prevBearish && currBullish && engulfs;
}

/**
 * Detect Hammer Pattern
 * 망치형: 긴 아래 꼬리와 짧은 몸통
 */
export function detectHammer(candles: CandlestickData[]): boolean {
    if (candles.length < 1) return false;

    const candle = candles[candles.length - 1];
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);

    // Long lower shadow (at least 2x body)
    const hasLongLowerShadow = lowerShadow >= body * 2;
    // Short upper shadow (less than body)
    const hasShortUpperShadow = upperShadow <= body;
    // Small body
    const hasSmallBody = body <= (candle.high - candle.low) * 0.3;

    return hasLongLowerShadow && hasShortUpperShadow && hasSmallBody;
}

/**
 * Detect Morning Star Pattern
 * 샛별형: 하락 캔들 + 작은 캔들 + 상승 캔들 (3개 조합)
 */
export function detectMorningStar(candles: CandlestickData[]): boolean {
    if (candles.length < 3) return false;

    const first = candles[candles.length - 3];
    const second = candles[candles.length - 2];
    const third = candles[candles.length - 1];

    // First candle is bearish
    const firstBearish = first.close < first.open;
    const firstBody = Math.abs(first.close - first.open);

    // Second candle has small body
    const secondBody = Math.abs(second.close - second.open);
    const secondSmall = secondBody < firstBody * 0.3;

    // Third candle is bullish
    const thirdBullish = third.close > third.open;
    const thirdBody = Math.abs(third.close - third.open);

    // Third closes above midpoint of first
    const thirdRecovery = third.close > (first.open + first.close) / 2;

    return firstBearish && secondSmall && thirdBullish && thirdRecovery;
}

/**
 * Detect Bearish Engulfing Pattern
 * 하락 장악형
 */
export function detectBearishEngulfing(candles: CandlestickData[]): boolean {
    if (candles.length < 2) return false;

    const prev = candles[candles.length - 2];
    const curr = candles[candles.length - 1];

    const prevBullish = prev.close > prev.open;
    const currBearish = curr.close < curr.open;
    const engulfs = curr.open >= prev.close && curr.close <= prev.open;

    return prevBullish && currBearish && engulfs;
}

/**
 * Detect Shooting Star Pattern
 * 유성형: 긴 위 꼬리와 짧은 몸통
 */
export function detectShootingStar(candles: CandlestickData[]): boolean {
    if (candles.length < 1) return false;

    const candle = candles[candles.length - 1];
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;

    const hasLongUpperShadow = upperShadow >= body * 2;
    const hasShortLowerShadow = lowerShadow <= body;
    const hasSmallBody = body <= (candle.high - candle.low) * 0.3;

    return hasLongUpperShadow && hasShortLowerShadow && hasSmallBody;
}

/**
 * Detect Doji Pattern
 * 도지형: 시가와 종가가 거의 같음
 */
export function detectDoji(candles: CandlestickData[]): boolean {
    if (candles.length < 1) return false;

    const candle = candles[candles.length - 1];
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;

    // Body is less than 5% of the range
    return body <= range * 0.05;
}

/**
 * Detect all patterns in candlestick data
 */
export function detectAllPatterns(
    candles: CandlestickData[],
    patternDatabase: CandlePattern[]
): PatternDetection[] {
    const detections: PatternDetection[] = [];

    // Bullish patterns
    if (detectBullishEngulfing(candles)) {
        const pattern = patternDatabase.find(p => p.id === 'bullish_engulfing');
        if (pattern) {
            detections.push({
                pattern,
                confidence: 85,
                detectedAt: new Date(),
                candleData: candles.slice(-2),
                priceAtDetection: candles[candles.length - 1].close,
            });
        }
    }

    if (detectHammer(candles)) {
        const pattern = patternDatabase.find(p => p.id === 'hammer');
        if (pattern) {
            detections.push({
                pattern,
                confidence: 80,
                detectedAt: new Date(),
                candleData: candles.slice(-1),
                priceAtDetection: candles[candles.length - 1].close,
            });
        }
    }

    if (detectMorningStar(candles)) {
        const pattern = patternDatabase.find(p => p.id === 'morning_star');
        if (pattern) {
            detections.push({
                pattern,
                confidence: 90,
                detectedAt: new Date(),
                candleData: candles.slice(-3),
                priceAtDetection: candles[candles.length - 1].close,
            });
        }
    }

    // Bearish patterns
    if (detectBearishEngulfing(candles)) {
        const pattern = patternDatabase.find(p => p.id === 'bearish_engulfing');
        if (pattern) {
            detections.push({
                pattern,
                confidence: 85,
                detectedAt: new Date(),
                candleData: candles.slice(-2),
                priceAtDetection: candles[candles.length - 1].close,
            });
        }
    }

    if (detectShootingStar(candles)) {
        const pattern = patternDatabase.find(p => p.id === 'shooting_star');
        if (pattern) {
            detections.push({
                pattern,
                confidence: 80,
                detectedAt: new Date(),
                candleData: candles.slice(-1),
                priceAtDetection: candles[candles.length - 1].close,
            });
        }
    }

    if (detectDoji(candles)) {
        const pattern = patternDatabase.find(p => p.id === 'doji');
        if (pattern) {
            detections.push({
                pattern,
                confidence: 70,
                detectedAt: new Date(),
                candleData: candles.slice(-1),
                priceAtDetection: candles[candles.length - 1].close,
            });
        }
    }

    return detections;
}

/**
 * Calculate pattern success rate from historical data
 * This would be called weekly to update the research data
 */
export function calculatePatternSuccessRate(
    patternId: string,
    historicalDetections: Array<{
        detectedPrice: number;
        futurePrice: number; // Price after N days
        targetDays: number;
    }>
): {
    successRate: number;
    avgReturn: number;
    sampleSize: number;
} {
    if (historicalDetections.length === 0) {
        return { successRate: 0, avgReturn: 0, sampleSize: 0 };
    }

    let successCount = 0;
    let totalReturn = 0;

    historicalDetections.forEach(detection => {
        const returnPct = ((detection.futurePrice - detection.detectedPrice) / detection.detectedPrice) * 100;
        totalReturn += returnPct;

        // Success if return > 2%
        if (returnPct > 2) {
            successCount++;
        }
    });

    return {
        successRate: (successCount / historicalDetections.length) * 100,
        avgReturn: totalReturn / historicalDetections.length,
        sampleSize: historicalDetections.length,
    };
}
