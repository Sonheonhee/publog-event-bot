/**
 * Discord Webhook Test Script
 * Tests if Discord webhook is properly configured
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

async function testDiscordWebhook() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    console.log('========================================');
    console.log('Discord Webhook Test');
    console.log('========================================\n');

    if (!webhookUrl) {
        console.error('❌ ERROR: DISCORD_WEBHOOK_URL not found in .env.local');
        console.log('\nPlease add DISCORD_WEBHOOK_URL to your .env.local file:');
        console.log('DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...\n');
        process.exit(1);
    }

    console.log('✓ Webhook URL found');
    console.log(`  URL: ${webhookUrl.substring(0, 50)}...\n`);

    console.log('Sending test notification...');

    try {
        await axios.post(webhookUrl, {
            embeds: [{
                title: '✅ Discord 연결 테스트 성공!',
                description: 'Premium Quant Dashboard의 Discord 웹훅이 정상적으로 작동합니다.',
                color: 0x00ff00,
                fields: [
                    {
                        name: '테스트 시간',
                        value: new Date().toLocaleString('ko-KR'),
                        inline: true,
                    },
                    {
                        name: '상태',
                        value: '정상',
                        inline: true,
                    },
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Premium Quant Dashboard - Test',
                },
            }],
        });

        console.log('✅ SUCCESS: Test notification sent to Discord!');
        console.log('\nCheck your Discord channel to confirm the message was received.\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ ERROR: Failed to send test notification');
        console.error(`  Error: ${error.message}`);

        if (error.response) {
            console.error(`  Status: ${error.response.status}`);
            console.error(`  Data: ${JSON.stringify(error.response.data)}`);
        }

        console.log('\nPossible issues:');
        console.log('1. Invalid webhook URL');
        console.log('2. Webhook was deleted from Discord');
        console.log('3. Network connectivity issues');
        console.log('4. Discord API is down\n');

        process.exit(1);
    }
}

testDiscordWebhook();
