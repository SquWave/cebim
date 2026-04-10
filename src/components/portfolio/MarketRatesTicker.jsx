import React from 'react';

/**
 * Market Rates Ticker
 * Displays USD, EUR, Gold, and Silver rates
 */
const MarketRatesTicker = ({ rates }) => {
    if (!rates) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center h-full">
                <span className="text-xs text-slate-500 mb-1 whitespace-nowrap">USD</span>
                <span className="text-sm font-bold text-emerald-400">
                    {rates.USD ? `${rates.USD.toFixed(2)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center h-full">
                <span className="text-xs text-slate-500 mb-1 whitespace-nowrap">EUR</span>
                <span className="text-sm font-bold text-emerald-400">
                    {rates.EUR ? `${rates.EUR.toFixed(2)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center h-full">
                <span className="text-xs text-slate-500 mb-1 whitespace-nowrap">Gr. Altın</span>
                <span className="text-sm font-bold text-amber-400">
                    {rates.GOLD ? `${rates.GOLD.toFixed(0)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center h-full">
                <span className="text-xs text-slate-500 mb-1 whitespace-nowrap">Gr. Gümüş</span>
                <span className="text-sm font-bold text-gray-300">
                    {rates.SILVER ? `${rates.SILVER.toFixed(2)} ₺` : <span className="text-rose-500 text-xs">Veri Yok</span>}
                </span>
            </div>
        </div>
    );
};

export default MarketRatesTicker;
