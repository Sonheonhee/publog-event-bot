/**
 * Background Stock Monitor
 * Runs independently to monitor stocks and send Discord notifications
 * 
 * Usage:
 *   node scripts/monitor.js
 * 
 * Environment variables required:
 *   - DISCORD_WEBHOOK_URL
 *   - KIS_APP_KEY
 *   - KIS_APP_SECRET
 *   - GEMINI_API_KEY (optional, for AI analysis)
 */

require('dotenv').config({ path: '.env.local' });
const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
    CHECK_INTERVAL_MS: 60 * 1000, // 1 minute
    API_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    HIGH_SCORE_THRESHOLD: 80,
    ENABLE_AI_ANALYSIS: true,
    COOLDOWN_MS: 5 * 60 * 1000, // 5 minutes
};

// Notification history for deduplication
const notificationHistory = new Map();
let lastDailyReportDate = null;

/**
 * Send Discord notification
 */
async function sendDiscordNotification(embed) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('[Monitor] Discord webhook URL not configured');
        return false;
    }

    try {
        await axios.post(webhookUrl, { embeds: [embed] });
        return true;
    } catch (error) {
        console.error('[Monitor] Failed to send Discord notification:', error.message);
        return false;
    }
}

/**
 * Check if notification should be sent (cooldown check)
 */
function shouldNotify(symbol, type) {
    const key = `${symbol}-${type}`;
    const lastNotification = notificationHistory.get(key);

    if (!lastNotification) {
        return true;
    }

    const now = Date.now();
    return now - lastNotification > CONFIG.COOLDOWN_MS;
}

/**
 * Record notification
 */
function recordNotification(symbol, type) {
    const key = `${symbol}-${type}`;
    notificationHistory.set(key, Date.now());
}

/**
 * Fetch real-time stock data
 */
async function fetchStockData() {
    try {
        const response = await axios.get(`${CONFIG.API_BASE_URL}/api/stocks/realtime`, {
            timeout: 30000,
        });

        return response.data.stocks || [];
    } catch (error) {
        console.error('[Monitor] Failed to fetch stock data:', error.message);
        return [];
    }
}

/**
 * Run Wonyotti Strategy Analysis (Python Bridge)
 */
async function runWonyottiAnalysis(symbol) {
    try {
        // Fetch Daily OHLCV Data (Using KIS API or fallback)
        // Note: For now, we will fetch historical data from KIS API
        const response = await axios.get(`${CONFIG.API_BASE_URL}/api/stocks/history?symbol=${symbol}&period=daily`, {
            timeout: 10000
        });

        const historyData = response.data;
        if (!historyData || !historyData.candles || historyData.candles.length < 20) {
            console.log(`[Monitor] Insufficient history for ${symbol}`);
            return null;
        }

        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '../engine/wonyotti_strategy.py');
            const pythonProcess = spawn('python', [pythonScript]);

            let result = '';
            let error = '';

            // Pipe data to Python stdin
            pythonProcess.stdin.write(JSON.stringify(historyData));
            pythonProcess.stdin.end();

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`[Monitor] Python script error: ${error}`);
                    resolve(null); // Fail gracefully
                } else {
                    try {
                        resolve(JSON.parse(result));
                    } catch (e) {
                        console.error(`[Monitor] Failed to parse Python output: ${result}`);
                        resolve(null);
                    }
                }
            });
        });
    } catch (error) {
        console.error(`[Monitor] Wonyotti analysis failed for ${symbol}: ${error.message}`);
        return null;
    }
}

/**
 * Process and notify high score stocks
 */
