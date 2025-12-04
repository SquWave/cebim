import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TrendChart = ({ transactions = [], currentBalance = 0 }) => {
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
        if (transactions.length === 0) return [];

        // 1. Start with Global Current Balance (End of Today)
        // This is passed from parent, calculated from all accounts + all transactions
        const currentTotalBalance = safeNumber(currentBalance);

        // 2. Determine Date Range
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) return [];

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const earliestDate = new Date(sortedTransactions[sortedTransactions.length - 1].date);
        earliestDate.setHours(0, 0, 0, 0);

        const transactionsByDate = {};
        sortedTransactions.forEach(t => {
            const dateKey = new Date(t.date).toISOString().split('T')[0];
            if (!transactionsByDate[dateKey]) transactionsByDate[dateKey] = { income: 0, expense: 0 };

            if (t.type === 'income') transactionsByDate[dateKey].income += safeNumber(t.amount);
            else if (t.type === 'expense') transactionsByDate[dateKey].expense += safeNumber(t.amount);
        });

        // 3. Backward Calculation
        const trendData = [];
        let runningBalance = currentTotalBalance;
        const currentDate = new Date(today);
        let safetyCounter = 0;

        while (currentDate >= earliestDate && safetyCounter < 3660) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const dayStats = transactionsByDate[dateKey] || { income: 0, expense: 0 };

            trendData.push({
                date: currentDate.toLocaleDateString('tr-TR'),
                rawDate: new Date(currentDate),
                balance: runningBalance
            });

            // Balance(Start of Day) = Balance(End of Day) - Income + Expense
            // Because: End = Start + Income - Expense
            // So: Start = End - Income + Expense
            runningBalance = runningBalance - dayStats.income + dayStats.expense;

            currentDate.setDate(currentDate.getDate() - 1);
            safetyCounter++;
        }

        return trendData.sort((a, b) => a.rawDate - b.rawDate);

    }, [transactions, currentBalance]);

    const totalChange = useMemo(() => {
        if (data.length === 0) return 0;
        const first = data[0].balance;
        const last = data[data.length - 1].balance;
        return last - first;
    }, [data]);

    const percentageChange = useMemo(() => {
        if (data.length === 0 || data[0].balance === 0) return 0;
        return ((totalChange / Math.abs(data[0].balance)) * 100).toFixed(1);
    }, [data, totalChange]);

    if (data.length === 0) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-64 flex items-center justify-center text-slate-500">
                Görüntülenecek veri yok.
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Bakiye Eğilimi</h3>
                </div>
                <div className={`text-right ${totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="text-xl font-bold">
                        {totalChange >= 0 ? '+' : ''}{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalChange)}
                    </div>
                    <div className="text-xs font-medium bg-slate-900/50 px-2 py-1 rounded-lg inline-block">
                        %{percentageChange}
                    </div>
                </div>
            </div>

            <div style={{ width: '100%', height: 256, minHeight: 256, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => new Intl.NumberFormat('tr-TR', { notation: "compact", compactDisplay: "short" }).format(value)}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                            itemStyle={{ color: '#818cf8' }}
                            formatter={(value) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)}
                            labelStyle={{ color: '#94a3b8', marginBottom: '0.5rem' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrendChart;
