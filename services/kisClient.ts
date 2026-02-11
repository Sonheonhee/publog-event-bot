import axios, { AxiosInstance } from 'axios';
import { KISToken, KISQuote } from '../types/stock';

/**
 * Korean Investment Securities (KIS) API Client
 * Documentation: https://apiportal.koreainvestment.com
 */
export class KISClient {
    private appKey: string;
    private appSecret: string;
    private baseURL: string;
    private token: KISToken | null = null;
    private tokenExpiry: Date | null = null;
    private client: AxiosInstance;

    constructor() {
        this.appKey = process.env.KIS_APP_KEY || '';
        this.appSecret = process.env.KIS_APP_SECRET || '';

        // Use mock server if KIS_USE_MOCK is true
        const useMock = process.env.KIS_USE_MOCK === 'true';
        this.baseURL = useMock
            ? 'https://openapivts.koreainvestment.com:29443' // Mock server
            : 'https://openapi.koreainvestment.com:9443'; // Real server

        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Get OAuth access token
     */
    private async getAccessToken(): Promise<string> {
        // Return cached token if still valid
        if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token.access_token;
        }

        try {
            const response = await this.client.post('/oauth2/tokenP', {
                grant_type: 'client_credentials',
                appkey: this.appKey,
                appsecret: this.appSecret,
            });

            this.token = response.data;
            // Token expires in 1 hour, refresh 5 minutes before
            this.tokenExpiry = new Date(Date.now() + (55 * 60 * 1000));

            if (!this.token) {
                throw new Error('Failed to obtain access token');
            }

            return this.token.access_token;
        } catch (error) {
            console.error('Failed to get KIS access token:', error);
            throw new Error('KIS authentication failed');
        }
    }

    /**
     * Get current stock price (현재가 조회)
     */
    async getCurrentPrice(symbol: string): Promise<KISQuote> {
        const token = await this.getAccessToken();

        try {
            const response = await this.client.get('/uapi/domestic-stock/v1/quotations/inquire-price', {
                headers: {
                    'authorization': `Bearer ${token}`,
                    'appkey': this.appKey,
                    'appsecret': this.appSecret,
                    'tr_id': 'FHKST01010100', // 주식현재가 시세
                },
                params: {
                    FID_COND_MRKT_DIV_CODE: 'J', // 시장 구분 (J: 주식)
                    FID_INPUT_ISCD: symbol, // 종목코드
                },
            });

            return response.data.output;
        } catch (error) {
            console.error(`Failed to get price for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Get multiple stock prices
     */
    async getMultiplePrices(symbols: string[]): Promise<Map<string, KISQuote>> {
        const results = new Map<string, KISQuote>();

        // Rate limiting: 1 request per 500ms
        for (const symbol of symbols) {
            try {
                const quote = await this.getCurrentPrice(symbol);
                results.set(symbol, quote);
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Failed to fetch ${symbol}:`, error);
            }
        }

        return results;
    }

    /**
     * Get historical price data (일별 시세)
     */
    async getHistoricalData(
        symbol: string,
        startDate: string,
        endDate: string
    ): Promise<any[]> {
        const token = await this.getAccessToken();

        try {
            const response = await this.client.get('/uapi/domestic-stock/v1/quotations/inquire-daily-price', {
                headers: {
                    'authorization': `Bearer ${token}`,
                    'appkey': this.appKey,
                    'appsecret': this.appSecret,
                    'tr_id': 'FHKST01010400', // 주식일별시세
                },
                params: {
                    FID_COND_MRKT_DIV_CODE: 'J',
                    FID_INPUT_ISCD: symbol,
                    FID_PERIOD_DIV_CODE: 'D', // D: 일별
                    FID_ORG_ADJ_PRC: '0', // 0: 수정주가 미반영
                },
            });

            return response.data.output;
        } catch (error) {
            console.error(`Failed to get historical data for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Search stock by name or code
     */
    async searchStock(query: string): Promise<any[]> {
        const token = await this.getAccessToken();

        try {
            const response = await this.client.get('/uapi/domestic-stock/v1/quotations/search-stock-info', {
                headers: {
                    'authorization': `Bearer ${token}`,
                    'appkey': this.appKey,
                    'appsecret': this.appSecret,
                    'tr_id': 'CTPF1002R', // 종목검색
                },
                params: {
                    PRDT_TYPE_CD: '300', // 주식
                    PDNO: query,
                },
            });

            return response.data.output;
        } catch (error) {
            console.error(`Failed to search stock ${query}:`, error);
            throw error;
        }
    }

    /**
     * Get WebSocket approval key for real-time data
     */
    async getWebSocketKey(): Promise<string> {
        const token = await this.getAccessToken();

        try {
            const response = await this.client.post('/oauth2/Approval', {
                grant_type: 'client_credentials',
                appkey: this.appKey,
                secretkey: this.appSecret,
            }, {
                headers: {
                    'authorization': `Bearer ${token}`,
                },
            });

            return response.data.approval_key;
        } catch (error) {
            console.error('Failed to get WebSocket approval key:', error);
            throw error;
        }
    }
}

// Singleton instance
export const kisClient = new KISClient();
