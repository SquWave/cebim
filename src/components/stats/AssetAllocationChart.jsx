import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft } from 'lucide-react';

const AssetAllocationChart = ({ assets = [], marketData = {}, privacyMode = false }) => {
    const [view, setView] = useState('main'); // 'main' or 'detail'
    const [selectedType, setSelectedType] = useState(null);

    // Type label mapping
    const getTypeLabel = (type) => {
        if (type === 'gold') return 'Altın';
        if (type === 'stock') return 'Hisse Senedi';
        if (type === 'fund') return 'Yatırım Fonu';
        if (type === 'currency') return 'Döviz';
        return 'Diğer';
    };

    // Calculate asset value - handles both flat and lots structure
    const getAssetValue = (asset) => {
        const livePrice = (marketData?.getPrice && marketData.getPrice(asset)) || 0;

        // Support both old flat structure and new lot structure
        if (asset.lots && Array.isArray(asset.lots)) {
            const totalPurchased = asset.lots.reduce((sum, lot) => sum + Number(lot.amount || 0), 0);
            const totalSold = (asset.sales || []).reduce((sum, sale) => sum + Number(sale.amount || 0), 0);
            const currentAmount = totalPurchased - totalSold;
            const priceToUse = livePrice > 0 ? livePrice : (asset.lots[0]?.price || 0);
            return currentAmount * priceToUse;
        } else {
            // Legacy flat structure
            const priceToUse = livePrice > 0 ? livePrice : (Number(asset.price) || asset.avgCost || 0);
            return Number(asset.amount || 0) * priceToUse;
        }
    };

    // Main category data (by asset type)
    const mainData = useMemo(() => {
        const typeMap = {};

        assets.forEach(asset => {
            const value = getAssetValue(asset);
            if (value <= 0) return;

            const typeLabel = getTypeLabel(asset.type);

            if (!typeMap[typeLabel]) typeMap[typeLabel] = { value: 0, type: asset.type };
            typeMap[typeLabel].value += value;
        });

        return Object.keys(typeMap)
            .map(name => ({ name, value: typeMap[name].value, type: typeMap[name].type }))
            .sort((a, b) => b.value - a.value);
    }, [assets, marketData]);

    // Detail data (individual assets for selected type)
    const detailData = useMemo(() => {
        if (!selectedType) return [];

        return assets
            .filter(asset => getTypeLabel(asset.type) === selectedType.name)
            .map(asset => {
                const value = getAssetValue(asset);
                return { name: asset.name, value };
            })
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [assets, marketData, selectedType]);

    const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

    const handleSliceClick = (data) => {
        if (view === 'main') {
            setSelectedType(data);
            setView('detail');
        }
    };

    const handleBackClick = () => {
        setView('main');
        setSelectedType(null);
    };

    const activeData = view === 'main' ? mainData : detailData;
    const totalValue = activeData.reduce((sum, item) => sum + item.value, 0);

    if (mainData.length === 0 || mainData.every(d => d.value === 0)) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-80 flex items-center justify-center text-slate-500">
                Portföy verisi yok.
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            {/* Header with Back Button */}
            <div className="flex items-center gap-3 mb-6">
                {view === 'detail' && (
                    <button
                        onClick={handleBackClick}
                        className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                )}
                <h3 className="text-lg font-semibold text-white">
                    {view === 'main' ? 'Varlık Dağılımı' : `${selectedType?.name} Dağılımı`}
                </h3>
            </div>

            <div className="relative h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={activeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            onClick={(data) => handleSliceClick(data)}
                            style={{ cursor: view === 'main' ? 'pointer' : 'default' }}
                        >
                            {activeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                            formatter={(value) => privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)}
                        />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '16px' }}
                            formatter={(value, entry) => {
                                const percent = totalValue > 0 ? (entry.payload.value / totalValue) * 100 : 0;
                                return `${value} (%${privacyMode ? '***' : percent.toFixed(1)})`;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Click hint for main view */}
            {view === 'main' && mainData.length > 0 && (
                <p className="text-xs text-slate-500 text-center mt-4">
                    Detayları görmek için kategoriye tıklayın
                </p>
            )}
        </div>
    );
};

export default AssetAllocationChart;
