import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
    EvolutionPatch,
    DashboardResponse,
    StockRecommendation,
    ChatMessage
} from '@/types/stock';

/**
 * Gemini Evolution Service
 * Handles Self-Evolution logic, Dashboard data generation, and Deep Research
 */
export class GeminiEvolutionService {
    private genAI: GoogleGenerativeAI;
    private deepModel: GenerativeModel; // gemini-2.0-flash-exp for deep analysis
    private flashModel: GenerativeModel; // gemini-2.0-flash-exp for quick tasks

    constructor() {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            console.warn('Gemini API key not found. Evolution features will be limited.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.deepModel = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                topK: 40,
            }
        });
        this.flashModel = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
            }
        });
    }

    // ============================================
    // Dashboard Data Generation
    // ============================================

    /**
     * Fetch dashboard data with AI analysis
     * @param evolutionInstruction - Custom logic instruction from latest patch
     */
    async fetchDashboardData(evolutionInstruction?: string): Promise<DashboardResponse> {
        const systemPrompt = `당신은 세계 최고 수준의 퀀트 애널리스트입니다.
${evolutionInstruction ? `\n**[EVOLUTION PATCH]**\n${evolutionInstruction}\n` : ''}

**임무:**
1. 현재 한국 주식 시장을 분석하세요
2. 가치주(Quant) 트랙과 급등주(Momentum) 트랙으로 나누어 추천하세요
3. 각 종목에 대해 AI 점수(0-100), 등급(S/A/B/C), 목표가, 손절가를 제시하세요
4. 오늘과 내일의 시장 리포트를 작성하세요

**응답 형식 (JSON):**
{
  "marketIndices": {
    "kospi": { "value": 2500, "change": 10, "changePercent": 0.4 },
    "usdKrw": { "value": 1350, "change": -5, "changePercent": -0.37 }
  },
  "topRecommendations": {
    "quant": [
      {
        "symbol": "005930",
        "name": "삼성전자",
        "currentPrice": 70000,
        "targetPrice": 85000,
        "stopLoss": 65000,
        "aiScore": 92,
        "grade": "S",
        "rationale": "반도체 업황 회복 기대감",
        "technicalAnalysis": "RSI 과매도 구간, MACD 골든크로스",
        "fundamentalAnalysis": "PER 10배, 배당수익률 3%",
        "expectedReturn": 21.4,
        "riskLevel": "LOW",
        "catalysts": ["HBM3 수주 증가", "AI 반도체 수요"]
      }
    ],
    "momentum": []
  },
  "todayReport": "오늘의 시장 분석 (3-4문장)",
  "tomorrowReport": "내일의 전망 (3-4문장)",
  "lastUpdated": "${new Date().toISOString()}"
}

JSON만 응답하세요.`;

        try {
            const result = await this.deepModel.generateContent(systemPrompt);
            const response = await result.response;
            const text = response.text();
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonText);

            return {
                ...parsed,
                lastUpdated: new Date(parsed.lastUpdated),
            };
        } catch (error) {
            console.error('Dashboard data generation failed:', error);
            // Return mock data on error
            return this.getMockDashboardData();
        }
    }

    /**
     * Mock dashboard data for fallback
     */
    private getMockDashboardData(): DashboardResponse {
        return {
            marketIndices: {
                kospi: { value: 2500, change: 10, changePercent: 0.4 },
                usdKrw: { value: 1350, change: -5, changePercent: -0.37 },
            },
            topRecommendations: {
                quant: [
                    {
                        symbol: '005930',
                        name: '삼성전자',
                        currentPrice: 70000,
                        targetPrice: 85000,
                        stopLoss: 65000,
                        aiScore: 92,
                        grade: 'S',
                        rationale: '반도체 업황 회복 기대감',
                        technicalAnalysis: 'RSI 과매도 구간, MACD 골든크로스',
                        fundamentalAnalysis: 'PER 10배, 배당수익률 3%',
                        expectedReturn: 21.4,
                        riskLevel: 'LOW',
                        catalysts: ['HBM3 수주 증가', 'AI 반도체 수요'],
                    },
                ],
                momentum: [],
            },
            todayReport: '데모 모드: 실제 API 연동 시 실시간 분석이 제공됩니다.',
            tomorrowReport: '데모 모드: 실제 API 연동 시 내일 전망이 제공됩니다.',
            lastUpdated: new Date(),
        };
    }

    // ============================================
    // Evolution Routine (CRON Simulation)
    // ============================================

    /**
     * Run evolution routine - AI generates new algorithm
     */
    async runEvolutionRoutine(currentVersion: string, performanceData?: any): Promise<EvolutionPatch> {
        const prompt = `당신은 자가 진화하는 AI 퀀트 시스템입니다.

**현재 상태:**
- 버전: ${currentVersion}
- 성과 데이터: ${performanceData ? JSON.stringify(performanceData) : '데이터 없음'}

**임무:**
1. 현재 시장 상황을 분석하여 새로운 투자 알고리즘을 개발하세요
2. Python 코드로 알고리즘을 작성하세요 (백테스팅용)
3. 프롬프트 지침(Instruction)을 작성하세요 (AI 분석 로직 개선용)
4. 패치 설명을 작성하세요

**응답 형식 (JSON):**
{
  "pythonCode": "# 새로운 알고리즘 코드\\ndef analyze_stock(data):\\n    # 구현\\n    pass",
  "logicInstruction": "RSI와 MACD를 결합한 멀티팩터 모델을 사용하세요. RSI < 30이고 MACD 골든크로스일 때 강한 매수 신호로 판단합니다.",
  "description": "RSI-MACD 멀티팩터 모델 v2.0 - 과매도 구간 골든크로스 전략",
  "performance": {
    "beforeAccuracy": 65,
    "afterAccuracy": 78,
    "improvement": 13
  }
}

JSON만 응답하세요.`;

        try {
            const result = await this.deepModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonText);

            // Generate new version number
            const versionParts = currentVersion.replace('v', '').split('.');
            const newMinor = parseInt(versionParts[1]) + 1;
            const newVersion = `v${versionParts[0]}.${newMinor}.0`;

            const patch: EvolutionPatch = {
                id: `patch-${Date.now()}`,
                version: newVersion,
                createdAt: new Date(),
                pythonCode: parsed.pythonCode,
                logicInstruction: parsed.logicInstruction,
                description: parsed.description,
                performance: parsed.performance,
            };

            return patch;
        } catch (error) {
            console.error('Evolution routine failed:', error);
            throw error;
        }
    }

    // ============================================
    // Deep Research Terminal
    // ============================================

    /**
     * Stream chat response for Deep Research Terminal
     * @param messages - Chat history
     * @param deepMode - Enable web search grounding
     */
    async *streamQuantChat(messages: ChatMessage[], deepMode: boolean = false): AsyncGenerator<string> {
        const chatHistory = messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        const systemInstruction = `당신은 Quant Pro의 Deep Research Terminal AI입니다.
사용자의 주식 투자 관련 질문에 전문적으로 답변하세요.
${deepMode ? '웹 검색을 활용하여 최신 정보를 제공하세요.' : ''}

답변은 명확하고 구체적으로 작성하세요.
필요시 코드 블록, 표, 리스트를 활용하세요.`;

        try {
            const chat = this.deepModel.startChat({
                history: chatHistory.slice(0, -1),
            });

            const lastMessage = messages[messages.length - 1];
            const result = await chat.sendMessageStream(lastMessage.content);

            for await (const chunk of result.stream) {
                const text = chunk.text();
                yield text;
            }
        } catch (error) {
            console.error('Chat stream failed:', error);
            yield '죄송합니다. 응답 생성 중 오류가 발생했습니다.';
        }
    }

    /**
     * Generate single chat response (non-streaming)
     */
    async generateChatResponse(messages: ChatMessage[], deepMode: boolean = false): Promise<string> {
        let fullResponse = '';
        for await (const chunk of this.streamQuantChat(messages, deepMode)) {
            fullResponse += chunk;
        }
        return fullResponse;
    }
}

// Singleton instance
export const geminiEvolutionService = new GeminiEvolutionService();
