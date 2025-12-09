import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

/**
 * Spending Distribution Widget
 * Shows expense distribution by main category with drill-down for subcategories
 */
const SpendingDistributionWidget = ({ transactions = [], categories = [], privacyMode = false }) => {
    const [drilldownCategory, setDrilldownCategory] = useState(null);

    // Helper to find main category for a transaction
    const getMainCategory = (transaction) => {
        const mainCat = categories.find(c =>
            c.subcategories?.includes(transaction.category) || c.name === transaction.category
        );
        return mainCat?.name || 'Diğer';
    };

    // Get all expenses from last 30 days
    const filteredExpenses = useMemo(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return transactions.filter(t => {
            const txDate = new Date(t.date);
            return t.type === 'expense' && txDate >= thirtyDaysAgo && txDate <= today;
        });
    }, [transactions]);

    // Main category data (e.g., "Gıda & Mutfak")
    const categoryData = useMemo(() => {
        const categoryTotals = {};
        filteredExpenses.forEach(t => {
            const mainCat = getMainCategory(t);
            categoryTotals[mainCat] = (categoryTotals[mainCat] || 0) + Number(t.amount);
        });

        return Object.entries(categoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredExpenses, categories]);

    // Subcategory data (e.g., "Restoran / Kafe" within "Gıda & Mutfak")
    const subcategoryData = useMemo(() => {
        if (!drilldownCategory) return [];

        const subcategoryTotals = {};
        filteredExpenses
            .filter(t => getMainCategory(t) === drilldownCategory)
            .forEach(t => {
                // Use the actual subcategory (stored in t.category)
                const subcat = t.category || 'Diğer';
                subcategoryTotals[subcat] = (subcategoryTotals[subcat] || 0) + Number(t.amount);
            });

        return Object.entries(subcategoryTotals)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredExpenses, drilldownCategory, categories]);

    const chartData = drilldownCategory ? subcategoryData : categoryData;
    const totalExpense = chartData.reduce((sum, item) => sum + item.value, 0);

    const handleSliceClick = (data) => {
        if (!drilldownCategory) {
            setDrilldownCategory(data.name);
        }
    };

    const handleBackClick = () => {
        setDrilldownCategory(null);
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((data.value / totalExpense) * 100).toFixed(1);
            return (
                <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg shadow-lg">
                    <p className="text-white text-xs font-medium">{data.name}</p>
                    <p className="text-slate-300 text-xs">
                        {privacyMode ? '₺***' : formatCurrency(data.value)} ({percentage}%)
                    </p>
                </div>
            );
        }
        return null;
    };

    if (categoryData.length === 0) {
        return (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 h-48 flex items-center justify-center text-slate-500 text-sm">
                Harcama verisi yok
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
                {drilldownCategory && (
                    <button
                        onClick={handleBackClick}
                        className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-400" />
                    </button>
                )}
                <h3 className="text-sm font-semibold text-white">
                    {drilldownCategory ? drilldownCategory : 'Harcama Dağılımı'}
                </h3>
            </div>

            <div className="flex items-center gap-4">
                <div style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={2}
                                dataKey="value"
                                onClick={handleSliceClick}
                                style={{ cursor: drilldownCategory ? 'default' : 'pointer' }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-1">
                    {chartData.slice(0, 5).map((item, index) => (
                        <div
                            key={item.name}
                            className={`flex items-center justify-between text-xs ${!drilldownCategory ? 'cursor-pointer hover:bg-slate-800/50 -mx-1 px-1 py-0.5 rounded' : ''}`}
                            onClick={() => !drilldownCategory && setDrilldownCategory(item.name)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-slate-300 truncate max-w-[80px]">{item.name}</span>
                            </div>
                            <span className="text-slate-400">
                                {privacyMode ? '***' : formatCurrency(item.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SpendingDistributionWidget;
