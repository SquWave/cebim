import React, { useState, useMemo } from 'react';
import DateFilter from './DateFilter';
import TrendChart from './TrendChart';
import SpendingCharts from './SpendingCharts';
import CashFlowComparison from './CashFlowComparison';
import DetailedReport from './DetailedReport';
import CreditCardStatements from './CreditCardStatements';
import { getDateRange, filterTransactionsByDateRange } from '../../utils/dateUtils';

const WalletAnalysis = ({ transactions = [], categories = [], accounts = [], privacyMode = false }) => {
    const [dateFilter, setDateFilter] = useState('30days');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // Filter Transactions based on Date (using shared utility)
    const filteredTransactions = useMemo(() => {
        const { start, end } = getDateRange(dateFilter, customRange);
        return filterTransactionsByDateRange(transactions, start, end);
    }, [transactions, dateFilter, customRange]);

    // Calculate Global Current Balance (Cash only)
    const currentBalance = useMemo(() => {
        let total = accounts
            .filter(acc => acc.type !== 'credit_card')
            .reduce((sum, acc) => sum + (Number(acc.initialBalance) || 0), 0);
            
        transactions.forEach(t => {
            const isFromCC = t.accountId && accounts.find(a => a.id === t.accountId)?.type === 'credit_card';
            const isToCC = t.toAccountId && accounts.find(a => a.id === t.toAccountId)?.type === 'credit_card';

            if (t.type === 'income' && !isFromCC) total += Number(t.amount);
            else if (t.type === 'expense' && !isFromCC) total -= Number(t.amount);
            else if (t.type === 'transfer') {
                if (!isFromCC && isToCC) total -= Number(t.amount); // Nakitten kredi kartı ödemesi
                else if (isFromCC && !isToCC) total += Number(t.amount); // Kredi kartından nakite aktarım
            }
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
                <TrendChart transactions={filteredTransactions} accounts={accounts} currentBalance={currentBalance} privacyMode={privacyMode} />

                {/* Spending Distribution */}
                <SpendingCharts transactions={filteredTransactions} categories={categories} dateFilter={dateFilter} customRange={customRange} privacyMode={privacyMode} />

                {/* Cash Flow Comparison */}
                <CashFlowComparison transactions={transactions} dateFilter={dateFilter} customRange={customRange} privacyMode={privacyMode} />

                {/* Detailed Report */}
                <DetailedReport transactions={filteredTransactions} categories={categories} privacyMode={privacyMode} />

                {/* Credit Card Statements */}
                <CreditCardStatements transactions={transactions} accounts={accounts} privacyMode={privacyMode} />
            </div>
        </div>
    );
};

export default WalletAnalysis;
