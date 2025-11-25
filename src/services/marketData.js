
// Free API for currencies (USD, EUR only)
const CURRENCY_API_URL = 'http://localhost:3001/api/fx';

// Stock data via backend proxy (bypasses CORS)
const MIDAS_API_URL = 'http://localhost:3001/api/stocks';

// Fallback manual rates
const FALLBACK_RATES = {
    USD: 34.50,
    EUR: 36.20,
    GOLD: 2950.00 // Gram Altın
};

// Cache for Midas Data
let cachedStockData = [];
let lastStockFetch = 0;
const CACHE_DURATION = 1000 * 60 * 1; // 1 minute cache for live prices

// Static List of Popular TEFAS Funds for Autocomplete
export const TEFAS_FUNDS = [
    { code: 'MAC', name: 'Marmara Capital Hisse Senedi Fonu' },
    { code: 'TTE', name: 'İş Portföy BIST Teknoloji Ağırlıklı Sınırlamalı Endeks Hisse Senedi Fonu' },
    { code: 'AFT', name: 'Ak Portföy Yeni Teknolojiler Yabancı Hisse Senedi Fonu' },
    { code: 'YAS', name: 'Yapı Kredi Portföy Koç Holding İştirakleri Hisse Senedi Fonu' },
    { code: 'NNF', name: 'Hedef Portföy Birinci Hisse Senedi Fonu' },
    { code: 'GMR', name: 'Inveo Portföy İkinci Hisse Senedi Fonu' },
    { code: 'IPB', name: 'İstanbul Portföy Birinci Değişken Fon' },
    { code: 'TI2', name: 'İş Portföy İştirak Hisse Senedi Fonu' },
    { code: 'ST1', name: 'Strateji Portföy Birinci Hisse Senedi Fonu' },
    { code: 'IDH', name: 'İş Portföy BIST 100 Dışı Şirketler Hisse Senedi Fonu' }
];

// Fetch all stocks from Midas
// src/services/marketData.js
export const fetchMidasStocks = async () => {
    const now = Date.now();
    if (cachedStockData.length > 0 && (now - lastStockFetch < CACHE_DURATION)) {
        console.log('[fetchMidasStocks] Using cached data');
        return cachedStockData;
    }

    console.log('[fetchMidasStocks] Fetching fresh data from backend...');
    try {
        const response = await fetch(MIDAS_API_URL);
        console.log('[fetchMidasStocks] Response status:', response.status);

        // Backend her zaman JSON dizi döndürür → json() ile ayrıştır
        const data = await response.json();

        console.log('[fetchMidasStocks] Data type:', typeof data, 'Is array:', Array.isArray(data));
        console.log('[fetchMidasStocks] Fetched', data.length, 'stocks');
        cachedStockData = data;
        lastStockFetch = now;
        return data;
    } catch (e) {
        console.error('[fetchMidasStocks] Failed to fetch Midas data', e);
        return [];
    }
};

// Search stocks using cached Midas data
export const searchStocks = async (query) => {
    console.log('[searchStocks] Called with query:', query);
    if (cachedStockData.length === 0) {
        console.log('[searchStocks] Cache empty, fetching...');
        await fetchMidasStocks();
        console.log('[searchStocks] Fetched data, count:', cachedStockData.length);
    }
    const q = query.toUpperCase();
    const results = cachedStockData
        .filter(item => item.Code && item.Code.startsWith(q))
        .slice(0, 5)
        .map(item => ({ code: item.Code, name: item.Code })); // Midas data doesn't have full name, using Code
    console.log('[searchStocks] Results:', results);
    return results;
};

// Helper to fetch BIST data (Midas API)
const fetchStockPrice = async (code) => {
    try {
        if (cachedStockData.length === 0) {
            await fetchMidasStocks();
        }
        const stock = cachedStockData.find(item => item.Code === code.toUpperCase());
        return stock ? stock.Last : null;
    } catch (e) {
        console.warn(`Failed to fetch stock price for ${code}`, e);
        return null;
    }
};

// Helper to fetch Fund data (Mock for now as TEFAS has no public API)
const fetchFundPrice = async (code) => {
    try {
        // Mocking prices for demo purposes since TEFAS scraping is complex client-side
        const MOCK_PRICES = {
            'MAC': 0.5423, 'TTE': 4.2312, 'AFT': 0.8912, 'YAS': 1.2345,
            'NNF': 2.3412, 'GMR': 1.1234, 'IPB': 3.4512, 'TI2': 5.6712,
            'ST1': 0.4512, 'IDH': 1.8912
        };
        return MOCK_PRICES[code.toUpperCase()] || (Math.random() * 5).toFixed(4); // Random fallback for demo
    } catch (e) {
        console.warn(`Failed to fetch fund price for ${code}`, e);
        return null;
    }
};

export const fetchMarketData = async (assets = []) => {
    try {
        // 1. Fetch FX rates (USDTRY, EURTRY, GAUTRY)
        const fxResponse = await fetch(CURRENCY_API_URL);
        const fxData = await fxResponse.json();

        let usdRate = null;
        let eurRate = null;
        let goldRate = null;

        if (Array.isArray(fxData)) {
            const usdEntry = fxData.find(item => item.Code === 'USDTRY');
            const eurEntry = fxData.find(item => item.Code === 'EURTRY');
            const goldEntry = fxData.find(item => item.Code === 'GAUTRY'); // Gram Altın

            if (usdEntry && typeof usdEntry.Last === 'number') usdRate = usdEntry.Last;
            if (eurEntry && typeof eurEntry.Last === 'number') eurRate = eurEntry.Last;
            if (goldEntry && typeof goldEntry.Last === 'number') goldRate = goldEntry.Last;
        }

        const marketData = {
            USD: usdRate,
            EUR: eurRate,
            GOLD: goldRate,
            lastUpdated: new Date().toISOString()
        };

        // 2. Fetch Specific Asset Prices (Stocks & Funds)
        const specificPrices = {};

        // Pre-fetch Midas data if there are stocks
        const hasStocks = assets.some(a => a.type === 'stock');
        if (hasStocks) {
            await fetchMidasStocks();
        }

        for (const asset of assets) {
            if (asset.type === 'stock' && asset.name) {
                const price = await fetchStockPrice(asset.name);
                if (price) specificPrices[asset.name.toUpperCase()] = price;
            }
            if (asset.type === 'fund' && asset.name) {
                const price = await fetchFundPrice(asset.name);
                if (price) specificPrices[asset.name.toUpperCase()] = price;
            }
        }

        return {
            ...marketData,
            specificPrices,
            error: false
        };

    } catch (error) {
        console.error("Market data fetch failed:", error);
        return {
            USD: null,
            EUR: null,
            GOLD: null,
            specificPrices: {},
            lastUpdated: new Date().toISOString(),
            error: true
        };
    }
};
