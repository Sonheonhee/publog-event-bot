
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "Hello, are you working?";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS: ${modelName} responded: "${text.trim().substring(0, 50)}..."`);
        return true;
    } catch (error) {
        console.error(`❌ FAILED: ${modelName} - ${error.message}`);
        return false;
    }
}

async function main() {
    const modelsToTest = [
        'gemini-2.0-flash',
        'gemini-1.5-flash', // Keeping as fallback check
        'gemini-pro'        // Keeping as fallback check
    ];

    console.log('Starting Gemini Model Availability Test...');

    for (const model of modelsToTest) {
        await testModel(model);
    }
}

main();
