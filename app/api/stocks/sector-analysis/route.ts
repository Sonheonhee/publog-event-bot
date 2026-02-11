import { NextResponse } from 'next/server';
import { kisClient } from '@/services/kisClient';
import { geminiService } from '@/services/geminiAI';
import { Stock, SectorAnalysis } from '@/types/stock';

export const dynamic = 'force-dynamic';

const SECTORS = [
    {
        name: '반도체',
        stocks: [
            { symbol: '005930', name: '삼성전자' },
            { symbol: '000660', name: 'SK하이닉스' },
            { symbol: '042700', name: '한미반도체' }
        ]
    },
    {
        name: '2차전지',
        stocks: [
            { symbol: '051910', name: 'LG화학' },
            { symbol: '006400', name: '삼성SDI' },
            { symbol: '373220', name: 'LG에너지솔루션' }
        ]
    },
    {
        name: '플랫폼',
        stocks: [
            { symbol: '035420', name: 'NAVER' },
            { symbol: '035720', name: '카카오' }
        ]
    },
    {
        name: '자동차',
        stocks: [
            { symbol: '005380', name: '현대차' },
            { symbol: '000270', name: '기아' }
        ]
    },
    {
        name: '바이오',
        stocks: [
            { symbol: '207940', name: '삼성바이오로직스' },
            { symbol: '068270', name: '셀트리온' }
        ]
    }
];

export async function GET() {
    try {
        const sectorAnalyses: SectorAnalysis[] = [];

        for (const sector of SECTORS) {
            try {
                // Fetch stock data
                const stocksData: Stock[] = [];
                for (const s of sector.stocks) {
                    try {
                        const quote = await kisClient.getCurrentPrice(s.symbol);
                        stocksData.push({
                            symbol: s.symbol,
                            name: s.name,
                            price: parseFloat(quote.stck_prpr),
                            change: parseFloat(quote.prdy_vrss),
                            changePercent: parseFloat(quote.prdy_ctrt),
                            volume: parseInt(quote.acml_vol),
                            sector: sector.name,
                            isSuspended: false
                        });
                        // Rate limit
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (e) {
                        console.error(`Failed to fetch ${s.name}:`, e);
                    }
                }

                if (stocksData.length === 0) continue;

                // Calculate trends
                const avgChange = stocksData.reduce((sum, s) => sum + s.changePercent, 0) / stocksData.length;
                const strongStocks = stocksData.filter(s => s.changePercent > 0).length;
                const trend = avgChange > 0.5 ? 'BULLISH' : (avgChange < -0.5 ? 'BEARISH' : 'NEUTRAL');

                // AI Analysis
                const analysis = await geminiService.analyzeSector(
                    sector.name,
                    stocksData,
                    { trend, avgChange: avgChange, strongStocks }
                );

                // Map to SectorStock type for response
                analysis.topStocks = stocksData.map((s, idx) => ({
                    symbol: s.symbol,
                    name: s.name,
                    price: s.price,
                    changePercent: s.changePercent,
                    sectorRank: idx + 1,
                    expectedGrowth: 0, // AI placeholder
                    catalysts: [],
                    score: 0
                }));

                sectorAnalyses.push(analysis);

            } catch (error) {
                console.error(`Failed to analyze sector ${sector.name}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            data: sectorAnalyses,
            timestamp: new Date()
        });

    } catch (error: any) {
        console.error('Sector Analysis API Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to analyze sectors'
            },
            { status: 500 }
        );
    }
}
