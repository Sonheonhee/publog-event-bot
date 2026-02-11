'use client';

import { useEffect } from 'react';
import useSWR from 'swr';
import { StockData, SectorAnalysis, CandleResearch } from '@/types/stock';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { NotificationButton } from '@/components/ui/NotificationButton';
import { SectorInsightCard } from '@/components/ui/SectorInsightCard';
import { CandleResearchSection } from '@/components/ui/CandleResearchSection';
import { formatKRW, formatPercent, getChangeColor } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotification } from '@/hooks/useNotification';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function TomorrowPicks() {
    const { sendNotification } = useNotification();
    const {
        tomorrowPicksEnabled,
        toggleTomorrowPicksNotifications,
        previousTomorrowPicks,
        updatePreviousTomorrowPicks,
    } = useNotificationStore();

    const { data, error, isLoading } = useSWR<{ predictions: StockData[] }>(
        '/api/stocks/predictions',
        fetcher,
        {
            refreshInterval: 60000, // Refresh every minute
        }
    );

    // Fetch sector analysis for 2차전지
    const { data: sectorData, error: sectorError } = useSWR<{ data: SectorAnalysis }>(
        '/api/sectors/analysis?sector=2차전지',
        fetcher,
        {
            refreshInterval: 300000, // Refresh every 5 minutes
        }
    );

    // Fetch candle research data
    const { data: candleData, error: candleError } = useSWR<{ data: CandleResearch }>(
        '/api/candles/research',
        fetcher,
        {
            refreshInterval: 3600000, // Refresh every hour
        }
    );

    // Detect new predictions and send notifications
    useEffect(() => {
        if (!data?.predictions || !tomorrowPicksEnabled) return;

        const currentSymbols = data.predictions.map(p => p.symbol);
        const newPredictions = data.predictions.filter(
            stock => !previousTomorrowPicks.includes(stock.symbol)
        );

        if (newPredictions.length > 0 && previousTomorrowPicks.length > 0) {
            newPredictions.forEach(stock => {
                const prediction = stock.aiAnalysis?.prediction || 'HOLD';
                const emoji = prediction === 'BUY' ? '🟢' : prediction === 'SELL' ? '🔴' : '🟡';

                sendNotification(
                    `💎 새로운 필승 종목 예측!`,
                    {
                        body: `${stock.name} (${stock.symbol})\n${emoji} ${prediction === 'BUY' ? '매수' : prediction === 'SELL' ? '매도' : '보유'} 추천\n신뢰도: ${stock.aiAnalysis?.confidence}%\n가격: ${formatKRW(stock.price)}`,
                        tag: `prediction-${stock.symbol}`,
                        requireInteraction: false,
                    }
                );
            });
        }

        updatePreviousTomorrowPicks(currentSymbols);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.predictions, tomorrowPicksEnabled]);

    if (isLoading) {
        return <SkeletonLoader variant="card" count={3} />;
    }

    if (error) {
        return (
            <GlassCard className="p-8 text-center">
                <p className="text-red-400">예측 데이터를 불러오는 중 오류가 발생했습니다.</p>
            </GlassCard>
        );
    }

    const predictions = data?.predictions || [];

    return (
        <div className="space-y-4">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold text-white">내일 필승 종목</h2>
                    <NotificationButton
                        enabled={tomorrowPicksEnabled}
                        onToggle={toggleTomorrowPicksNotifications}
                        label="예측 알림"
                    />
                </div>
                <p className="text-gray-400">AI가 분석한 내일의 유망 종목입니다</p>
            </div>

            {/* Sector Insight Section */}
            {sectorData?.data && (
                <div className="mb-6">
                    <SectorInsightCard sectorAnalysis={sectorData.data} />
                </div>
            )}

            {/* Candle Research Section */}
            {candleData?.data && (
                <div className="mb-6">
                    <CandleResearchSection research={candleData.data} />
                </div>
            )}

            {predictions.length === 0 ? (
                <GlassCard className="p-8 text-center">
                    <p className="text-gray-400">현재 예측된 종목이 없습니다.</p>
                </GlassCard>
            ) : (
                <div className="grid gap-4">
                    {predictions.map((stock, index) => (
                        <GlassCard
                            key={stock.symbol}
                            hover
                            glow
                            className="p-6 fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-white">{stock.name}</h3>
                                        <span className="text-sm text-gray-400">{stock.symbol}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-bold text-white">
                                            {formatKRW(stock.price)}
                                        </span>
                                        <span className={`text-lg font-semibold ${getChangeColor(stock.changePercent)}`}>
                                            {formatPercent(stock.changePercent)}
                                        </span>
                                    </div>
                                </div>

                                {stock.aiAnalysis && (
                                    <div className="text-right">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg ${stock.aiAnalysis.prediction === 'BUY' ? 'bg-green-500/20 text-green-400' :
                                            stock.aiAnalysis.prediction === 'SELL' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {stock.aiAnalysis.prediction === 'BUY' ? '🟢 매수' :
                                                stock.aiAnalysis.prediction === 'SELL' ? '🔴 매도' :
                                                    '🟡 보유'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {stock.aiAnalysis && (
                                <>
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="glass rounded-lg p-3">
                                            <div className="text-xs text-gray-400 mb-1">신뢰도</div>
                                            <div className="text-lg font-bold text-indigo-400">
                                                {stock.aiAnalysis.confidence}%
                                            </div>
                                        </div>
                                        {stock.aiAnalysis.targetPrice && (
                                            <div className="glass rounded-lg p-3">
                                                <div className="text-xs text-gray-400 mb-1">목표가</div>
                                                <div className="text-lg font-bold text-green-400">
                                                    {formatKRW(stock.aiAnalysis.targetPrice)}
                                                </div>
                                            </div>
                                        )}
                                        {stock.aiAnalysis.expectedReturn && (
                                            <div className="glass rounded-lg p-3">
                                                <div className="text-xs text-gray-400 mb-1">예상 수익률</div>
                                                <div className={`text-lg font-bold ${stock.aiAnalysis.expectedReturn > 0 ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {formatPercent(stock.aiAnalysis.expectedReturn)}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="glass rounded-lg p-4 mb-4">
                                        <div className="text-sm font-semibold text-indigo-400 mb-2">분석 근거</div>
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {stock.aiAnalysis.reasoning}
                                        </p>
                                    </div>

                                    {stock.aiAnalysis.factors.length > 0 && (
                                        <div className="glass rounded-lg p-4">
                                            <div className="text-sm font-semibold text-indigo-400 mb-3">주요 요인</div>
                                            <div className="space-y-2">
                                                {stock.aiAnalysis.factors.map((factor, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <div className={`flex-shrink-0 w-16 text-right font-semibold ${factor.impact > 0 ? 'text-green-400' : 'text-red-400'
                                                            }`}>
                                                            {factor.impact > 0 ? '+' : ''}{factor.impact}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-white">{factor.name}</div>
                                                            <div className="text-xs text-gray-400">{factor.description}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
