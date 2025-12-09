import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const COLORS = {
    gold: '#f59e0b',
    stock: '#6366f1',
    fund: '#3b82f6',
    currency: '#10b981'
};

const CATEGORY_LABELS = {
    gold: 'Altın',
    stock: 'Hisse',
    fund: 'Fon',
    currency: 'Döviz'
};

// Colors for individual assets in drill-down
const ASSET_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

/**
 * Asset Allocation Widget
 * Shows portfolio distribution with drill-down for individual assets
 */
const AssetAllocationWidget = ({ assets = [], marketData, privacyMode = false }) => {
    const [drilldownCategory, setDrilldownCategory] = useState(null);

    // Calculate asset values
    const assetsWithValues = useMemo(() => {
        return assets.map(asset => {
            const type = asset.type || 'other';
            const livePrice = marketData?.getPrice ? marketData.getPrice(asset) : 0;

            let assetValue = 0;
            let currentAmount = 0;

            if (asset.lots) {
                const totalPurchased = asset.lots.reduce((sum, lot) => sum + Number(lot.amount), 0);
                const totalSold = (asset.sales || []).reduce((sum, sale) => sum + Number(sale.amount), 0);
                currentAmount = totalPurchased - totalSold;
                const price = livePrice > 0 ? livePrice : (asset.lots[0]?.price || 0);
                assetValue = currentAmount * price;
            } else {
                currentAmount = Number(asset.amount);
                const price = livePrice > 0 ? livePrice : (Number(asset.price) || 0);
                assetValue = currentAmount * price;
            }

            return { ...asset, type, assetValue, currentAmount };
        }).filter(a => a.assetValue > 0);
    }, [assets, marketData]);

    // Category totals
    const categoryData = useMemo(() => {
        const categoryTotals = {};
        assetsWithValues.forEach(asset => {
            categoryTotals[asset.type] = (categoryTotals[asset.type] || 0) + asset.assetValue;
        });

        return Object.entries(categoryTotals).map(([type, value]) => ({
            name: CATEGORY_LABELS[type] || type,
            value,
            type
        }));
    }, [assetsWithValues]);

    // Individual assets in selected category
    const assetData = useMemo(() => {
        if (!drilldownCategory) return [];

        return assetsWithValues
            .filter(a => a.type === drilldownCategory)
            .map(a => ({ name: a.name, value: a.assetValue }))
            .sort((a, b) => b.value - a.value);
    }, [assetsWithValues, drilldownCategory]);

    const chartData = drilldownCategory ? assetData : categoryData;
    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

    const handleSliceClick = (data) => {
        if (!drilldownCategory && data.type) {
            setDrilldownCategory(data.type);
        }
    };

    const handleBackClick = () => {
        setDrilldownCategory(null);
    };

    const getColor = (item, index) => {
        if (drilldownCategory) {
            return ASSET_COLORS[index % ASSET_COLORS.length];
        }
        return COLORS[item.type] || '#64748b';
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((data.value / totalValue) * 100).toFixed(1);
            return (
                <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg shadow-lg">
                    <p className="text-white text-xs font-medium">{data.name}</p>
                    <p className="text-slate-300 text-xs">
                        {privacyMode ? '₺***' : formatCurrency(data.value)} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (categoryData.length === 0) {
        return (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 h-48 flex items-center justify-center text-slate-500 text-sm">
                Yatırım verisi yok
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
                {drilldownCategory && (
                    <button
                        onClick={handleBackClick}
                        className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                    </button>
                )}
                <h3 className="text-sm font-semibold text-white">
                    {drilldownCategory ? CATEGORY_LABELS[drilldownCategory] : 'Varlık Dağılımı'}
                </h3>
            </div>

            <div className="flex items-center gap-4">
                <div style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                                onClick={handleSliceClick}
                                style={{ cursor: drilldownCategory ? 'default' : 'pointer' }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={entry.name || entry.type} fill={getColor(entry, index)} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-1">
                    {chartData.slice(0, 5).map((item, index) => (
                        <div
                            key={item.name || item.type}
                            className={`flex items-center justify-between text-xs ${!drilldownCategory ? 'cursor-pointer hover:bg-slate-800/50 -mx-1 px-1 py-0.5 rounded' : ''}`}
                            onClick={() => !drilldownCategory && item.type && setDrilldownCategory(item.type)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getColor(item, index) }} />
                                <span className="text-slate-300 truncate max-w-[80px]">{item.name}</span>
                            </div>
                            <span className="text-slate-400">
                                {privacyMode ? '***' : `${((item.value / totalValue) * 100).toFixed(0)}%`}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AssetAllocationWidget;
