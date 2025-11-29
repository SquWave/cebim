import React, { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, RefreshCw, Trash2, Coins, Banknote, ArrowUpRight, PieChart, Search, ReceiptTurkishLira } from 'lucide-react';
import { fetchMarketData, searchStocks, TEFAS_FUNDS } from '../services/marketData';

// Helper functions for lot-based asset management
const migrateFlatAssetToLots = (flatAsset) => {
    // Convert old flat structure to new lot structure
    if (flatAsset.lots) return flatAsset; // Already migrated

    return {
        id: flatAsset.id,
        name: flatAsset.name,
        type: flatAsset.type,
        expanded: false,
        lots: [{
            id: `lot_${Date.now()}`,
            amount: flatAsset.amount,
            cost: flatAsset.cost,
            price: flatAsset.price,
            addedAt: Date.now()
        }]
    };
};

const computeAggregatedValues = (lotsAsset) => {
    if (!lotsAsset.lots || lotsAsset.lots.length === 0) {
        return { totalAmount: 0, avgCost: 0, currentPrice: 0, totalValue: 0, totalProfit: 0 };
    }

    // Calculate totals from LOTS (Purchases)
    const totalPurchasedAmount = lotsAsset.lots.reduce((sum, lot) => sum + lot.amount, 0);
    const totalPurchasedCost = lotsAsset.lots.reduce((sum, lot) => sum + (lot.amount * lot.cost), 0);

    // Calculate totals from SALES
    const totalSoldAmount = (lotsAsset.sales || []).reduce((sum, sale) => sum + sale.amount, 0);

    // Net Amount
    const totalAmount = totalPurchasedAmount - totalSoldAmount;

    // Avg Cost (based on purchases)
    const avgCost = totalPurchasedAmount > 0 ? totalPurchasedCost / totalPurchasedAmount : 0;

    const currentPrice = lotsAsset.lots[0]?.price || 0; // All lots share same current price
    const totalValue = totalAmount * currentPrice;

    // Total Cost of REMAINING assets
    const totalCostValue = totalAmount * avgCost;

    const totalProfit = totalValue - totalCostValue;
    const profitPercentage = totalCostValue > 0 ? (totalProfit / totalCostValue) * 100 : 0;

    return { totalAmount, avgCost, currentPrice, totalValue, totalProfit, profitPercentage };
};

