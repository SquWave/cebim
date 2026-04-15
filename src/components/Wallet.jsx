import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Wallet as WalletIcon, CreditCard, Building2, ArrowRightLeft, Pencil, X, Check, HandCoins, Home, Utensils, Bus, Car, ShoppingBag, Film, HeartPulse, ChartNoAxesCombined, BanknoteArrowDown, IterationCw, ReceiptText, Filter, Calendar } from 'lucide-react';
import { formatDateForInput } from '../utils/formatters';

const Wallet = ({ transactions = [], onAddTransaction, onUpdateTransaction, onDeleteTransaction, accounts = [], onAddAccount, onUpdateAccount, onDeleteAccount, categories = [], privacyMode = false }) => {

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
    const [installmentCount, setInstallmentCount] = useState('1');
    const [totalWithInterest, setTotalWithInterest] = useState('');
    const [useInterest, setUseInterest] = useState(false);

    // Account State
    const [isAddingAccount, setIsAddingAccount] = useState(false);
    const [accountName, setAccountName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [accountType, setAccountType] = useState('cash');
    const [creditLimit, setCreditLimit] = useState('');
    const [statementDay, setStatementDay] = useState('1');
    const [editingAccount, setEditingAccount] = useState(null);
    const [selectedCreditCard, setSelectedCreditCard] = useState(null); // For period history modal

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filterCategory, setFilterCategory] = useState(''); // Ana kategori ID
    const [filterAccount, setFilterAccount] = useState('');   // Hesap ID
    const [filterStartDate, setFilterStartDate] = useState(''); // YYYY-MM-DD
    const [filterEndDate, setFilterEndDate] = useState('');     // YYYY-MM-DD

    // Ensure transactions is an array
    const safeTransactions = transactions || [];

    // Helper: Get current period start date for credit cards
    const getCurrentPeriodStart = (statementDay) => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const day = parseInt(statementDay) || 1;

        // Get the last day of current month
        const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const actualDay = Math.min(day, lastDayOfCurrentMonth);

        // If we haven't passed the statement day this month, use last month's statement day
        let periodStart;
        if (today.getDate() < actualDay) {
            // Use previous month's statement day
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
            const prevActualDay = Math.min(day, lastDayOfPrevMonth);
            periodStart = new Date(prevYear, prevMonth, prevActualDay, 0, 0, 0, 0);
        } else {
            // Use this month's statement day
            periodStart = new Date(currentYear, currentMonth, actualDay, 0, 0, 0, 0);
        }
        return periodStart;
    };

    // Helper: Get previous periods for credit card history
    const getCreditCardPeriods = (acc) => {
        if (acc.type !== 'credit_card') return [];

        const periods = [];
        const today = new Date();
        const statementDay = parseInt(acc.statementDay) || 1;

        // Get transactions for this card
        const cardTransactions = safeTransactions.filter(t => t.accountId === acc.id && t.type === 'expense');
        if (cardTransactions.length === 0) return [];

        // Helper: get effective period amount for a transaction
        // For installment transactions, only count the installment amount per period
        const getPeriodAmount = (t) => {
            const iCount = Number(t.installmentCount) || 1;
            if (iCount > 1) {
                return Number(t.installmentAmount) || (Number(t.amount) / iCount);
            }
            return Number(t.amount);
        };

        // Find the earliest transaction date
        const dates = cardTransactions.map(t => new Date(t.date));
        const earliest = new Date(Math.min(...dates));

        // Generate periods from earliest to now
        let periodEnd = new Date(today);
        let periodStart = getCurrentPeriodStart(statementDay);

        // Current period
        const currentPeriodTxs = cardTransactions.filter(t => new Date(t.date) >= periodStart && new Date(t.date) <= periodEnd);
        const currentPeriodExpenses = currentPeriodTxs.reduce((sum, t) => sum + getPeriodAmount(t), 0);

        periods.push({
            label: 'Bu Dönem',
            start: periodStart,
            end: periodEnd,
            total: currentPeriodExpenses,
            transactions: currentPeriodTxs
        });

        // Previous periods (up to 6 months back)
        for (let i = 0; i < 6; i++) {
            periodEnd = new Date(periodStart);
            periodEnd.setMilliseconds(-1);

            const prevMonth = periodStart.getMonth() === 0 ? 11 : periodStart.getMonth() - 1;
            const prevYear = periodStart.getMonth() === 0 ? periodStart.getFullYear() - 1 : periodStart.getFullYear();
            const lastDayOfMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
            const actualDay = Math.min(statementDay, lastDayOfMonth);
            periodStart = new Date(prevYear, prevMonth, actualDay, 0, 0, 0, 0);

            if (periodStart < earliest) break;

            const periodTxs = cardTransactions.filter(t => new Date(t.date) >= periodStart && new Date(t.date) <= periodEnd);
            const periodExpenses = periodTxs.reduce((sum, t) => sum + getPeriodAmount(t), 0);

            if (periodExpenses > 0) {
                periods.push({
                    label: periodStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
                    start: periodStart,
                    end: periodEnd,
                    total: periodExpenses,
                    transactions: periodTxs
                });
            }
        }

        return periods;
    };

    // Helper: Count how many periods have passed since a transaction date
    const getPaidInstallments = (txDate, statementDay) => {
        const tx = new Date(txDate);
        const today = new Date();
        const day = parseInt(statementDay) || 1;

        // Count full billing cycles that have passed
        let count = 0;
        let checkDate = new Date(tx);

        // Find the first statement day after the transaction
        let nextStatement = new Date(checkDate.getFullYear(), checkDate.getMonth(), day);
        if (nextStatement <= checkDate) {
            nextStatement.setMonth(nextStatement.getMonth() + 1);
        }
        // Adjust for months with fewer days
        const lastDay = new Date(nextStatement.getFullYear(), nextStatement.getMonth() + 1, 0).getDate();
        if (day > lastDay) nextStatement.setDate(lastDay);

        // Count how many statement days have passed
        while (nextStatement <= today && count < 100) {
            count++;
            nextStatement = new Date(nextStatement.getFullYear(), nextStatement.getMonth() + 1, 1);
            const md = new Date(nextStatement.getFullYear(), nextStatement.getMonth() + 1, 0).getDate();
            nextStatement.setDate(Math.min(day, md));
        }
        return count;
    };

    // Derived State
    const accountBalances = useMemo(() => {
        const balances = {};
        accounts.forEach(acc => {
            if (acc.type === 'credit_card') {
                const limit = Number(acc.creditLimit) || 0;
                const statDay = acc.statementDay || 1;
                const periodStart = getCurrentPeriodStart(statDay);

                // Calculate remaining installment debt for all installment transactions
                let totalRemainingDebt = 0;
                let currentPeriodNonInstallment = 0;
                let currentPeriodIncome = 0; // Sadece bu dönemki iadeler/gelirler limit arttırır

                safeTransactions
                    .filter(t => t.accountId === acc.id)
                    .forEach(t => {
                        if (t.type === 'expense') {
                            const iCount = Number(t.installmentCount) || 1;
                            if (iCount > 1) {
                                // Installment transaction
                                const totalAmount = Number(t.totalWithInterest) || Number(t.amount);
                                const perInstallment = Number(t.installmentAmount) || (totalAmount / iCount);
                                const paid = Math.min(getPaidInstallments(t.date, statDay), iCount);
                                const remaining = totalAmount - (paid * perInstallment);
                                totalRemainingDebt += Math.max(remaining, 0);
                            } else {
                                // Single payment - only affects current period
                                if (new Date(t.date) >= periodStart) {
                                    currentPeriodNonInstallment += Number(t.amount);
                                }
                            }
                        } else if (t.type === 'income') {
                            // Gelir (İade) geldi ise ve GÜNCEL DÖNEMDE (hesap kesiminden sonra) ise limitimizi geri artıralım
                            if (new Date(t.date) >= periodStart) {
                                currentPeriodIncome += Number(t.amount);
                            }
                        }
                    });

                balances[acc.id] = limit - totalRemainingDebt - currentPeriodNonInstallment + currentPeriodIncome;
            } else {
                // Regular account: initial balance +/- transactions
                balances[acc.id] = Number(acc.initialBalance) || 0;
            }
        });
        safeTransactions.forEach(t => {
            const acc = accounts.find(a => a.id === t.accountId);
            if (t.accountId && balances[t.accountId] !== undefined && (!acc || acc.type !== 'credit_card')) {
                if (t.type === 'income') {
                    balances[t.accountId] += Number(t.amount);
                } else if (t.type === 'expense') {
                    balances[t.accountId] -= Number(t.amount);
                } else if (t.type === 'transfer' && t.toAccountId) {
                    balances[t.accountId] -= Number(t.amount);
                    if (balances[t.toAccountId] !== undefined) {
                        balances[t.toAccountId] += Number(t.amount);
                    }
                }
            }
        });
        return balances;
    }, [accounts, safeTransactions]);

    // Total balance for cash and bank accounts only (exclude credit cards)
    const totalBalance = Object.entries(accountBalances)
        .filter(([accId]) => {
            const acc = accounts.find(a => a.id === accId);
            return acc && acc.type !== 'credit_card';
        })
        .reduce((sum, [, balance]) => sum + balance, 0);

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

    // Filtered transactions for display
    const filteredTransactions = useMemo(() => {
        return safeTransactions.filter(t => {
            // Kategori filtresi (ana kategori)
            if (filterCategory) {
                const mainCat = categories.find(c => c.id === filterCategory);
                if (!mainCat) return false;
                // Check if transaction category is in main category's subcategories or matches main category name
                if (!mainCat.subcategories.includes(t.category) && mainCat.name !== t.category) return false;
            }
            // Hesap filtresi
            if (filterAccount && t.accountId !== filterAccount) return false;
            // Tarih aralığı filtresi
            if (filterStartDate) {
                const txDate = new Date(t.date);
                const startDate = new Date(filterStartDate);
                startDate.setHours(0, 0, 0, 0);
                if (txDate < startDate) return false;
            }
            if (filterEndDate) {
                const txDate = new Date(t.date);
                const endDate = new Date(filterEndDate);
                endDate.setHours(23, 59, 59, 999);
                if (txDate > endDate) return false;
            }
            return true;
        });
    }, [safeTransactions, filterCategory, filterAccount, filterStartDate, filterEndDate, categories]);

    // Check if any filter is active
    const hasActiveFilters = filterCategory || filterAccount || filterStartDate || filterEndDate;

    // Clear all filters
    const clearFilters = () => {
        setFilterCategory('');
        setFilterAccount('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    // --- Account Handlers ---
    const handleAddAccount = (e) => {
        e.preventDefault();
        if (!accountName) return;

        // Validate credit card specific fields
        if (accountType === 'credit_card' && !creditLimit) {
            alert('Kredi kartı için limit girmeniz zorunludur.');
            return;
        }

        const accountData = {
            id: Date.now().toString(),
            name: accountName,
            type: accountType,
        };

        if (accountType === 'credit_card') {
            accountData.creditLimit = Number(creditLimit) || 0;
            accountData.statementDay = parseInt(statementDay) || 1;
            accountData.initialBalance = 0; // Credit cards don't have initial balance
        } else {
            accountData.initialBalance = Number(initialBalance) || 0;
        }

        onAddAccount(accountData);

        // Reset form
        setAccountName('');
        setInitialBalance('');
        setCreditLimit('');
        setStatementDay('1');
        setAccountType('cash');
        setIsAddingAccount(false);
    };

    const handleEditAccount = (account) => {
        setEditingAccount({ ...account });
    };

    const handleSaveAccount = (e) => {
        e.preventDefault();
        if (!editingAccount || !editingAccount.name) return;

        // Validate credit card specific fields
        if (editingAccount.type === 'credit_card' && !editingAccount.creditLimit) {
            alert('Kredi kartı için limit girmeniz zorunludur.');
            return;
        }

        const updatedAccount = {
            ...editingAccount,
        };

        if (editingAccount.type === 'credit_card') {
            updatedAccount.creditLimit = Number(editingAccount.creditLimit) || 0;
            updatedAccount.statementDay = parseInt(editingAccount.statementDay) || 1;
            updatedAccount.initialBalance = 0;
        } else {
            updatedAccount.initialBalance = Number(editingAccount.initialBalance) || 0;
        }

        onUpdateAccount(updatedAccount);
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

        // Credit card limit check for expenses
        if (type === 'expense') {
            const selectedAccount = accounts.find(a => a.id === selectedAccountId);
            if (selectedAccount && selectedAccount.type === 'credit_card') {
                const remainingLimit = accountBalances[selectedAccountId] || 0;
                const iCount = Number(installmentCount) || 1;
                const effectiveTotal = (useInterest && totalWithInterest) ? Number(totalWithInterest) : numAmount;
                if (effectiveTotal > remainingLimit) {
                    alert(`Kart limitiniz aşılıyor!\n\nKalan limit: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(remainingLimit)}\nHarcama tutarı: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(effectiveTotal)}`);
                    return;
                }
            }
        }

        // Build transaction object
        const selectedAccount = accounts.find(a => a.id === selectedAccountId);
        const isCreditCard = selectedAccount && selectedAccount.type === 'credit_card';
        const iCount = isCreditCard ? (Number(installmentCount) || 1) : 1;
        const effectiveTotal = (isCreditCard && useInterest && totalWithInterest) ? Number(totalWithInterest) : numAmount;
        const perInstallment = iCount > 1 ? Math.round((effectiveTotal / iCount) * 100) / 100 : numAmount;

        onAddTransaction({
            id: Date.now(),
            amount: numAmount,
            description: description || (type === 'transfer' ? 'Transfer' : 'İşlem'),
            category: type === 'transfer' ? 'Transfer' : category,
            type,
            date: new Date(date).toISOString(),
            accountId: selectedAccountId,
            toAccountId: type === 'transfer' ? toAccountId : null,
            // Installment fields
            ...(isCreditCard && iCount > 1 ? {
                installmentCount: iCount,
                installmentAmount: perInstallment,
                totalWithInterest: useInterest ? effectiveTotal : null,
                installmentStartDate: new Date(date).toISOString()
            } : {})
        });

        setAmount('');
        setDescription('');
        setCategory('');
        setToAccountId('');
        setInstallmentCount('1');
        setTotalWithInterest('');
        setUseInterest(false);
        setDate(formatDateForInput());
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

        const editAcc = accounts.find(a => a.id === editingTransaction.accountId);
        const isEditCC = editAcc && editAcc.type === 'credit_card';
        const editICount = isEditCC ? (Number(editingTransaction.installmentCount) || 1) : 1;
        const editUseInterest = editingTransaction.useInterest || false;
        const editTotalInterest = editUseInterest ? Number(editingTransaction.totalWithInterest) : null;
        const editEffectiveTotal = editTotalInterest || Number(editingTransaction.amount);
        const editPerInstallment = editICount > 1 ? Math.round((editEffectiveTotal / editICount) * 100) / 100 : Number(editingTransaction.amount);

        const updatedTx = {
            ...editingTransaction,
            amount: Number(editingTransaction.amount),
            date: new Date(editingTransaction.date).toISOString(),
            installmentCount: isEditCC && editICount > 1 ? editICount : null,
            installmentAmount: isEditCC && editICount > 1 ? editPerInstallment : null,
            totalWithInterest: isEditCC && editICount > 1 && editUseInterest ? editEffectiveTotal : null,
            installmentStartDate: isEditCC && editICount > 1 ? (editingTransaction.installmentStartDate || new Date(editingTransaction.date).toISOString()) : null,
        };

        // Remove useInterest from saved data (UI-only field)
        delete updatedTx.useInterest;

        // Clean null/undefined values for Firestore compatibility
        Object.keys(updatedTx).forEach(key => {
            if (updatedTx[key] === undefined) delete updatedTx[key];
        });

        await onUpdateTransaction(updatedTx);
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
                            placeholder={accountType === 'credit_card' ? "Kart Adı (Örn: Akbank Kredi Kartı)" : "Hesap Adı (Örn: Cüzdan, Maaş Kartı)"}
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />

                        {accountType === 'credit_card' ? (
                            <>
                                <input
                                    type="number"
                                    placeholder="Kart Limiti (₺)"
                                    value={creditLimit}
                                    onChange={(e) => setCreditLimit(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                    required
                                />
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">Ekstre Kesim Günü</label>
                                    <select
                                        value={statementDay}
                                        onChange={(e) => setStatementDay(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                    >
                                        {[...Array(31)].map((_, i) => (
                                            <option key={i + 1} value={i + 1}>Her ayın {i + 1}. günü</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        ) : (
                            <input
                                type="number"
                                placeholder="Başlangıç Bakiyesi (Opsiyonel)"
                                value={initialBalance}
                                onChange={(e) => setInitialBalance(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            />
                        )}

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">Hesap Oluştur</button>
                    </div>
                </form>
            )}

            {/* Edit Account Modal/Form */}
            {editingAccount && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleSaveAccount} className="bg-slate-900 p-6 rounded-2xl w-full max-w-sm border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4">
                            {editingAccount.type === 'credit_card' ? 'Kredi Kartını Düzenle' : 'Hesabı Düzenle'}
                        </h3>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder={editingAccount.type === 'credit_card' ? "Kart Adı" : "Hesap Adı"}
                                value={editingAccount.name}
                                onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                required
                            />

                            {editingAccount.type === 'credit_card' ? (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Kart Limiti (₺)"
                                        value={editingAccount.creditLimit || ''}
                                        onChange={(e) => setEditingAccount({ ...editingAccount, creditLimit: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                        required
                                    />
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Ekstre Kesim Günü</label>
                                        <select
                                            value={editingAccount.statementDay || 1}
                                            onChange={(e) => setEditingAccount({ ...editingAccount, statementDay: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            {[...Array(31)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>Her ayın {i + 1}. günü</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <input
                                    type="number"
                                    placeholder="Başlangıç Bakiyesi"
                                    value={editingAccount.initialBalance}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, initialBalance: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                />
                            )}

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
                {accounts.map(acc => {
                    const balance = accountBalances[acc.id] || 0;
                    const isCreditCard = acc.type === 'credit_card';
                    const creditLimit = Number(acc.creditLimit) || 0;
                    const usedAmount = isCreditCard ? creditLimit - balance : 0;
                    const usagePercent = isCreditCard && creditLimit > 0 ? Math.min((usedAmount / creditLimit) * 100, 100) : 0;

                    return (
                        <div
                            key={acc.id}
                            className={`p-3 bg-slate-900 rounded-xl border border-slate-800 relative group ${isCreditCard ? 'cursor-pointer hover:border-purple-500/50' : ''}`}
                            onClick={isCreditCard ? () => setSelectedCreditCard(acc) : undefined}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-2 rounded-lg ${acc.type === 'bank' ? 'bg-blue-500/10 text-blue-400' : acc.type === 'credit_card' ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {getAccountIcon(acc.type)}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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

                            {isCreditCard ? (
                                <>
                                    <div className="text-lg font-bold text-slate-200">
                                        {privacyMode ? '₺***' : `${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(balance)}`}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        / {privacyMode ? '***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(creditLimit)}
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-rose-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-purple-500'}`}
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-slate-500">
                                            {privacyMode ? '**%' : `${usagePercent.toFixed(0)}%`} kullanıldı
                                        </span>
                                        <span className="text-[10px] text-slate-500">
                                            Kesim: {acc.statementDay || 1}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-lg font-bold text-slate-200">
                                    {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(balance)}
                                </div>
                            )}
                        </div>
                    );
                })}
                {accounts.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                        Henüz hesap eklenmedi. "Hesap Ekle" butonu ile başlayın.
                    </div>
                )}
            </div>

            {/* Credit Card Period History Modal */}
            {selectedCreditCard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedCreditCard.name}</h3>
                                <p className="text-xs text-slate-500">Dönem Geçmişi</p>
                            </div>
                            <button
                                onClick={() => setSelectedCreditCard(null)}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Card Summary */}
                        <div className="p-4 bg-slate-800/50 rounded-xl mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 text-sm">Kart Limiti</span>
                                <span className="text-white font-medium">
                                    {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(selectedCreditCard.creditLimit || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 text-sm">Kalan Limit</span>
                                <span className="text-emerald-400 font-medium">
                                    {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(accountBalances[selectedCreditCard.id] || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Ekstre Kesim Günü</span>
                                <span className="text-white">Her ayın {selectedCreditCard.statementDay || 1}. günü</span>
                            </div>
                        </div>

                        {/* Periods */}
                        <div className="space-y-3">
                            {getCreditCardPeriods(selectedCreditCard).length === 0 ? (
                                <div className="text-center py-6 text-slate-500 text-sm">
                                    Henüz bu kartta işlem yok.
                                </div>
                            ) : (
                                getCreditCardPeriods(selectedCreditCard).map((period, index) => (
                                    <div key={index} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-sm font-medium ${index === 0 ? 'text-purple-400' : 'text-slate-300'}`}>
                                                {period.label}
                                            </span>
                                            <span className="text-rose-400 font-semibold">
                                                {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(period.total)}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {period.start.toLocaleDateString('tr-TR')} - {period.end.toLocaleDateString('tr-TR')}
                                        </div>
                                        <div className="text-[11px] text-slate-600 mt-1">
                                            {period.transactions.length} işlem
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedCreditCard(null)}
                            className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
            )}

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
                        {/* Amount Input */}
                        <div className="relative z-20">
                            <input
                                type="text"
                                inputMode="decimal"
                                min="0.01"
                                step="0.01"
                                placeholder="Tutar (TL)"
                                value={amount}
                                onChange={(e) => {
                                    const val = e.target.value.replace(',', '.');
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) setAmount(val);
                                }}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 touch-manipulation"
                                required
                            />
                        </div>

                        {/* Installment Fields - Only for credit card expenses */}
                        {type === 'expense' && (() => {
                            const selAcc = accounts.find(a => a.id === selectedAccountId);
                            return selAcc && selAcc.type === 'credit_card';
                        })() && (
                                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Taksit Sayısı</label>
                                        <select
                                            value={installmentCount}
                                            onChange={(e) => setInstallmentCount(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                        >
                                            <option value="1">Tek Çekim</option>
                                            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                <option key={n} value={n}>{n} Taksit</option>
                                            ))}
                                        </select>
                                    </div>

                                    {Number(installmentCount) > 1 && (
                                        <>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={useInterest}
                                                    onChange={(e) => setUseInterest(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                                                />
                                                <span className="text-xs text-slate-400">Vade farklı</span>
                                            </label>

                                            {useInterest && (
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="Vade farklı toplam tutar (₺)"
                                                    value={totalWithInterest}
                                                    onChange={(e) => setTotalWithInterest(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                                />
                                            )}

                                            {/* Installment Summary */}
                                            {amount && (
                                                <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                                                    {(() => {
                                                        const total = (useInterest && totalWithInterest) ? Number(totalWithInterest) : Number(amount);
                                                        const per = Math.round((total / Number(installmentCount)) * 100) / 100;
                                                        return (
                                                            <>
                                                                <div className="flex justify-between">
                                                                    <span>Taksit tutarı:</span>
                                                                    <span className="text-white font-medium">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(per)}</span>
                                                                </div>
                                                                <div className="flex justify-between mt-1">
                                                                    <span>Toplam:</span>
                                                                    <span className="text-white font-medium">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)}</span>
                                                                </div>
                                                                {useInterest && totalWithInterest && Number(totalWithInterest) > Number(amount) && (
                                                                    <div className="flex justify-between mt-1 text-amber-400">
                                                                        <span>Vade farkı:</span>
                                                                        <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(totalWithInterest) - Number(amount))}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full min-w-0 max-w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
                        <div className="relative z-20">
                            <input
                                type="text"
                                placeholder="Açıklama"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 touch-manipulation"
                            />
                        </div>

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

                            {/* Installment Fields for Edit */}
                            {editingTransaction.type === 'expense' && (() => {
                                const editAcc = accounts.find(a => a.id === editingTransaction.accountId);
                                return editAcc && editAcc.type === 'credit_card';
                            })() && (
                                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
                                        <div>
                                            <label className="text-xs text-slate-400 block mb-1">Taksit Sayısı</label>
                                            <select
                                                value={editingTransaction.installmentCount || 1}
                                                onChange={(e) => setEditingTransaction({ ...editingTransaction, installmentCount: Number(e.target.value) })}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="1">Tek Çekim</option>
                                                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                    <option key={n} value={n}>{n} Taksit</option>
                                                ))}
                                            </select>
                                        </div>

                                        {(editingTransaction.installmentCount || 1) > 1 && (
                                            <>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={editingTransaction.useInterest || false}
                                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, useInterest: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-xs text-slate-400">Vade farklı</span>
                                                </label>

                                                {editingTransaction.useInterest && (
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        placeholder="Vade farklı toplam tutar (₺)"
                                                        value={editingTransaction.totalWithInterest || ''}
                                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, totalWithInterest: e.target.value })}
                                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                                    />
                                                )}

                                                {editingTransaction.amount && (
                                                    <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg">
                                                        {(() => {
                                                            const total = (editingTransaction.useInterest && editingTransaction.totalWithInterest) ? Number(editingTransaction.totalWithInterest) : Number(editingTransaction.amount);
                                                            const per = Math.round((total / Number(editingTransaction.installmentCount)) * 100) / 100;
                                                            return (
                                                                <>
                                                                    <div className="flex justify-between">
                                                                        <span>Taksit tutarı:</span>
                                                                        <span className="text-white font-medium">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(per)}</span>
                                                                    </div>
                                                                    <div className="flex justify-between mt-1">
                                                                        <span>Toplam:</span>
                                                                        <span className="text-white font-medium">{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total)}</span>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
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
                {/* Header with Filter Button */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Son İşlemler</h3>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showFilters || hasActiveFilters
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        Filtre
                        {hasActiveFilters && (
                            <span className="ml-1 w-2 h-2 bg-indigo-400 rounded-full"></span>
                        )}
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-2 space-y-3">
                        {/* Category Filter */}
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Kategori</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">Tüm Kategoriler</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Account Filter */}
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Hesap</label>
                            <select
                                value={filterAccount}
                                onChange={(e) => setFilterAccount(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">Tüm Hesaplar</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Başlangıç</label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Bitiş</label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="w-full py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                Filtreleri Temizle
                            </button>
                        )}

                        {/* Filter Summary */}
                        <div className="text-xs text-slate-500 text-center">
                            {filteredTransactions.length} / {safeTransactions.length} işlem gösteriliyor
                        </div>
                    </div>
                )}

                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        {hasActiveFilters ? 'Filtreye uygun işlem bulunamadı.' : 'Henüz işlem yok.'}
                    </div>
                ) : (
                    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t) => {
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
                                        {t.installmentCount > 1 && (
                                            <div className="text-[10px] text-purple-400 mt-0.5">
                                                {t.installmentCount} Taksit • {privacyMode ? '₺***' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(t.installmentAmount)}/ay
                                            </div>
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
