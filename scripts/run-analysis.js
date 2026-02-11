/**
 * Run Analysis Bridge
 * Usage: node scripts/run-analysis.js [symbol]
 * This script fetches data (mock for now) and pipes it to the Python engine.
 */

const { spawn } = require('child_process');
const path = require('path');

// Mock Data Generator for Testing
function generateMockData(symbol) {
    const data = {
        symbol: symbol || "005930",
        candles: []
    };

    // Generate 50 days of data
    let price = 50000;
    for (let i = 0; i < 50; i++) {
        const change = (Math.random() - 0.5) * 1000;
        price += change;

        data.candles.push({
            date: new Date(Date.now() - (49 - i) * 86400000).toISOString(),
            open: price,
            high: price + 500,
            low: price - 500,
            close: price + change,
            volume: Math.floor(Math.random() * 1000000) + 500000
        });
    }

    // Induce a "Panic Sell" scenario at the end for testing signals
    const last = data.candles[data.candles.length - 1];
    data.candles.push({
        date: new Date().toISOString(),
        open: last.close,
        high: last.close,
        low: last.close * 0.90, // -10% drop
        close: last.close * 0.92, // -8% close
        volume: last.volume * 5 // 5x volume spike
    });

    return JSON.stringify(data);
}

async function runStrategy(jsonData) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, '../engine/wonyotti_strategy.py');
        const pythonProcess = spawn('python', [pythonScript]);

        let result = '';
        let error = '';

        // Pipe data to Python stdin
        pythonProcess.stdin.write(jsonData);
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${error}`));
            } else {
                try {
                    resolve(JSON.parse(result));
                } catch (e) {
                    reject(new Error(`Failed to parse Python output: ${result}`));
                }
            }
        });
    });
}

// Main Execution
(async () => {
    try {
        const symbol = process.argv[2] || "TEST";
        console.log(`[Bridge] Generating mock data for ${symbol}...`);
        const mockData = generateMockData(symbol);

        console.log(`[Bridge] Running Python Strategy Engine...`);
        const analysis = await runStrategy(mockData);

        console.log('\n--- Analysis Result ---');
        console.log(JSON.stringify(analysis, null, 2));

        if (analysis.action === "BUY" || analysis.action === "STRONG_BUY") {
            console.log(`\n✅ Signal Detected: ${analysis.action} (${analysis.reason})`);
        } else {
            console.log(`\n⏸️  No Action: ${analysis.action}`);
        }

    } catch (error) {
        console.error('[Error]', error.message);
    }
})();
