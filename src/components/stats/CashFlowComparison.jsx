import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Handshake } from 'lucide-react';

const CashFlowComparison = ({ transactions = [], dateFilter, customRange }) => {
    // Helper to get previous period date range
    const getPreviousPeriod = () => {
        const now = new Date();
        let start = new Date();
        let end = new Date();
        let prevStart = new Date();
        let prevEnd = new Date();

        switch (dateFilter) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                prevStart.setDate(start.getDate() - 1);
                prevStart.setHours(0, 0, 0, 0);
                prevEnd.setDate(end.getDate() - 1);
                prevEnd.setHours(23, 59, 59, 999);
                break;
            case 'week':
                const day = now.getDay() || 7;
                if (day !== 1) start.setHours(-24 * (day - 1));
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                prevStart = new Date(start);
                prevStart.setDate(start.getDate() - 7);
                prevEnd = new Date(end);
                prevEnd.setDate(end.getDate() - 7);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                prevStart = new Date(start);
                prevStart.setMonth(start.getMonth() - 1);
                prevEnd = new Date(end);
                prevEnd.setMonth(end.getMonth() - 1);
                // Handle month end overflow
                const lastDayPrevMonth = new Date(prevStart.getFullYear(), prevStart.getMonth() + 1, 0).getDate();
                if (prevEnd.getDate() > lastDayPrevMonth) prevEnd.setDate(lastDayPrevMonth);
                break;
            case 'year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                prevStart = new Date(start);
                prevStart.setFullYear(start.getFullYear() - 1);
                prevEnd = new Date(end);
                prevEnd.setFullYear(end.getFullYear() - 1);
                break;
            default:
                return null;
        }
        return { start, end, prevStart, prevEnd };
    };

    const periodData = useMemo(() => {
        const ranges = getPreviousPeriod();
        if (!ranges) return null;

        const currentTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= ranges.start && d <= ranges.end;
        });

        const prevTx = transactions.filter(t => {
            const d = new Date(t.date);
            return d >= ranges.prevStart && d <= ranges.prevEnd;
        });

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

        return { current, previous };
    }, [transactions, dateFilter, customRange]);

    if (!periodData) return null;

    const { current, previous } = periodData;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 whitespace-nowrap">
                        <Handshake className="w-3 h-3" /> Net Durum
                    </div>
                    <div className={`text-lg font-bold ${current.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(current.net)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Önceki: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(previous.net)}
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 whitespace-nowrap">
                        <TrendingUp className="w-3 h-3 text-emerald-500" /> Toplam Gelir
                    </div>
                    <div className="text-lg font-bold text-white">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(current.income)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Önceki: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(previous.income)}
                    </div>
                </div>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1 whitespace-nowrap">
                        <TrendingDown className="w-3 h-3 text-rose-500" /> Toplam Gider
                    </div>
                    <div className="text-lg font-bold text-white">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(current.expense)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                        Önceki: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(previous.expense)}
                    </div>
                </div>
            </div>

            {/* Comparison Chart Placeholder - Can be expanded to show daily comparison */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 h-48 flex items-center justify-center text-slate-500 text-sm">
                Detaylı Karşılaştırma Grafiği (Geliştiriliyor)
            </div>
        </div>
    );
};

export default CashFlowComparison;
