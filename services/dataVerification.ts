import { VerificationStatus } from '@/types/stock';

/**
 * Data Verification Service
 * Ensures data integrity and freshness
 */
export class DataVerificationService {
    /**
     * Verify stock data
     */
    verifyStockData(
        price: number,
        timestamp: Date,
        source: string
    ): VerificationStatus {
        const issues: string[] = [];
        let confidence = 100;

        // Check data freshness (should be within 5 minutes)
        const ageMinutes = (Date.now() - timestamp.getTime()) / 1000 / 60;
        if (ageMinutes > 5) {
            issues.push(`데이터가 ${ageMinutes.toFixed(0)}분 지연되었습니다`);
            confidence -= 20;
        }

        // Check price validity
        if (price <= 0) {
            issues.push('가격이 유효하지 않습니다');
            confidence -= 50;
        }

        // Check if market is open (9:00 - 15:30 KST, Mon-Fri)
        const isMarketOpen = this.isMarketOpen(timestamp);
        if (!isMarketOpen && ageMinutes > 60) {
            issues.push('장 마감 후 데이터입니다');
            confidence -= 10;
        }

        return {
            isVerified: confidence >= 70,
            lastChecked: new Date(),
            source,
            confidence: Math.max(0, confidence),
            issues: issues.length > 0 ? issues : undefined,
        };
    }

    /**
     * Check if Korean stock market is open
     */
    private isMarketOpen(date: Date): boolean {
        const day = date.getDay();
        const hours = date.getHours();
        const minutes = date.getMinutes();

        // Weekend
        if (day === 0 || day === 6) return false;

        // Market hours: 9:00 - 15:30 KST
        if (hours < 9 || hours > 15) return false;
        if (hours === 15 && minutes > 30) return false;

        return true;
    }

    /**
     * Verify multiple data sources match
     */
    verifyDataConsistency(
        prices: Map<string, number>,
        threshold: number = 0.01 // 1% difference allowed
    ): VerificationStatus {
        const priceArray = Array.from(prices.values());

        if (priceArray.length < 2) {
            return {
                isVerified: true,
                lastChecked: new Date(),
                source: 'single-source',
                confidence: 80,
            };
        }

        const avg = priceArray.reduce((a, b) => a + b, 0) / priceArray.length;
        const maxDiff = Math.max(...priceArray.map(p => Math.abs(p - avg) / avg));

        if (maxDiff > threshold) {
            return {
                isVerified: false,
                lastChecked: new Date(),
                source: 'multi-source',
                confidence: 50,
                issues: [`가격 불일치: 최대 ${(maxDiff * 100).toFixed(2)}% 차이`],
            };
        }

        return {
            isVerified: true,
            lastChecked: new Date(),
            source: 'multi-source',
            confidence: 95,
        };
    }

    /**
     * Get verification badge text
     */
    getVerificationBadge(status: VerificationStatus): string {
        if (status.isVerified && status.confidence >= 90) {
            return '✓ 데이터 검증 완료';
        } else if (status.isVerified) {
            return '✓ 검증됨';
        } else {
            return '⚠ 검증 필요';
        }
    }

    /**
     * Get verification color
     */
    getVerificationColor(status: VerificationStatus): string {
        if (status.isVerified && status.confidence >= 90) {
            return 'text-green-500';
        } else if (status.isVerified) {
            return 'text-yellow-500';
        } else {
            return 'text-red-500';
        }
    }
}

// Singleton instance
export const dataVerificationService = new DataVerificationService();
