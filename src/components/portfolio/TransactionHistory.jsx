import React, { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Filter, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAllTransactions, formatTransactionDate, categoryConfig } from '../../utils/assetHelpers';
import { formatCurrency } from '../../utils/formatters';

/**
 * Transaction History Modal
 * Shows all buy/sell transactions across all assets with filtering
 */
const TransactionHistory = ({ assets = [], isOpen, onClose }) => {
    // Filter state
    const [filterType, setFilterType] = useState('all'); // 'all', 'buy', 'sell'
    const [filterAssetType, setFilterAssetType] = useState('all'); // 'all', 'stock', 'fund', 'gold', 'currency'

    // Reset filters when modal opens
    useEffect(() => {
        if (isOpen) {
            setFilterType('all');
            setFilterAssetType('all');
        }
    }, [isOpen]);

    // Get all transactions from all assets
    const allTransactions = useMemo(() => {
        const transactions = [];
        assets.forEach(asset => {
            const assetTransactions = getAllTransactions(asset);
            transactions.push(...assetTransactions);
        });
        // Sort by date (newest first)
        return transactions.sort((a, b) => (b.date || 0) - (a.date || 0));
    }, [assets]);

    // Apply filters
    const filteredTransactions = useMemo(() => {
        return allTransactions.filter(tx => {
            if (filterType !== 'all' && tx.type !== filterType) return false;
            if (filterAssetType !== 'all' && tx.assetType !== filterAssetType) return false;
            return true;
        });
    }, [allTransactions, filterType, filterAssetType]);

    // Calculate summary
    const summary = useMemo(() => {
        let totalBuyValue = 0;
        let totalSellValue = 0;
        let totalProfit = 0;

        filteredTransactions.forEach(tx => {
            if (tx.type === 'buy') {
                totalBuyValue += tx.total || 0;
            } else {
                totalSellValue += tx.total || 0;
                totalProfit += tx.profit || 0;
            }
        });

        return { totalBuyValue, totalSellValue, totalProfit };
    }, [filteredTransactions]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white">İşlem Geçmişi</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-700/50 space-y-3">
                    {/* Transaction Type Filter */}
                    <div className="flex gap-2">
                        {[
                            { value: 'all', label: 'Tümü' },
                            { value: 'buy', label: 'Alımlar' },
                            { value: 'sell', label: 'Satımlar' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setFilterType(option.value)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === option.value
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Asset Type Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setFilterAssetType('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterAssetType === 'all'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            Tüm Varlıklar
                        </button>
                        {Object.entries(categoryConfig).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setFilterAssetType(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${filterAssetType === key
                                    ? 'bg-slate-700 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-700/50">
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">Alım</div>
                        <div className="text-sm font-semibold text-emerald-400">
                            {formatCurrency(summary.totalBuyValue)}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">Satım</div>
                        <div className="text-sm font-semibold text-amber-400">
                            {formatCurrency(summary.totalSellValue)}
                        </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="text-xs text-slate-400">Kar/Zarar</div>
                        <div className={`text-sm font-semibold ${summary.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {summary.totalProfit >= 0 ? '+' : ''}{formatCurrency(summary.totalProfit)}
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div
                    key={`list-${filterType}-${filterAssetType}`}
                    className="flex-1 overflow-y-auto p-4 space-y-2"
                >
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            Gösterilecek işlem bulunamadı.
                        </div>
                    ) : (
                        filteredTransactions.map((tx, index) => (
                            <div
                                key={`${tx.id}-${index}`}
                                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Type Icon */}
                                        <div className={`p-2 rounded-lg ${tx.type === 'buy'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-amber-500/10 text-amber-400'
                                            }`}>
                                            {tx.type === 'buy'
                                                ? <ArrowDownRight className="w-4 h-4" />
                                                : <ArrowUpRight className="w-4 h-4" />
                                            }
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">{tx.assetName}</span>
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${tx.type === 'buy'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {tx.type === 'buy' ? 'Alım' : 'Satım'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {tx.amount} adet @ {formatCurrency(tx.price)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-semibold text-white">
                                            {formatCurrency(tx.total)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {formatTransactionDate(tx.date)}
                                        </div>
                                        {tx.type === 'sell' && tx.profit !== undefined && (
                                            <div className={`text-xs ${tx.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {tx.profit >= 0 ? '+' : ''}{formatCurrency(tx.profit)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer info */}
                <div className="p-3 border-t border-slate-700/50 text-center text-xs text-slate-500">
                    Toplam {filteredTransactions.length} işlem
                </div>
            </div>
        </div>
    );
};

export default TransactionHistory;
