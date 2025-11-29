import React, { useState, useMemo } from 'react';
import DateFilter from './DateFilter';
import TrendChart from './TrendChart';
import SpendingCharts from './SpendingCharts';
import CashFlowComparison from './CashFlowComparison';
import DetailedReport from './DetailedReport';

const WalletAnalysis = ({ transactions = [], categories = [], accounts = [] }) => {
    const [dateFilter, setDateFilter] = useState('month');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Filter Transactions based on Date
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        switch (dateFilter) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                // Start of week (Monday)
                const day = now.getDay() || 7; // Get current day number, converting Sun (0) to 7
                if (day !== 1) start.setHours(-24 * (day - 1));
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Start of month (1st day)
                start.setDate(1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'year':
                start.setMonth(0, 1);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                if (customRange.start) start = new Date(customRange.start);
                if (customRange.end) end = new Date(customRange.end);
                // Adjust end date to end of day if it's just a date string
                if (customRange.end && customRange.end.length <= 10) end.setHours(23, 59, 59, 999);
                break;
            default:
                break;
        }

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });
    }, [transactions, dateFilter, customRange]);

    // Calculate Global Current Balance
    const currentBalance = useMemo(() => {
        let total = accounts.reduce((sum, acc) => sum + (Number(acc.initialBalance) || 0), 0);
        transactions.forEach(t => {
            if (t.type === 'income') total += Number(t.amount);
            else if (t.type === 'expense') total -= Number(t.amount);
        });
        return total;
    }, [accounts, transactions]);

    return (
        <div className="space-y-6">
            {/* Date Filter */}
            <DateFilter filter={dateFilter} onFilterChange={setDateFilter} />

            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
                <div className="flex gap-2 bg-slate-800 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <input
                        type="date"
                        value={customRange.start}
                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <input
                        type="date"
                        value={customRange.end}
                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                </div>
            )}

            {/* Summary for Debugging/Verification */}
            <div className="text-slate-400 text-sm text-center">
                {filteredTransactions.length} işlem listeleniyor.
            </div>

            {/* Charts */}
            <div className="space-y-6">
                {/* Trend Chart */}
                <TrendChart transactions={filteredTransactions} currentBalance={currentBalance} />

                {/* Spending Distribution */}
                <SpendingCharts transactions={filteredTransactions} categories={categories} />

                {/* Cash Flow Comparison */}
                <CashFlowComparison transactions={transactions} dateFilter={dateFilter} customRange={customRange} />

                {/* Detailed Report */}
                <DetailedReport transactions={filteredTransactions} categories={categories} />
            </div>
        </div>
    );
};

export default WalletAnalysis;
