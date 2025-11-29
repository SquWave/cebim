import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, TurkishLira, PiggyBank } from 'lucide-react';

const PortfolioSummary = ({ assets = [], marketData = {} }) => {
    // Helper to safely parse numbers
    const safeNumber = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const strVal = String(val);
        if (strVal.includes(',') && !strVal.includes('.')) {
            return Number(strVal.replace(',', '.'));
        }
        return Number(strVal) || 0;
    };

    const summary = useMemo(() => {
        let totalValue = 0;
        let totalCost = 0;

        assets.forEach(rawAsset => {
            // Logic to handle both flat assets and lot-based assets
            // Replicating logic from Portfolio.jsx's computeAggregatedValues
            let currentAmount = 0;
            let avgCost = 0;
            let currentPrice = 0;

            if (rawAsset.lots && rawAsset.lots.length > 0) {
                // Lot-based calculation
                const totalPurchasedAmount = rawAsset.lots.reduce((sum, lot) => sum + safeNumber(lot.amount), 0);
                const totalPurchasedCost = rawAsset.lots.reduce((sum, lot) => sum + (safeNumber(lot.amount) * safeNumber(lot.cost)), 0);

                const totalSoldAmount = (rawAsset.sales || []).reduce((sum, sale) => sum + safeNumber(sale.amount), 0);

                currentAmount = totalPurchasedAmount - totalSoldAmount;
                avgCost = totalPurchasedAmount > 0 ? totalPurchasedCost / totalPurchasedAmount : 0;

                // Use price from marketData if available, otherwise fallback to lot price
                if (marketData && typeof marketData.getPrice === 'function') {
                    const marketPrice = marketData.getPrice(rawAsset);
                    if (marketPrice) currentPrice = marketPrice;
                    else currentPrice = safeNumber(rawAsset.lots[0]?.price);
                } else {
                    currentPrice = safeNumber(rawAsset.lots[0]?.price);
                }

            } else {
                // Legacy/Flat calculation (fallback)
                currentAmount = safeNumber(rawAsset.amount);
                avgCost = safeNumber(rawAsset.avgCost) || safeNumber(rawAsset.cost); // Handle potential naming diffs

                if (marketData && typeof marketData.getPrice === 'function') {
                    currentPrice = marketData.getPrice(rawAsset) || avgCost;
                } else {
                    currentPrice = avgCost;
                }
            }

            // Calculate totals for this asset
            const assetValue = currentAmount * Number(currentPrice);
            const assetCost = currentAmount * avgCost;

            totalValue += assetValue;
            totalCost += assetCost;
        });

        const profitLoss = totalValue - totalCost;
        const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

        return { totalValue, totalCost, profitLoss, profitLossPercentage };
    }, [assets, marketData]);

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Portföy Özeti</h3>

            <div className="flex flex-col gap-3">
                {/* Total Value */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <PiggyBank className="w-5 h-5" />
                        </div>
                        <span className="text-slate-300 font-medium">Toplam Değer</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(summary.totalValue)}
                    </div>
                </div>

                {/* Total Cost */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                            <TurkishLira className="w-5 h-5" />
                        </div>
                        <span className="text-slate-300 font-medium">Toplam Maliyet</span>
                    </div>
                    <div className="text-xl font-bold text-slate-300">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(summary.totalCost)}
                    </div>
                </div>

                {/* Profit/Loss */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${summary.profitLoss >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {summary.profitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <span className="text-slate-300 font-medium">Genel Kar/Zarar</span>
                    </div>
                    <div className="text-right">
                        <div className={`text-xl font-bold ${summary.profitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {summary.profitLoss >= 0 ? '+' : ''}{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(summary.profitLoss)}
                        </div>
                        <div className={`text-xs font-medium ${summary.profitLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            %{summary.profitLossPercentage.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioSummary;
