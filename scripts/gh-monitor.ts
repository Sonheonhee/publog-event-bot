
import { kisClient } from '../services/kisClient';
import { spawn } from 'child_process';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const CONFIG = {
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    // List of stocks to monitor (Major Korean Stocks)
    TARGET_STOCKS: [
        { code: '005930', name: '삼성전자' },
        { code: '000660', name: 'SK하이닉스' },
        { code: '373220', name: 'LG에너지솔루션' },
        { code: '207940', name: '삼성바이오로직스' },
        { code: '005380', name: '현대차' },
        { code: '000270', name: '기아' },
        { code: '068270', name: '셀트리온' },
        { code: '005490', name: 'POSCO홀딩스' },
        { code: '035420', name: 'NAVER' },
        { code: '035720', name: '카카오' },
        { code: '105560', name: 'KB금융' },
        { code: '055550', name: '신한지주' },
        { code: '051910', name: 'LG화학' },
        { code: '006400', name: '삼성SDI' }
    ]
};

// Helper for ESM directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StockResult {
    name: string;
    code: string;
    price: number;
    change: number;
    changePercent: number;
    signal?: any;
    error?: string;
}

/**
 * Run Wonyotti Strategy Analysis (Python Bridge)
 */
async function runPythonStrategy(historyData: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../engine/wonyotti_strategy.py');
        const pythonProcess = spawn('python', [pythonScript]);

        let result = '';
        let error = '';

        // Pipe data to Python stdin
        pythonProcess.stdin.write(JSON.stringify({ candles: historyData }));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`[Python] Error: ${error}`);
                resolve(null);
            } else {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    console.error(`[Python] Parse Error: ${result}`);
                    resolve(null);
                }
            }
        });
    });
}

/**
 * Send Discord Notification
 */
async function sendDiscordNotification(embed: any) {
    if (!CONFIG.DISCORD_WEBHOOK_URL) {
        console.error('Missing DISCORD_WEBHOOK_URL');
        return;
    }

    try {
        await axios.post(CONFIG.DISCORD_WEBHOOK_URL, { embeds: [embed] });
        console.log('Sent Discord notification');
    } catch (error: any) {
        console.error('Failed to send Discord notification:', error.message);
    }
}

/**
 * Main Monitoring Function
 */
async function runMonitor() {
    console.log('Starting GitHub Actions Stock Monitor...');

    const results: StockResult[] = [];
    const signals: StockResult[] = [];

    // 1. Process each stock
    for (const stock of CONFIG.TARGET_STOCKS) {
        console.log(`Processing ${stock.name} (${stock.code})...`);
        try {
            // Get Current Price
            const priceData = await kisClient.getCurrentPrice(stock.code);
            const price = parseFloat(priceData.stck_prpr);
            const change = parseFloat(priceData.prdy_vrss);
            const changePercent = parseFloat(priceData.prdy_ctrt);

            // Get Historical Data (for Strategy)
            // Last 200 days
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 250); // Margin for weekends

            const historyRaw = await kisClient.getHistoricalData(
                stock.code,
                startDate.toISOString().split('T')[0].replace(/-/g, ''),
                endDate.toISOString().split('T')[0].replace(/-/g, '')
            );

            // Convert KIS history to format expected by Python script
            const candles = historyRaw.map((d: any) => ({
                date: d.stck_bsop_date,
                open: parseFloat(d.stck_oprc),
                high: parseFloat(d.stck_hgpr),
                low: parseFloat(d.stck_lwpr),
                close: parseFloat(d.stck_clpr),
                volume: parseInt(d.acml_vol)
            })).reverse(); // KIS returns latest first, we likely want chronological order? 
            // Actually wonyotti_strategy.py doesn't sort, so we should ensure it's sorted by date ascending if needed.
            // pandas dataframe usually handles it, but let's reverse to be safe (oldest to newest).

            // Run Strategy
            const signal = await runPythonStrategy(candles);

            const result: StockResult = {
                name: stock.name,
                code: stock.code,
                price,
                change,
                changePercent,
                signal
            };

            results.push(result);

            // Check for Buy/Sell signals (excluding HOLD)
            if (signal && (signal.action === 'BUY' || signal.action === 'STRONG_BUY' || signal.action === 'SELL')) {
                signals.push(result);
            }

            // Rate limit
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error: any) {
            console.error(`Failed to process ${stock.name}:`, error.message);
        }
    }

    // 2. Generate Daily Report
    // Sort by change percent
    results.sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = results.slice(0, 5);

    const now = new Date();
    const todayStr = now.toLocaleDateString('ko-KR');

    // Create Embed fields
    const fields = topGainers.map((stock, index) => ({
        name: `${index + 1}. ${stock.name} (${stock.code})`,
        value: `📈 ${stock.changePercent.toFixed(2)}% | ${stock.price.toLocaleString()}원`,
        inline: false
    }));

    // Add Signals if any
    if (signals.length > 0) {
        fields.push({ name: '\u200B', value: '**🚨 전략 시그널 포착**', inline: false });
        signals.forEach(stock => {
            const actionMap: { [key: string]: string } = {
                'STRONG_BUY': '강력 매수',
                'BUY': '매수',
                'SELL': '매도',
                'HOLD': '관망'
            };
            const actionKr = actionMap[stock.signal.action] || stock.signal.action;
            const emoji = stock.signal.action.includes('BUY') ? '🟢' : '🔴';
            fields.push({
                name: `${emoji} ${stock.name} - ${actionKr}`,
                value: `사유: ${stock.signal.reason}\nRSI: ${stock.signal.factors.rsi.toFixed(1)} | Z: ${stock.signal.factors.z_score.toFixed(2)}`,
                inline: false
            });
        });
    }

    // Send Notification
    await sendDiscordNotification({
        title: '📊 일일 주식 리포트 (GitHub Actions)',
        description: `${todayStr} 마감 시황 및 전략 분석 결과입니다.`,
        color: 0x0099ff,
        fields: fields,
        timestamp: now.toISOString(),
        footer: { text: 'Stock Bot Automated Report' }
    });

    console.log('Report sent successfully.');
}

runMonitor().catch(console.error);
