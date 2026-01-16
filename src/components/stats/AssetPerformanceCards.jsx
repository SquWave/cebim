import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { computeRealizedPL, getCategoryLabel } from '../../utils/assetHelpers';
import { formatCurrency } from '../../utils/formatters';

const AssetPerformanceCards = ({ assets = [], marketData = {}, privacyMode = false }) => {
    const [expandedClass, setExpandedClass] = useState(null);
    const [viewMode, setViewMode] = useState('active'); // 'active' or 'sold'

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

    // Active assets data (unrealized)
    const activeData = useMemo(() => {
        const classMap = {};

        assets.forEach(rawAsset => {
            let currentAmount = 0;
            let avgCost = 0;
            let currentPrice = 0;

            if (rawAsset.lots && rawAsset.lots.length > 0) {
                const totalPurchasedAmount = rawAsset.lots.reduce((sum, lot) => sum + safeNumber(lot.amount), 0);
                const totalPurchasedCost = rawAsset.lots.reduce((sum, lot) => sum + (safeNumber(lot.amount) * safeNumber(lot.cost)), 0);
                const totalSoldAmount = (rawAsset.sales || []).reduce((sum, sale) => sum + safeNumber(sale.amount), 0);

                currentAmount = totalPurchasedAmount - totalSoldAmount;
                avgCost = totalPurchasedAmount > 0 ? totalPurchasedCost / totalPurchasedAmount : 0;

                if (marketData && typeof marketData.getPrice === 'function') {
                    const marketPrice = marketData.getPrice(rawAsset);
                    if (marketPrice) currentPrice = marketPrice;
                    else currentPrice = safeNumber(rawAsset.lots[0]?.price);
                } else {
                    currentPrice = safeNumber(rawAsset.lots[0]?.price);
                }
            } else {
                currentAmount = safeNumber(rawAsset.amount);
                avgCost = safeNumber(rawAsset.avgCost) || safeNumber(rawAsset.cost);
                if (marketData && typeof marketData.getPrice === 'function') {
                    currentPrice = marketData.getPrice(rawAsset) || avgCost;
                } else {
                    currentPrice = avgCost;
                }
            }

            const value = currentAmount * Number(currentPrice);
            if (currentAmount <= 0) return;

            const cost = currentAmount * avgCost;
            const pl = value - cost;
            const plPercent = cost > 0 ? (pl / cost) * 100 : 0;

            const typeLabel = getCategoryLabel(rawAsset.type) || 'Diğer';

            if (!classMap[typeLabel]) {
                classMap[typeLabel] = { name: typeLabel, totalValue: 0, totalCost: 0, assets: [] };
            }

            classMap[typeLabel].totalValue += value;
            classMap[typeLabel].totalCost += cost;
            classMap[typeLabel].assets.push({
                ...rawAsset,
                currentAmount,
                avgCost,
                currentPrice,
                value,
                cost,
                pl,
                plPercent
            });
        });

        Object.values(classMap).forEach(c => {
            c.pl = c.totalValue - c.totalCost;
            c.plPercent = c.totalCost > 0 ? (c.pl / c.totalCost) * 100 : 0;
        });

        return Object.values(classMap).sort((a, b) => b.totalValue - a.totalValue);
    }, [assets, marketData]);

    // Sold assets data (realized)
    const soldData = useMemo(() => {
        const stats = computeRealizedPL(assets);
        const classMap = {};

        Object.values(stats.salesByAsset).forEach(assetData => {
            const typeLabel = getCategoryLabel(assetData.type) || 'Diğer';

            if (!classMap[typeLabel]) {
                classMap[typeLabel] = { name: typeLabel, totalProfit: 0, totalCost: 0, assets: [] };
            }

            classMap[typeLabel].totalProfit += assetData.totalProfit;
            classMap[typeLabel].totalCost += assetData.totalCost;
            classMap[typeLabel].assets.push(assetData);
        });

        Object.values(classMap).forEach(c => {
            c.plPercent = c.totalCost > 0 ? (c.totalProfit / c.totalCost) * 100 : 0;
        });

        return Object.values(classMap).sort((a, b) => b.totalProfit - a.totalProfit);
    }, [assets]);

    const toggleClass = (name) => {
        setExpandedClass(expandedClass === name ? null : name);
    };

    const currentData = viewMode === 'active' ? activeData : soldData;
    const hasActiveData = activeData.length > 0;
    const hasSoldData = soldData.length > 0;

    if (!hasActiveData && !hasSoldData) return null;

    return (
        <div className="space-y-4">
            {/* Header with Switch */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Varlık Bazlı Performans</h3>

                {/* Switch Toggle */}
                <div className="flex bg-slate-900/50 rounded-lg p-1 border border-slate-700">
                    <button
                        onClick={() => { setViewMode('active'); setExpandedClass(null); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'active'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Aktif
                    </button>
                    <button
                        onClick={() => { setViewMode('sold'); setExpandedClass(null); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === 'sold'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Satılmış
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {currentData.length === 0 && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
                    <p className="text-slate-400 text-sm">
                        {viewMode === 'active' ? 'Aktif varlık bulunmuyor' : 'Satılmış varlık bulunmuyor'}
                    </p>
                </div>
            )}

            {/* Cards */}
            <div className="space-y-3">
                {currentData.map(cls => (
                    <div key={cls.name} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        {/* Class Header */}
                        <button
                            onClick={() => toggleClass(cls.name)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {expandedClass === cls.name ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <div className="text-left">
                                    <div className="font-medium text-white">{cls.name}</div>
                                    <div className="text-xs text-slate-400">{cls.assets.length} Varlık</div>
                                </div>
                            </div>
                            <div className="text-right">
                                {viewMode === 'active' ? (
                                    <>
                                        <div className="font-semibold text-white">
                                            {privacyMode ? '₺***' : formatCurrency(cls.totalValue)}
                                        </div>
                                        <div className={`text-xs font-medium flex items-center justify-end gap-1 ${cls.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {cls.pl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {privacyMode ? '***' : `${cls.pl >= 0 ? '+' : ''}${formatCurrency(cls.pl)} (%${cls.plPercent.toFixed(2)})`}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className={`font-semibold ${cls.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {privacyMode ? '***' : `${cls.totalProfit >= 0 ? '+' : ''}${formatCurrency(cls.totalProfit)}`}
                                        </div>
                                        <div className={`text-xs font-medium ${cls.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {privacyMode ? '***' : `%${cls.plPercent.toFixed(2)}`}
                                        </div>
                                    </>
                                )}
                            </div>
                        </button>

                        {/* Assets List */}
                        {expandedClass === cls.name && (
                            <div className="bg-slate-900/30 border-t border-slate-700 divide-y divide-slate-700/50">
                                {cls.assets.map((asset, idx) => (
                                    <div key={asset.id || asset.name || idx} className="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                                        <div>
                                            <div className="font-medium text-slate-200">{asset.name || asset.symbol}</div>
                                            <div className="text-xs text-slate-400">
                                                {viewMode === 'active'
                                                    ? `${privacyMode ? '***' : asset.currentAmount} Adet • Ort. ${privacyMode ? '₺***' : formatCurrency(asset.avgCost)}`
                                                    : (() => {
                                                        const totalSoldAmount = asset.sales?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) || 0;
                                                        const avgSalePrice = totalSoldAmount > 0 ? asset.totalRevenue / totalSoldAmount : 0;
                                                        return `${privacyMode ? '***' : totalSoldAmount} Adet • Ort. ${privacyMode ? '₺***' : formatCurrency(avgSalePrice)}`;
                                                    })()
                                                }
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {viewMode === 'active' ? (
                                                <>
                                                    <div className="text-sm text-slate-300">
                                                        {privacyMode ? '₺***' : formatCurrency(asset.value)}
                                                    </div>
                                                    <div className={`text-xs ${asset.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {privacyMode ? '***' : `${asset.pl >= 0 ? '+' : ''}${formatCurrency(asset.pl)} (%${asset.plPercent.toFixed(2)})`}
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={`text-sm font-bold ${asset.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {privacyMode ? '***' : `${asset.totalProfit >= 0 ? '+' : ''}${formatCurrency(asset.totalProfit)}`}
                                                    </div>
                                                    <div className={`text-xs ${asset.totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {privacyMode ? '***' : `%${asset.totalCost > 0 ? ((asset.totalProfit / asset.totalCost) * 100).toFixed(1) : '0.0'}`}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssetPerformanceCards;
