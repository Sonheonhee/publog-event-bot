'use client';

import { CandleResearch, CandlePattern } from '@/types/stock';
import { GlassCard } from './GlassCard';

interface Props {
    research: CandleResearch;
}

export function CandleResearchSection({ research }: Props) {
    return (
        <GlassCard hover glow className="p-6 border-l-4 border-indigo-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">📊</span>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        📊 캔들 기법 수학적 연구
                    </h3>
                    <div className="flex items-center gap-3 text-indigo-300 font-medium">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                            <span className="text-sm">Week {research.weekNumber}, {research.year}</span>
                        </div>
                        <span className="text-gray-600">|</span>
                        <span className="text-sm text-gray-400">{new Date(research.updatedAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs font-medium text-green-400">Weekly Updated</span>
                </div>
            </div>

            <div className="relative z-10 space-y-3 pl-1">
                <p className="text-gray-300 font-medium text-lg">
                    매주 업데이트되는 캔들 패턴의 확률 기반 데이터 연구
                </p>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/10">
                    <span className="text-indigo-400 mt-0.5">💡</span>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        이 확률 기반 데이터를 통해 <span className="text-indigo-300 font-semibold">아래 필승종목들</span>이 선정되었습니다.
                        <br />
                        <span className="text-xs opacity-70 mt-1 block">
                            (총 {research.totalSamples.toLocaleString()}개 표본 분석 기반)
                        </span>
                    </p>
                </div>
            </div>
        </GlassCard>
    );
}
