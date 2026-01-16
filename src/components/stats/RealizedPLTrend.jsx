import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { computeRealizedPLByMonth } from '../../utils/assetHelpers';

const RealizedPLTrend = ({ assets = [], privacyMode = false }) => {

    const monthlyData = useMemo(() => {
        return computeRealizedPLByMonth(assets);
    }, [assets]);

    // Don't render if no data or less than 2 months
    if (monthlyData.length < 1) {
        return null;
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium text-white mb-1">{data.label}</p>
                    <p className={`text-sm font-bold ${data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {privacyMode ? '***' : `${data.profit >= 0 ? '+' : ''}${formatCurrency(data.profit)}`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{data.count} satış</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                Aylık Kar/Zarar Trendi
            </h3>

            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={{ stroke: '#475569' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => privacyMode ? '***' : `${value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                        <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                            {monthlyData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.profit >= 0 ? '#10b981' : '#ef4444'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between text-sm">
                <span className="text-slate-400">{monthlyData.length} ay veri</span>
                <span className="text-slate-400">
                    Toplam: {' '}
                    <span className={monthlyData.reduce((s, m) => s + m.profit, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {privacyMode ? '***' : formatCurrency(monthlyData.reduce((s, m) => s + m.profit, 0))}
                    </span>
                </span>
            </div>
        </div>
    );
};

export default RealizedPLTrend;
