
// Mocking types and dependencies to be self-contained
interface CandlestickData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

interface TechnicalIndicators {
    rsi: number;
    macd: { histogram: number };
    bollingerBands: { upper: number; lower: number };
    sma20: number;
    sma50: number;
    sma200: number;
    volumeAvg: number;
    ema12: number;
    ema26: number;
}

// Simplified Indicator Logic (Inlined for standalone execution)
function calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateIndicators(data: CandlestickData[]): TechnicalIndicators {
    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume || 0);
    const lastPrice = closes[closes.length - 1];

    // Mocking complex indicators for simulation speed/simplicity in this standalone script
    // In production code, these use the full libraries.
    return {
        rsi: 50 + (Math.random() - 0.5) * 20, // Random walk around 50
        macd: { histogram: (Math.random() - 0.5) * 2 },
        bollingerBands: { upper: lastPrice * 1.05, lower: lastPrice * 0.95 },
        sma20: calculateSMA(closes, 20),
        sma50: calculateSMA(closes, 50),
        sma200: calculateSMA(closes, 200),
        volumeAvg: calculateSMA(volumes, 20),
        ema12: lastPrice,
        ema26: lastPrice
    };
}

// Strategy Class (Copy of the logic)
class HybridTransformerStrategy {
    private readonly lookbackWindow = 30;
    private readonly attentionHeads = {
        momentum: 0.35,
        volatility: 0.25,
        volume: 0.20,
        trend: 0.20,
    };

    public predict(candles: CandlestickData[]): { action: string, confidence: number } {
        if (candles.length < this.lookbackWindow) return { action: 'HOLD', confidence: 0 };

        const indicators = calculateIndicators(candles);
        const lastPrice = candles[candles.length - 1].close;

        // Simplified prediction logic for simulation
        const momentum = indicators.rsi > 55 ? 1 : 0;
        const trend = indicators.sma20 > indicators.sma50 ? 1 : 0;

        let score = (momentum * 0.5) + (trend * 0.5);
        if (Math.random() > 0.8) score += 0.2; // Add some noise

        if (score > 0.6) return { action: 'BUY', confidence: score };
        if (score < 0.4) return { action: 'SELL', confidence: 1 - score };
        return { action: 'HOLD', confidence: 0 };
    }
}

function runSimulation(days: number = 365) {
    const candles: CandlestickData[] = [];
    let price = 100;
    for (let i = 0; i < days; i++) {
        const change = (Math.random() - 0.48) * 0.05;
        price = price * (1 + change);
        candles.push({
            time: `2025-01-${i}`,
            open: price,
            high: price * 1.02,
            low: price * 0.98,
            close: price,
            volume: 1000 + Math.random() * 1000
        });
    }

    const strategy = new HybridTransformerStrategy();
    let balance = 10000;
    let peak = 10000;
    let mdd = 0;
    let position = 0;
    let trades = 0;

    for (let i = 50; i < candles.length; i++) {
        const subset = candles.slice(0, i + 1);
        const prediction = strategy.predict(subset);
        const currentPrice = candles[i].close;

        if (balance > peak) peak = balance;
        const dd = (peak - balance) / peak;
        if (dd > mdd) mdd = dd;

        if (prediction.action === 'BUY' && position === 0) {
            position = balance / currentPrice;
            balance = 0;
            trades++;
        } else if (prediction.action === 'SELL' && position > 0) {
            balance = position * currentPrice;
            position = 0;
            trades++;
        }
    }

    const finalBalance = position > 0 ? position * candles[candles.length - 1].close : balance;
    const roi = ((finalBalance - 10000) / 10000) * 100;

    console.log(JSON.stringify({
        roi: `${roi.toFixed(2)}%`,
        mdd: `${(mdd * 100).toFixed(2)}%`,
        trades,
        finalBalance: finalBalance.toFixed(2)
    }));
}

runSimulation();
