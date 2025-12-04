import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Wallet } from 'lucide-react';

const DetailedReport = ({ transactions = [], categories = [] }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedSubcategory, setExpandedSubcategory] = useState(null);
    const [reportType, setReportType] = useState('expense'); // 'expense' | 'income'

    const data = useMemo(() => {
        const filteredTx = transactions.filter(t => t.type === reportType);
        const catMap = {};

        filteredTx.forEach(t => {
            const catName = t.category;
            const mainCat = categories.find(c => c.name === catName || c.subcategories.includes(catName));

            if (mainCat) {
                if (!catMap[mainCat.id]) {
                    catMap[mainCat.id] = {
                        ...mainCat,
                        total: 0,
                        subcategoriesData: {}
                    };
                }

                catMap[mainCat.id].total += Number(t.amount);

                // Determine subcategory name (if it's a main category selection, use 'Genel')
                const subName = mainCat.subcategories.includes(catName) ? catName : 'Genel';

                if (!catMap[mainCat.id].subcategoriesData[subName]) {
                    catMap[mainCat.id].subcategoriesData[subName] = {
                        name: subName,
                        total: 0,
                        transactions: []
                    };
                }

                catMap[mainCat.id].subcategoriesData[subName].total += Number(t.amount);
                catMap[mainCat.id].subcategoriesData[subName].transactions.push(t);
            } else {
                // Handle uncategorized or legacy categories
                if (!catMap['uncategorized']) {
                    catMap['uncategorized'] = {
                        id: 'uncategorized',
                        name: 'Diğer / Kategorisiz',
                        icon: 'Wallet',
                        total: 0,
                        subcategoriesData: {
                            'Genel': { name: 'Genel', total: 0, transactions: [] }
                        }
                    };
                }
                catMap['uncategorized'].total += Number(t.amount);
                catMap['uncategorized'].subcategoriesData['Genel'].total += Number(t.amount);
                catMap['uncategorized'].subcategoriesData['Genel'].transactions.push(t);
            }
        });

        return Object.values(catMap).sort((a, b) => b.total - a.total);
    }, [transactions, categories, reportType]);

    const toggleCategory = (id) => {
        setExpandedCategory(expandedCategory === id ? null : id);
        setExpandedSubcategory(null); // Reset sub expansion
    };

    const toggleSubcategory = (name) => {
        setExpandedSubcategory(expandedSubcategory === name ? null : name);
    };

    if (data.length === 0 && transactions.length > 0) {
        // Show empty state if transactions exist but none match filter
    }

    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Detaylı Rapor</h3>
                <div className="flex bg-slate-900/50 p-1 rounded-lg">
                    <button
                        onClick={() => setReportType('expense')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'expense'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Giderler
                    </button>
                    <button
                        onClick={() => setReportType('income')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'income'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Gelirler
                    </button>
                </div>
            </div>

            <div className="divide-y divide-slate-700">
                {data.length > 0 ? (
                    data.map(cat => (
                        <div key={cat.id} className="bg-slate-800/50">
                            {/* Level 1: Main Category */}
                            <button
                                onClick={() => toggleCategory(cat.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    {expandedCategory === cat.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                    <span className="font-medium text-white">{cat.name}</span>
                                </div>
                                <span className="font-semibold text-white">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(cat.total)}
                                </span>
                            </button>

                            {/* Level 2: Subcategories */}
                            {expandedCategory === cat.id && (
                                <div className="bg-slate-900/30 border-t border-slate-700">
                                    {Object.values(cat.subcategoriesData).sort((a, b) => b.total - a.total).map(sub => (
                                        <div key={sub.name}>
                                            <button
                                                onClick={() => toggleSubcategory(sub.name)}
                                                className="w-full flex items-center justify-between py-3 px-4 pl-11 hover:bg-slate-800/50 transition-colors border-b border-slate-700/50 last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {expandedSubcategory === sub.name ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                                                    <span className="text-sm text-slate-300">{sub.name}</span>
                                                </div>
                                                <span className="text-sm text-slate-300">
                                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sub.total)}
                                                </span>
                                            </button>

                                            {/* Level 3: Transactions */}
                                            {expandedSubcategory === sub.name && (
                                                <div className="bg-slate-950/30 py-2">
                                                    {sub.transactions.map(t => (
                                                        <div key={t.id} className="flex justify-between items-center py-2 px-4 pl-16 hover:bg-slate-900/50">
                                                            <div className="min-w-0">
                                                                <div className="text-xs text-slate-400">
                                                                    {new Date(t.date).toLocaleDateString('tr-TR')}
                                                                    {t.description && <span className="text-slate-500"> • {t.description}</span>}
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs whitespace-nowrap ml-2 ${reportType === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {reportType === 'expense' ? '-' : '+'}{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        Bu dönem için {reportType === 'expense' ? 'gider' : 'gelir'} kaydı bulunamadı.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DetailedReport;
