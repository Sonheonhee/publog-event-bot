'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Award, Target, BarChart3 } from 'lucide-react';
import { PerformanceMetrics, PredictionRecord } from '@/types/stock';
import { storageService } from '@/services/storage';

export default function PerformanceView() {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPerformanceData();
    }, []);

    const loadPerformanceData = async () => {
        try {
            const [metricsData, predictionsData] = await Promise.all([
                storageService.calculatePerformanceMetrics(),
                storageService.getAllPredictions(),
            ]);

            setMetrics(metricsData);
            setPredictions(predictionsData.sort((a, b) =>
                new Date(b.predictedAt).getTime() - new Date(a.predictedAt).getTime()
            ));
        } catch (error) {
            console.error('Failed to load performance data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 to-gray-100">
            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Win Rate */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <Award className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">승률</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-bold text-gray-900">
                            {metrics?.winRate.toFixed(1) || '0.0'}%
                        </div>
                        <div className="text-sm text-gray-600">
                            {metrics?.successfulPredictions || 0} / {metrics?.totalPredictions || 0} 성공
                        </div>
                    </div>
                </div>

                {/* Average Return */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">평균 수익률</span>
                    </div>
                    <div className="space-y-1">
                        <div className={`text-3xl font-bold ${(metrics?.averageReturn || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {(metrics?.averageReturn || 0) >= 0 ? '+' : ''}
                            {metrics?.averageReturn.toFixed(2) || '0.00'}%
                        </div>
                        <div className="text-sm text-gray-600">건당 평균</div>
                    </div>
                </div>

                {/* Cumulative Return */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">누적 수익률</span>
                    </div>
                    <div className="space-y-1">
                        <div className={`text-3xl font-bold ${(metrics?.cumulativeReturn || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                            {(metrics?.cumulativeReturn || 0) >= 0 ? '+' : ''}
                            {metrics?.cumulativeReturn.toFixed(2) || '0.00'}%
                        </div>
                        <div className="text-sm text-gray-600">전체 합산</div>
                    </div>
                </div>

                {/* Total Predictions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">총 예측</span>
                    </div>
                    <div className="space-y-1">
                        <div className="text-3xl font-bold text-gray-900">
                            {metrics?.totalPredictions || 0}
                        </div>
                        <div className="text-sm text-gray-600">완료된 예측</div>
                    </div>
                </div>
            </div>

            {/* Prediction History Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    예측 이력
                </h3>

                {predictions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>아직 예측 이력이 없습니다.</p>
                        <p className="text-sm mt-1">대시보드에서 종목을 추천받아보세요.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {predictions.map(prediction => (
                            <div
                                key={prediction.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-gray-900">
                                            {prediction.stockName}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {prediction.symbol}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${prediction.prediction.prediction === 'BUY'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : prediction.prediction.prediction === 'SELL'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {prediction.prediction.prediction}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span>
                                            진입가: {prediction.entryPrice.toLocaleString()}원
                                        </span>
                                        {prediction.targetPrice && (
                                            <span>
                                                목표가: {prediction.targetPrice.toLocaleString()}원
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {new Date(prediction.predictedAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                </div>

                                {prediction.actualResult ? (
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${prediction.actualResult.isSuccess
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                                }`}>
                                                {prediction.actualResult.returnPercent >= 0 ? '+' : ''}
                                                {prediction.actualResult.returnPercent.toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {prediction.actualResult.exitPrice.toLocaleString()}원
                                            </div>
                                        </div>
                                        {prediction.actualResult.isSuccess ? (
                                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-600" />
                                        )}
                                    </div>
                                ) : (
                                    <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                        진행 중
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
