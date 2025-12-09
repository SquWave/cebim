import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Handshake } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Cash Flow Widget
 * Shows net balance, total income, and total expense for last 30 days
 */
const CashFlowWidget = ({ transactions = [], privacyMode = false }) => {
    const { income, expense, net } = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= thirtyDaysAgo && txDate <= today;
        });

        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            income: totalIncome,
            expense: totalExpense,
            net: totalIncome - totalExpense
        };
    }, [transactions]);

    const displayValue = (value, prefix = '') => {
        if (privacyMode) return `${prefix}₺***`;
        return `${prefix}${formatCurrency(value)}`;
    };

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-3">Nakit Akışı</h3>

            <div className="grid grid-cols-3 gap-3">
                {/* Net Balance */}
                <div className="text-center">
                    <div className={`inline-flex p-2 rounded-lg mb-2 ${net >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                        <Handshake className={`w-4 h-4 ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                    </div>
                    <div className="text-xs text-slate-400 mb-1">Net</div>
                    <div className={`text-sm font-bold ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {displayValue(net, net >= 0 ? '+' : '')}
                    </div>
                </div>

                {/* Income */}
                <div className="text-center">
                    <div className="inline-flex p-2 bg-emerald-500/20 rounded-lg mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-400 mb-1">Gelir</div>
                    <div className="text-sm font-bold text-emerald-400">
                        {displayValue(income, '+')}
                    </div>
                </div>

                {/* Expense */}
                <div className="text-center">
                    <div className="inline-flex p-2 bg-rose-500/20 rounded-lg mb-2">
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-xs text-slate-400 mb-1">Gider</div>
                    <div className="text-sm font-bold text-rose-400">
                        {displayValue(expense, '-')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashFlowWidget;
