// Stock data types
export interface Stock {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    sector?: string;
    isSuspended: boolean;
}

export interface StockData extends Stock {
    indicators: TechnicalIndicators;
    aiAnalysis?: AIAnalysis;
    score: number;
    timestamp: Date;
}

// Technical Indicators
export interface TechnicalIndicators {
    rsi: number;
    macd: MACDData;
    bollingerBands: BollingerBands;
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
    volumeAvg: number;
}

export interface MACDData {
    macd: number;
    signal: number;
    histogram: number;
}

export interface BollingerBands {
    upper: number;
    middle: number;
    lower: number;
}

// AI Analysis
export interface AIAnalysis {
    prediction: 'BUY' | 'SELL' | 'HOLD';
    confidence: number; // 0-100
    reasoning: string;
    targetPrice?: number;
    expectedReturn?: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: AnalysisFactor[];
}

export interface AnalysisFactor {
    name: string;
    impact: number; // -100 to 100
    description: string;
}

// Prediction Tracking
export interface Prediction {
    id: string;
    symbol: string;
    predictedAt: Date;
    prediction: AIAnalysis;
    actualResult?: {
        price: number;
        return: number;
        evaluatedAt: Date;
    };
    accuracy?: number;
}

// Data Verification
export interface VerificationStatus {
    isVerified: boolean;
    lastChecked: Date;
    source: string;
    confidence: number; // 0-100
    issues?: string[];
}

// Chart data
export interface ChartDataPoint {
    time: string | number;
    value: number;
}

export interface CandlestickData {
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

// KIS API Types
export interface KISToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    access_token_token_expired: string;
}

export interface KISQuote {
    stck_prpr: string; // 현재가
    prdy_vrss: string; // 전일대비
    prdy_vrss_sign: string; // 전일대비부호
    prdy_ctrt: string; // 전일대비율
    acml_vol: string; // 누적거래량
    hts_kor_isnm: string; // 종목명
}

export interface KISWebSocketMessage {
    header: {
        tr_id: string;
        tr_key: string;
    };
    body: {
        rt_cd: string;
        msg_cd: string;
        msg1: string;
        output?: any;
    };
}

// Discord notification types
export interface DiscordNotification {
    title: string;
    description: string;
    color: number;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    timestamp?: string;
}

// Watchlist
export interface WatchlistItem {
    id: string;
    symbol: string;
    addedAt: Date;
    alertPrice?: number;
    notes?: string;
}

// Tab types
export type TabType = 'realtime' | 'predictions' | 'watchlist';

// API Response types
export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}

// Sector Analysis Types
export interface SectorAnalysis {
    sectorName: string;
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number; // 0-100
    reasoning: string;
    topStocks: SectorStock[];
    marketShare?: number;
    lastUpdated: Date;
}

export interface SectorStock {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    sectorRank: number; // 섹터 내 순위
    expectedGrowth: number; // 예상 상승률
    catalysts: string[]; // 급등 촉매
    score: number;
}

// Candle Pattern Research Types
export interface CandlePattern {
    id: string;
    name: string;
    nameEn: string;
    type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    description: string;
    successRate: number; // 성공 확률 (%)
    avgReturn: number; // 평균 수익률 (%)
    sampleSize: number; // 표본 크기
    confidence: number; // 통계적 신뢰도 (%)
    lastUpdated: Date;
}

export interface CandleResearch {
    weekNumber: number;
    year: number;
    patterns: CandlePattern[];
    summary: string;
    methodology: string;
    totalSamples: number;
    updatedAt: Date;
}

export interface PatternDetection {
    pattern: CandlePattern;
    confidence: number; // 감지 신뢰도
    detectedAt: Date;
    candleData: CandlestickData[];
    priceAtDetection: number;
}

// ============================================
// QUANT PRO - Self-Evolution System Types
// ============================================

/**
 * Evolution Patch - AI가 생성한 알고리즘 개선 패치
 */
export interface EvolutionPatch {
    id: string;
    version: string; // e.g., "v1.2.3"
    createdAt: Date;
    pythonCode: string; // AI가 생성한 Python 알고리즘 코드
    logicInstruction: string; // 프롬프트에 주입될 로직 지침
    description: string; // 패치 설명
    performance?: {
        beforeAccuracy: number;
        afterAccuracy: number;
        improvement: number;
    };
}

/**
 * Prediction Record - 예측 이력 및 성과 추적
 */
export interface PredictionRecord {
    id: string;
    symbol: string;
    stockName: string;
    predictedAt: Date;
    prediction: AIAnalysis;
    entryPrice: number;
    targetPrice?: number;
    stopLoss?: number;
    actualResult?: {
        exitPrice: number;
        exitDate: Date;
        returnPercent: number;
        isSuccess: boolean;
    };
    evolutionVersion: string; // 어떤 버전의 알고리즘이 예측했는지
}

/**
 * Dashboard Response - 대시보드 데이터 구조
 */
export interface DashboardResponse {
    marketIndices: {
        kospi: {
            value: number;
            change: number;
            changePercent: number;
        };
        usdKrw: {
            value: number;
            change: number;
            changePercent: number;
        };
    };
    topRecommendations: {
        quant: StockRecommendation[]; // 가치주 트랙
        momentum: StockRecommendation[]; // 급등주 트랙
    };
    todayReport: string;
    tomorrowReport: string;
    lastUpdated: Date;
}

/**
 * Stock Recommendation - AI 추천 종목
 */
export interface StockRecommendation {
    symbol: string;
    name: string;
    currentPrice: number;
    targetPrice: number;
    stopLoss: number;
    aiScore: number; // 0-100
    grade: 'S' | 'A' | 'B' | 'C';
    rationale: string; // 추천 사유
    technicalAnalysis: string;
    fundamentalAnalysis: string;
    expectedReturn: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    catalysts: string[]; // 급등 촉매
}

/**
 * Chat Message - Deep Research Terminal 채팅
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
    metadata?: {
        searchResults?: any[];
        codeBlocks?: string[];
    };
}

/**
 * Performance Metrics - AI 성과 지표
 */
export interface PerformanceMetrics {
    totalPredictions: number;
    successfulPredictions: number;
    winRate: number; // 승률 (%)
    averageReturn: number; // 평균 수익률 (%)
    cumulativeReturn: number; // 누적 수익률 (%)
    sharpeRatio?: number;
    maxDrawdown?: number;
    lastUpdated: Date;
}
