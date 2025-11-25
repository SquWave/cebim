import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, RefreshCw, Trash2, Coins, Banknote, ArrowUpRight, PieChart, Search } from 'lucide-react';
import { fetchMarketData, searchStocks, TEFAS_FUNDS } from '../services/marketData';

const Portfolio = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [cost, setCost] = useState(''); // Unit Cost (Maliyet)
    const [type, setType] = useState('stock'); // stock, fund, gold, currency
    const [rates, setRates] = useState(null);
    const [specificPrices, setSpecificPrices] = useState({});
    const [loadingRates, setLoadingRates] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        loadRates();
    }, []);

    // Autocomplete Logic
    useEffect(() => {
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

    const updateAssetPrices = () => {
        if (!rates) return;
        let updatedCount = 0;

        assets.forEach(asset => {
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

            if (newPrice) {
                onUpdateAsset({ ...asset, price: newPrice });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            alert(`${updatedCount} varlığın fiyatı güncel piyasa verileriyle yenilendi.`);
        } else {
            alert('Güncellenebilecek uygun varlık bulunamadı veya veri çekilemedi.');
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
        // If it's a stock, try to fetch the current price immediately
        else if (type === 'stock' && rates && rates.specificPrices) {
            const stockCode = name.toUpperCase();
            // Trigger a refresh to get this specific stock's price
            const data = await fetchMarketData([{ name: stockCode, type: 'stock' }]);
            if (data.specificPrices && data.specificPrices[stockCode]) {
                initialPrice = data.specificPrices[stockCode];
                console.log('[handleSubmit] Fetched live price for', stockCode, ':', initialPrice);
            }
        }

        onAddAsset({
            id: Date.now(),
            name: name.toUpperCase(),
            amount: Number(amount),
            cost: Number(cost),
            price: initialPrice,
            type,
        });

        setName('');
        setAmount('');
        setCost('');
        setIsAdding(false);
        setSuggestions([]);

        // Reload all rates to include the new asset
        loadRates();
    };

    const handleSelectSuggestion = (code) => {
        setName(code);
        setShowSuggestions(false);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
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
                    <h2 className="text-2xl font-bold text-white">Portföy</h2>
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
                        <span className="text-sm font-bold text-emerald-400">{rates.USD?.toFixed(2)} ₺</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">EUR</span>
                        <span className="text-sm font-bold text-emerald-400">{rates.EUR?.toFixed(2)} ₺</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">Altın</span>
                        <span className="text-sm font-bold text-amber-400">{rates.GOLD?.toFixed(0)} ₺</span>
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
                                onClick={() => setType(t)}
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
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder={type === 'stock' ? "Hisse Kodu (örn: THYAO)" : type === 'fund' ? "Fon Kodu (örn: MAC)" : "Varlık Adı (örn: USD)"}
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
                                placeholder="Birim Maliyet (TL)"
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
                    assets.map((asset) => {
                        const { profit, percentage } = calculateProfitLoss(asset);
                        const isProfit = profit >= 0;

                        return (
                            <div key={asset.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800">
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
                                                {asset.type === 'stock' ? 'Hisse Senedi' : asset.type === 'fund' ? 'Yatırım Fonu' : asset.type === 'gold' ? 'Altın/Emtia' : 'Döviz'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-white text-lg">
                                            {formatCurrency(Number(asset.amount) * Number(asset.price))}
                                        </div>
                                        <div className={`text-xs font-medium ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isProfit ? '+' : ''}{formatCurrency(profit)} ({isProfit ? '+' : ''}{percentage.toFixed(2)}%)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-3 border-t border-slate-800 text-sm">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-slate-500 text-xs block">Maliyet</span>
                                            <span className="text-slate-300">{formatCurrency(asset.cost || 0)}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-xs block">Güncel Fiyat</span>
                                            <span className="text-white font-medium">{formatCurrency(asset.price)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDeleteAsset(asset.id)}
                                        className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Portfolio;
