import axios from 'axios';

/**
 * KRX (Korea Exchange) Monitor Service
 * Monitors suspended and halted stocks
 */
export class KRXMonitor {
    private suspendedStocks: Set<string> = new Set();
    private lastUpdate: Date | null = null;

    /**
     * Check if a stock is suspended
     */
    isSuspended(symbol: string): boolean {
        return this.suspendedStocks.has(symbol);
    }

    /**
     * Update suspended stocks list
     * Note: This is a simplified implementation
     * In production, you would fetch from KRX API or data provider
     */
    async updateSuspendedStocks(): Promise<void> {
        try {
            // TODO: Implement actual KRX API call
            // For now, using mock data

            // Example: Fetch from KRX or financial data provider
            // const response = await axios.get('KRX_API_URL');
            // const suspended = response.data.suspended_stocks;

            // Mock implementation
            const mockSuspended = this.getMockSuspendedStocks();
            this.suspendedStocks = new Set(mockSuspended);
            this.lastUpdate = new Date();

            console.log(`Updated suspended stocks: ${this.suspendedStocks.size} stocks`);
        } catch (error) {
            console.error('Failed to update suspended stocks:', error);
        }
    }

    /**
     * Get mock suspended stocks (for development)
     */
    private getMockSuspendedStocks(): string[] {
        // In production, this would come from KRX API
        // These are example stock codes
        return [
            // Add actual suspended stock codes here
        ];
    }

    /**
     * Get last update time
     */
    getLastUpdate(): Date | null {
        return this.lastUpdate;
    }

    /**
     * Get all suspended stocks
     */
    getSuspendedStocks(): string[] {
        return Array.from(this.suspendedStocks);
    }

    /**
     * Add stock to suspended list (manual)
     */
    addSuspendedStock(symbol: string): void {
        this.suspendedStocks.add(symbol);
    }

    /**
     * Remove stock from suspended list (manual)
     */
    removeSuspendedStock(symbol: string): void {
        this.suspendedStocks.delete(symbol);
    }

    /**
     * Check if update is needed (older than 1 hour)
     */
    needsUpdate(): boolean {
        if (!this.lastUpdate) return true;
        const hoursSinceUpdate = (Date.now() - this.lastUpdate.getTime()) / 1000 / 60 / 60;
        return hoursSinceUpdate > 1;
    }

    /**
     * Auto-update if needed
     */
    async autoUpdate(): Promise<void> {
        if (this.needsUpdate()) {
            await this.updateSuspendedStocks();
        }
    }
}

// Singleton instance
export const krxMonitor = new KRXMonitor();
