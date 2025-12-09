import React, { useState } from 'react';
import { Wallet, PieChart, LayoutGrid } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useWidgetPreferences } from '../hooks/useWidgetPreferences';
import WidgetSelector from './dashboard/WidgetSelector';

// Widget Components
import MarketRatesWidget from './dashboard/widgets/MarketRatesWidget';
import BalanceTrendWidget from './dashboard/widgets/BalanceTrendWidget';
import CashFlowWidget from './dashboard/widgets/CashFlowWidget';
import SpendingDistributionWidget from './dashboard/widgets/SpendingDistributionWidget';
import AssetAllocationWidget from './dashboard/widgets/AssetAllocationWidget';
import QuickTransactionWidget from './dashboard/widgets/QuickTransactionWidget';

const Dashboard = ({
    transactions,
    assets,
    accounts = [],
    categories = [],
    marketData,
    onAddTransaction,
    privacyMode = false
}) => {
    const [showWidgetSelector, setShowWidgetSelector] = useState(false);
    const { enabledWidgets, loading: widgetsLoading, toggleWidget, setWidgets } = useWidgetPreferences();

    // Helper to mask values in privacy mode
    const displayValue = (value, prefix = '') => {
        if (privacyMode) return `${prefix}₺***`;
        return `${prefix}${formatCurrency(value)}`;
    };

    // Calculate Net Worth
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + (Number(acc.initialBalance) || 0), 0);

    const totalCash = transactions.reduce((acc, curr) => {
        if (curr.type === 'income') return acc + Number(curr.amount);
        if (curr.type === 'expense') return acc - Number(curr.amount);
        return acc;
    }, totalInitialBalance);

    const totalPortfolio = assets.reduce((acc, curr) => {
        const livePrice = marketData?.getPrice ? marketData.getPrice(curr) : 0;

        if (curr.lots) {
            const totalPurchasedAmount = curr.lots.reduce((sum, lot) => sum + Number(lot.amount), 0);
            const totalSoldAmount = (curr.sales || []).reduce((sum, sale) => sum + Number(sale.amount), 0);
            const currentAmount = totalPurchasedAmount - totalSoldAmount;
            const priceToUse = livePrice > 0 ? livePrice : (curr.lots[0]?.price || 0);
            return acc + (currentAmount * priceToUse);
        } else {
            const priceToUse = livePrice > 0 ? livePrice : (Number(curr.price) || 0);
            return acc + (Number(curr.amount) * priceToUse);
        }
    }, 0);

    const netWorth = totalCash + totalPortfolio;

    // Get market rates for widget
    const rates = marketData ? {
        USD: marketData.USD,
        EUR: marketData.EUR,
        GOLD: marketData.GOLD
    } : null;

    // Render a widget by ID
    const renderWidget = (widgetId) => {
        switch (widgetId) {
            case 'market_rates':
                return <MarketRatesWidget key={widgetId} rates={rates} />;
            case 'balance_trend':
                return <BalanceTrendWidget key={widgetId} transactions={transactions} currentBalance={totalCash} privacyMode={privacyMode} />;
            case 'cash_flow':
                return <CashFlowWidget key={widgetId} transactions={transactions} privacyMode={privacyMode} />;
            case 'spending_distribution':
                return <SpendingDistributionWidget key={widgetId} transactions={transactions} categories={categories} privacyMode={privacyMode} />;
            case 'asset_allocation':
                return <AssetAllocationWidget key={widgetId} assets={assets} marketData={marketData} privacyMode={privacyMode} />;
            case 'quick_transaction':
                return <QuickTransactionWidget key={widgetId} transactions={transactions} accounts={accounts} categories={categories} onAddTransaction={onAddTransaction} privacyMode={privacyMode} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h2 className="text-slate-400 text-sm font-medium mb-1">Toplam Varlık</h2>
                <div className="text-3xl font-bold text-white">
                    {displayValue(netWorth)}
                </div>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">Cüzdan</div>
                            <div className="text-sm font-semibold text-slate-200">
                                {displayValue(totalCash)}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                            <PieChart className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">Yatırım</div>
                            <div className="text-sm font-semibold text-slate-200">
                                {displayValue(totalPortfolio)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Widget Section */}
            <div className="space-y-4">
                {/* Add Widget Button */}
                <button
                    onClick={() => setShowWidgetSelector(true)}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-sm">Widget Ekle / Düzenle</span>
                </button>

                {/* Enabled Widgets */}
                {widgetsLoading ? (
                    <div className="text-center text-slate-500 py-4">
                        Widget'lar yükleniyor...
                    </div>
                ) : (
                    enabledWidgets.map(widgetId => renderWidget(widgetId))
                )}
            </div>

            {/* Widget Selector Modal */}
            <WidgetSelector
                isOpen={showWidgetSelector}
                onClose={() => setShowWidgetSelector(false)}
                enabledWidgets={enabledWidgets}
                onToggleWidget={toggleWidget}
                onReorderWidgets={setWidgets}
            />
        </div>
    );
};

export default Dashboard;
