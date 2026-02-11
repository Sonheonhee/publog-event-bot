/**
 * Sector Mapping for Korean Stocks
 * Maps stock symbols to their respective sectors
 */

export const SECTORS = {
    BATTERY: '2차전지',
    SEMICONDUCTOR: '반도체',
    BIO: '바이오',
    AUTOMOTIVE: '자동차',
    STEEL: '철강',
    CHEMICAL: '화학',
    ENTERTAINMENT: '엔터테인먼트',
    FINANCE: '금융',
    RETAIL: '유통',
    CONSTRUCTION: '건설',
    SHIPBUILDING: '조선',
    DISPLAY: '디스플레이',
    INTERNET: '인터넷',
    GAME: '게임',
} as const;

export type SectorType = typeof SECTORS[keyof typeof SECTORS];

/**
 * Stock to Sector mapping
 * Key: Stock symbol (6-digit code)
 * Value: Sector name
 */
export const STOCK_SECTOR_MAP: Record<string, SectorType> = {
    // 2차전지
    '373220': SECTORS.BATTERY, // LG에너지솔루션
    '006400': SECTORS.BATTERY, // 삼성SDI
    '051910': SECTORS.BATTERY, // LG화학
    '096770': SECTORS.BATTERY, // SK이노베이션
    '066970': SECTORS.BATTERY, // 엘앤에프
    '086520': SECTORS.BATTERY, // 에코프로
    '247540': SECTORS.BATTERY, // 에코프로비엠
    '278280': SECTORS.BATTERY, // 천보
    '020150': SECTORS.BATTERY, // 일진머티리얼즈
    '005420': SECTORS.BATTERY, // 코스모화학

    // 반도체
    '005930': SECTORS.SEMICONDUCTOR, // 삼성전자
    '000660': SECTORS.SEMICONDUCTOR, // SK하이닉스
    '042700': SECTORS.SEMICONDUCTOR, // 한미반도체
    '039030': SECTORS.SEMICONDUCTOR, // 이오테크닉스
    '108320': SECTORS.SEMICONDUCTOR, // LX세미콘
    '357780': SECTORS.SEMICONDUCTOR, // 솔브레인
    '095340': SECTORS.SEMICONDUCTOR, // ISC
    '036930': SECTORS.SEMICONDUCTOR, // 주성엔지니어링

    // 바이오
    '207940': SECTORS.BIO, // 삼성바이오로직스
    '068270': SECTORS.BIO, // 셀트리온
    '091990': SECTORS.BIO, // 셀트리온헬스케어
    '326030': SECTORS.BIO, // SK바이오팜
    '214450': SECTORS.BIO, // 파마리서치
    '214150': SECTORS.BIO, // 클래시스
    '196170': SECTORS.BIO, // 알테오젠

    // 자동차
    '005380': SECTORS.AUTOMOTIVE, // 현대차
    '000270': SECTORS.AUTOMOTIVE, // 기아
    '012330': SECTORS.AUTOMOTIVE, // 현대모비스
    '161390': SECTORS.AUTOMOTIVE, // 한국타이어앤테크놀로지
    '086280': SECTORS.AUTOMOTIVE, // 현대글로비스

    // 디스플레이
    '034220': SECTORS.DISPLAY, // LG디스플레이
    '009150': SECTORS.DISPLAY, // 삼성전기

    // 엔터테인먼트
    '035900': SECTORS.ENTERTAINMENT, // JYP Ent.
    '352820': SECTORS.ENTERTAINMENT, // 하이브

    // 게임
    '251270': SECTORS.GAME, // 넷마블
    '036570': SECTORS.GAME, // 엔씨소프트
    '259960': SECTORS.GAME, // 크래프톤
    '112040': SECTORS.GAME, // 위메이드

    // 인터넷
    '035420': SECTORS.INTERNET, // NAVER
    '035720': SECTORS.INTERNET, // 카카오
    '376300': SECTORS.INTERNET, // 쿠팡

    // 금융
    '055550': SECTORS.FINANCE, // 신한지주
    '086790': SECTORS.FINANCE, // 하나금융지주
    '105560': SECTORS.FINANCE, // KB금융
    '323410': SECTORS.FINANCE, // 카카오뱅크

    // 철강
    '005490': SECTORS.STEEL, // POSCO홀딩스
    '004020': SECTORS.STEEL, // 현대제철

    // 화학
    '009830': SECTORS.CHEMICAL, // 한화솔루션
    '011170': SECTORS.CHEMICAL, // 롯데케미칼

    // 조선
    '009540': SECTORS.SHIPBUILDING, // HD한국조선해양
    '010140': SECTORS.SHIPBUILDING, // 삼성중공업
    '042660': SECTORS.SHIPBUILDING, // 한화오션
};

/**
 * Get sector for a stock symbol
 */
export function getSectorForStock(symbol: string): SectorType | null {
    return STOCK_SECTOR_MAP[symbol] || null;
}

/**
 * Get all stocks in a sector
 */
export function getStocksInSector(sector: SectorType): string[] {
    return Object.entries(STOCK_SECTOR_MAP)
        .filter(([_, stockSector]) => stockSector === sector)
        .map(([symbol]) => symbol);
}

/**
 * Get all available sectors
 */
export function getAllSectors(): SectorType[] {
    return Object.values(SECTORS);
}
