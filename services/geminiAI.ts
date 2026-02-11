import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIAnalysis, TechnicalIndicators, Stock, SectorAnalysis, CandlePattern, PatternDetection } from '@/types/stock';

/**
 * Google Gemini AI Service for stock analysis
 */
export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY || '';
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    /**
     * Analyze stock with AI
     */
    async analyzeStock(
        stock: Stock,
        indicators: TechnicalIndicators,
        historicalData?: any[],
        candlePatterns?: PatternDetection[]
    ): Promise<AIAnalysis> {
        const prompt = this.buildAnalysisPrompt(stock, indicators, historicalData, candlePatterns);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Parse AI response
            return this.parseAIResponse(text);
        } catch (error) {
            console.error('Gemini AI analysis failed:', error);
            // Return default/neutral analysis instead of throwing execution
            return {
                prediction: 'HOLD',
                confidence: 0,
                reasoning: 'AI 서비스 일시적 오류로 분석을 수행할 수 없습니다.',
                targetPrice: stock.price,
                expectedReturn: 0,
                riskLevel: 'MEDIUM',
                factors: []
            };
        }
    }

    /**
     * Build analysis prompt
     */
    private buildAnalysisPrompt(
        stock: Stock,
        indicators: TechnicalIndicators,
        historicalData?: any[],
        candlePatterns?: PatternDetection[]
    ): string {
        const patternInfo = candlePatterns && candlePatterns.length > 0
            ? `\n**감지된 캔들 패턴:**\n${candlePatterns.map(p =>
                `- ${p.pattern.name}: 성공률 ${p.pattern.successRate.toFixed(1)}%, 평균 수익률 ${p.pattern.avgReturn.toFixed(1)}% (표본: ${p.pattern.sampleSize}개, 신뢰도: ${p.confidence}%)`
            ).join('\n')}`
            : '';
        return `당신은 전문 퀀트 애널리스트입니다. 다음 주식을 분석하고 JSON 형식으로 응답하세요.

**종목 정보:**
- 종목명: ${stock.name} (${stock.symbol})
- 현재가: ${stock.price.toLocaleString()}원
- 전일대비: ${stock.changePercent.toFixed(2)}%
- 거래량: ${stock.volume.toLocaleString()}
${stock.marketCap ? `- 시가총액: ${stock.marketCap.toLocaleString()}원` : ''}
${stock.sector ? `- 섹터: ${stock.sector}` : ''}

**기술적 지표:**
- RSI: ${indicators.rsi.toFixed(2)}
- MACD: ${indicators.macd.macd.toFixed(2)} (Signal: ${indicators.macd.signal.toFixed(2)}, Histogram: ${indicators.macd.histogram.toFixed(2)})
- Bollinger Bands: Upper ${indicators.bollingerBands.upper.toFixed(0)}, Middle ${indicators.bollingerBands.middle.toFixed(0)}, Lower ${indicators.bollingerBands.lower.toFixed(0)}
- SMA20: ${indicators.sma20.toFixed(0)}, SMA50: ${indicators.sma50.toFixed(0)}, SMA200: ${indicators.sma200.toFixed(0)}
- EMA12: ${indicators.ema12.toFixed(0)}, EMA26: ${indicators.ema26.toFixed(0)}
- 평균 거래량: ${indicators.volumeAvg.toLocaleString()}
${patternInfo}

**분석 요청:**
1. 기술적 지표를 종합적으로 분석하세요
2. 매수/매도/보유 추천을 제시하세요
3. 신뢰도(0-100)를 평가하세요
4. 주요 분석 요인들을 나열하세요 (각 요인의 영향도 -100~100)
5. 리스크 레벨(LOW/MEDIUM/HIGH)을 평가하세요
6. 목표가와 예상 수익률을 제시하세요

**응답 형식 (JSON):**
{
  "prediction": "BUY" | "SELL" | "HOLD",
  "confidence": 75,
  "reasoning": "상세한 분석 근거 (한국어, 3-5문장)",
  "targetPrice": 50000,
  "expectedReturn": 15.5,
  "riskLevel": "MEDIUM",
  "factors": [
    {
      "name": "RSI 과매수/과매도",
      "impact": 30,
      "description": "RSI가 70 이상으로 과매수 구간"
    },
    {
      "name": "MACD 골든크로스",
      "impact": 50,
      "description": "MACD가 시그널선을 상향 돌파"
    }
  ]
}

JSON만 응답하세요. 다른 텍스트는 포함하지 마세요.`;
    }

    /**
     * Parse AI response
     */
    private parseAIResponse(text: string): AIAnalysis {
        try {
            // Remove markdown code blocks if present
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonText);

            return {
                prediction: parsed.prediction,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning,
                targetPrice: parsed.targetPrice,
                expectedReturn: parsed.expectedReturn,
                riskLevel: parsed.riskLevel,
                factors: parsed.factors,
            };
        } catch (error) {
            console.error('Failed to parse AI response:', text);
            // Return default analysis on parse error
            return {
                prediction: 'HOLD',
                confidence: 50,
                reasoning: 'AI 분석 파싱 실패. 기본 분석을 제공합니다.',
                riskLevel: 'MEDIUM',
                factors: [],
            };
        }
    }

    /**
     * Batch analyze multiple stocks
     */
    async analyzeMultipleStocks(
        stocks: Array<{ stock: Stock; indicators: TechnicalIndicators }>
    ): Promise<Map<string, AIAnalysis>> {
        const results = new Map<string, AIAnalysis>();

        // Rate limiting: 1 request per 2 seconds to avoid quota issues
        for (const { stock, indicators } of stocks) {
            try {
                const analysis = await this.analyzeStock(stock, indicators);
                results.set(stock.symbol, analysis);
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Failed to analyze ${stock.symbol}:`, error);
            }
        }

        return results;
    }

    /**
     * Analyze sector and recommend top stocks
     */
    async analyzeSector(
        sectorName: string,
        sectorStocks: Stock[],
        sectorTrend: { trend: string; avgChange: number; strongStocks: number }
    ): Promise<SectorAnalysis> {
        const topStocks = sectorStocks.slice(0, 10);
        const prompt = `당신은 전문 섹터 애널리스트입니다. 다음 섹터를 분석하고 JSON 형식으로 응답하세요.

**섹터 정보:**
- 섹터명: ${sectorName}
- 전체 추세: ${sectorTrend.trend}
- 평균 변동률: ${sectorTrend.avgChange.toFixed(2)}%
- 강세 종목 수: ${sectorTrend.strongStocks}개 / ${sectorStocks.length}개

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
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonText);

            return {
                sectorName,
                trend: parsed.trend,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning,
                topStocks: [], // Will be filled by caller
                lastUpdated: new Date(),
            };
        } catch (error) {
            console.error('Sector analysis failed:', error);
            return {
                sectorName,
                trend: 'NEUTRAL',
                confidence: 50,
                reasoning: '섹터 분석을 수행할 수 없습니다.',
                topStocks: [],
                lastUpdated: new Date(),
            };
        }
    }

    /**
     * Generate market summary
     */
    async generateMarketSummary(topStocks: Stock[]): Promise<string> {
        const prompt = `다음은 오늘의 주요 특징주 목록입니다:

${topStocks.map((s, i) => `${i + 1}. ${s.name} (${s.symbol}): ${s.price.toLocaleString()}원 (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`).join('\n')}

이 종목들을 바탕으로 오늘의 시장 동향을 3-4문장으로 요약해주세요. 한국어로 작성하세요.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Failed to generate market summary:', error);
            return '시장 요약을 생성할 수 없습니다.';
        }
    }
}

// Singleton instance
export const geminiService = new GeminiService();
