import React, { useMemo } from 'react';
import { ComposedChart, Line, Bar, Cell, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Handshake } from 'lucide-react';
import { getPeriodRanges, filterTransactionsByDateRange } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

const CashFlowComparison = ({ transactions = [], dateFilter, customRange, privacyMode = false }) => {
    const periodData = useMemo(() => {
        const ranges = getPeriodRanges(dateFilter, customRange);
        if (!ranges) return null;

        const currentTx = filterTransactionsByDateRange(transactions, ranges.start, ranges.end);
        const prevTx = filterTransactionsByDateRange(transactions, ranges.prevStart, ranges.prevEnd);

        const calculateTotals = (txs) => {
            let income = 0;
            let expense = 0;
            txs.forEach(t => {
                if (t.type === 'income') income += Number(t.amount);
                if (t.type === 'expense') expense += Number(t.amount);
            });
            return { income, expense, net: income - expense };
        };

        const current = calculateTotals(currentTx);
        const previous = calculateTotals(prevTx);

        return { current, previous, currentTx };
    }, [transactions, dateFilter, customRange]);

    const chartData = useMemo(() => {
        if (!periodData || !periodData.currentTx) return [];

        const { currentTx } = periodData;
        const ranges = getPeriodRanges(dateFilter, customRange);
        if (!ranges) return [];

        // Initialize map with all dates in range
        const rawMap = {};
        let current = new Date(ranges.start);
        const end = new Date(ranges.end);

        // Safety break
        let safety = 0;
        while (current <= end && safety < 1000) {
            let key;
            if (dateFilter === 'year') {
                key = new Date(current.getFullYear(), current.getMonth(), 1).getTime();
                current.setMonth(current.getMonth() + 1);
            } else {
                key = new Date(current.getFullYear(), current.getMonth(), current.getDate()).getTime();
                current.setDate(current.getDate() + 1);
            }

            if (!rawMap[key]) {
                rawMap[key] = { date: key, income: 0, expense: 0 };
            }
            safety++;
        }

        // Helper to format date key
        const formatDateKey = (date) => {
            const d = new Date(date);
            if (dateFilter === 'year') {
                return d.toLocaleDateString('tr-TR', { month: 'short' });
            }
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            return `${day}.${month}`;
        };

        // Fill with actual data
        currentTx.forEach(t => {
            const d = new Date(t.date);
            let key;
            if (dateFilter === 'year') {
                key = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
            } else {
                key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            }

            if (rawMap[key]) {
                if (t.type === 'income') rawMap[key].income += Number(t.amount);
                if (t.type === 'expense') rawMap[key].expense += Number(t.amount);
            }
        });

        return Object.values(rawMap)
            .sort((a, b) => a.date - b.date)
            .map(item => ({
                name: formatDateKey(item.date),
                fullDate: item.date,
                income: item.income,
                expense: item.expense,
                net: item.income - item.expense
            }));

    }, [periodData, dateFilter, customRange]);

    if (!periodData) return null;

    const { current, previous } = periodData;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const date = new Date(data.fullDate).toLocaleDateString('tr-TR');
            const value = privacyMode ? '₺***' : formatCurrency(data.net);

            return (
                <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-lg">
                    <p className="text-white font-medium text-sm">
                        {value} - {date}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 whitespace-nowrap">
                        <Handshake className="w-3 h-3" /> Net Durum
                    </div>
                    <div className={`text-lg font-bold ${current.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {privacyMode ? '₺***' : formatCurrency(current.net)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Önceki: {privacyMode ? '₺***' : formatCurrency(previous.net)}
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 whitespace-nowrap">
                        <TrendingUp className="w-3 h-3 text-emerald-500" /> Toplam Gelir
                    </div>
                    <div className="text-lg font-bold text-white">
                        {privacyMode ? '₺***' : formatCurrency(current.income)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Önceki: {privacyMode ? '₺***' : formatCurrency(previous.income)}
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 whitespace-nowrap">
                        <TrendingDown className="w-3 h-3 text-rose-500" /> Toplam Gider
                    </div>
                    <div className="text-lg font-bold text-white">
                        {privacyMode ? '₺***' : formatCurrency(current.expense)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Önceki: {privacyMode ? '₺***' : formatCurrency(previous.expense)}
                    </div>
                </div>
            </div>

            {/* Detailed Comparison Chart */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-6">Nakit Akış Eğilimi</h3>
                <div className="h-64 w-full" style={{ minHeight: 256, minWidth: 0 }}>
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
                            <ComposedChart data={chartData} stackOffset="sign">
                                <defs>
                                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                        <feOffset dx="0" dy="2" result="offsetblur" />
                                        <feComponentTransfer>
                                            <feFuncA type="linear" slope="0.5" />
                                        </feComponentTransfer>
                                        <feMerge>
                                            <feMergeNode />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => privacyMode ? '***' : `${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.2 }} />

                                <ReferenceLine y={0} stroke="#475569" />
                                <Bar dataKey="net" name="Net Akış" radius={[4, 4, 4, 4]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#10b981' : '#f43f5e'} />
                                    ))}
                                </Bar>
                                <Line
                                    type="monotone"
                                    dataKey="net"
                                    name="Trend"
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#1e293b', strokeWidth: 2 }}
                                    style={{ filter: 'url(#shadow)' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Bu dönem için veri bulunamadı.
                        </div>
                    )}
                </div>

                {/* Custom Legend */}
                {chartData.length > 0 && (
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white rounded-sm"></div>
                            <span className="text-slate-300 text-xs">Nakit Akışı</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                            <span className="text-slate-300 text-xs">Gelir</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
                            <span className="text-slate-300 text-xs">Gider</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CashFlowComparison;
