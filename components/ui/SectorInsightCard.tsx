'use client';

import { SectorAnalysis } from '@/types/stock';
import { GlassCard } from './GlassCard';
import { formatKRW, formatPercent, getChangeColor } from '@/lib/utils';

interface Props {
    sectorAnalysis: SectorAnalysis;
}

export function SectorInsightCard({ sectorAnalysis }: Props) {
    const trendColor = sectorAnalysis.trend === 'BULLISH'
        ? 'text-green-400'
        : sectorAnalysis.trend === 'BEARISH'
            ? 'text-red-400'
            : 'text-gray-400';

    const trendIcon = sectorAnalysis.trend === 'BULLISH'
        ? '📈'
        : sectorAnalysis.trend === 'BEARISH'
            ? '📉'
            : '➖';

    const trendText = sectorAnalysis.trend === 'BULLISH'
        ? '강세'
        : sectorAnalysis.trend === 'BEARISH'
            ? '약세'
            : '보합';

    return (
        <GlassCard hover glow className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <span className="text-2xl">{trendIcon}</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{sectorAnalysis.sectorName} 섹터 분석</h3>
                        <p className="text-sm text-gray-400">
                            {new Date(sectorAnalysis.lastUpdated).toLocaleDateString('ko-KR')} 업데이트
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${trendColor}`}>
                        {trendText}
                    </div>
                    <div className="text-sm text-gray-400">
                        신뢰도 {sectorAnalysis.confidence}%
                    </div>
                </div>
            </div>

            <div className="glass rounded-lg p-4 mb-4">
                <div className="text-sm font-semibold text-indigo-400 mb-2">핵심 인사이트</div>
                <p className="text-sm text-gray-300 leading-relaxed">
                    {sectorAnalysis.reasoning}
                </p>
            </div>

            {sectorAnalysis.topStocks.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-white">급등 예상 종목</h4>
                        <span className="text-xs text-gray-400">
                            {sectorAnalysis.topStocks.length}개 종목
                        </span>
                    </div>

                    <div className="space-y-3">
                        {sectorAnalysis.topStocks.map((stock, index) => (
                            <div
                                key={stock.symbol}
                                className="glass rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-indigo-400">
                                                #{stock.sectorRank}
                                            </span>
                                            <span className="text-base font-bold text-white">
                                                {stock.name}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {stock.symbol}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-semibold text-white">
                                                {formatKRW(stock.price)}
                                            </span>
                                            <span className={`text-sm font-semibold ${getChangeColor(stock.changePercent)}`}>
                                                {formatPercent(stock.changePercent)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 mb-1">예상 상승률</div>
                                        <div className="text-lg font-bold text-green-400">
                                            +{stock.expectedGrowth.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                {stock.catalysts.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <div className="text-xs text-gray-400 mb-2">급등 촉매</div>
                                        <div className="flex flex-wrap gap-2">
                                            {stock.catalysts.map((catalyst, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300"
                                                >
                                                    {catalyst}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </GlassCard>
    );
}
