import { Stock, SectorAnalysis, SectorStock, StockData } from '@/types/stock';
import { getSectorForStock, getStocksInSector, SectorType } from './sectorMapping';
import { calculateStockScore } from './stockScoring';

/**
 * Filter stocks by sector
 */
export function filterStocksBySector(stocks: StockData[], sector: SectorType): StockData[] {
    return stocks.filter(stock => getSectorForStock(stock.symbol) === sector);
}

/**
 * Select surging stocks within a sector
 * Criteria:
 * 1. High volume (2x average or more)
 * 2. Positive price momentum (+2% or more)
 * 3. Strong technical score (70+)
 * 4. RSI in healthy range (40-75)
 */
export function selectSurgingStocks(
    sectorStocks: StockData[],
    limit: number = 5
): SectorStock[] {
    const surgingStocks = sectorStocks
        .filter(stock => {
            // Volume surge check
            const volumeRatio = stock.volume / stock.indicators.volumeAvg;
            const hasVolumeSurge = volumeRatio >= 1.5;

            // Price momentum check
            const hasMomentum = stock.changePercent >= 1.5;

            // Technical strength check
            const hasStrength = stock.score >= 65;

            // RSI healthy range
            const rsi = stock.indicators.rsi;
            const healthyRSI = rsi >= 40 && rsi <= 75;

            return hasVolumeSurge && hasMomentum && hasStrength && healthyRSI;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return surgingStocks.map((stock, index) => ({
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        changePercent: stock.changePercent,
        sectorRank: index + 1,
        expectedGrowth: calculateExpectedGrowth(stock),
        catalysts: identifyCatalysts(stock),
        score: stock.score,
    }));
}

/**
 * Calculate expected growth based on technical indicators and AI analysis
 */
function calculateExpectedGrowth(stock: StockData): number {
    let expectedGrowth = 0;

    // Base on AI analysis if available
    if (stock.aiAnalysis?.expectedReturn) {
        expectedGrowth = stock.aiAnalysis.expectedReturn;
    } else {
        // Estimate based on technical indicators
        const rsi = stock.indicators.rsi;
        const macdHistogram = stock.indicators.macd.histogram;

        // RSI contribution
        if (rsi < 30) {
            expectedGrowth += 8; // Oversold bounce potential
        } else if (rsi >= 50 && rsi <= 70) {
            expectedGrowth += 5; // Healthy uptrend
        }

        // MACD contribution
        if (macdHistogram > 0) {
            expectedGrowth += 4;
        }

        // Momentum contribution
        expectedGrowth += stock.changePercent * 0.5;
    }

    return Math.max(0, Math.min(30, expectedGrowth)); // Cap at 30%
}

/**
 * Identify catalysts for stock surge
 */
function identifyCatalysts(stock: StockData): string[] {
    const catalysts: string[] = [];

    // Volume surge
    const volumeRatio = stock.volume / stock.indicators.volumeAvg;
    if (volumeRatio >= 3) {
        catalysts.push('거래량 급증 (3배 이상)');
    } else if (volumeRatio >= 2) {
        catalysts.push('거래량 증가 (2배 이상)');
    }

    // Technical signals
    const rsi = stock.indicators.rsi;
    if (rsi < 30) {
        catalysts.push('RSI 과매도 반등');
    } else if (rsi >= 50 && rsi <= 70) {
        catalysts.push('RSI 상승 추세');
    }

    if (stock.indicators.macd.histogram > 0 && stock.indicators.macd.macd > stock.indicators.macd.signal) {
        catalysts.push('MACD 골든크로스');
    }

    // Price action
    if (stock.price > stock.indicators.sma20 && stock.price > stock.indicators.sma50) {
        catalysts.push('이동평균선 상향 돌파');
    }

    // AI factors
    if (stock.aiAnalysis?.factors) {
        const topFactors = stock.aiAnalysis.factors
            .filter(f => f.impact > 30)
            .slice(0, 2);
        topFactors.forEach(factor => {
            catalysts.push(factor.name);
        });
    }

    return catalysts.slice(0, 4); // Limit to 4 catalysts
}

/**
 * Analyze sector trend and performance
 */
export function analyzeSectorTrend(sectorStocks: StockData[]): {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    avgChange: number;
    strongStocks: number;
} {
    if (sectorStocks.length === 0) {
        return {
            trend: 'NEUTRAL',
            confidence: 0,
            avgChange: 0,
            strongStocks: 0,
        };
    }

    // Calculate average price change
    const avgChange = sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / sectorStocks.length;

    // Count strong stocks (score >= 70)
    const strongStocks = sectorStocks.filter(s => s.score >= 70).length;
    const strongRatio = strongStocks / sectorStocks.length;

    // Determine trend
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    let confidence: number;

    if (avgChange > 2 && strongRatio > 0.5) {
        trend = 'BULLISH';
        confidence = Math.min(95, 70 + avgChange * 5 + strongRatio * 20);
    } else if (avgChange < -2 && strongRatio < 0.3) {
        trend = 'BEARISH';
        confidence = Math.min(95, 70 + Math.abs(avgChange) * 5);
    } else {
        trend = 'NEUTRAL';
        confidence = 50 + Math.abs(avgChange) * 2;
    }

    return {
        trend,
        confidence: Math.round(confidence),
        avgChange: Math.round(avgChange * 100) / 100,
        strongStocks,
    };
}

/**
 * Get sector performance summary
 */
export function getSectorPerformanceSummary(sectorStocks: StockData[]): string {
    const { trend, avgChange, strongStocks } = analyzeSectorTrend(sectorStocks);
    const total = sectorStocks.length;

    const trendText = trend === 'BULLISH' ? '상승세' : trend === 'BEARISH' ? '하락세' : '보합세';
    const changeText = avgChange > 0 ? `+${avgChange.toFixed(2)}%` : `${avgChange.toFixed(2)}%`;

    return `섹터 전체 ${trendText} (평균 ${changeText}), ${total}개 종목 중 ${strongStocks}개 강세`;
}
