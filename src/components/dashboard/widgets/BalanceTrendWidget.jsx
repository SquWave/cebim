import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Balance Trend Widget
 * Shows last 30 days balance trend (compact version)
 */
const BalanceTrendWidget = ({ transactions = [], currentBalance = 0, privacyMode = false }) => {
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

        const currentTotalBalance = safeNumber(currentBalance);
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        if (sortedTransactions.length === 0) return [];

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Fixed 30 days range
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const transactionsByDate = {};
        sortedTransactions.forEach(t => {
            const dateKey = new Date(t.date).toISOString().split('T')[0];
            if (!transactionsByDate[dateKey]) transactionsByDate[dateKey] = { income: 0, expense: 0 };

            if (t.type === 'income') transactionsByDate[dateKey].income += safeNumber(t.amount);
            else if (t.type === 'expense') transactionsByDate[dateKey].expense += safeNumber(t.amount);
        });

        const trendData = [];
        let runningBalance = currentTotalBalance;
        const currentDate = new Date(today);

        while (currentDate >= thirtyDaysAgo) {
            const dateKey = currentDate.toISOString().split('T')[0];
            const dayStats = transactionsByDate[dateKey] || { income: 0, expense: 0 };

            trendData.push({
                date: `${String(currentDate.getDate()).padStart(2, '0')}.${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
                rawDate: new Date(currentDate),
                balance: runningBalance
            });

            runningBalance = runningBalance - dayStats.income + dayStats.expense;
            currentDate.setDate(currentDate.getDate() - 1);
        }

        return trendData.sort((a, b) => a.rawDate - b.rawDate);
    }, [transactions, currentBalance]);

    const totalChange = useMemo(() => {
        if (data.length === 0) return 0;
        return data[data.length - 1].balance - data[0].balance;
    }, [data]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const value = privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.balance);
            const date = item.rawDate.toLocaleDateString('tr-TR');

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

    if (data.length === 0) {
        return (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 h-48 flex items-center justify-center text-slate-500 text-sm">
                Görüntülenecek veri yok
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-white">Bakiye Eğilimi</h3>
                <div className={`text-xs font-medium px-2 py-1 rounded ${totalChange >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {privacyMode ? '***' : `${totalChange >= 0 ? '+' : ''}${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalChange)}`}
                </div>
            </div>

            <div style={{ width: '100%', height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBalanceWidget" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569' }} />
                        <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBalanceWidget)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default BalanceTrendWidget;
