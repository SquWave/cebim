import React, { useMemo, useState } from 'react';
import { CreditCard, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const getPeriodForDate = (date, statementDay) => {
    const d = new Date(date);
    const day = parseInt(statementDay) || 1;
    const m = d.getMonth();
    const y = d.getFullYear();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const actualDay = Math.min(day, lastDay);

    if (d.getDate() <= actualDay) {
        return { month: m, year: y };
    } else {
        let nextM = m + 1;
        let nextY = y;
        if (nextM > 11) { nextM = 0; nextY++; }
        return { month: nextM, year: nextY };
    }
};

const getPeriodBounds = (periodDef, statementDay) => {
    const day = parseInt(statementDay) || 1;
    const { month, year } = periodDef;

    const endLastDay = new Date(year, month + 1, 0).getDate();
    const endTargetDay = Math.min(day, endLastDay);
    const end = new Date(year, month, endTargetDay, 23, 59, 59, 999);

    let startMonth = month - 1;
    let startYear = year;
    if (startMonth < 0) { startMonth = 11; startYear--; }
    
    const startLastDay = new Date(startYear, startMonth + 1, 0).getDate();
    const startTargetDay = Math.min(day, startLastDay);
    const start = new Date(startYear, startMonth, startTargetDay + 1, 0, 0, 0, 0);

    return { start, end };
};

const CreditCardStatementsWidget = ({ transactions = [], accounts = [], privacyMode = false }) => {
    const [expandedCard, setExpandedCard] = useState(null);

    const creditCards = accounts.filter(a => a.type === 'credit_card');

    const getPeriodStartForDate = (date, statementDay) => {
        const periodDef = getPeriodForDate(date, statementDay);
        return getPeriodBounds(periodDef, statementDay).start;
    };

    const getPeriodEnd = (periodStart, statementDay) => {
        const d = new Date(periodStart);
        d.setDate(d.getDate() + 5);
        const periodDef = getPeriodForDate(d, statementDay);
        return getPeriodBounds(periodDef, statementDay).end;
    };

    const shiftPeriod = (periodStart, monthDelta, statementDay) => {
        const d = new Date(periodStart);
        d.setDate(d.getDate() + 5);
        const periodDef = getPeriodForDate(d, statementDay);
        
        let newMonth = periodDef.month + monthDelta;
        let newYear = periodDef.year;
        while (newMonth < 0) { newMonth += 12; newYear--; }
        while (newMonth > 11) { newMonth -= 12; newYear++; }
        
        return getPeriodBounds({ month: newMonth, year: newYear }, statementDay).start;
    };

    const getInstallmentContribution = (tx, periodStart, statementDay) => {
        const iCount = Number(tx.installmentCount) || 1;
        if (iCount <= 1) return 0;
        const perInstallment = Number(tx.installmentAmount) || (Number(tx.amount) / iCount);
        
        const txPeriodDef = getPeriodForDate(tx.date, statementDay);
        
        const d = new Date(periodStart);
        d.setDate(d.getDate() + 5);
        const currentPeriodDef = getPeriodForDate(d, statementDay);
        
        const monthsDiff = (currentPeriodDef.year - txPeriodDef.year) * 12 +
                         (currentPeriodDef.month - txPeriodDef.month);
        
        if (monthsDiff < 0 || monthsDiff >= iCount) return 0;
        return perInstallment;
    };

    const cardData = useMemo(() => {
        const result = {};
        const today = new Date();

        creditCards.forEach(card => {
            const statementDay = parseInt(card.statementDay) || 1;
            const limit = Number(card.creditLimit) || 0;
            const cardTxs = transactions.filter(t => t.accountId === card.id && t.type === 'expense');
            const currentPeriodStart = getPeriodStartForDate(today, statementDay);
            const currentPeriodEnd = getPeriodEnd(currentPeriodStart, statementDay);

            // Current period calculation
            const singleTotal = cardTxs
                .filter(t => {
                    const td = new Date(t.date);
                    return (Number(t.installmentCount) || 1) <= 1 && td >= currentPeriodStart && td <= currentPeriodEnd;
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const installmentTotal = cardTxs
                .filter(t => (Number(t.installmentCount) || 1) > 1)
                .reduce((sum, t) => sum + getInstallmentContribution(t, currentPeriodStart, statementDay), 0);

            const currentIncome = transactions
                .filter(t => t.accountId === card.id && t.type === 'income')
                .filter(t => {
                    const td = new Date(t.date);
                    return td >= currentPeriodStart && td <= currentPeriodEnd;
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const currentTotal = Math.round((singleTotal + installmentTotal - currentIncome) * 100) / 100;

            // Previous period for comparison
            const prevStart = shiftPeriod(currentPeriodStart, -1, statementDay);
            const prevEnd = getPeriodEnd(prevStart, statementDay);
            const prevSingle = cardTxs
                .filter(t => {
                    const td = new Date(t.date);
                    return (Number(t.installmentCount) || 1) <= 1 && td >= prevStart && td <= prevEnd;
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);
            const prevInstallment = cardTxs
                .filter(t => (Number(t.installmentCount) || 1) > 1)
                .reduce((sum, t) => sum + getInstallmentContribution(t, prevStart, statementDay), 0);
            
            const prevIncome = transactions
                .filter(t => t.accountId === card.id && t.type === 'income')
                .filter(t => {
                    const td = new Date(t.date);
                    return td >= prevStart && td <= prevEnd;
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const prevTotal = Math.round((prevSingle + prevInstallment - prevIncome) * 100) / 100;

            const startStr = currentPeriodStart.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
            const endStr = currentPeriodEnd.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

            // Calculate available limit (limit - remaining installment debt - current period single payments + current period income)
            let totalRemainingDebt = 0;
            let currentPeriodIncome = 0; // Bu dönem gelen iadeler limit açsın
            
            // Re-filter incomes for the current period specifically
            transactions.filter(t => t.accountId === card.id && t.type === 'income').forEach(t => {
                const td = new Date(t.date);
                // İadeler sadece güncel hesaptaysa limiti geri getirir
                if (td >= currentPeriodStart && td <= currentPeriodEnd) {
                    currentPeriodIncome += Number(t.amount);
                }
            });

            cardTxs.filter(t => (Number(t.installmentCount) || 1) > 1).forEach(t => {
                const iCount = Number(t.installmentCount) || 1;
                const totalAmt = Number(t.totalWithInterest) || Number(t.amount);
                const perInst = Number(t.installmentAmount) || (totalAmt / iCount);
                
                const txPeriodDef = getPeriodForDate(t.date, statementDay);
                const d = new Date(currentPeriodStart);
                d.setDate(d.getDate() + 5);
                const currentPeriodDef = getPeriodForDate(d, statementDay);
                
                const paidMonths = (currentPeriodDef.year - txPeriodDef.year) * 12 + 
                                 (currentPeriodDef.month - txPeriodDef.month);
                const paid = Math.min(Math.max(paidMonths, 0), iCount);
                totalRemainingDebt += Math.max(totalAmt - (paid * perInst), 0);
            });

            const availableLimit = limit - totalRemainingDebt - singleTotal + currentPeriodIncome;

            result[card.id] = {
                currentTotal,
                prevTotal,
                limit,
                availableLimit: Math.round(availableLimit * 100) / 100,
                periodLabel: `${startStr} – ${endStr}`,
                utilizationPercent: limit > 0 ? Math.round(((limit - availableLimit) / limit) * 100) : 0,
                txCount: cardTxs.filter(t => {
                    const td = new Date(t.date);
                    return td >= currentPeriodStart && td <= currentPeriodEnd;
                }).length
            };
        });

        return result;
    }, [creditCards, transactions]);

    if (creditCards.length === 0) return null;

    const displayValue = (val) => privacyMode ? '₺***' : formatCurrency(val);

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">Kart Ekstreleri</h3>
            </div>

            <div className="divide-y divide-slate-700/50">
                {creditCards.map(card => {
                    const data = cardData[card.id];
                    if (!data) return null;
                    const isExpanded = expandedCard === card.id;
                    const changePercent = data.prevTotal > 0
                        ? Math.round(((data.currentTotal - data.prevTotal) / data.prevTotal) * 100)
                        : 0;

                    return (
                        <div key={card.id} className="p-4">
                            <button
                                onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                                className="w-full text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isExpanded
                                            ? <ChevronDown className="w-4 h-4 text-slate-500" />
                                            : <ChevronRight className="w-4 h-4 text-slate-500" />
                                        }
                                        <span className="font-medium text-white text-sm">{card.name}</span>
                                    </div>
                                    <span className="text-lg font-bold text-purple-400">
                                        {displayValue(data.currentTotal)}
                                    </span>
                                </div>
                            </button>

                            {/* Always visible: progress bar */}
                            <div className="mt-2 ml-6">
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                    <span>{data.periodLabel}</span>
                                    <span>{data.utilizationPercent}% kullanım</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            data.utilizationPercent > 80 ? 'bg-rose-500' :
                                            data.utilizationPercent > 50 ? 'bg-amber-500' : 'bg-purple-500'
                                        }`}
                                        style={{ width: `${Math.min(data.utilizationPercent, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div className="mt-3 ml-6 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Bu dönem işlem</span>
                                        <span className="text-slate-300">{data.txCount} işlem</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Kullanılabilir limit</span>
                                        <span className="text-slate-300">{displayValue(data.availableLimit)}</span>
                                    </div>
                                    {data.prevTotal > 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Önceki dönem</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-slate-300">{displayValue(data.prevTotal)}</span>
                                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                                    changePercent > 0 ? 'text-rose-400 bg-rose-500/10' :
                                                    changePercent < 0 ? 'text-emerald-400 bg-emerald-500/10' :
                                                    'text-slate-400 bg-slate-700'
                                                }`}>
                                                    {changePercent > 0 ? '+' : ''}{changePercent}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CreditCardStatementsWidget;
