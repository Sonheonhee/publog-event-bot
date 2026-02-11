/**
 * Test Daily Report Notification
 * Usage: node scripts/test-daily-report.js
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function sendDiscordNotification(embed) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('Error: DISCORD_WEBHOOK_URL is not set in .env.local');
        return;
    }

    try {
        console.log('Sending notification to:', webhookUrl);
        await axios.post(webhookUrl, { embeds: [embed] });
        console.log('✅ Notification sent successfully!');
    } catch (error) {
        console.error('❌ Failed to send notification:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

async function runTest() {
    const now = new Date();
    const todayStr = now.toLocaleDateString('ko-KR');

    // Mock stock data
    const mockStocks = [
        { name: '삼성전자', symbol: '005930', price: 78500, changePercent: 2.5 },
        { name: 'SK하이닉스', symbol: '000660', price: 142000, changePercent: 1.8 },
        { name: 'LG에너지솔루션', symbol: '373220', price: 395000, changePercent: 4.2 },
        { name: 'NAVER', symbol: '035420', price: 215000, changePercent: 1.2 },
        { name: '카카오', symbol: '035720', price: 54300, changePercent: 0.8 }
    ];

    // Sort by change percent (descending)
    const topGainers = [...mockStocks]
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5);

    const fields = topGainers.map((stock, index) => ({
        name: `${index + 1}. ${stock.name} (${stock.symbol})`,
        value: `📈 ${stock.changePercent.toFixed(2)}% | ${stock.price.toLocaleString()}원`,
        inline: false
    }));

    console.log('Preparing test notification...');

    await sendDiscordNotification({
        title: '🧪 [TEST] 9시 급등주 결산',
        description: `${todayStr} 오늘의 상위 급등 종목 TOP 5 (테스트 발송입니다)`,
        color: 0xffd700, // Gold color
        fields: fields,
        timestamp: now.toISOString(),
        footer: { text: 'Premium Quant Dashboard • Daily Report Test' }
    });
}

runTest();