async function processStocks(stocks) {
    const highScoreStocks = stocks.filter(stock => stock.score >= CONFIG.HIGH_SCORE_THRESHOLD);

    if (highScoreStocks.length === 0) {
        console.log('[Monitor] No high score stocks found');
        return;
    }

    console.log(`[Monitor] Found ${highScoreStocks.length} high score stocks`);

    // Send individual notifications for new high score stocks
    for (const stock of highScoreStocks) {
        // Check for suspended stocks first
        if (stock.isSuspended && shouldNotify(stock.symbol, 'suspended')) {
            await sendDiscordNotification({
                title: '⚠️ 거래정지 종목 경고',
                description: `**${stock.name} (${stock.symbol})**이(가) 거래정지되었습니다.`,
                color: 0xff0000,
                timestamp: new Date().toISOString(),
                footer: { text: 'Premium Quant Dashboard' },
            });
            recordNotification(stock.symbol, 'suspended');
            await sleep(1000); // Rate limiting
            continue;
        }

        // Send high score notification
        if (shouldNotify(stock.symbol, 'high_score')) {
            console.log(`[Monitor] Checking Wonyotti strategy for ${stock.name}...`);
            const wonyottiSignal = await runWonyottiAnalysis(stock.symbol);

            let description = `**${stock.name} (${stock.symbol})**이(가) 높은 점수를 기록했습니다.`;
            let color = 0x00ff00;

            const fields = [
                {
                    name: '종합 점수',
                    value: `${stock.score.toFixed(1)}/100`,
                    inline: true,
                },
                {
                    name: '현재가',
                    value: `${stock.price.toLocaleString()}원`,
                    inline: true,
                },
                {
                    name: '등락률',
                    value: `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`,
                    inline: true,
                },
            ];

            // If Wonyotti Signal Found, Enhance Notification
            if (wonyottiSignal && (wonyottiSignal.action === 'BUY' || wonyottiSignal.action === 'STRONG_BUY')) {
                description += `\n\n💡 **워뇨띠 전략 포착!**\n"${wonyottiSignal.reason}"`;
                fields.push({
                    name: '워뇨띠 시그널',
                    value: wonyottiSignal.action === 'STRONG_BUY' ? '🚨 강력 매수 (Panic Buy)' : 'Checking...',
                    inline: false
                });
                fields.push({
                    name: 'RSI / Z-Score',
                    value: `${wonyottiSignal.factors.rsi.toFixed(1)} / ${wonyottiSignal.factors.z_score.toFixed(2)}`,
                    inline: true
                });
                if (wonyottiSignal.action === 'STRONG_BUY') color = 0xff00ff; // Purple for special signal
            }

            await sendDiscordNotification({
                title: '🎯 고점수 종목 발견!',
                description: description,
                color: color,
                fields: fields,
                timestamp: new Date().toISOString(),
                footer: { text: 'Premium Quant Dashboard • Wonyotti Engine' },
            });
            recordNotification(stock.symbol, 'high_score');
            console.log(`[Monitor] Sent notification for ${stock.symbol}`);
            await sleep(1000); // Rate limiting
        }

        // Send AI prediction if available
        if (stock.aiAnalysis && shouldNotify(stock.symbol, 'prediction')) {
            const emoji = stock.aiAnalysis.prediction === 'BUY' ? '🟢' :
                stock.aiAnalysis.prediction === 'SELL' ? '🔴' : '🟡';

            await sendDiscordNotification({
                title: `${emoji} AI 예측: ${stock.name}`,
                description: stock.aiAnalysis.reasoning,
                color: stock.aiAnalysis.prediction === 'BUY' ? 0x00ff00 :
                    stock.aiAnalysis.prediction === 'SELL' ? 0xff0000 : 0xffff00,
                fields: [
                    {
                        name: '종목',
                        value: `${stock.name} (${stock.symbol})`,
                        inline: true,
                    },
                    {
                        name: '예측',
                        value: stock.aiAnalysis.prediction,
                        inline: true,
                    },
                    {
                        name: '신뢰도',
                        value: `${stock.aiAnalysis.confidence}%`,
                        inline: true,
                    },
                ],
                timestamp: new Date().toISOString(),
                footer: { text: 'Premium Quant Dashboard' },
            });
            recordNotification(stock.symbol, 'prediction');
            await sleep(1000); // Rate limiting
        }
    }
}

/**
 * Sleep helper
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main monitoring loop
 */
