import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchMarketData } from '../services/marketData';

export const useMarketData = (assets = []) => {
    const [data, setData] = useState({
        USD: null,
        EUR: null,
        GOLD: null,
        specificPrices: {},
        lastUpdated: null,
        loading: false,
        error: null
    });

    const refresh = useCallback(async () => {
        setData(prev => ({ ...prev, loading: true }));
        try {
            const result = await fetchMarketData(assets);
            setData({ ...result, loading: false });
        } catch (err) {
            setData(prev => ({ ...prev, loading: false, error: err }));
        }
    }, [assets]); // assets dependency might cause re-fetch if array ref changes

    // Initial fetch
    useEffect(() => {
        refresh();
        // Optional: Auto-refresh every minute
        const interval = setInterval(refresh, 60000);
        return () => clearInterval(interval);
    }, [refresh]);

    // Helper to get price for a specific asset
    const getPrice = useCallback((asset) => {
        if (!asset) return 0;

        const assetName = (asset.name || '').toUpperCase();

        if (asset.type === 'currency') {
            if (assetName.includes('USD') || assetName.includes('DOLAR')) return data.USD || 0;
            if (assetName.includes('EUR') || assetName.includes('EURO')) return data.EUR || 0;
        }
        else if (asset.type === 'gold') {
            if (assetName.includes('ALTIN') || assetName.includes('GOLD')) return data.GOLD || 0;
        }
        else if ((asset.type === 'stock' || asset.type === 'fund')) {
            return data.specificPrices[assetName] || 0;
        }

        return 0;
    }, [data]);

    return { ...data, getPrice, refresh };
};
