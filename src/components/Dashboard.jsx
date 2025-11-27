import React from 'react';
import { Wallet, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const Dashboard = ({ transactions, assets, accounts = [] }) => {
    // Calculate Net Worth
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + (Number(acc.initialBalance) || 0), 0);

    const totalCash = transactions.reduce((acc, curr) => {
        if (curr.type === 'income') return acc + Number(curr.amount);
        if (curr.type === 'expense') return acc - Number(curr.amount);
        return acc; // Transfers don't affect total net cash
    }, totalInitialBalance);

    const totalPortfolio = assets.reduce((acc, curr) => {
        // Support both old flat structure and new lot structure
        if (curr.lots) {
            // Lot-based: sum all lots' values minus sales
            const totalPurchasedValue = curr.lots.reduce((sum, lot) => {
                return sum + (Number(lot.amount) * Number(lot.price));
            }, 0);

            const currentPrice = curr.lots[0]?.price || 0;
            const totalSoldAmount = (curr.sales || []).reduce((sum, sale) => sum + Number(sale.amount), 0);
            const soldValue = totalSoldAmount * currentPrice;

            return acc + (totalPurchasedValue - soldValue);
        } else {
            // Legacy flat structure
            return acc + (Number(curr.amount) * Number(curr.price));
        }
    }, 0);

    const netWorth = totalCash + totalPortfolio;

    // Calculate Monthly Summary (Simple version: all time for now, can filter by month later)
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h2 className="text-slate-400 text-sm font-medium mb-1">Toplam Varlık</h2>
                <div className="text-3xl font-bold text-white">
                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(netWorth)}
                </div>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">Nakit</div>
                            <div className="text-sm font-semibold text-slate-200">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalCash)}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">Yatırım</div>
                            <div className="text-sm font-semibold text-slate-200">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalPortfolio)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-slate-400">Gelir</span>
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                        +{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalIncome)}
                    </div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                        <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                        <span className="text-sm text-slate-400">Gider</span>
                    </div>
                    <div className="text-lg font-bold text-rose-400">
                        -{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalExpense)}
                    </div>
                </div>
            </div>

            {/* Asset Allocation (Simple List) */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Varlık Dağılımı</h3>
                <div className="space-y-3">
                    {assets.length === 0 ? (
                        <div className="text-slate-500 text-center py-4 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
                            Henüz varlık eklenmedi.
                        </div>
                    ) : (
                        assets.map((asset) => {
                            let displayAmount = 0;
                            let displayValue = 0;
                            let currentPrice = 0;

                            if (asset.lots) {
                                const totalPurchased = asset.lots.reduce((sum, lot) => sum + Number(lot.amount), 0);
                                const totalSold = (asset.sales || []).reduce((sum, sale) => sum + Number(sale.amount), 0);
                                displayAmount = totalPurchased - totalSold;
                                currentPrice = asset.lots[0]?.price || 0;
                                displayValue = displayAmount * currentPrice;
                            } else {
                                displayAmount = Number(asset.amount);
                                currentPrice = Number(asset.price);
                                displayValue = displayAmount * currentPrice;
                            }

                            return (
                                <div key={asset.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                                    <div>
                                        <div className="font-medium text-white">{asset.name}</div>
                                        <div className="text-xs text-slate-400">{displayAmount} Adet</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-slate-200">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(displayValue)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(currentPrice)} / adet
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
