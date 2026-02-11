import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { CandleResearch } from '@/types/stock';

/**
 * GET /api/candles/research
 * Returns the latest weekly candle pattern research data
 */
export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', 'candleResearch.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        // Get the most recent research
        const latestResearch: CandleResearch = data.research[0];

        return NextResponse.json({
            success: true,
            data: latestResearch,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to load candle research data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to load candle research data',
                timestamp: new Date(),
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/candles/research
 * Update weekly candle research data (Admin only)
 */
export async function POST(request: Request) {
    try {
        const newResearch: CandleResearch = await request.json();

        const filePath = path.join(process.cwd(), 'data', 'candleResearch.json');
        const fileContents = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(fileContents);

        // Add new research to the beginning of the array
        data.research.unshift(newResearch);
        data.currentWeek = newResearch.weekNumber;
        data.currentYear = newResearch.year;
        data.lastUpdated = newResearch.updatedAt;

        // Keep only last 12 weeks of data
        if (data.research.length > 12) {
            data.research = data.research.slice(0, 12);
        }

        // Write back to file
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

        return NextResponse.json({
            success: true,
            data: newResearch,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Failed to update candle research data:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update candle research data',
                timestamp: new Date(),
            },
            { status: 500 }
        );
    }
}
