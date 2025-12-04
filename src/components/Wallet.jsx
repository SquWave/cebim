import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet as WalletIcon, CreditCard, Building2, ArrowRightLeft, Pencil, X, Check, HandCoins, Home, Utensils, Bus, Car, ShoppingBag, Film, HeartPulse, ChartNoAxesCombined, BanknoteArrowDown, IterationCw, ReceiptText } from 'lucide-react';

const Wallet = ({ transactions = [], onAddTransaction, onUpdateTransaction, onDeleteTransaction, accounts = [], onAddAccount, onUpdateAccount, onDeleteAccount, categories = [], privacyMode = false }) => {
    // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (dateInput) => {
        try {
            const date = dateInput ? new Date(dateInput) : new Date();
            if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);
            const pad = (num) => num.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        } catch (e) {
            return new Date().toISOString().slice(0, 16);
        }
    };

    // Transaction State
    const [isAdding, setIsAdding] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [type, setType] = useState('expense');
    const [date, setDate] = useState(formatDateForInput()); // Default to current local datetime
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Account State
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [accountType, setAccountType] = useState('cash');
    const [editingAccount, setEditingAccount] = useState(null);

    // Ensure transactions is an array
    const safeTransactions = transactions || [];

    // Derived State
    const accountBalances = useMemo(() => {
        const balances = {};
        accounts.forEach(acc => {
            balances[acc.id] = Number(acc.initialBalance) || 0;
        });
        safeTransactions.forEach(t => {
            if (t.accountId && balances[t.accountId] !== undefined) {
                if (t.type === 'income') {
                    balances[t.accountId] += Number(t.amount);
                } else if (t.type === 'expense') {
                    balances[t.accountId] -= Number(t.amount);
                } else if (t.type === 'transfer' && t.toAccountId) {
                    // Deduct from source (accountId)
                    balances[t.accountId] -= Number(t.amount);
                    // Add to destination (toAccountId)
                    if (balances[t.toAccountId] !== undefined) {
                        balances[t.toAccountId] += Number(t.amount);
                    }
                }
            } else if (!t.accountId) {
                // Legacy transactions
            }
        });
        return balances;
    }, [accounts, safeTransactions]);

    const totalBalance = Object.values(accountBalances).reduce((a, b) => a + b, 0);

    // Helper to get icon component
    const getCategoryIcon = (iconName) => {
        const icons = {
            // Income Categories (Legacy -> New)
            'Briefcase': HandCoins,
            'TrendingUp': ChartNoAxesCombined,
            'Gift': BanknoteArrowDown,
            'RefreshCw': IterationCw,

            // Expense Categories
            'Home': Home,
            'Utensils': Utensils,
            'Bus': Bus,
            'Car': Car,
            'ShoppingBag': ShoppingBag,
            'Film': Film,
            'HeartPulse': HeartPulse,
            'CreditCard': CreditCard,

            // Direct mappings (if data is updated)
            'HandCoins': HandCoins,
            'ChartNoAxesCombined': ChartNoAxesCombined,
            'BanknoteArrowDown': BanknoteArrowDown,
            'IterationCw': IterationCw,
            'ReceiptText': ReceiptText
        };
        return icons[iconName] || WalletIcon;
    };

    // Filter categories based on transaction type
    const availableCategories = useMemo(() => {
        return categories.filter(c => c.type === type);
    }, [categories, type]);

    // --- Account Handlers ---
    const handleAddAccount = (e) => {
        e.preventDefault();
        if (!accountName) return;

        onAddAccount({
            id: Date.now().toString(),
            name: accountName,
            type: accountType,
            initialBalance: Number(initialBalance) || 0
        });

        setAccountName('');
        setInitialBalance('');
        setAccountType('cash');
        setIsAddingAccount(false);
    };

    const handleEditAccount = (account) => {
        setEditingAccount({ ...account });
    };

    const handleSaveAccount = (e) => {
        e.preventDefault();
        if (!editingAccount || !editingAccount.name) return;

        onUpdateAccount({
            ...editingAccount,
            initialBalance: Number(editingAccount.initialBalance)
        });
        setEditingAccount(null);
    };

    // --- Transaction Handlers ---

    const handleAddTransaction = (e) => {
        e.preventDefault();

        // Validate amount
        const numAmount = Number(amount);
        if (!amount || numAmount <= 0) {
            alert("Lütfen 0'dan büyük bir tutar girin.");
            return;
        }

        // Require account selection
        if (!selectedAccountId) {
            alert("Lütfen bir hesap seçin.");
            return;
        }

        if (type === 'transfer' && !toAccountId) {
            alert("Lütfen hedef hesabı seçin.");
            return;
        }

        if (type === 'transfer' && selectedAccountId === toAccountId) {
            alert("Aynı hesaba transfer yapamazsınız.");
            return;
        }

        if (type !== 'transfer' && !category) {
            alert("Lütfen bir kategori seçin.");
            return;
        }

        onAddTransaction({
            id: Date.now(),
            amount: numAmount,
            description: description || (type === 'transfer' ? 'Transfer' : 'İşlem'),
            category: type === 'transfer' ? 'Transfer' : category,
            type,
            date: new Date(date).toISOString(),
            accountId: selectedAccountId,
            toAccountId: type === 'transfer' ? toAccountId : null
        });

        setAmount('');
        setDescription('');
        setCategory('');
        setToAccountId('');
        setDate(formatDateForInput()); // Reset to current local datetime
        setIsAdding(false);
    };

    const handleEditTransaction = (transaction) => {
        setEditingTransaction({
            ...transaction,
            date: formatDateForInput(transaction.date) // Format for datetime-local input
        });
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        if (!editingTransaction || !editingTransaction.amount) return;

        await onUpdateTransaction({
            ...editingTransaction,
            amount: Number(editingTransaction.amount),
            date: new Date(editingTransaction.date).toISOString()
        });
        setEditingTransaction(null);
    };


    const getAccountIcon = (type) => {
        switch (type) {
            case 'bank': return <Building2 className="w-5 h-5" />;
            case 'credit_card': return <CreditCard className="w-5 h-5" />;
            default: return <WalletIcon className="w-5 h-5" />;
        }
    };

    return (
        <div className="pb-20 space-y-6">
            {/* Header & Total Balance */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Cüzdan</h2>
                    <div className="text-sm text-slate-400">Toplam Varlık: {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalBalance)}</div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddingAccount(!isAddingAccount)}
                        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-300"
                        title="Hesap Ekle"
                    >
                        <WalletIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors text-white"
                        title="İşlem Ekle"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Add Account Form */}
            {isAddingAccount && (
                <form onSubmit={handleAddAccount} className="p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Yeni Hesap Ekle</h3>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setAccountType('cash')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${accountType === 'cash' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-transparent'}`}>Nakit</button>
                            <button type="button" onClick={() => setAccountType('bank')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${accountType === 'bank' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-transparent'}`}>Banka</button>
                            <button type="button" onClick={() => setAccountType('credit_card')} className={`flex-1 py-2 rounded-lg text-sm font-medium border ${accountType === 'credit_card' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-400 border-transparent'}`}>Kredi Kartı</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Hesap Adı (Örn: Cüzdan, Maaş Kartı)"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <input
                            type="number"
                            placeholder="Başlangıç Bakiyesi (Opsiyonel)"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">Hesap Oluştur</button>
                    </div>
                </form>
            )}

            {/* Edit Account Modal/Form */}
            {editingAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSaveAccount} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4">Hesabı Düzenle</h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Hesap Adı"
                                value={editingAccount.name}
                                onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Başlangıç Bakiyesi"
                                value={editingAccount.initialBalance}
                                onChange={(e) => setEditingAccount({ ...editingAccount, initialBalance: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                            />
                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setEditingAccount(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">İptal</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Kaydet</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Accounts List */}
            <div className="grid grid-cols-2 gap-3">
                {accounts.map(acc => (
                    <div key={acc.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 relative group">
                        <div className="flex justify-between items-start mb-2">
                            <div className={`p-2 rounded-lg ${acc.type === 'bank' ? 'bg-blue-500/10 text-blue-400' : acc.type === 'credit_card' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {getAccountIcon(acc.type)}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditAccount(acc)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => {
                                    if (confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
                                        onDeleteAccount(acc.id);
                                    }
                                }} className="text-slate-600 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="font-medium text-white truncate">{acc.name}</div>
                        <div className="text-lg font-bold text-slate-200">
                            {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(accountBalances[acc.id] || 0)}
                        </div>
                    </div>
                ))}
                {accounts.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                        Henüz hesap eklenmedi. "Hesap Ekle" butonu ile başlayın.
                    </div>
                )}
            </div>

            {/* Add Transaction Form */}
            {isAdding && (
                <form onSubmit={handleAddTransaction} className="p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Yeni İşlem Ekle</h3>
                    <div className="flex gap-2 mb-4">
                        <button type="button" onClick={() => setType('expense')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-slate-800 text-slate-400'}`}>Gider</button>
                        <button type="button" onClick={() => setType('income')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-800 text-slate-400'}`}>Gelir</button>
                        <button type="button" onClick={() => setType('transfer')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'transfer' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-slate-800 text-slate-400'}`}>Transfer</button>
                    </div>

                    <div className="space-y-3">
                        {accounts.length > 0 && (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-400 block mb-1">{type === 'transfer' ? 'Gönderen Hesap' : 'Hesap'}</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {type === 'transfer' && (
                                    <div className="flex-1">
                                        <label className="text-xs text-slate-400 block mb-1">Alıcı Hesap</label>
                                        <select
                                            value={toAccountId}
                                            onChange={(e) => setToAccountId(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="">Seçiniz...</option>
                                            {accounts.filter(a => a.id !== selectedAccountId).map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                        <input type="number" min="0.01" step="0.01" placeholder="Tutar (TL)" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" required />
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <input type="text" placeholder="Açıklama (Opsiyonel)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />

                        {type !== 'transfer' && (
                            <div className="relative">
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 appearance-none"
                                    required
                                >
                                    <option value="">Kategori Seçiniz...</option>
                                    {availableCategories.map(cat => (
                                        <optgroup key={cat.id} label={cat.name}>
                                            {cat.subcategories.map(sub => (
                                                <option key={`${cat.id}-${sub}`} value={sub}>{sub}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <ArrowDownCircle className="w-4 h-4" />
                                </div>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">Ekle</button>
                    </div>
                </form>
            )}

            {/* Edit Transaction Modal/Form */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSaveTransaction} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4">İşlemi Düzenle</h3>
                        <div className="space-y-3">
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => setEditingTransaction({ ...editingTransaction, type: 'expense' })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${editingTransaction.type === 'expense' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-transparent'}`}>Gider</button>
                                <button type="button" onClick={() => setEditingTransaction({ ...editingTransaction, type: 'income' })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${editingTransaction.type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-transparent'}`}>Gelir</button>
                                <button type="button" onClick={() => setEditingTransaction({ ...editingTransaction, type: 'transfer' })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${editingTransaction.type === 'transfer' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-slate-800 text-slate-400 border-transparent'}`}>Transfer</button>
                            </div>

                            <input
                                type="number"
                                placeholder="Tutar"
                                value={editingTransaction.amount}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                required
                            />
                            <input
                                type="datetime-local"
                                value={editingTransaction.date}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Açıklama"
                                value={editingTransaction.description}
                                onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                            />
                            {editingTransaction.type !== 'transfer' && (
                                <select
                                    value={editingTransaction.category}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, category: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">Kategori Seçiniz...</option>
                                    {categories.filter(c => c.type === editingTransaction.type).map(cat => (
                                        <optgroup key={cat.id} label={cat.name}>
                                            {cat.subcategories.map(sub => (
                                                <option key={`${cat.id}-${sub}`} value={sub}>{sub}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            )}

                            {/* Account Selectors for Editing */}
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">{editingTransaction.type === 'transfer' ? 'Gönderen Hesap' : 'Hesap'}</label>
                                    <select
                                        value={editingTransaction.accountId || ''}
                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, accountId: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {editingTransaction.type === 'transfer' && (
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Alıcı Hesap</label>
                                        <select
                                            value={editingTransaction.toAccountId || ''}
                                            onChange={(e) => setEditingTransaction({ ...editingTransaction, toAccountId: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="">Seçiniz...</option>
                                            {accounts.filter(a => a.id !== editingTransaction.accountId).map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-4">
                                <button type="button" onClick={() => setEditingTransaction(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors">İptal</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Kaydet</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Transactions List */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Son İşlemler</h3>
                {safeTransactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">Henüz işlem yok.</div>
                ) : (
                    safeTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => {
                        const account = accounts.find(a => a.id === t.accountId);
                        const toAccount = t.toAccountId ? accounts.find(a => a.id === t.toAccountId) : null;

                        // Find category icon
                        let iconName = 'Wallet';
                        if (t.type === 'transfer') {
                            iconName = 'ArrowRightLeft';
                        } else {
                            const mainCat = categories.find(c => c.subcategories.includes(t.category) || c.name === t.category);
                            if (mainCat) iconName = mainCat.icon;
                        }

                        return (
                            <div key={t.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800 group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : t.type === 'transfer' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {t.type === 'transfer' ? <ArrowRightLeft className="w-5 h-5" /> : (() => {
                                            const Icon = getCategoryIcon(iconName);
                                            return <Icon className="w-5 h-5" />;
                                        })()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-white truncate">{t.category || (t.type === 'transfer' ? 'Transfer' : 'İşlem')}</div>
                                        <div className="text-xs text-slate-400 truncate">
                                            {new Date(t.date).toLocaleDateString('tr-TR')}
                                            {account && <span> • {account.name} {toAccount ? `→ ${toAccount.name}` : ''}</span>}
                                        </div>
                                        {t.description && (
                                            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{t.description}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 ml-2 shrink-0">
                                    <span className={`font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : t.type === 'transfer' ? 'text-blue-400' : 'text-rose-400'}`}>
                                        {t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '-'}{privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.amount)}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditTransaction(t)} className="text-slate-600 hover:text-indigo-400 transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => {
                                            if (confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
                                                onDeleteTransaction(t.id);
                                            }
                                        }} className="text-slate-600 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Wallet;
