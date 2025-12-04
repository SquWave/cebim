import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AssetAllocationChart = ({ assets = [], marketData = {}, privacyMode = false }) => {
    const data = useMemo(() => {
        const typeMap = {};

        assets.forEach(asset => {
            const currentPrice = (marketData.getPrice && marketData.getPrice(asset)) || asset.avgCost || 0;
            const value = Number(asset.amount) * Number(currentPrice);

            // Determine asset type label
            let typeLabel = 'Diğer';
            if (asset.type === 'gold') typeLabel = 'Altın';
            else if (asset.type === 'stock') typeLabel = 'Hisse Senedi';
            else if (asset.type === 'fund') typeLabel = 'Yatırım Fonu';
            else if (asset.type === 'currency') typeLabel = 'Döviz';

            if (!typeMap[typeLabel]) typeMap[typeLabel] = 0;
            typeMap[typeLabel] += value;
        });

        return Object.keys(typeMap)
            .map(name => ({ name, value: typeMap[name] }))
            .sort((a, b) => b.value - a.value);
    }, [assets, marketData]);

    const COLORS = ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#8b5cf6'];

    if (data.length === 0 || data.every(d => d.value === 0)) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-80 flex items-center justify-center text-slate-500">
                Portföy verisi yok.
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-6">Varlık Dağılımı</h3>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                            formatter={(value) => privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                            formatter={(value, entry) => {
                                const total = data.reduce((sum, item) => sum + item.value, 0);
                                const percent = total > 0 ? (entry.payload.value / total) * 100 : 0;
                                return `${value} (%${percent.toFixed(1)})`;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AssetAllocationChart;
