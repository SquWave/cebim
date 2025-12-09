import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, RefreshCw, Trash2, Coins, Banknote, ArrowUpRight, PieChart, ReceiptTurkishLira } from 'lucide-react';
import { fetchMarketData } from '../services/marketData';
import { migrateFlatAssetToLots, computeAggregatedValues } from '../utils/assetHelpers';
import { formatCurrency } from '../utils/formatters';
import MarketRatesTicker from './portfolio/MarketRatesTicker';
import AssetCategoryList from './portfolio/AssetCategoryList';
import { usePortfolioForm } from '../hooks/usePortfolioForm';
import { usePortfolioOperations } from '../hooks/usePortfolioOperations';


const Portfolio = ({ assets, onAddAsset, onUpdateAsset, onDeleteAsset, privacyMode = false }) => {
    // Market data state
    const [rates, setRates] = useState(null);
    const [specificPrices, setSpecificPrices] = useState({});
    const [loadingRates, setLoadingRates] = useState(false);

    // Use custom hooks for form and operations
    const formHook = usePortfolioForm({ assets, onAddAsset, onUpdateAsset, rates });
    const opsHook = usePortfolioOperations({ onUpdateAsset, onDeleteAsset });

    // Destructure form hook values
    const {
        isAdding, setIsAdding,
        name, setName,
        amount, setAmount,
        cost, setCost,
        type, setType,
        suggestions, showSuggestions, setShowSuggestions,
        handleSelectSuggestion, handleSubmit
    } = formHook;

    // Destructure operations hook values
    const {
        editingLot, editForm, setEditForm,
        handleEditLot, handleSaveLot, handleCancelEdit, handleDeleteLot,
        isSelling, setIsSelling, saleForm, setSaleForm,
        viewMode, setViewMode,
        editingSale, editSaleForm, setEditSaleForm,
        handleSale, handleDeleteSale, handleEditSale, handleCancelEditSale, handleSaveSale,
        expandedAssets, setExpandedAssets
    } = opsHook;

    // Load rates on mount
    useEffect(() => {
        loadRates();
    }, []);

    // Auto-update prices when rates are loaded
    useEffect(() => {
        if (rates && assets.length > 0) {
            updateAssetPrices(true);
        }
    }, [rates]);

    const loadRates = async () => {
        setLoadingRates(true);
        const data = await fetchMarketData(assets);
        setRates(data);
        if (data.specificPrices) {
            setSpecificPrices(data.specificPrices);
        }
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

            const currentPrice = asset.lots[0]?.price || 0;

            if (newPrice && newPrice !== currentPrice) {
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

    const calculateProfitLoss = (asset) => {
        const totalCost = asset.amount * asset.cost;
        const currentValue = asset.amount * asset.price;
        const profit = currentValue - totalCost;
        const percentage = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        return { profit, percentage };
    };

    // Calculate total investment value
    const totalInvestmentValue = assets.reduce((sum, rawAsset) => {
        const asset = migrateFlatAssetToLots(rawAsset);
        const { totalValue } = computeAggregatedValues(asset);
        return sum + totalValue;
    }, 0);

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Yatırım</h2>
                    <div className="text-sm text-slate-400">
                        Toplam Varlık: {privacyMode ? '₺***' : formatCurrency(totalInvestmentValue)}
                    </div>
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
            <MarketRatesTicker rates={rates} />

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

            <AssetCategoryList
                assets={assets}
                privacyMode={privacyMode}
                formatCurrency={formatCurrency}
                renderAssetCard={(rawAsset, computed) => {
                    const asset = migrateFlatAssetToLots(rawAsset);
                    const { totalAmount, avgCost, currentPrice, totalValue, totalProfit, profitPercentage } = computed || computeAggregatedValues(asset);
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
                                                {privacyMode ? '***' : totalAmount} Adet

                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-white text-lg">
                                            {formatCurrency(totalValue)}
                                        </div>
                                        <div className={`text-xs font-medium ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {privacyMode ? '***' : `${isProfit ? '+' : ''}${formatCurrency(totalProfit)} (${isProfit ? '+' : ''}${profitPercentage.toFixed(2)}%)`}
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
                                        onClick={() => {
                                            if (confirm('Bu varlığı silmek istediğinize emin misiniz? Tüm alım ve satış kayıtları da silinecektir.')) {
                                                onDeleteAsset(asset.id);
                                            }
                                        }}
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
                }}
            />
        </div>
    );
};

export default Portfolio;
