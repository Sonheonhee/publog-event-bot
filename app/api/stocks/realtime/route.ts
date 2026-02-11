import { NextResponse } from 'next/server';
import { StockData, CandlestickData } from '@/types/stock';
import { kisClient } from '@/services/kisClient';
import { geminiService } from '@/services/geminiAI';
import { krxMonitor } from '@/services/krxMonitor';
import { dataVerificationService } from '@/services/dataVerification';
import { calculateIndicators } from '@/lib/indicators';
import { calculateStockScore, rankStocks, filterHighScoreStocks } from '@/lib/stockScoring';

// Sample stock symbols for demo
const SAMPLE_STOCKS = [
    { symbol: '005930', name: '삼성전자' },
    { symbol: '000660', name: 'SK하이닉스' },
    { symbol: '035420', name: 'NAVER' },
    { symbol: '005380', name: '현대차' },
    { symbol: '051910', name: 'LG화학' },
];

export async function GET() {
    try {
        // Update KRX suspended stocks
        await krxMonitor.autoUpdate();

        const stocks: StockData[] = [];

        // Fetch stock data
        for (const { symbol, name } of SAMPLE_STOCKS) {
            try {
                // Get current price from KIS API
                const quote = await kisClient.getCurrentPrice(symbol);

                // Parse KIS data
                const price = parseFloat(quote.stck_prpr);
                const change = parseFloat(quote.prdy_vrss);
                const changePercent = parseFloat(quote.prdy_ctrt);
                const volume = parseInt(quote.acml_vol);

                // Get historical data for indicators
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 200); // 200 days of data

                const historicalData = await kisClient.getHistoricalData(
                    symbol,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                // Convert to candlestick data
                const candlestickData: CandlestickData[] = historicalData.map((d: any) => ({
                    time: d.stck_bsop_date,
                    open: parseFloat(d.stck_oprc),
                    high: parseFloat(d.stck_hgpr),
                    low: parseFloat(d.stck_lwpr),
                    close: parseFloat(d.stck_clpr),
                    volume: parseInt(d.acml_vol),
                }));

                // Calculate technical indicators
                const indicators = calculateIndicators(candlestickData);

                // Check if suspended
                const isSuspended = krxMonitor.isSuspended(symbol);

                // Create stock object
                const stock: Partial<StockData> = {
                    symbol,
                    name,
                    price,
                    change,
                    changePercent,
                    volume,
                    isSuspended,
                    indicators,
                    timestamp: new Date(),
                };

                // Get AI analysis (only for top stocks to save API calls)
                if (stocks.length < 3) {
                    const aiAnalysis = await geminiService.analyzeStock(
                        stock as any,
                        indicators,
                        candlestickData
                    );
                    stock.aiAnalysis = aiAnalysis;
                }

                // Calculate score
                stock.score = calculateStockScore(
                    stock as any,
                    indicators,
                    stock.aiAnalysis
                );

                stocks.push(stock as StockData);

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Failed to fetch ${symbol}:`, error);
            }
        }

        // Rank and filter high-score stocks
        const rankedStocks = rankStocks(stocks);
        const highScoreStocks = filterHighScoreStocks(rankedStocks, 60);

        return NextResponse.json({
            success: true,
            stocks: highScoreStocks,
            timestamp: new Date(),
        });
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch stock data',
            },
            { status: 500 }
        );
    }
}
