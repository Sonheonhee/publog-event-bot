import { TechnicalIndicators, MACDData, BollingerBands, CandlestickData } from '@/types/stock';

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
        return 50; // Default neutral value
    }

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) {
            gains += changes[i];
        } else {
            losses += Math.abs(changes[i]);
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate subsequent values using smoothing
    for (let i = period; i < changes.length; i++) {
        const change = changes[i];
        if (change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

/**
 * Calculate SMA (Simple Moving Average)
 */
export function calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
        return prices[prices.length - 1] || 0;
    }

    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

/**
 * Calculate EMA (Exponential Moving Average)
 */
export function calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
        return calculateSMA(prices, prices.length);
    }

    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
): MACDData {
    const ema12 = calculateEMA(prices, fastPeriod);
    const ema26 = calculateEMA(prices, slowPeriod);
    const macdLine = ema12 - ema26;

    // Calculate signal line (EMA of MACD)
    const macdValues: number[] = [];
    for (let i = slowPeriod; i <= prices.length; i++) {
        const slice = prices.slice(0, i);
        const fast = calculateEMA(slice, fastPeriod);
        const slow = calculateEMA(slice, slowPeriod);
        macdValues.push(fast - slow);
    }

    const signal = calculateEMA(macdValues, signalPeriod);
    const histogram = macdLine - signal;

    return {
        macd: macdLine,
        signal,
        histogram,
    };
}

/**
 * Calculate Bollinger Bands
 */
export function calculateBollingerBands(
    prices: number[],
    period: number = 20,
    stdDev: number = 2
): BollingerBands {
    const sma = calculateSMA(prices, period);

    if (prices.length < period) {
        return {
            upper: sma,
            middle: sma,
            lower: sma,
        };
    }

    const slice = prices.slice(-period);
    const squaredDiffs = slice.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
        upper: sma + (standardDeviation * stdDev),
        middle: sma,
        lower: sma - (standardDeviation * stdDev),
    };
}

/**
 * Calculate all technical indicators
 */
export function calculateIndicators(
    historicalData: CandlestickData[]
): TechnicalIndicators {
    const closePrices = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume || 0);

    return {
        rsi: calculateRSI(closePrices),
        macd: calculateMACD(closePrices),
        bollingerBands: calculateBollingerBands(closePrices),
        sma20: calculateSMA(closePrices, 20),
        sma50: calculateSMA(closePrices, 50),
        sma200: calculateSMA(closePrices, 200),
        ema12: calculateEMA(closePrices, 12),
        ema26: calculateEMA(closePrices, 26),
        volumeAvg: calculateSMA(volumes, 20),
    };
}

/**
 * Calculate stock score based on technical indicators
 */
export function calculateTechnicalScore(indicators: TechnicalIndicators, currentPrice: number): number {
    let score = 0;

    // RSI Score (0-20 points)
    if (indicators.rsi < 30) {
        score += 20; // Oversold - bullish
    } else if (indicators.rsi > 70) {
        score += 5; // Overbought - caution
    } else {
        score += 10 + ((50 - Math.abs(indicators.rsi - 50)) / 50) * 10;
    }

    // MACD Score (0-20 points)
    if (indicators.macd.histogram > 0) {
        score += 15 + Math.min(indicators.macd.histogram / 100, 5);
    } else {
        score += Math.max(0, 10 + indicators.macd.histogram / 100);
    }

    // Bollinger Bands Score (0-15 points)
    const bbPosition = (currentPrice - indicators.bollingerBands.lower) /
        (indicators.bollingerBands.upper - indicators.bollingerBands.lower);
    if (bbPosition < 0.2) {
        score += 15; // Near lower band - potential bounce
    } else if (bbPosition > 0.8) {
        score += 5; // Near upper band - potential reversal
    } else {
        score += 10;
    }

    // Moving Average Score (0-15 points)
    let maScore = 0;
    if (currentPrice > indicators.sma20) maScore += 5;
    if (currentPrice > indicators.sma50) maScore += 5;
    if (currentPrice > indicators.sma200) maScore += 5;
    score += maScore;

    // Trend Score (0-15 points)
    if (indicators.sma20 > indicators.sma50 && indicators.sma50 > indicators.sma200) {
        score += 15; // Strong uptrend
    } else if (indicators.sma20 < indicators.sma50 && indicators.sma50 < indicators.sma200) {
        score += 5; // Downtrend
    } else {
        score += 10; // Mixed
    }

    // EMA Crossover Score (0-15 points)
    if (indicators.ema12 > indicators.ema26) {
        score += 15; // Bullish crossover
    } else {
        score += 5;
    }

    return Math.min(100, Math.max(0, score));
}
