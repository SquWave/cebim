import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

const AssetPerformanceCards = ({ assets = [], marketData = {}, privacyMode = false }) => {
    const [expandedClass, setExpandedClass] = useState(null);

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

    const data = useMemo(() => {
        const classMap = {};

        assets.forEach(rawAsset => {
            // Logic to handle both flat assets and lot-based assets
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
                avgCost = safeNumber(rawAsset.avgCost) || safeNumber(rawAsset.cost);

                if (marketData && typeof marketData.getPrice === 'function') {
                    currentPrice = marketData.getPrice(rawAsset) || avgCost;
                } else {
                    currentPrice = avgCost;
                }
            }

            const value = currentAmount * Number(currentPrice);
            const cost = currentAmount * avgCost;
            const pl = value - cost;
            const plPercent = cost > 0 ? (pl / cost) * 100 : 0;

            let typeLabel = 'Diğer';
            if (rawAsset.type === 'gold') typeLabel = 'Altın';
            else if (rawAsset.type === 'stock') typeLabel = 'Hisse Senedi';
            else if (rawAsset.type === 'fund') typeLabel = 'Yatırım Fonu';
            else if (rawAsset.type === 'currency') typeLabel = 'Döviz';

            if (!classMap[typeLabel]) {
                classMap[typeLabel] = {
                    name: typeLabel,
                    totalValue: 0,
                    totalCost: 0,
                    assets: []
                };
            }

            classMap[typeLabel].totalValue += value;
            classMap[typeLabel].totalCost += cost;
            classMap[typeLabel].assets.push({
                ...rawAsset,
                currentAmount, // Use calculated amount
                avgCost,      // Use calculated avgCost
                currentPrice,
                value,
                cost,
                pl,
                plPercent
            });
        });

        // Calculate class level P/L
        Object.values(classMap).forEach(c => {
            c.pl = c.totalValue - c.totalCost;
            c.plPercent = c.totalCost > 0 ? (c.pl / c.totalCost) * 100 : 0;
        });

        return Object.values(classMap).sort((a, b) => b.totalValue - a.totalValue);
    }, [assets, marketData]);

    const toggleClass = (name) => {
        setExpandedClass(expandedClass === name ? null : name);
    };

    if (data.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Varlık Bazlı Performans</h3>

            <div className="space-y-3">
                {data.map(cls => (
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
                                <div className="font-semibold text-white">
                                    {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cls.totalValue)}
                                </div>
                                <div className={`text-xs font-medium flex items-center justify-end gap-1 ${cls.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {cls.pl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {privacyMode ? '***' : `${cls.pl >= 0 ? '+' : ''}${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cls.pl)} (%${cls.plPercent.toFixed(2)})`}
                                </div>
                            </div>
                        </button>

                        {/* Assets List */}
                        {expandedClass === cls.name && (
                            <div className="bg-slate-900/30 border-t border-slate-700 divide-y divide-slate-700/50">
                                {cls.assets.map(asset => (
                                    <div key={asset.id} className="p-4 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
                                        <div>
                                            <div className="font-medium text-slate-200">{asset.name || asset.symbol}</div>
                                            <div className="text-xs text-slate-400">
                                                {privacyMode ? '***' : asset.currentAmount} Adet • Ort. {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(asset.avgCost)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-slate-300">
                                                {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(asset.value)}
                                            </div>
                                            <div className={`text-xs ${asset.pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {privacyMode ? '***' : `${asset.pl >= 0 ? '+' : ''}${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(asset.pl)} (%${asset.plPercent.toFixed(2)})`}
                                            </div>
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
