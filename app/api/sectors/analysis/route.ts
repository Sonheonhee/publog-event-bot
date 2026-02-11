import { NextResponse } from 'next/server';
import { StockData, SectorAnalysis } from '@/types/stock';
import { filterStocksBySector, selectSurgingStocks, analyzeSectorTrend } from '@/lib/sectorAnalysis';
import { SectorType } from '@/lib/sectorMapping';
import { geminiService } from '@/services/geminiAI';

/**
 * GET /api/sectors/analysis?sector=2차전지
 * Analyze a specific sector and return top surging stocks
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sector = searchParams.get('sector') as SectorType;

        if (!sector) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Sector parameter is required',
                    timestamp: new Date(),
                },
                { status: 400 }
            );
        }

        // Fetch real-time stock data
        const realtimeResponse = await fetch(`${request.url.split('/api')[0]}/api/stocks/realtime`);
        const realtimeData = await realtimeResponse.json();

        if (!realtimeData.success || !realtimeData.data) {
            throw new Error('Failed to fetch realtime stock data');
        }

        const allStocks: StockData[] = realtimeData.data;

        // Filter stocks by sector
        const sectorStocks = filterStocksBySector(allStocks, sector);

        if (sectorStocks.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    sectorName: sector,
                    trend: 'NEUTRAL',
                    confidence: 0,
                    reasoning: '해당 섹터의 종목 데이터가 없습니다.',
                    topStocks: [],
                    lastUpdated: new Date(),
                },
                timestamp: new Date(),
            });
        }

        // Analyze sector trend
        const trendAnalysis = analyzeSectorTrend(sectorStocks);

        // Select surging stocks
        const surgingStocks = selectSurgingStocks(sectorStocks, 5);

        // Get AI analysis for the sector
        const aiAnalysis = await geminiService.analyzeSector(
            sector,
            sectorStocks,
            trendAnalysis
        );

        // Combine results
        const sectorAnalysis: SectorAnalysis = {
            ...aiAnalysis,
            topStocks: surgingStocks,
        };

        return NextResponse.json({
            success: true,
            data: sectorAnalysis,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to analyze sector:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to analyze sector',
                timestamp: new Date(),
            },
            { status: 500 }
        );
    }
}
