'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { RealTimeStocks } from '@/components/tabs/RealTimeStocks';
import { TomorrowPicks } from '@/components/tabs/TomorrowPicks';
import { WatchlistDB } from '@/components/tabs/WatchlistDB';
import DeepResearchTerminal from '@/components/DeepResearchTerminal';
import PerformanceView from '@/components/PerformanceView';
import { storageService } from '@/services/storage';
import { EvolutionPatch } from '@/types/stock';
import { Sparkles, Loader2 } from 'lucide-react';

type QuantProTab = 'dashboard' | 'research' | 'performance' | 'watchlist';

export default function Home() {
    const [activeTab, setActiveTab] = useState<QuantProTab>('dashboard');
    const [evolutionPatch, setEvolutionPatch] = useState<EvolutionPatch | null>(null);
    const [isLoadingPatch, setIsLoadingPatch] = useState(true);

    // Load Evolution Patch on mount
    useEffect(() => {
        loadEvolutionPatch();
    }, []);

    const loadEvolutionPatch = async () => {
        try {
            await storageService.init();
            const latestPatch = await storageService.getLatestPatch();
            setEvolutionPatch(latestPatch);
        } catch (error) {
            console.error('Failed to load evolution patch:', error);
        } finally {
            setIsLoadingPatch(false);
        }
    };

    // Mock verification status
    const verificationStatus = {
        isVerified: true,
        lastChecked: new Date(),
        source: 'KIS API + Gemini AI',
        confidence: 95,
    };

    return (
        <main className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <header className="text-center space-y-4 py-8">
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-5xl md:text-6xl font-bold text-gradient">
                            Quant Pro
                        </h1>
                        {isLoadingPatch ? (
                            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        ) : evolutionPatch ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-mono text-purple-300">
                                    {evolutionPatch.version}
                                </span>
                            </div>
                        ) : null}
                    </div>
                    <p className="text-lg text-gray-300">
                        AI 기반 자가 진화형 퀀트 분석 엔진
                    </p>
                    {evolutionPatch && (
                        <p className="text-sm text-gray-400 max-w-2xl mx-auto">
                            {evolutionPatch.description}
                        </p>
                    )}
                    <div className="flex justify-center">
                        <VerificationBadge status={verificationStatus} />
                    </div>
                </header>

                {/* Tab Navigation */}
                <GlassCard variant="strong" className="p-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`
                px-4 py-4 rounded-lg font-medium transition-all duration-300
                ${activeTab === 'dashboard'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
              `}
                        >
                            <div className="text-sm md:text-base">📊 대시보드</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('research')}
                            className={`
                px-4 py-4 rounded-lg font-medium transition-all duration-300
                ${activeTab === 'research'
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg scale-105'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
              `}
                        >
                            <div className="text-sm md:text-base">🔬 Deep Research</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`
                px-4 py-4 rounded-lg font-medium transition-all duration-300
                ${activeTab === 'performance'
                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
              `}
                        >
                            <div className="text-sm md:text-base">📈 Performance</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('watchlist')}
                            className={`
                px-4 py-4 rounded-lg font-medium transition-all duration-300
                ${activeTab === 'watchlist'
                                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg scale-105'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
              `}
                        >
                            <div className="text-sm md:text-base">⭐ Watchlist</div>
                        </button>
                    </div>
                </GlassCard>

                {/* Tab Content */}
                <div className="fade-in">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6">
                            <RealTimeStocks />
                            <TomorrowPicks />
                        </div>
                    )}
                    {activeTab === 'research' && (
                        <GlassCard variant="strong" className="h-[calc(100vh-300px)] overflow-hidden">
                            <DeepResearchTerminal />
                        </GlassCard>
                    )}
                    {activeTab === 'performance' && <PerformanceView />}
                    {activeTab === 'watchlist' && <WatchlistDB />}
                </div>
            </div>
        </main>
    );
}

