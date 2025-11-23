import React, { useState } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const Wallet = ({ transactions, onAddTransaction, onDeleteTransaction }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState('expense'); // 'income' or 'expense'

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !description) return;

        onAddTransaction({
            id: Date.now(),
            amount: Number(amount),
            description,
            category: category || 'Genel',
            type,
            date: new Date().toISOString(),
        });

        setAmount('');
        setDescription('');
        setCategory('');
        setIsAdding(false);
    };

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Cüzdan</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-6 h-6 text-white" />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-4">
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setType('expense')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            Gider
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('income')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-400'
                                }`}
                        >
                            Gelir
                        </button>
                    </div>

                    <div className="space-y-3">
                        <input
                            type="number"
                            placeholder="Tutar (TL)"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Açıklama"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Kategori (Opsiyonel)"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            Ekle
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {transactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Henüz işlem yok.
                    </div>
                ) : (
                    transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                    {t.type === 'income' ? (
                                        <ArrowUpCircle className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <ArrowDownCircle className="w-5 h-5 text-rose-500" />
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{t.description}</div>
                                    <div className="text-xs text-slate-400">{t.category} • {new Date(t.date).toLocaleDateString('tr-TR')}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount)}
                                </span>
                                <button
                                    onClick={() => onDeleteTransaction(t.id)}
                                    className="text-slate-600 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Wallet;
