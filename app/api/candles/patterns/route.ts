import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { CandlestickData, PatternDetection } from '@/types/stock';
import { detectAllPatterns } from '@/lib/candlePatterns';

/**
 * POST /api/candles/patterns
 * Detect candle patterns for a given stock
 */
export async function POST(request: Request) {
    try {
        const { symbol, candleData } = await request.json();

        if (!symbol || !candleData || !Array.isArray(candleData)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request: symbol and candleData required',
                    timestamp: new Date(),
                },
                { status: 400 }
            );
        }

        // Load pattern database
        const filePath = path.join(process.cwd(), 'data', 'candleResearch.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const researchData = JSON.parse(fileContents);
        const latestPatterns = researchData.research[0].patterns;

        // Detect patterns
        const detections: PatternDetection[] = detectAllPatterns(
            candleData as CandlestickData[],
            latestPatterns
        );

        return NextResponse.json({
            success: true,
            data: {
                symbol,
                detections,
                detectedAt: new Date(),
            },
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to detect candle patterns:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to detect candle patterns',
                timestamp: new Date(),
            },
            { status: 500 }
        );
    }
}
