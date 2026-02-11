import { CandlestickData, TechnicalIndicators } from '@/types/stock';
import { calculateIndicators } from './indicators';

// --- Evolved System Types ---

interface TransformerAttentionWeight {
    feature: string;
    weight: number;
}

interface MarketStateVector {
    rsi: number;
    macdHistogram: number;
    volatility: number;
    trendStrength: number;
    volumeFlow: number;
}

export interface PredictionResult {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    targetPrice: number;
    reasoning: string;
}

// --- SOTA-Inspired Hybrid Transformer Strategy ---

export class HybridTransformerStrategy {
    private readonly lookbackWindow = 30;
    // Simulated "Head" weights for Self-Attention mechanism
    private readonly attentionHeads = {
        momentum: 0.35, // High internal attention on RSI/MACD
        volatility: 0.25, // Attention on Bollinger Bands
        volume: 0.20, // Attention on Volume flow
        trend: 0.20, // Attention on Moving Averages
    };

    /**
     * Core "Forward Pass" of the evolved logic.
     * Simulates a single-layer Attention mechanism on top of technical features.
     */
    public predict(
        candles: CandlestickData[],
        sentimentScore: number = 0.5 // Neutral default (0 = Bearish, 1 = Bullish)
    ): PredictionResult {
        if (candles.length < this.lookbackWindow) {
            return { action: 'HOLD', confidence: 0, targetPrice: 0, reasoning: 'Insufficient Data' };
        }

        // 1. Feature Embedding (State Vector Construction)
        const recentCandles = candles.slice(-this.lookbackWindow);
        const indicators = calculateIndicators(recentCandles);
        const lastPrice = recentCandles[recentCandles.length - 1].close;

        // Normalize Inputs (0-1 Scale)
        const state: MarketStateVector = {
            rsi: indicators.rsi / 100, // 0-1
            macdHistogram: this.sigmoid(indicators.macd.histogram), // 0-1
            volatility: (indicators.bollingerBands.upper - indicators.bollingerBands.lower) / lastPrice,
            trendStrength: this.calculateTrendStrength(indicators, lastPrice),
            volumeFlow: indicators.volumeAvg > 0 ? (recentCandles[recentCandles.length - 1].volume || 0) / indicators.volumeAvg : 1
        };

        // 2. Multi-Head Self-Attention Simulation
        // In a real Transformer, this would be Q*K^T * V. Here we simulate the weighted aggregation.
        const momentumScore = (state.rsi * 0.5 + state.macdHistogram * 0.5);
        const trendScore = state.trendStrength;
        const volScore = 1 - Math.min(state.volatility * 10, 1); // Lower volatility is often better for steady trends, or high for breakouts.

        // Dynamic Attention Adjustment based on Market Regime (SOTA concept: Adaptive Gating)
        let dynamicWeights = { ...this.attentionHeads };
        if (state.volatility > 0.05) {
            // High volatility regime: Shift attention to Volatility and Momentum
            dynamicWeights.volatility += 0.2;
            dynamicWeights.trend -= 0.2;
        }

        // 3. Final Aggregation (Context Vector)
        const contextScore =
            (momentumScore * dynamicWeights.momentum) +
            (trendScore * dynamicWeights.trend) +
            (volScore * dynamicWeights.volatility) +
            (Math.min(state.volumeFlow, 2) * 0.1 * dynamicWeights.volume); // Cap volume impact

        // 4. Multi-modal Fusion
        // Fusing Time-Series Context with Sentiment (e.g., News/Social)
        // Formula: Final_Logit = alpha * Context + beta * Sentiment
        const alpha = 0.7;
        const beta = 0.3;
        const finalLogit = (contextScore * alpha) + (sentimentScore * beta);

        // 5. Decision Logic (Softmax-like thresholding)
        return this.generateDecision(finalLogit, lastPrice, state);
    }

    private sigmoid(t: number): number {
        return 1 / (1 + Math.exp(-t));
    }

    private calculateTrendStrength(ind: TechnicalIndicators, price: number): number {
        let score = 0;
        if (price > ind.sma20) score += 0.3;
        if (ind.sma20 > ind.sma50) score += 0.3;
        if (ind.sma50 > ind.sma200) score += 0.4;
        return score;
    }

    private generateDecision(logit: number, currentPrice: number, state: MarketStateVector): PredictionResult {
        // Logit is roughly 0 to 1, centered around 0.5
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let targetPrice = currentPrice;

        if (logit > 0.65) {
            action = 'BUY';
            targetPrice = currentPrice * (1 + (logit - 0.5) * 0.1); // Dynamic target based on conviction
        } else if (logit < 0.35) {
            action = 'SELL';
            targetPrice = currentPrice * (1 - (0.5 - logit) * 0.1);
        }

        // Explanation Generation (XAI - Explainable AI)
        const reasoning = `Score: ${logit.toFixed(3)} | RSI contribution: ${state.rsi.toFixed(2)} | Trend: ${state.trendStrength.toFixed(2)}`;

        return {
            action,
            confidence: Math.abs(logit - 0.5) * 2, // 0 to 1
            targetPrice,
            reasoning
        };
    }
}

// --- Backtest Simulation Utility ---

export function runSimulation(days: number = 365): { roi: string, mdd: string, trades: number } {
    // 1. Generate Dummy Data (Geometric Brownian Motion + Volatility Clusters)
    const candles: CandlestickData[] = [];
    let price = 100;
    for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.48) * 0.05; // Slightly bullish drift
        price = price * (1 + change);
        candles.push({
            time: `2025-01-${(i % 30) + 1}`,
            open: price,
            high: price * 1.02,
            low: price * 0.98,
            close: price * (1 + (Math.random() - 0.5) * 0.01),
            volume: Math.floor(Math.random() * 10000)
        });
    }

    // 2. Run Strategy
    const strategy = new HybridTransformerStrategy();
    let balance = 10000;
    let peakBalance = 10000;
    let maxDrawdown = 0;
    let position = 0; // 0 or 1 share (simplified)
    let entryPrice = 0;
    let tradeCount = 0;

    for (let i = 50; i < candles.length; i++) {
        const subset = candles.slice(0, i + 1);
        const currentPrice = subset[subset.length - 1].close;
        const prediction = strategy.predict(subset);

        // Update Max Drawdown
        if (balance > peakBalance) peakBalance = balance;
        const dd = (peakBalance - balance) / peakBalance;
        if (dd > maxDrawdown) maxDrawdown = dd;

        // Execute Trade
        if (prediction.action === 'BUY' && position === 0) {
            position = balance / currentPrice;
            balance = 0;
            entryPrice = currentPrice;
            tradeCount++;
        } else if (prediction.action === 'SELL' && position > 0) {
            balance = position * currentPrice;
            position = 0;
            tradeCount++;
        }
    }

    // Final Value
    const finalBalance = position > 0 ? position * candles[candles.length - 1].close : balance;
    const totalRoi = ((finalBalance - 10000) / 10000) * 100;

    return {
        roi: `${totalRoi.toFixed(2)}%`,
        mdd: `${(maxDrawdown * 100).toFixed(2)}%`,
        trades: tradeCount
    };
}
