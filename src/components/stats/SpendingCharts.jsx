import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { getDateRange } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/formatters';

const SpendingCharts = ({ transactions = [], categories = [], dateFilter, customRange }) => {
    const [chartType, setChartType] = useState('pie'); // 'pie', 'bar', 'list'
    const [view, setView] = useState('main'); // 'main', 'sub'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [focusedItem, setFocusedItem] = useState(null); // Item to show in center (null = total)

    const expenseTransactions = useMemo(() => {
        return transactions.filter(t => t.type === 'expense');
    }, [transactions]);

    // Main Category Data
    const categoryData = useMemo(() => {
        const catMap = {};
        expenseTransactions.forEach(t => {
            const catName = t.category;
            const mainCat = categories.find(c => c.name === catName || c.subcategories.includes(catName));
            const key = mainCat ? mainCat.name : catName;

            if (!catMap[key]) catMap[key] = 0;
            catMap[key] += Number(t.amount);
        });

        return Object.keys(catMap)
            .map(name => ({ name, value: catMap[name] }))
            .sort((a, b) => b.value - a.value);
    }, [expenseTransactions, categories]);

    // Subcategory Data (for selected category)
    const subCategoryData = useMemo(() => {
        if (!selectedCategory) return [];

        const subMap = {};
        const relevantTransactions = expenseTransactions.filter(t => {
            const catName = t.category;
            const mainCat = categories.find(c => c.name === catName || c.subcategories.includes(catName));
            return mainCat && mainCat.name === selectedCategory.name;
        });

        relevantTransactions.forEach(t => {
            const subName = t.category;
            if (!subMap[subName]) subMap[subName] = 0;
            subMap[subName] += Number(t.amount);
        });

        return Object.keys(subMap)
            .map(name => ({ name, value: subMap[name] }))
            .sort((a, b) => b.value - a.value);
    }, [expenseTransactions, categories, selectedCategory]);

    const dailyData = useMemo(() => {
        // Use shared date utility
        const range = getDateRange(dateFilter, customRange);
        const dayMap = {};

        // Initialize all days in range with 0
        if (range) {
            let current = new Date(range.start);
            const end = new Date(range.end);

            // Safety break to prevent infinite loops if dates are invalid
            let safety = 0;
            while (current <= end && safety < 1000) {
                const dateKey = current.toLocaleDateString('tr-TR');
                dayMap[dateKey] = 0;
                current.setDate(current.getDate() + 1);
                safety++;
            }
        }

        // Fill with actual data
        expenseTransactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString('tr-TR');
            // Only add if it falls within our map (which it should if filtered correctly)
            if (dayMap.hasOwnProperty(date)) {
                dayMap[date] += Number(t.amount);
            }
        });

        return Object.keys(dayMap)
            .map(date => ({ date, amount: dayMap[date] }))
            .sort((a, b) => {
                const [d1, m1, y1] = a.date.split('.');
                const [d2, m2, y2] = b.date.split('.');
                return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
            });
    }, [expenseTransactions, dateFilter, customRange]);

    const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];

    const handleSliceClick = (data, index) => {
        if (view === 'main') {
            setSelectedCategory(data);
            setView('sub');
            setFocusedItem(null);
        } else {
            setFocusedItem(data);
        }
    };

    const handleBackClick = () => {
        setView('main');
        setSelectedCategory(null);
        setFocusedItem(null);
    };

    const activeData = view === 'main' ? categoryData : subCategoryData;
    const totalValue = activeData.reduce((sum, item) => sum + item.value, 0);

    const centerLabel = focusedItem ? focusedItem.name : (view === 'main' ? 'Toplam' : selectedCategory?.name);
    const centerValue = focusedItem ? focusedItem.value : totalValue;

    if (expenseTransactions.length === 0) {
        return (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-80 flex items-center justify-center text-slate-500">
                Bu dönemde harcama kaydı yok.
            </div>
        );
    }

    return (
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    {view === 'sub' && (
                        <button
                            onClick={handleBackClick}
                            className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <h3 className="text-lg font-semibold text-white">
                        {view === 'main' ? 'Harcama Dağılımı' : `${selectedCategory?.name} Detayı`}
                    </h3>
                </div>
                <div className="flex bg-slate-900 rounded-lg p-1">
                    <button onClick={() => setChartType('pie')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'pie' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Pasta</button>
                    <button onClick={() => setChartType('bar')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'bar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Zaman</button>
                    <button onClick={() => setChartType('list')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Liste</button>
                </div>
            </div>

            <div className="h-64 w-full" style={{ minHeight: '256px', minWidth: 0 }}>
                {chartType === 'pie' && (
                    <div className="flex h-full">
                        {/* Chart Area */}
                        <div className="relative flex-1 h-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
                                <PieChart>
                                    <Pie
                                        data={activeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        onClick={handleSliceClick}
                                        cursor="pointer"
                                    >
                                        {activeData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                stroke="rgba(0,0,0,0)"
                                                style={{ outline: 'none' }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text Overlay - Perfectly Centered */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-xs text-slate-400 font-medium mb-1">
                                    {centerLabel}
                                </div>
                                <div className="text-lg font-bold text-white">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(centerValue)}
                                </div>
                            </div>
                        </div>

                        {/* Custom Legend */}
                        <div className="w-1/3 flex flex-col justify-center pl-2 space-y-2 overflow-y-auto custom-scrollbar">
                            {activeData.map((entry, index) => (
                                <div
                                    key={`legend-${index}`}
                                    className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-700/30 p-1 rounded transition-colors"
                                    onClick={() => handleSliceClick(entry, index)}
                                >
                                    <div
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-slate-300 truncate" title={entry.name}>
                                        {entry.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {chartType === 'bar' && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => new Intl.NumberFormat('tr-TR', { notation: "compact", compactDisplay: "short" }).format(value)} />
                            <Tooltip
                                cursor={{ fill: '#334155', opacity: 0.2 }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {chartType === 'list' && (
                    <div className="h-full overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {activeData.map((cat, index) => (
                            <div
                                key={cat.name}
                                className="relative cursor-pointer hover:bg-slate-700/30 p-2 rounded-lg transition-colors"
                                onClick={() => handleSliceClick(cat, index)}
                            >
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-200 font-medium">{cat.name}</span>
                                    <span className="text-slate-400">{formatCurrency(cat.value)}</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(cat.value / activeData[0].value) * 100}%`,
                                            backgroundColor: COLORS[index % COLORS.length]
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpendingCharts;
