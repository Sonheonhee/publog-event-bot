import { EvolutionPatch, PredictionRecord, PerformanceMetrics } from '@/types/stock';

/**
 * IndexedDB Service for Quant Pro
 * Stores: Evolution Patches, Prediction History, Performance Metrics
 */
export class StorageService {
    private dbName = 'QuantProDB';
    private version = 1;
    private db: IDBDatabase | null = null;

    /**
     * Initialize IndexedDB
     */
    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Evolution Patches Store
                if (!db.objectStoreNames.contains('evolution')) {
                    const evolutionStore = db.createObjectStore('evolution', { keyPath: 'id' });
                    evolutionStore.createIndex('version', 'version', { unique: true });
                    evolutionStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Prediction History Store
                if (!db.objectStoreNames.contains('predictions')) {
                    const predictionsStore = db.createObjectStore('predictions', { keyPath: 'id' });
                    predictionsStore.createIndex('symbol', 'symbol', { unique: false });
                    predictionsStore.createIndex('predictedAt', 'predictedAt', { unique: false });
                    predictionsStore.createIndex('evolutionVersion', 'evolutionVersion', { unique: false });
                }

                // Watchlist Store
                if (!db.objectStoreNames.contains('watchlist')) {
                    const watchlistStore = db.createObjectStore('watchlist', { keyPath: 'id' });
                    watchlistStore.createIndex('symbol', 'symbol', { unique: true });
                }

                // Performance Metrics Store
                if (!db.objectStoreNames.contains('metrics')) {
                    db.createObjectStore('metrics', { keyPath: 'id' });
                }
            };
        });
    }

    // ============================================
    // Evolution Patches
    // ============================================

    /**
     * Save evolution patch
     */
    async saveEvolutionPatch(patch: EvolutionPatch): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['evolution'], 'readwrite');
            const store = transaction.objectStore('evolution');
            const request = store.put(patch);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get latest evolution patch
     */
    async getLatestPatch(): Promise<EvolutionPatch | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['evolution'], 'readonly');
            const store = transaction.objectStore('evolution');
            const index = store.index('createdAt');
            const request = index.openCursor(null, 'prev');

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    resolve(cursor.value as EvolutionPatch);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all evolution patches
     */
    async getAllPatches(): Promise<EvolutionPatch[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['evolution'], 'readonly');
            const store = transaction.objectStore('evolution');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as EvolutionPatch[]);
            request.onerror = () => reject(request.error);
        });
    }

    // ============================================
    // Prediction History
    // ============================================

    /**
     * Save prediction record
     */
    async savePrediction(prediction: PredictionRecord): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['predictions'], 'readwrite');
            const store = transaction.objectStore('predictions');
            const request = store.put(prediction);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all predictions
     */
    async getAllPredictions(): Promise<PredictionRecord[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['predictions'], 'readonly');
            const store = transaction.objectStore('predictions');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result as PredictionRecord[]);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get predictions by symbol
     */
    async getPredictionsBySymbol(symbol: string): Promise<PredictionRecord[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['predictions'], 'readonly');
            const store = transaction.objectStore('predictions');
            const index = store.index('symbol');
            const request = index.getAll(symbol);

            request.onsuccess = () => resolve(request.result as PredictionRecord[]);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update prediction result
     */
    async updatePredictionResult(
        id: string,
        result: { exitPrice: number; exitDate: Date; returnPercent: number; isSuccess: boolean }
    ): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['predictions'], 'readwrite');
            const store = transaction.objectStore('predictions');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const prediction = getRequest.result as PredictionRecord;
                if (prediction) {
                    prediction.actualResult = result;
                    const putRequest = store.put(prediction);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Prediction not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // ============================================
    // Performance Metrics
    // ============================================

    /**
     * Calculate and save performance metrics
     */
    async calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
        const predictions = await this.getAllPredictions();
        const completedPredictions = predictions.filter(p => p.actualResult);

        const totalPredictions = completedPredictions.length;
        const successfulPredictions = completedPredictions.filter(p => p.actualResult!.isSuccess).length;
        const winRate = totalPredictions > 0 ? (successfulPredictions / totalPredictions) * 100 : 0;

        const returns = completedPredictions.map(p => p.actualResult!.returnPercent);
        const averageReturn = returns.length > 0
            ? returns.reduce((sum, r) => sum + r, 0) / returns.length
            : 0;

        const cumulativeReturn = returns.reduce((sum, r) => sum + r, 0);

        const metrics: PerformanceMetrics = {
            totalPredictions,
            successfulPredictions,
            winRate,
            averageReturn,
            cumulativeReturn,
            lastUpdated: new Date(),
        };

        // Save to IndexedDB
        await this.saveMetrics(metrics);

        return metrics;
    }

    /**
     * Save performance metrics
     */
    private async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['metrics'], 'readwrite');
            const store = transaction.objectStore('metrics');
            const request = store.put({ ...metrics, id: 'current' });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get current performance metrics
     */
    async getMetrics(): Promise<PerformanceMetrics | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['metrics'], 'readonly');
            const store = transaction.objectStore('metrics');
            const request = store.get('current');

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result as PerformanceMetrics : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ============================================
    // Watchlist
    // ============================================

    /**
     * Add to watchlist
     */
    async addToWatchlist(item: { id: string; symbol: string; name: string; addedAt: Date }): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['watchlist'], 'readwrite');
            const store = transaction.objectStore('watchlist');
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Remove from watchlist
     */
    async removeFromWatchlist(id: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['watchlist'], 'readwrite');
            const store = transaction.objectStore('watchlist');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get watchlist
     */
    async getWatchlist(): Promise<any[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['watchlist'], 'readonly');
            const store = transaction.objectStore('watchlist');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

// Singleton instance
export const storageService = new StorageService();
