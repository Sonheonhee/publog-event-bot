import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { StockData, CandlestickData } from '@/types/stock';
import { kisClient } from '@/services/kisClient';
import { geminiService } from '@/services/geminiAI';
import { calculateIndicators } from '@/lib/indicators';
import { calculateStockScore, rankStocks } from '@/lib/stockScoring';

// Stocks to analyze for tomorrow
const PREDICTION_STOCKS = [
    { symbol: '005930', name: '삼성전자' },
    { symbol: '000660', name: 'SK하이닉스' },
    { symbol: '035420', name: 'NAVER' },
    { symbol: '005380', name: '현대차' },
    { symbol: '051910', name: 'LG화학' },
    { symbol: '006400', name: '삼성SDI' },
    { symbol: '035720', name: '카카오' },
];

export async function GET() {
    try {
        const predictions: StockData[] = [];

        for (const { symbol, name } of PREDICTION_STOCKS) {
            try {
                // Get current price
                const quote = await kisClient.getCurrentPrice(symbol);

                const price = parseFloat(quote.stck_prpr);
                const change = parseFloat(quote.prdy_vrss);
                const changePercent = parseFloat(quote.prdy_ctrt);
                const volume = parseInt(quote.acml_vol);

                // Get historical data
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 200);

                const historicalData = await kisClient.getHistoricalData(
                    symbol,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                const candlestickData: CandlestickData[] = historicalData.map((d: any) => ({
                    time: d.stck_bsop_date,
                    open: parseFloat(d.stck_oprc),
                    high: parseFloat(d.stck_hgpr),
                    low: parseFloat(d.stck_lwpr),
                    close: parseFloat(d.stck_clpr),
                    volume: parseInt(d.acml_vol),
                }));

                // Calculate indicators
                const indicators = calculateIndicators(candlestickData);

                // Get AI analysis
                const stock: Partial<StockData> = {
                    symbol,
                    name,
                    price,
                    change,
                    changePercent,
                    volume,
                    isSuspended: false,
                    indicators,
                    timestamp: new Date(),
                };

                const aiAnalysis = await geminiService.analyzeStock(
                    stock as any,
                    indicators,
                    candlestickData
                );

                stock.aiAnalysis = aiAnalysis;
                stock.score = calculateStockScore(stock as any, indicators, aiAnalysis);

                predictions.push(stock as StockData);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Failed to analyze ${symbol}:`, error);
            }
        }

        // Filter only BUY predictions and rank by confidence
        const buyPredictions = predictions
            .filter(p => p.aiAnalysis?.prediction === 'BUY')
            .sort((a, b) => (b.aiAnalysis?.confidence || 0) - (a.aiAnalysis?.confidence || 0));

        // Generate market summary
        // Use top stocks (regardless of BUY/SELL) to form a market view
        const topStocksForSummary = predictions.slice(0, 5);
        let marketSummary = '';
        try {
            marketSummary = await geminiService.generateMarketSummary(topStocksForSummary as any[]);
        } catch (error) {
            console.error('Failed to generate market summary:', error);
            marketSummary = '시장 요약 생성 실패';
        }

        return NextResponse.json({
            success: true,
            predictions: buyPredictions.slice(0, 5), // Top 5 predictions
            marketSummary,
            timestamp: new Date(),
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to generate predictions',
            },
            { status: 500 }
        );
    }
}
