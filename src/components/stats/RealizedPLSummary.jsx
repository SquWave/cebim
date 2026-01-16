import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Receipt, Target, CircleDollarSign, Percent, Clock } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { computeRealizedPL, computeAverageHoldingPeriod } from '../../utils/assetHelpers';

const RealizedPLSummary = ({ assets = [], privacyMode = false }) => {

    const stats = useMemo(() => {
        return computeRealizedPL(assets);
    }, [assets]);

    const holdingStats = useMemo(() => {
        return computeAverageHoldingPeriod(assets);
    }, [assets]);

    // Don't render if no sales
    if (stats.totalSaleCount === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                Gerçekleşmiş Kar/Zarar
            </h3>

            <div className="flex flex-col gap-3">
                {/* Total Revenue */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                            <CircleDollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-slate-300 font-medium">Toplam Satış Geliri</span>
                    </div>
                    <div className="text-xl font-bold text-white">
                        {privacyMode ? '₺***' : formatCurrency(stats.totalRevenue)}
                    </div>
                </div>

                {/* Total Cost */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-slate-400">
                            <Receipt className="w-5 h-5" />
                        </div>
                        <span className="text-slate-300 font-medium">Toplam Satış Maliyeti</span>
                    </div>
                    <div className="text-xl font-bold text-slate-300">
                        {privacyMode ? '₺***' : formatCurrency(stats.totalCost)}
                    </div>
                </div>

                {/* Realized P/L */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${stats.totalProfit >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {stats.totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <span className="text-slate-300 font-medium">Gerçekleşmiş Kar/Zarar</span>
                    </div>
                    <div className="text-right">
                        <div className={`text-xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {privacyMode ? '₺***' : `${stats.totalProfit >= 0 ? '+' : ''}${formatCurrency(stats.totalProfit)}`}
                        </div>
                        <div className={`text-xs font-medium ${stats.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {privacyMode ? '***' : `%${stats.profitPercentage.toFixed(2)}`}
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Sale Count */}
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs text-slate-400">Satış Sayısı</span>
                        </div>
                        <div className="text-lg font-bold text-white">{stats.totalSaleCount}</div>
                        <div className="text-xs text-slate-500">
                            {stats.profitableSales} kârlı, {stats.lossSales} zararlı
                        </div>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Percent className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-slate-400">Başarı Oranı</span>
                        </div>
                        <div className={`text-lg font-bold ${stats.successRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            %{stats.successRate.toFixed(1)}
                        </div>
                        <div className="text-xs text-slate-500">
                            Kârlı satış oranı
                        </div>
                    </div>

                    {/* Average Holding Period */}
                    {holdingStats.averageDays > 0 && (
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-cyan-400" />
                                <span className="text-xs text-slate-400">Ort. Tutma</span>
                            </div>
                            <div className="text-lg font-bold text-cyan-400">
                                {holdingStats.averageDays} gün
                            </div>
                            <div className="text-xs text-slate-500">
                                FIFO hesaplama
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealizedPLSummary;

