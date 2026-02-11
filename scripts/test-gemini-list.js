
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    console.log('\nFetching available models...');
    try {
        // Direct fetch to list models since SDK might not expose it easily in all versions
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log('✅ Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(` - ${m.name}`);
                }
            });
        } else {
            console.log('❌ No models found in response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Failed to list models:', error.message);
    }
}

async function main() {
    await listModels();
}

main();
