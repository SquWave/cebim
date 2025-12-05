import React, { useState, useMemo } from 'react';
import DateFilter from './DateFilter';
import TrendChart from './TrendChart';
import SpendingCharts from './SpendingCharts';
import CashFlowComparison from './CashFlowComparison';
import DetailedReport from './DetailedReport';
import { getDateRange, filterTransactionsByDateRange } from '../../utils/dateUtils';

const WalletAnalysis = ({ transactions = [], categories = [], accounts = [], privacyMode = false }) => {
    const [dateFilter, setDateFilter] = useState('30days');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Filter Transactions based on Date (using shared utility)
    const filteredTransactions = useMemo(() => {
        const { start, end } = getDateRange(dateFilter, customRange);
        return filterTransactionsByDateRange(transactions, start, end);
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
                <TrendChart transactions={filteredTransactions} currentBalance={currentBalance} privacyMode={privacyMode} />

                {/* Spending Distribution */}
                <SpendingCharts transactions={filteredTransactions} categories={categories} dateFilter={dateFilter} customRange={customRange} privacyMode={privacyMode} />

                {/* Cash Flow Comparison */}
                <CashFlowComparison transactions={transactions} dateFilter={dateFilter} customRange={customRange} privacyMode={privacyMode} />

                {/* Detailed Report */}
                <DetailedReport transactions={filteredTransactions} categories={categories} privacyMode={privacyMode} />
            </div>
        </div>
    );
};

export default WalletAnalysis;
