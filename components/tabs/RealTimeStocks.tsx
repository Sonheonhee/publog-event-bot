'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { StockData } from '@/types/stock';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { NotificationButton } from '@/components/ui/NotificationButton';
import { formatKRW, formatPercent, getChangeColor, formatNumber, timeAgo } from '@/lib/utils';
import { getScoreCategory } from '@/lib/stockScoring';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotification } from '@/hooks/useNotification';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function RealTimeStocks() {
    const { sendNotification } = useNotification();
    const {
        realTimeStocksEnabled,
        toggleRealTimeNotifications,
        previousRealTimeStocks,
        updatePreviousRealTimeStocks,
    } = useNotificationStore();

    const { data, error, isLoading } = useSWR<{ stocks: StockData[] }>(
        '/api/stocks/realtime',
        fetcher,
        {
            refreshInterval: 5000, // Refresh every 5 seconds
            revalidateOnFocus: true,
        }
    );

    // Detect new stocks and send notifications
    useEffect(() => {
        if (!data?.stocks || !realTimeStocksEnabled) return;

        const currentSymbols = data.stocks.map(s => s.symbol);
        const newStocks = data.stocks.filter(
            stock => !previousRealTimeStocks.includes(stock.symbol)
        );

        if (newStocks.length > 0 && previousRealTimeStocks.length > 0) {
            newStocks.forEach(stock => {
                const scoreInfo = getScoreCategory(stock.score);
                sendNotification(
                    `🚀 새로운 특징주 발견!`,
                    {
                        body: `${stock.name} (${stock.symbol})\n${scoreInfo.emoji} 점수: ${stock.score.toFixed(0)} - ${scoreInfo.label}\n가격: ${formatKRW(stock.price)} (${formatPercent(stock.changePercent)})`,
                        tag: `realtime-${stock.symbol}`,
                        requireInteraction: false,
                    }
                );
            });
        }

        updatePreviousRealTimeStocks(currentSymbols);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.stocks, realTimeStocksEnabled]);

    if (isLoading) {
        return <SkeletonLoader variant="card" count={5} />;
    }

    if (error) {
        return (
            <GlassCard className="p-8 text-center">
                <p className="text-red-400">데이터를 불러오는 중 오류가 발생했습니다.</p>
                <p className="text-sm text-gray-400 mt-2">{error.message}</p>
            </GlassCard>
        );
    }

    const stocks = data?.stocks || [];

    if (stocks.length === 0) {
        return (
            <GlassCard className="p-8 text-center">
                <p className="text-gray-400">현재 특징주가 없습니다.</p>
            </GlassCard>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">실시간 특징주</h2>
                    <div className="text-sm text-gray-400">
                        {data && `마지막 업데이트: ${timeAgo(new Date(stocks[0]?.timestamp))}`}
                    </div>
                </div>
                <NotificationButton
                    enabled={realTimeStocksEnabled}
                    onToggle={toggleRealTimeNotifications}
                    label="실시간 알림"
                />
            </div>

            <div className="grid gap-4">
                {stocks.map((stock, index) => {
                    const scoreInfo = getScoreCategory(stock.score);

                    return (
                        <GlassCard
                            key={stock.symbol}
                            hover
                            glow={stock.score >= 80}
                            className="p-6 fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-white">{stock.name}</h3>
                                        <span className="text-sm text-gray-400">{stock.symbol}</span>
                                        {stock.isSuspended && (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                                                거래정지
                                            </span>
                                        )}
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

                                <div className="text-right">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{scoreInfo.emoji}</span>
                                        <span className={`text-3xl font-bold ${scoreInfo.color}`}>
                                            {stock.score.toFixed(0)}
                                        </span>
                                    </div>
                                    <span className={`text-sm ${scoreInfo.color}`}>
                                        {scoreInfo.label}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="glass rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">거래량</div>
                                    <div className="text-sm font-semibold text-white">
                                        {formatNumber(stock.volume)}
                                    </div>
                                </div>
                                <div className="glass rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">RSI</div>
                                    <div className={`text-sm font-semibold ${stock.indicators.rsi > 70 ? 'text-red-400' :
                                        stock.indicators.rsi < 30 ? 'text-blue-400' :
                                            'text-gray-300'
                                        }`}>
                                        {stock.indicators.rsi.toFixed(1)}
                                    </div>
                                </div>
                                <div className="glass rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">MACD</div>
                                    <div className={`text-sm font-semibold ${stock.indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                        {stock.indicators.macd.histogram.toFixed(2)}
                                    </div>
                                </div>
                                <div className="glass rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">SMA20</div>
                                    <div className="text-sm font-semibold text-white">
                                        {formatKRW(stock.indicators.sma20)}
                                    </div>
                                </div>
                            </div>

                            {stock.aiAnalysis && (
                                <div className="glass rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-indigo-400">AI 분석</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${stock.aiAnalysis.prediction === 'BUY' ? 'bg-green-500/20 text-green-400' :
                                            stock.aiAnalysis.prediction === 'SELL' ? 'bg-red-500/20 text-red-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {stock.aiAnalysis.prediction}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            신뢰도: {stock.aiAnalysis.confidence}%
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300">{stock.aiAnalysis.reasoning}</p>
                                </div>
                            )}
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
