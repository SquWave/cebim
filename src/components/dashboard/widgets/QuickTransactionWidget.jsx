import React, { useState } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, ArrowRightCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

/**
 * Quick Transaction Widget
 * Shows quick add form + last 5 transactions
 */
const QuickTransactionWidget = ({
    transactions = [],
    accounts = [],
    categories = [],
    onAddTransaction,
    privacyMode = false
}) => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        accountId: '',
        toAccountId: '',
        date: new Date().toISOString().slice(0, 16)
    });

    // Get last 5 transactions
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    // Get expense categories only for quick add
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.amount || !formData.accountId) return;
        if (formData.type === 'transfer' && !formData.toAccountId) return;

        const transactionData = {
            id: Date.now(),
            amount: Number(formData.amount),
            description: formData.description || (formData.type === 'transfer' ? 'Transfer' : 'Hızlı İşlem'),
            category: formData.type === 'transfer' ? 'Transfer' : (formData.category || (formData.type === 'expense' ? 'Diğer' : 'Gelir')),
            type: formData.type,
            date: new Date(formData.date).toISOString(),
            accountId: formData.accountId
        };

        // Add toAccountId for transfers
        if (formData.type === 'transfer') {
            transactionData.toAccountId = formData.toAccountId;
        }

        onAddTransaction(transactionData);

        setFormData({
            type: 'expense',
            amount: '',
            description: '',
            category: '',
            accountId: '',
            toAccountId: '',
            date: new Date().toISOString().slice(0, 16)
        });
        setShowForm(false);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'income': return <ArrowUpCircle className="w-4 h-4 text-emerald-400" />;
            case 'expense': return <ArrowDownCircle className="w-4 h-4 text-rose-400" />;
            case 'transfer': return <ArrowRightCircle className="w-4 h-4 text-blue-400" />;
            default: return null;
        }
    };

    return (
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Hızlı İşlem</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`p-2 rounded-lg transition-colors ${showForm ? 'bg-slate-700 text-white' : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'}`}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Quick Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="p-3 border-b border-slate-800 bg-slate-800/50 space-y-2">
                    {/* Type Toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, type: 'expense', category: '', toAccountId: '' }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg ${formData.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-700 text-slate-400'}`}
                        >
                            Gider
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, type: 'income', category: '', toAccountId: '' }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg ${formData.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-700 text-slate-400'}`}
                        >
                            Gelir
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(f => ({ ...f, type: 'transfer', category: '' }))}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg ${formData.type === 'transfer' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-slate-700 text-slate-400'}`}
                        >
                            Transfer
                        </button>
                    </div>

                    {/* Date & Amount */}
                    <div className="flex gap-2">
                        <input
                            type="datetime-local"
                            value={formData.date}
                            onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                            className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <input
                            type="number"
                            placeholder="Tutar"
                            value={formData.amount}
                            onChange={(e) => setFormData(f => ({ ...f, amount: e.target.value }))}
                            className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* Account Selection */}
                    {formData.type === 'transfer' ? (
                        <div className="flex gap-2">
                            <select
                                value={formData.accountId}
                                onChange={(e) => setFormData(f => ({ ...f, accountId: e.target.value }))}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                required
                            >
                                <option value="">Kaynak</option>
                                {accounts.filter(acc => acc.id !== formData.toAccountId).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                            <span className="flex items-center text-slate-500">→</span>
                            <select
                                value={formData.toAccountId}
                                onChange={(e) => setFormData(f => ({ ...f, toAccountId: e.target.value }))}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                required
                            >
                                <option value="">Hedef</option>
                                {accounts.filter(acc => acc.id !== formData.accountId).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <select
                            value={formData.accountId}
                            onChange={(e) => setFormData(f => ({ ...f, accountId: e.target.value }))}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                            required
                        >
                            <option value="">Hesap Seç</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Category (only for income/expense) */}
                    {formData.type !== 'transfer' && (
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">Kategori Seç</option>
                            {(formData.type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                                <optgroup key={cat.id} label={cat.name}>
                                    {cat.subcategories?.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    )}

                    {/* Description */}
                    <input
                        type="text"
                        placeholder="Açıklama"
                        value={formData.description}
                        onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg p-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />

                    <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Ekle
                    </button>
                </form>
            )}

            {/* Recent Transactions */}
            <div className="divide-y divide-slate-800">
                {recentTransactions.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                        Henüz işlem yok
                    </div>
                ) : (
                    recentTransactions.map((tx) => (
                        <div key={tx.id} className="p-3 flex items-center gap-3">
                            {getTypeIcon(tx.type)}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-white truncate">{tx.category}</div>
                                <div className="text-xs text-slate-500">
                                    {new Date(tx.date).toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className={`text-sm font-medium ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-rose-400' : 'text-blue-400'}`}>
                                {privacyMode ? '₺***' : `${tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}${formatCurrency(tx.amount)}`}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QuickTransactionWidget;