async function monitorLoop() {
    console.log('[Monitor] Starting stock monitoring...');
    console.log(`[Monitor] Check interval: ${CONFIG.CHECK_INTERVAL_MS / 1000}s`);
    console.log(`[Monitor] High score threshold: ${CONFIG.HIGH_SCORE_THRESHOLD}`);
    console.log(`[Monitor] Cooldown period: ${CONFIG.COOLDOWN_MS / 1000}s`);

    // Send startup notification
    await sendDiscordNotification({
        title: '▶️ 모니터링 시작',
        description: '백그라운드 주식 모니터링이 시작되었습니다.',
        color: 0x00ff00,
        fields: [
            {
                name: '체크 주기',
                value: `${CONFIG.CHECK_INTERVAL_MS / 1000}초`,
                inline: true,
            },
            {
                name: '고점수 기준',
                value: `${CONFIG.HIGH_SCORE_THRESHOLD}점 이상`,
                inline: true,
            },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Premium Quant Dashboard' },
    });

    let iteration = 0;

    while (true) {
        try {
            iteration++;
            console.log(`\n[Monitor] Iteration #${iteration} - ${new Date().toLocaleString('ko-KR')}`);

            const stocks = await fetchStockData();

            if (stocks.length > 0) {
                console.log(`[Monitor] Fetched ${stocks.length} stocks`);
                await processStocks(stocks);
            } else {
                console.log('[Monitor] No stocks data available');
            }

            // --- Daily Summary Report (9:00 PM) ---
            const now = new Date();
            const todayStr = now.toLocaleDateString('ko-KR');

            // Check if it's 21:00 or later, and we haven't sent the report for today
            if (now.getHours() >= 21 && lastDailyReportDate !== todayStr && stocks.length > 0) {
                console.log(`[Monitor] Sending daily summary report for ${todayStr}...`);

                // Sort by change percent (descending)
                const topGainers = [...stocks]
                    .sort((a, b) => b.changePercent - a.changePercent)
                    .slice(0, 5); // Top 5

                if (topGainers.length > 0) {
                    const fields = topGainers.map((stock, index) => ({
                        name: `${index + 1}. ${stock.name} (${stock.symbol})`,
                        value: `📈 ${stock.changePercent.toFixed(2)}% | ${stock.price.toLocaleString()}원`,
                        inline: false
                    }));

                    await sendDiscordNotification({
                        title: '📅 9시 급등주 결산',
                        description: `${todayStr} 오늘의 상위 급등 종목 TOP 5입니다.`,
                        color: 0xffd700, // Gold color
                        fields: fields,
                        timestamp: now.toISOString(),
                        footer: { text: 'Premium Quant Dashboard • Daily Report' }
                    });

                    lastDailyReportDate = todayStr;
                    console.log('[Monitor] Daily summary sent successfully');
                }
            }
            // ---------------------------------------

            // Cleanup old notification history every 100 iterations
            if (iteration % 100 === 0) {
                const now = Date.now();
                for (const [key, timestamp] of notificationHistory.entries()) {
                    if (now - timestamp > 24 * 60 * 60 * 1000) { // 24 hours
                        notificationHistory.delete(key);
                    }
                }
                console.log(`[Monitor] Cleaned up notification history, remaining: ${notificationHistory.size}`);
            }

        } catch (error) {
            console.error('[Monitor] Error in monitoring loop:', error);

            // Send error notification (with cooldown)
            if (shouldNotify('system', 'error')) {
                await sendDiscordNotification({
                    title: '❌ 모니터링 오류',
                    description: `오류가 발생했습니다: ${error.message}`,
                    color: 0xff0000,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Premium Quant Dashboard' },
                });
                recordNotification('system', 'error');
            }
        }

        // Wait for next iteration
        await sleep(CONFIG.CHECK_INTERVAL_MS);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[Monitor] Shutting down...');

    await sendDiscordNotification({
        title: '⏸️ 모니터링 중지',
        description: '백그라운드 주식 모니터링이 중지되었습니다.',
        color: 0xffa500,
        timestamp: new Date().toISOString(),
        footer: { text: 'Premium Quant Dashboard' },
    });

    process.exit(0);
});

// Start monitoring
monitorLoop().catch(error => {
    console.error('[Monitor] Fatal error:', error);
    process.exit(1);
});
