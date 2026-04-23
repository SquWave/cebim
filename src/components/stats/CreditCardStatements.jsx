import React, { useMemo, useState } from 'react';
import { CreditCard, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const CreditCardStatements = ({ transactions = [], accounts = [], privacyMode = false }) => {
    const [expandedCard, setExpandedCard] = useState(null);

    const creditCards = accounts.filter(a => a.type === 'credit_card');

    // Find the period that contains a given date
    const getPeriodStartForDate = (date, statementDay) => {
        const d = new Date(date);
        const day = parseInt(statementDay) || 1;
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const actualDay = Math.min(day, lastDay);

        if (d.getDate() < actualDay) {
            // We're before the statement day, so period started last month
            const pm = d.getMonth() === 0 ? 11 : d.getMonth() - 1;
            const py = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
            const prevLastDay = new Date(py, pm + 1, 0).getDate();
            return new Date(py, pm, Math.min(day, prevLastDay), 0, 0, 0, 0);
        }
        return new Date(d.getFullYear(), d.getMonth(), actualDay, 0, 0, 0, 0);
    };

    // Get the end date for a period that starts on periodStart
    const getPeriodEnd = (periodStart, statementDay) => {
        const day = parseInt(statementDay) || 1;
        let endMonth = periodStart.getMonth() + 1;
        let endYear = periodStart.getFullYear();
        if (endMonth > 11) { endMonth -= 12; endYear++; }
        const lastDayOfEndMonth = new Date(endYear, endMonth + 1, 0).getDate();
        const actualEndDay = Math.min(day, lastDayOfEndMonth);
        const periodEnd = new Date(endYear, endMonth, actualEndDay, 0, 0, 0, 0);
        periodEnd.setMilliseconds(-1);
        return periodEnd;
    };

    // Move a period start forward or backward by N months
    const shiftPeriod = (periodStart, monthDelta, statementDay) => {
        const day = parseInt(statementDay) || 1;
        let newMonth = periodStart.getMonth() + monthDelta;
        let newYear = periodStart.getFullYear();
        while (newMonth < 0) { newMonth += 12; newYear--; }
        while (newMonth > 11) { newMonth -= 12; newYear++; }
        const lastDay = new Date(newYear, newMonth + 1, 0).getDate();
        return new Date(newYear, newMonth, Math.min(day, lastDay), 0, 0, 0, 0);
    };

    // Get installment contribution for a period
    const getInstallmentContribution = (tx, periodStart, statementDay) => {
        const iCount = Number(tx.installmentCount) || 1;
        if (iCount <= 1) return 0;

        const perInstallment = Number(tx.installmentAmount) || (Number(tx.amount) / iCount);
        const txPeriodStart = getPeriodStartForDate(tx.date, statementDay);

        // How many periods between the tx period and this period?
        const monthsDiff = (periodStart.getFullYear() - txPeriodStart.getFullYear()) * 12 +
                          (periodStart.getMonth() - txPeriodStart.getMonth());

        if (monthsDiff < 0 || monthsDiff >= iCount) return 0;
        return perInstallment;
    };

    // Find how many future periods we need for installments
    const getMaxFuturePeriods = (cardTxs, currentPeriodStart, statementDay) => {
        let maxFuture = 0;
        cardTxs.forEach(t => {
            const iCount = Number(t.installmentCount) || 1;
            if (iCount <= 1) return;

            const txPeriodStart = getPeriodStartForDate(t.date, statementDay);
            const monthsSinceTx = (currentPeriodStart.getFullYear() - txPeriodStart.getFullYear()) * 12 +
                                  (currentPeriodStart.getMonth() - txPeriodStart.getMonth());
            const remainingInstallments = iCount - monthsSinceTx - 1; // -1 for current period
            if (remainingInstallments > maxFuture) maxFuture = remainingInstallments;
        });
        return maxFuture;
    };

    // Build period data
    const cardData = useMemo(() => {
        const result = {};
        const today = new Date();

        creditCards.forEach(card => {
            const statementDay = parseInt(card.statementDay) || 1;
            const limit = Number(card.creditLimit) || 0;
            const cardTxs = transactions.filter(t => t.accountId === card.id && t.type === 'expense');

            // Current period (the one containing today)
            const currentPeriodStart = getPeriodStartForDate(today, statementDay);

            // How many future periods needed for installments
            const futurePeriodCount = getMaxFuturePeriods(cardTxs, currentPeriodStart, statementDay);

            // Build all periods: future + current + 12 past
            const allPeriods = [];

            // Future periods (for installments)
            for (let i = futurePeriodCount; i >= 1; i--) {
                const pStart = shiftPeriod(currentPeriodStart, i, statementDay);
                const pEnd = getPeriodEnd(pStart, statementDay);
                allPeriods.push({ start: pStart, end: pEnd, type: 'future' });
            }

            // Current period
            const currentEnd = getPeriodEnd(currentPeriodStart, statementDay);
            allPeriods.push({ start: currentPeriodStart, end: currentEnd, type: 'current' });

            // Past periods (up to 12)
            for (let i = 1; i <= 12; i++) {
                const pStart = shiftPeriod(currentPeriodStart, -i, statementDay);
                const pEnd = getPeriodEnd(pStart, statementDay);
                allPeriods.push({ start: pStart, end: pEnd, type: 'past' });
            }

            // Calculate amounts for each period
            const periodData = allPeriods.map(period => {
                // Single-payment expenses in this period
                const singleTotal = cardTxs
                    .filter(t => {
                        const td = new Date(t.date);
                        return (Number(t.installmentCount) || 1) <= 1 && td >= period.start && td <= period.end;
                    })
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                // Installment contributions
                const installmentTotal = cardTxs
                    .filter(t => (Number(t.installmentCount) || 1) > 1)
                    .reduce((sum, t) => sum + getInstallmentContribution(t, period.start, statementDay), 0);

                // Incomes (refunds) in this period
                const periodIncome = transactions
                    .filter(t => t.accountId === card.id && t.type === 'income')
                    .filter(t => {
                        const td = new Date(t.date);
                        return td >= period.start && td <= period.end;
                    })
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                // Transactions originating in this period
                const originTxCount = cardTxs.filter(t => {
                    const td = new Date(t.date);
                    return td >= period.start && td <= period.end;
                }).length;

                const incomeTxCount = transactions
                    .filter(t => t.accountId === card.id && t.type === 'income')
                    .filter(t => {
                        const td = new Date(t.date);
                        return td >= period.start && td <= period.end;
                    }).length;

                const total = Math.round((singleTotal + installmentTotal - periodIncome) * 100) / 100;

                const startStr = period.start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                const endStr = period.end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });

                return {
                    ...period,
                    label: `${startStr} – ${endStr}`,
                    total,
                    singleTotal: Math.round(singleTotal * 100) / 100,
                    installmentTotal: Math.round(installmentTotal * 100) / 100,
                    incomeTotal: Math.round(periodIncome * 100) / 100,
                    txCount: originTxCount + incomeTxCount,
                    isCurrent: period.type === 'current',
                    isFuture: period.type === 'future'
                };
            });

            // Filter: keep current + future with amounts + past with amounts + 2 empty past for context
            const filtered = [];
            let emptyPastCount = 0;
            periodData.forEach(p => {
                if (p.isCurrent || p.isFuture) {
                    filtered.push(p);
                } else if (p.total > 0) {
                    filtered.push(p);
                    emptyPastCount = 0; // reset after a filled period
                } else {
                    emptyPastCount++;
                    if (emptyPastCount <= 2) filtered.push(p);
                }
            });

            // Average spending (past only, non-zero)
            const pastTotals = periodData.filter(p => p.type === 'past' && p.total > 0).map(p => p.total);
            const avgSpending = pastTotals.length > 0 ? pastTotals.reduce((a, b) => a + b, 0) / pastTotals.length : 0;

            result[card.id] = { periods: filtered, avgSpending, limit };
        });

        return result;
    }, [creditCards, transactions]);

    if (creditCards.length === 0) return null;

    const getTrendIcon = (current, avg) => {
        if (avg === 0 || current === 0) return <Minus className="w-3 h-3 text-slate-500" />;
        if (current > avg * 1.1) return <TrendingUp className="w-3 h-3 text-rose-400" />;
        if (current < avg * 0.9) return <TrendingDown className="w-3 h-3 text-emerald-400" />;
        return <Minus className="w-3 h-3 text-slate-500" />;
    };

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Kart Ekstreleri</h3>
            </div>

            <div className="divide-y divide-slate-700">
                {creditCards.map(card => {
                    const data = cardData[card.id];
                    if (!data) return null;
                    const { periods, avgSpending, limit } = data;
                    const isExpanded = expandedCard === card.id;
                    const currentPeriod = periods.find(p => p.isCurrent);

                    return (
                        <div key={card.id}>
                            <button
                                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                        : <ChevronRight className="w-4 h-4 text-slate-400" />
                                    }
                                    <div className="text-left">
                                        <div className="font-medium text-white">{card.name}</div>
                                        <div className="text-[11px] text-slate-500">
                                            Limit: {privacyMode ? '₺***' : formatCurrency(limit)} • Kesim: {card.statementDay}. gün
                                        </div>
                                    </div>
                                </div>
                                {currentPeriod && (
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-purple-400">
                                            {privacyMode ? '₺***' : formatCurrency(currentPeriod.total)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">bu dönem</div>
                                    </div>
                                )}
                            </button>

                            {isExpanded && (
                                <div className="bg-slate-900/30 border-t border-slate-700">
                                    {avgSpending > 0 && (
                                        <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-500">Ortalama dönem harcaması</span>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {privacyMode ? '₺***' : formatCurrency(avgSpending)}
                                            </span>
                                        </div>
                                    )}

                                    {periods.map((period, idx) => {
                                        const barWidth = limit > 0 ? Math.min((period.total / limit) * 100, 100) : 0;

                                        return (
                                            <div
                                                key={idx}
                                                className={`relative py-3 px-4 pl-8 border-b border-slate-700/50 last:border-0 ${
                                                    period.isCurrent ? 'bg-purple-500/5' :
                                                    period.isFuture ? 'bg-blue-500/5' : ''
                                                }`}
                                            >
                                                <div
                                                    className={`absolute left-0 top-0 bottom-0 opacity-[0.04] ${
                                                        period.isCurrent ? 'bg-purple-400' :
                                                        period.isFuture ? 'bg-blue-400' : 'bg-slate-400'
                                                    }`}
                                                    style={{ width: `${barWidth}%` }}
                                                />

                                                <div className="relative flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {period.isCurrent && (
                                                                <span className="text-[9px] font-bold text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">GÜNCEL</span>
                                                            )}
                                                            {period.isFuture && (
                                                                <span className="text-[9px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">GELECEK</span>
                                                            )}
                                                            <span className={`text-sm ${
                                                                period.isCurrent ? 'text-purple-300 font-medium' :
                                                                period.isFuture ? 'text-blue-300 font-medium' : 'text-slate-300'
                                                            }`}>
                                                                {period.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-500">
                                                                {period.txCount > 0 ? `${period.txCount} işlem` : 'İşlem yok'}
                                                            </span>
                                                            {period.installmentTotal > 0 && (
                                                                <span className="text-[10px] text-purple-400/70">
                                                                    • Taksit: {privacyMode ? '₺***' : formatCurrency(period.installmentTotal)}
                                                                </span>
                                                            )}
                                                            {period.incomeTotal > 0 && (
                                                                <span className="text-[10px] text-emerald-400/70">
                                                                    • İade/Gelir: {privacyMode ? '₺***' : formatCurrency(period.incomeTotal)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!period.isCurrent && !period.isFuture && getTrendIcon(period.total, avgSpending)}
                                                        <span className={`text-sm font-semibold ${
                                                            period.total === 0 ? 'text-slate-600' :
                                                            period.isCurrent ? 'text-purple-400' :
                                                            period.isFuture ? 'text-blue-400' : 'text-slate-300'
                                                        }`}>
                                                            {period.total === 0 ? '–' : (privacyMode ? '₺***' : formatCurrency(period.total))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CreditCardStatements;
