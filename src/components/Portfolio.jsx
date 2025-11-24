import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, RefreshCw, Trash2, Coins, Banknote, ArrowUpRight } from 'lucide-react';
import { fetchMarketData } from '../services/marketData';

const Portfolio = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [price, setPrice] = useState('');
    const [type, setType] = useState('stock'); // stock, gold, currency
    const [rates, setRates] = useState(null);
    const [loadingRates, setLoadingRates] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        setLoadingRates(true);
        const data = await fetchMarketData();
        setRates(data);
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
                if (assetName.includes('EUR') || assetName.includes('EURO')) newPrice = rates.EUR;
            } else if (asset.type === 'gold') {
                if (assetName.includes('ALTIN') || assetName.includes('GOLD')) newPrice = rates.GOLD;
            }

            if (newPrice) {
                onUpdateAsset({ ...asset, price: newPrice });
                updatedCount++;
            }
        });

        if (updatedCount > 0) {
            alert(`${updatedCount} varlığın fiyatı güncel piyasa verileriyle yenilendi.`);
        } else {
            alert('Güncellenebilecek uygun varlık bulunamadı (USD, EUR veya Altın).');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !amount || !price) return;

        onAddAsset({
            id: Date.now(),
            name,
            amount: Number(amount),
            price: Number(price),
            type,
        });

        setName('');
        setAmount('');
        setPrice('');
        setIsAdding(false);
    };

    const handlePriceUpdate = (id, newPrice) => {
        const asset = assets.find(a => a.id === id);
        if (asset) {
            onUpdateAsset({ ...asset, price: Number(newPrice) });
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
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
                        <span className="text-xs text-slate-500 mb-1">Dolar (USD)</span>
                        <span className="text-sm font-bold text-emerald-400">{rates.USD.toFixed(2)} ₺</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">Euro (EUR)</span>
                        <span className="text-sm font-bold text-emerald-400">{rates.EUR.toFixed(2)} ₺</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                        <span className="text-xs text-slate-500 mb-1">Gram Altın</span>
                        <span className="text-sm font-bold text-amber-400">{rates.GOLD.toFixed(0)} ₺</span>
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
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {['stock', 'gold', 'currency'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${type === t ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50' : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {t === 'stock' ? 'Hisse' : t === 'gold' ? 'Altın' : 'Döviz'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Varlık Adı (örn: USD, Gram Altın)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            required
                        />
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
                                placeholder="Birim Fiyat (TL)"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
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
                    assets.map((asset) => (
                        <div key={asset.id} className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${asset.type === 'gold' ? 'bg-amber-500/10 text-amber-400' :
                                            asset.type === 'currency' ? 'bg-emerald-500/10 text-emerald-400' :
                                                'bg-indigo-500/10 text-indigo-400'
                                        }`}>
                                        {asset.type === 'gold' ? <Coins className="w-5 h-5" /> :
                                            asset.type === 'currency' ? <Banknote className="w-5 h-5" /> :
                                                <TrendingUp className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-lg">{asset.name}</div>
                                        <div className="text-xs text-slate-400 capitalize">
                                            {asset.type === 'stock' ? 'Hisse Senedi' : asset.type === 'gold' ? 'Altın/Emtia' : 'Döviz'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-lg">
                                        {formatCurrency(Number(asset.amount) * Number(asset.price))}
                                    </div>
                                    <div className="text-xs text-slate-400">{asset.amount} Adet</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">Fiyat:</span>
                                    <input
                                        type="number"
                                        value={asset.price}
                                        onChange={(e) => handlePriceUpdate(asset.id, e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 pl-12 text-sm text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={() => onDeleteAsset(asset.id)}
                                    className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
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

export default Portfolio;