const Portfolio = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [cost, setCost] = useState(''); // Unit Cost (Maliyet)
    const [type, setType] = useState(''); // stock, fund, gold, currency
    const [rates, setRates] = useState(null);
    const [specificPrices, setSpecificPrices] = useState({});
    const [loadingRates, setLoadingRates] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [expandedAssets, setExpandedAssets] = useState(new Set());
    const [editingLot, setEditingLot] = useState(null); // { assetId, lotId }
    const [editForm, setEditForm] = useState({ amount: '', cost: '' });

    // Sale State
    const [isSelling, setIsSelling] = useState(null); // assetId being sold
    const [saleForm, setSaleForm] = useState({ amount: '', salePrice: '' });
    const [viewMode, setViewMode] = useState({}); // { assetId: 'lots' | 'sales' }
    const [editingSale, setEditingSale] = useState(null); // { assetId, saleId }
    const [editSaleForm, setEditSaleForm] = useState({ amount: '', salePrice: '' });

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const isSelectionRef = useRef(false);

    useEffect(() => {
        loadRates();
    }, []);

    // Reset form when opening add dialog
    useEffect(() => {
        if (isAdding) {
            setName('');
            setAmount('');
            setCost('');
            setType('');
            setSuggestions([]);
            setShowSuggestions(false);
            isSelectionRef.current = false;
        }
    }, [isAdding]);

    // Auto-update prices when rates are loaded
    useEffect(() => {
        if (rates && assets.length > 0) {
            updateAssetPrices(true); // Silent update
        }
    }, [rates]);

    // Autocomplete Logic
    useEffect(() => {
        if (isSelectionRef.current) {
            isSelectionRef.current = false;
            return;
        }

        if (!name || (type !== 'stock' && type !== 'fund')) {
            setSuggestions([]);
            return;
        }

        const query = name.toUpperCase();

        const fetchSuggestions = async () => {
            if (type === 'stock') {
                const results = await searchStocks(query);
                setSuggestions(results);
                if (results.length > 0) setShowSuggestions(true);
            } else {
                const filtered = TEFAS_FUNDS.filter(item =>
                    item.code.startsWith(query) || item.name.toUpperCase().includes(query)
                ).slice(0, 5);
                setSuggestions(filtered);
                if (filtered.length > 0) setShowSuggestions(true);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [name, type]);

    const loadRates = async () => {
        setLoadingRates(true);
        const data = await fetchMarketData(assets);
        setRates(data);
        if (data.specificPrices) {
            setSpecificPrices(data.specificPrices);
        }
        setLastUpdated(new Date());
        setLoadingRates(false);
    };

    const updateAssetPrices = (silent = false) => {
        if (!rates) return;
        let updatedCount = 0;
        let errorCount = 0;

        assets.forEach(rawAsset => {
            const asset = migrateFlatAssetToLots(rawAsset);
            let newPrice = null;
            const assetName = asset.name.toUpperCase();

            if (asset.type === 'currency') {
                if (assetName.includes('USD') || assetName.includes('DOLAR')) newPrice = rates.USD;
                else if (assetName.includes('EUR') || assetName.includes('EURO')) newPrice = rates.EUR;
            }
            else if (asset.type === 'gold') {
                if (assetName.includes('ALTIN') || assetName.includes('GOLD')) newPrice = rates.GOLD;
            }
            else if ((asset.type === 'stock' || asset.type === 'fund') && specificPrices[assetName]) {
                newPrice = specificPrices[assetName];
            }

            // Check if current price (from first lot) differs from new price
            const currentPrice = asset.lots[0]?.price || 0;

            if (newPrice && newPrice !== currentPrice) {
                // Update all lots with new price
                const updatedLots = asset.lots.map(lot => ({
                    ...lot,
                    price: newPrice
                }));

                onUpdateAsset({ ...asset, lots: updatedLots });
                updatedCount++;
            } else if (!newPrice) {
                errorCount++;
            }
        });

        if (!silent) {
            if (updatedCount > 0) {
                alert(`${updatedCount} varlığın fiyatı güncel piyasa verileriyle yenilendi.`);
            } else if (errorCount > 0) {
                alert('Bazı varlıkların güncel fiyatına ulaşılamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
            } else {
                alert('Güncellenebilecek uygun varlık bulunamadı.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !amount || !cost) return;

        let initialPrice = Number(cost);

        // For currency assets, use live FX rate instead of cost
        if (type === 'currency' && rates) {
            if (name === 'USD') initialPrice = rates.USD;
            else if (name === 'EUR') initialPrice = rates.EUR;
        }
        else if (type === 'gold' && rates) {
            initialPrice = rates.GOLD;
        }
        // If it's a stock, try to fetch the current price immediately
        else if (type === 'stock' && rates && rates.specificPrices) {
            const stockCode = name.toUpperCase();
            // Trigger a refresh to get this specific stock's price
            const data = await fetchMarketData([{ name: stockCode, type: 'stock' }]);
            if (data.specificPrices && data.specificPrices[stockCode]) {
                initialPrice = data.specificPrices[stockCode];
                console.log('[handleSubmit] Fetched live price for stock', stockCode, ':', initialPrice);
            }
        }
        // If it's a fund, fetch the current price from TEFAS
        else if (type === 'fund') {
            const fundCode = name.toUpperCase();
            const data = await fetchMarketData([{ name: fundCode, type: 'fund' }]);
            if (data.specificPrices && data.specificPrices[fundCode]) {
                initialPrice = data.specificPrices[fundCode];
                console.log('[handleSubmit] Fetched live price for fund', fundCode, ':', initialPrice);
            }
        }

        try {
            const assetName = name.toUpperCase();

            // Migrate existing assets on the fly
            const migratedAssets = assets.map(migrateFlatAssetToLots);

            // Check if asset already exists (by name + type)
            const existingAsset = migratedAssets.find(a => a.name === assetName && a.type === type);

            if (existingAsset) {
                // Add new lot to existing asset
                const newLot = {
                    id: `lot_${Date.now()}`,
                    amount: Number(amount),
                    cost: Number(cost),
                    price: initialPrice,
                    addedAt: Date.now()
                };

                const updatedAsset = {
                    ...existingAsset,
                    lots: [...existingAsset.lots, newLot]
                };

                await onUpdateAsset(updatedAsset);
            } else {
                // Create new asset with first lot
                const newAsset = {
                    id: Date.now(),
                    name: assetName,
                    type,
                    expanded: false,
                    lots: [{
                        id: `lot_${Date.now()}`,
                        amount: Number(amount),
                        cost: Number(cost),
                        price: initialPrice,
                        addedAt: Date.now()
                    }]
                };

                await onAddAsset(newAsset);
            }

            // Reset form on success
            setName('');
            setAmount('');
            setCost('');
            setIsAdding(false);
            setSuggestions([]);

        } catch (error) {
            console.error("Error adding/updating asset:", error);
            alert("Varlık eklenirken bir hata oluştu. Lütfen tekrar deneyin.");
        }
    };

    const handleSelectSuggestion = (code) => {
        isSelectionRef.current = true;
        setName(code);
        setShowSuggestions(false);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
    };

    const handleEditLot = (assetId, lot) => {
        setEditingLot({ assetId, lotId: lot.id });
        setEditForm({ amount: lot.amount, cost: lot.cost });
    };

    const handleSaveLot = async (asset, lotId) => {
        try {
            const updatedLots = asset.lots.map(lot =>
                lot.id === lotId
                    ? { ...lot, amount: Number(editForm.amount), cost: Number(editForm.cost) }
                    : lot
            );

            await onUpdateAsset({ ...asset, lots: updatedLots });
            setEditingLot(null);
            setEditForm({ amount: '', cost: '' });
        } catch (error) {
            console.error("Error updating lot:", error);
            alert("Kayıt güncellenirken bir hata oluştu.");
        }
    };

    const handleCancelEdit = () => {
        setEditingLot(null);
        setEditForm({ amount: '', cost: '' });
    };

    const handleDeleteLot = async (asset, lotId) => {
        if (!confirm("Bu alım kaydını silmek istediğinize emin misiniz?")) return;

        try {
            const updatedLots = asset.lots.filter(lot => lot.id !== lotId);

            if (updatedLots.length === 0) {
                // If no lots left, delete the entire asset
                await onDeleteAsset(asset.id);
            } else {
                // Update asset with remaining lots
                await onUpdateAsset({ ...asset, lots: updatedLots });
            }
        } catch (error) {
            console.error("Error deleting lot:", error);
            alert("Kayıt silinirken bir hata oluştu.");
        }
    };

    const handleSale = async (asset) => {
        const { totalAmount, avgCost, currentPrice } = computeAggregatedValues(asset);
        const saleAmount = Number(saleForm.amount);
        const salePrice = Number(saleForm.salePrice) || currentPrice;

        // Validation
        if (!saleAmount || saleAmount <= 0) {
            alert("Lütfen geçerli bir adet girin.");
            return;
        }

        if (saleAmount > totalAmount) {
            alert(`Yeterli varlık yok! Maksimum ${totalAmount} adet satabilirsiniz.`);
            return;
        }

        try {
            // Create sale record
            const newSale = {
                id: `sale_${Date.now()}`,
                amount: saleAmount,
                salePrice: salePrice,
                avgCost: avgCost,
                profit: (saleAmount * salePrice) - (saleAmount * avgCost),
                soldAt: Date.now()
            };

            // Add to sales array
            const updatedSales = [...(asset.sales || []), newSale];

            // Update asset (keep lots unchanged, just update sales)
            await onUpdateAsset({
                ...asset,
                sales: updatedSales
            });

            // Reset sale form
            setIsSelling(null);
            setSaleForm({ amount: '', salePrice: '' });

        } catch (error) {
            console.error("Error processing sale:", error);
            alert("Satış işlemi sırasında bir hata oluştu.");
        }
    };

    const handleDeleteSale = async (asset, saleId) => {
        if (!confirm("Bu satış kaydını silmek istediğinize emin misiniz?")) return;

        try {
            const updatedSales = (asset.sales || []).filter(s => s.id !== saleId);

            await onUpdateAsset({
                ...asset,
                sales: updatedSales
            });
        } catch (error) {
            console.error("Error deleting sale:", error);
            alert("Satış kaydı silinirken bir hata oluştu.");
        }
    };

    const handleEditSale = (assetId, sale) => {
        setEditingSale({ assetId, saleId: sale.id });
        setEditSaleForm({
            amount: sale.amount,
            salePrice: sale.salePrice
        });
    };

    const handleCancelEditSale = () => {
        setEditingSale(null);
        setEditSaleForm({ amount: '', salePrice: '' });
    };

    const handleSaveSale = async (asset, saleId) => {
        const newAmount = Number(editSaleForm.amount);
        const newSalePrice = Number(editSaleForm.salePrice);

        if (!newAmount || newAmount <= 0) {
            alert("Lütfen geçerli bir adet girin.");
            return;
        }

        if (!newSalePrice || newSalePrice < 0) {
            alert("Lütfen geçerli bir satış fiyatı girin.");
            return;
        }

        // Validate against total holdings
        const totalPurchased = asset.lots.reduce((sum, lot) => sum + Number(lot.amount), 0);
        const otherSalesTotal = asset.sales
            .filter(s => s.id !== saleId)
            .reduce((sum, sale) => sum + Number(sale.amount), 0);

        if (newAmount + otherSalesTotal > totalPurchased) {
            alert(`Yeterli varlık yok! Maksimum ${totalPurchased - otherSalesTotal} adet satabilirsiniz.`);
            return;
        }

        try {
            const updatedSales = asset.sales.map(sale => {
                if (sale.id === saleId) {
                    return {
                        ...sale,
                        amount: newAmount,
                        salePrice: newSalePrice,
                        profit: (newAmount * newSalePrice) - (newAmount * sale.avgCost)
                    };
                }
                return sale;
            });

            await onUpdateAsset({
                ...asset,
                sales: updatedSales
            });

            handleCancelEditSale();
        } catch (error) {
            console.error("Error updating sale:", error);
            alert("Satış kaydı güncellenirken bir hata oluştu.");
        }
    };

    const calculateProfitLoss = (asset) => {
        const totalCost = asset.amount * asset.cost;
        const currentValue = asset.amount * asset.price;
        const profit = currentValue - totalCost;
        const percentage = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        return { profit, percentage };
    };

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Yatırım</h2>
                    {lastUpdated && (
                        <p className="text-xs text-slate-500 mt-1">
                            Son Güncelleme: {lastUpdated.toLocaleTimeString()}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadRates}
                        disabled={loadingRates}
                        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                        title="Kurları Yenile"
                    >
                        <RefreshCw className={`w-6 h-6 ${loadingRates ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Market Rates Ticker */}
            {rates && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">USD</span>
                        <span className="text-sm font-bold text-emerald-400">
                            {rates.USD ? `${rates.USD.toFixed(2)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                        </span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">EUR</span>
                        <span className="text-sm font-bold text-emerald-400">
                            {rates.EUR ? `${rates.EUR.toFixed(2)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                        </span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">Gram Altın</span>
                        <span className="text-sm font-bold text-amber-400">
                            {rates.GOLD ? `${rates.GOLD.toFixed(0)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                        </span>
                    </div>
                </div>
            )}

            {/* Bulk Update Action */}
            {rates && assets.length > 0 && (
                <button
                    onClick={updateAssetPrices}
                    className="w-full mb-6 py-2 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-emerald-500/20"
                >
                    <ArrowUpRight className="w-4 h-4" />
                    Portföy Fiyatlarını Güncelle
                </button>
            )}

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-4 relative">
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {['stock', 'fund', 'gold', 'currency'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => {
                                    setType(t);
                                    if (t === 'gold') setName('Gram Altın');
                                    else setName('');
                                }}
                                className={`py-2 rounded-lg text-xs sm:text-sm font-medium capitalize transition-colors ${type === t ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {t === 'stock' ? 'Hisse' : t === 'fund' ? 'Fon' : t === 'gold' ? 'Altın' : 'Döviz'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="relative">
                            {type === 'currency' ? (
                                <select
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                                    required
                                >
                                    <option value="" disabled>Para Birimi Seçiniz</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            ) : type === 'gold' ? (
                                <input
                                    type="text"
                                    value="Gram Altın"
                                    readOnly
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-400 focus:outline-none cursor-not-allowed"
                                />
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder={type === 'stock' ? "Hisse Kodu" : type === 'fund' ? "Fon Kodu" : "Varlık Adı"}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onFocus={() => setShowSuggestions(true)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
                                        required
                                    />
                                    {/* Autocomplete Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {suggestions.map((item) => (
                                                <div
                                                    key={item.code}
                                                    onClick={() => handleSelectSuggestion(item.code)}
                                                    className="p-3 hover:bg-slate-700 cursor-pointer flex justify-between items-center border-b border-slate-700/50 last:border-0"
                                                >
                                                    <span className="font-bold text-white">{item.code}</span>
                                                    <span className="text-xs text-slate-400 truncate max-w-[180px]">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="number"
                                placeholder="Adet"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                required
                            />
                            <input
                                type="number"
                                placeholder="Birim Maliyet (₺)"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
                        >
                            Varlık Ekle
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-4">
                {assets.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        Henüz yatırım varlığı yok.
                    </div>
                ) : (
                    assets.map((rawAsset) => {
                        // Migrate on-the-fly
                        const asset = migrateFlatAssetToLots(rawAsset);
                        const { totalAmount, avgCost, currentPrice, totalValue, totalProfit, profitPercentage } = computeAggregatedValues(asset);
                        const isProfit = totalProfit >= 0;
                        const isExpanded = expandedAssets.has(asset.id);

                        return (
                            <div key={asset.id} className="bg-slate-900 rounded-xl border border-slate-800">
                                {/* Collapsed View - Main Asset Card */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${asset.type === 'gold' ? 'bg-amber-500/10 text-amber-400' :
                                                asset.type === 'currency' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    asset.type === 'fund' ? 'bg-blue-500/10 text-blue-400' :
                                                        'bg-indigo-500/10 text-indigo-400'
                                                }`}>
                                                {asset.type === 'gold' ? <Coins className="w-5 h-5" /> :
                                                    asset.type === 'currency' ? <Banknote className="w-5 h-5" /> :
                                                        asset.type === 'fund' ? <PieChart className="w-5 h-5" /> :
                                                            <TrendingUp className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-lg">{asset.name}</div>
                                                <div className="text-xs text-slate-400 capitalize">
                                                    {asset.type === 'stock' ? 'Hisse Senedi' : asset.type === 'fund' ? 'Yatırım Fonu' : asset.type === 'gold' ? 'Gram Altın' : 'Döviz'}
                                                    <span className="mx-1">•</span>
                                                    {totalAmount} Adet

                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-white text-lg">
                                                {formatCurrency(totalValue)}
                                            </div>
                                            <div className={`text-xs font-medium ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {isProfit ? '+' : ''}{formatCurrency(totalProfit)} ({isProfit ? '+' : ''}{profitPercentage.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800 text-sm">
                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-slate-500 text-xs block">Ort. Maliyet</span>
                                                <span className="text-slate-300">{formatCurrency(avgCost || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 text-xs block">Güncel Fiyat</span>
                                                <span className="text-white font-medium">{formatCurrency(currentPrice)}</span>
                                            </div>
                                        </div>

                                        {/* Expand/Collapse Button */}
                                        <button
                                            onClick={() => {
                                                setExpandedAssets(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(asset.id)) {
                                                        next.delete(asset.id);
                                                    } else {
                                                        next.add(asset.id);
                                                    }
                                                    return next;
                                                });
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                                            title={isExpanded ? "Daralt" : "Genişlet"}
                                        >
                                            {isExpanded ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsSelling(asset.id);
                                                setSaleForm({
                                                    amount: '',
                                                    salePrice: currentPrice
                                                });
                                            }}
                                            className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                                            title="Sat"
                                        >
                                            <ReceiptTurkishLira className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => onDeleteAsset(asset.id)}
                                            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Sale Form */}
                                {isSelling === asset.id && (
                                    <div className="border-t border-slate-800 p-4 bg-amber-500/5">
                                        <div className="text-sm font-semibold text-amber-400 mb-3">Satış İşlemi</div>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">
                                                        Satılacak Adet (Maks: {totalAmount})
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={totalAmount}
                                                        value={saleForm.amount}
                                                        onChange={(e) => setSaleForm(prev => ({ ...prev, amount: e.target.value }))}
                                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-amber-500"
                                                        placeholder="Adet"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-400 block mb-1">Satış Fiyatı (₺)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={saleForm.salePrice}
                                                        onChange={(e) => setSaleForm(prev => ({ ...prev, salePrice: e.target.value }))}
                                                        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-amber-500"
                                                        placeholder="Fiyat"
                                                    />
                                                </div>
                                            </div>

                                            {saleForm.amount && saleForm.salePrice && (
                                                <div className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                                                    Tahmini Kar/Zarar: {' '}
                                                    <span className={
                                                        (Number(saleForm.amount) * Number(saleForm.salePrice) - Number(saleForm.amount) * avgCost) >= 0
                                                            ? 'text-emerald-400'
                                                            : 'text-rose-400'
                                                    }>
                                                        {formatCurrency((Number(saleForm.amount) * Number(saleForm.salePrice)) - (Number(saleForm.amount) * avgCost))}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSale(asset)}
                                                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors"
                                                >
                                                    Satışı Onayla
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsSelling(null);
                                                        setSaleForm({ amount: '', salePrice: '' });
                                                    }}
                                                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
                                                >
                                                    İptal
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Expanded View - Individual Lots */}
                                {isExpanded && (
                                    <div className="border-t border-slate-800 p-4 space-y-2 bg-slate-900/50">
                                        {/* Tabs */}
                                        <div className="flex gap-2 mb-4 border-b border-slate-700/50 pb-2">
                                            <button
                                                onClick={() => setViewMode(prev => ({ ...prev, [asset.id]: 'lots' }))}
                                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${(viewMode[asset.id] || 'lots') === 'lots'
                                                    ? 'bg-indigo-500/20 text-indigo-400'
                                                    : 'text-slate-400 hover:text-slate-300'
                                                    }`}
                                            >
                                                Alımlar
                                            </button>
                                            <button
                                                onClick={() => setViewMode(prev => ({ ...prev, [asset.id]: 'sales' }))}
                                                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${viewMode[asset.id] === 'sales'
                                                    ? 'bg-amber-500/20 text-amber-400'
                                                    : 'text-slate-400 hover:text-slate-300'
                                                    }`}
                                            >
                                                Satımlar
                                            </button>
                                        </div>

                                        {/* Content */}
                                        {(viewMode[asset.id] || 'lots') === 'lots' ? (
                                            /* Lots List */
                                            <>
                                                {asset.lots.length === 0 && (
                                                    <div className="text-sm text-slate-500 text-center py-4">Henüz alım kaydı yok.</div>
                                                )}
                                                {asset.lots.map((lot, index) => {
                                                    const lotValue = lot.amount * lot.price;
                                                    const lotCostTotal = lot.amount * lot.cost;
                                                    const lotProfit = lotValue - lotCostTotal;
                                                    const lotProfitPercent = lotCostTotal > 0 ? (lotProfit / lotCostTotal) * 100 : 0;
                                                    const isLotProfit = lotProfit >= 0;
                                                    const isEditing = editingLot?.assetId === asset.id && editingLot?.lotId === lot.id;

                                                    return (
                                                        <div key={lot.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                            {isEditing ? (
                                                                /* Edit Mode */
                                                                <div className="space-y-3">
                                                                    <div className="flex gap-2">
                                                                        <div className="flex-1">
                                                                            <label className="text-xs text-slate-400 block mb-1">Adet</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editForm.amount}
                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                                                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="text-xs text-slate-400 block mb-1">Birim Maliyet (₺)</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editForm.cost}
                                                                                onChange={(e) => setEditForm(prev => ({ ...prev, cost: e.target.value }))}
                                                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleSaveLot(asset, lot.id)}
                                                                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition-colors"
                                                                        >
                                                                            Kaydet
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelEdit}
                                                                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
                                                                        >
                                                                            İptal
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Display Mode */
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                                                                            <span className="text-sm text-white font-medium">{lot.amount} Adet</span>
                                                                            <span className="text-xs text-slate-500">@{formatCurrency(lot.cost)}</span>
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">
                                                                            Toplam Maliyet: {formatCurrency(lotCostTotal)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="text-right">
                                                                            <div className="text-sm font-semibold text-white">{formatCurrency(lotValue)}</div>
                                                                            <div className={`text-xs ${isLotProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                {isLotProfit ? '+' : ''}{formatCurrency(lotProfit)} ({isLotProfit ? '+' : ''}{lotProfitPercent.toFixed(2)}%)
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <button
                                                                                onClick={() => handleEditLot(asset.id, lot)}
                                                                                className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                                                                                title="Düzenle"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteLot(asset, lot.id)}
                                                                                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                                                                                title="Sil"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            /* Sales List */
                                            <>
                                                {(!asset.sales || asset.sales.length === 0) && (
                                                    <div className="text-sm text-slate-500 text-center py-4">Henüz satış kaydı yok.</div>
                                                )}
                                                {(asset.sales || []).map((sale, index) => {
                                                    const isSaleProfit = sale.profit >= 0;
                                                    const isEditing = editingSale?.assetId === asset.id && editingSale?.saleId === sale.id;

                                                    return (
                                                        <div key={sale.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                                            {isEditing ? (
                                                                /* Edit Mode */
                                                                <div className="space-y-3">
                                                                    <div className="flex gap-2">
                                                                        <div className="flex-1">
                                                                            <label className="text-xs text-slate-400 block mb-1">Adet (Maks: {totalAmount + sale.amount})</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={totalAmount + sale.amount}
                                                                                value={editSaleForm.amount}
                                                                                onChange={(e) => setEditSaleForm(prev => ({ ...prev, amount: e.target.value }))}
                                                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-amber-500"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <label className="text-xs text-slate-400 block mb-1">Satış Fiyatı (₺)</label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={editSaleForm.salePrice}
                                                                                onChange={(e) => setEditSaleForm(prev => ({ ...prev, salePrice: e.target.value }))}
                                                                                className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-amber-500"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleSaveSale(asset, sale.id)}
                                                                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded transition-colors"
                                                                        >
                                                                            Kaydet
                                                                        </button>
                                                                        <button
                                                                            onClick={handleCancelEditSale}
                                                                            className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
                                                                        >
                                                                            İptal
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Display Mode */
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                                                                            <span className="text-sm text-white font-medium">{sale.amount} Adet</span>
                                                                            <span className="text-xs text-slate-500">@{formatCurrency(sale.salePrice)}</span>
                                                                        </div>
                                                                        <div className="text-xs text-slate-500">
                                                                            Ort. Maliyet: {formatCurrency(sale.avgCost)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-2">
                                                                        <div className="text-right">
                                                                            <div className="text-sm font-semibold text-white">{formatCurrency(sale.amount * sale.salePrice)}</div>
                                                                            <div className={`text-xs ${isSaleProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                {isSaleProfit ? '+' : ''}{formatCurrency(sale.profit)}
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-500 mt-1">
                                                                                {new Date(sale.soldAt).toLocaleDateString('tr-TR')}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <button
                                                                                onClick={() => handleEditSale(asset.id, sale)}
                                                                                className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                                                                                title="Düzenle"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                                </svg>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteSale(asset, sale.id)}
                                                                                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                                                                                title="Sil"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Portfolio;
