
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Configuration
const KIS_APP_KEY = process.env.KIS_APP_KEY;
const KIS_APP_SECRET = process.env.KIS_APP_SECRET;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const USE_MOCK = process.env.KIS_USE_MOCK === 'true';
const BASE_URL = USE_MOCK
    ? 'https://openapivts.koreainvestment.com:29443'
    : 'https://openapi.koreainvestment.com:9443';

if (!KIS_APP_KEY || !KIS_APP_SECRET || !GEMINI_API_KEY) {
    console.error('Missing environment variables!');
    process.exit(1);
}

// 1. KIS Client Logic
let accessToken = null;

async function getAccessToken() {
    if (accessToken) return accessToken;
    try {
        console.log('Fetching KIS Access Token...');
        const res = await axios.post(`${BASE_URL}/oauth2/tokenP`, {
            grant_type: 'client_credentials',
            appkey: KIS_APP_KEY,
            appsecret: KIS_APP_SECRET
        });
        accessToken = res.data.access_token;
        return accessToken;
    } catch (e) {
        console.error('Failed to get token:', e.message);
        throw e;
    }
}

async function getPrice(symbol) {
    const token = await getAccessToken();
    try {
        const res = await axios.get(`${BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price`, {
            headers: {
                'authorization': `Bearer ${token}`,
                'appkey': KIS_APP_KEY,
                'appsecret': KIS_APP_SECRET,
                'tr_id': 'FHKST01010100'
            },
            params: {
                FID_COND_MRKT_DIV_CODE: 'J',
                FID_INPUT_ISCD: symbol
            }
        });
        return res.data.output;
    } catch (e) {
        console.error(`Failed to get price for ${symbol}:`, e.message);
        throw e;
    }
}

// 2. Gemini Logic
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function analyzeSector(sectorName, stocks, trendData) {
    console.log(`Analyzing sector: ${sectorName}...`);
    const topStocks = stocks.slice(0, 10);
    const prompt = `당신은 전문 섹터 애널리스트입니다. 다음 섹터를 분석하고 JSON 형식으로 응답하세요.

**섹터 정보:**
- 섹터명: ${sectorName}
- 전체 추세: ${trendData.trend}
- 평균 변동률: ${trendData.avgChange.toFixed(2)}%
- 강세 종목 수: ${trendData.strongStocks}개 / ${stocks.length}개

**주요 종목:**
${topStocks.map((s, i) => `${i + 1}. ${s.name} (${s.symbol}): ${s.price.toLocaleString()}원 (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`).join('\n')}

**분석 요청:**
1. 섹터의 현재 트렌드를 평가하세요 (BULLISH/BEARISH/NEUTRAL)
2. 신뢰도(0-100)를 제시하세요
3. 섹터 분석 근거를 3-4문장으로 작성하세요
4. 이 섹터가 주목받는 이유를 설명하세요

**응답 형식 (JSON):**
{
  "trend": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 80,
  "reasoning": "상세한 섹터 분석 근거 (한국어, 3-4문장)"
}

JSON만 응답하세요.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('Gemini Response:', text);
        return text;
    } catch (e) {
        console.error('Gemini Analysis Failed:', e.message);
        throw e;
    }
}

// Main Flow
async function main() {
    try {
        // Test Sector: Semiconductor
        const sector = {
            name: '반도체',
            stocks: [
                { symbol: '005930', name: '삼성전자' },
                { symbol: '000660', name: 'SK하이닉스' }
            ]
        };

        const stockData = [];
        for (const s of sector.stocks) {
            const quote = await getPrice(s.symbol);
            stockData.push({
                symbol: s.symbol,
                name: s.name,
                price: parseFloat(quote.stck_prpr),
                changePercent: parseFloat(quote.prdy_ctrt)
            });
            console.log(`Fetched ${s.name}: ${quote.stck_prpr} (${quote.prdy_ctrt}%)`);
        }

        const avgChange = stockData.reduce((sum, s) => sum + s.changePercent, 0) / stockData.length;
        const strongStocks = stockData.filter(s => s.changePercent > 0).length;
        const trend = avgChange > 0.5 ? 'BULLISH' : (avgChange < -0.5 ? 'BEARISH' : 'NEUTRAL');

        await analyzeSector(sector.name, stockData, { trend, avgChange, strongStocks });
        console.log('✅ Sector Analysis Verification Complete');

    } catch (e) {
        console.error('❌ Verification Failed:', e);
    }
}

main();
