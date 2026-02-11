'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatKRW, formatPercent, getChangeColor, formatDateTime } from '@/lib/utils';

interface WatchlistItem {
    id: string;
    symbol: string;
    name: string;
    addedAt: Date;
    currentPrice?: number;
    changePercent?: number;
    alertPrice?: number;
    notes?: string;
}

export function WatchlistDB() {
    // Mock data - in production, this would come from a database
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
        {
            id: '1',
            symbol: '005930',
            name: '삼성전자',
            addedAt: new Date('2026-01-20'),
            currentPrice: 75000,
            changePercent: 2.5,
            alertPrice: 80000,
            notes: '반도체 업황 회복 기대',
        },
    ]);

    const [newSymbol, setNewSymbol] = useState('');
    const [newName, setNewName] = useState('');

    const addToWatchlist = () => {
        if (!newSymbol || !newName) return;

        const newItem: WatchlistItem = {
            id: Date.now().toString(),
            symbol: newSymbol,
            name: newName,
            addedAt: new Date(),
        };

        setWatchlist([...watchlist, newItem]);
        setNewSymbol('');
        setNewName('');
    };

    const removeFromWatchlist = (id: string) => {
        setWatchlist(watchlist.filter(item => item.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">감시 종목 DB</h2>
                <p className="text-gray-400">관심 종목을 추가하고 관리하세요</p>
            </div>

            {/* Add New Stock */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">종목 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="종목 코드 (예: 005930)"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                        type="text"
                        placeholder="종목명 (예: 삼성전자)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={addToWatchlist}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        추가하기
                    </button>
                </div>
            </GlassCard>

            {/* Watchlist */}
            {watchlist.length === 0 ? (
                <GlassCard className="p-8 text-center">
                    <p className="text-gray-400">감시 중인 종목이 없습니다.</p>
                    <p className="text-sm text-gray-500 mt-2">위에서 종목을 추가해보세요.</p>
                </GlassCard>
            ) : (
                <div className="grid gap-4">
                    {watchlist.map((item, index) => (
                        <GlassCard
                            key={item.id}
                            hover
                            className="p-6 fade-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-white">{item.name}</h3>
                                        <span className="text-sm text-gray-400">{item.symbol}</span>
                                    </div>
                                    {item.currentPrice && (
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-bold text-white">
                                                {formatKRW(item.currentPrice)}
                                            </span>
                                            {item.changePercent !== undefined && (
                                                <span className={`text-lg font-semibold ${getChangeColor(item.changePercent)}`}>
                                                    {formatPercent(item.changePercent)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => removeFromWatchlist(item.id)}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                                >
                                    삭제
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="glass rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">추가일</div>
                                    <div className="text-sm font-semibold text-white">
                                        {formatDateTime(item.addedAt)}
                                    </div>
                                </div>
                                {item.alertPrice && (
                                    <div className="glass rounded-lg p-3">
                                        <div className="text-xs text-gray-400 mb-1">알림 가격</div>
                                        <div className="text-sm font-semibold text-yellow-400">
                                            {formatKRW(item.alertPrice)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {item.notes && (
                                <div className="glass rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">메모</div>
                                    <div className="text-sm text-gray-300">{item.notes}</div>
                                </div>
                            )}
                        </GlassCard>
                    ))}
                </div>
            )}
        </div>
    );
}
