
// Determine API base URL based on environment
// In production (Vercel), use relative paths (/api/...)
// In development, use localhost:3001
const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

// Free API for currencies (USD, EUR only)
const CURRENCY_API_URL = `${API_BASE_URL}/api/fx`;

// Stock data via backend proxy (bypasses CORS)
const STOCKS_API_URL = `${API_BASE_URL}/api/stocks`;

// Fallback manual rates
const FALLBACK_RATES = {
    USD: 43.13,
    EUR: 50.25,
    GOLD: 6220.00, // Gram Altın
    SILVER: 108.00  // Gram Gümüş
};

// Cache for Stock Data (TradingView)
let cachedStockData = [];
let lastStockFetch = 0;
const CACHE_DURATION = 1000 * 60 * 1; // 1 minute cache for live prices

// Static List of TEFAS Fund Codes for Autocomplete (Updated from Excel 2026-07-29)
export const TEFAS_FUNDS = [
    { code: 'AC1' }, { code: 'AIS' }, { code: 'BAI' }, { code: 'BCO' }, { code: 'BDA' }, { code: 'BKY' }, { code: 'BTK' }, { code: 'BVK' }, { code: 'CKF' }, { code: 'CKS' },
    { code: 'CPU' }, { code: 'CVK' }, { code: 'CVL' }, { code: 'DKH' }, { code: 'DKL' }, { code: 'DNK' }, { code: 'DNP' }, { code: 'DPK' }, { code: 'EKF' }, { code: 'ELZ' },
    { code: 'EP1' }, { code: 'EPA' }, { code: 'EPI' }, { code: 'EPK' }, { code: 'FAK' }, { code: 'FBC' }, { code: 'FCK' }, { code: 'FFH' }, { code: 'FTL' }, { code: 'GKF' },
    { code: 'GKH' }, { code: 'GKV' }, { code: 'GLS' }, { code: 'GO2' }, { code: 'GOL' }, { code: 'GOP' }, { code: 'GPF' }, { code: 'GPN' }, { code: 'GUK' }, { code: 'HAM' },
    { code: 'HCV' }, { code: 'HFI' }, { code: 'HFO' }, { code: 'HKH' }, { code: 'HPH' }, { code: 'IAT' }, { code: 'IAY' }, { code: 'IV8' }, { code: 'IVF' }, { code: 'KAV' },
    { code: 'KCL' }, { code: 'KCR' }, { code: 'KCV' }, { code: 'KDE' }, { code: 'KDL' }, { code: 'KDT' }, { code: 'KGM' }, { code: 'KH1' }, { code: 'KHC' }, { code: 'KHJ' },
    { code: 'KIK' }, { code: 'KIS' }, { code: 'KKC' }, { code: 'KKL' }, { code: 'KLH' }, { code: 'KLI' }, { code: 'KLS' }, { code: 'KLU' }, { code: 'KME' }, { code: 'KMF' },
    { code: 'KMN' }, { code: 'KNJ' }, { code: 'KPA' }, { code: 'KPC' }, { code: 'KPD' }, { code: 'KPI' }, { code: 'KPU' }, { code: 'KSK' }, { code: 'KSR' }, { code: 'KST' },
    { code: 'KSV' }, { code: 'KTI' }, { code: 'KTJ' }, { code: 'KTM' }, { code: 'KTN' }, { code: 'KTR' }, { code: 'KTS' }, { code: 'KTT' }, { code: 'KTV' }, { code: 'KU3' },
    { code: 'KUA' }, { code: 'KUD' }, { code: 'KUT' }, { code: 'KVK' }, { code: 'KVR' }, { code: 'KZL' }, { code: 'KZU' }, { code: 'LKF' }, { code: 'MAC' }, { code: 'MKA' },
    { code: 'MKG' }, { code: 'MPE' }, { code: 'MPF' }, { code: 'MPK' }, { code: 'MPS' }, { code: 'MTK' }, { code: 'NAK' }, { code: 'NJF' }, { code: 'NJY' }, { code: 'NKA' },
    { code: 'NKM' }, { code: 'NKT' }, { code: 'NME' }, { code: 'NSA' }, { code: 'NSP' }, { code: 'NVK' }, { code: 'NZU' }, { code: 'OGD' }, { code: 'OHK' }, { code: 'OTJ' },
    { code: 'OTK' }, { code: 'PA2' }, { code: 'PBK' }, { code: 'PDD' }, { code: 'PHK' }, { code: 'PK1' }, { code: 'PKD' }, { code: 'PKF' }, { code: 'PKM' }, { code: 'PKP' },
    { code: 'PKR' }, { code: 'PKT' }, { code: 'PP1' }, { code: 'PPG' }, { code: 'PPK' }, { code: 'PRR' }, { code: 'PUK' }, { code: 'PVK' }, { code: 'RBA' }, { code: 'RBH' },
    { code: 'RBK' }, { code: 'RBR' }, { code: 'RBT' }, { code: 'RBV' }, { code: 'RCV' }, { code: 'RJG' }, { code: 'RKH' }, { code: 'RKS' }, { code: 'RKV' }, { code: 'RPI' },
    { code: 'RRP' }, { code: 'SPT' }, { code: 'TAL' }, { code: 'TCA' }, { code: 'TIL' }, { code: 'TLK' }, { code: 'TLV' }, { code: 'TLZ' }, { code: 'TPZ' }, { code: 'TRU' },
    { code: 'TTE' }, { code: 'TVE' }, { code: 'VFK' }, { code: 'VFO' }, { code: 'VHS' }, { code: 'VKK' }, { code: 'VKV' }, { code: 'VLT' }, { code: 'VPA' }, { code: 'VRK' },
    { code: 'YCY' }, { code: 'YFV' }, { code: 'YHK' }, { code: 'YSL' }, { code: 'ZBI' }, { code: 'ZCK' }, { code: 'ZP6' }, { code: 'ZP8' }, { code: 'ZP9' }, { code: 'ZPE' },
    { code: 'ZPF' }, { code: 'ZPG' }, { code: 'ZPO' }
];

// Fetch all stocks from TradingView (via backend proxy)
// src/services/marketData.js
export const fetchStockData = async () => {
    const now = Date.now();
    if (cachedStockData.length > 0 && (now - lastStockFetch < CACHE_DURATION)) {
        console.log('[fetchStockData] Using cached data');
        return cachedStockData;
    }

    console.log('[fetchStockData] Fetching fresh data from backend (TradingView)...');
    try {
        const response = await fetch(STOCKS_API_URL);
        console.log('[fetchStockData] Response status:', response.status);

        // Backend her zaman JSON dizi döndürür
        const data = await response.json();

        console.log('[fetchStockData] Fetched', data.length, 'stocks');
        cachedStockData = data;
        lastStockFetch = now;
        return data;
    } catch (e) {
        console.error('[fetchStockData] Failed to fetch stock data', e);
        return [];
    }
};

// Search stocks using cached data
export const searchStocks = async (query) => {
    console.log('[searchStocks] Called with query:', query);
    if (cachedStockData.length === 0) {
        console.log('[searchStocks] Cache empty, fetching...');
        await fetchStockData();
        console.log('[searchStocks] Fetched data, count:', cachedStockData.length);
    }
    const q = query.toUpperCase();
    const results = cachedStockData
        .filter(item => item.Code && item.Code.startsWith(q))
        .slice(0, 5)
        .map(item => ({ code: item.Code, name: item.Code })); // Using Code as name 
    console.log('[searchStocks] Results:', results);
    return results;
};

// Helper to fetch BIST data (TradingView)
const fetchStockPrice = async (code) => {
    try {
        if (cachedStockData.length === 0) {
            await fetchStockData();
        }
        const stock = cachedStockData.find(item => item.Code === code.toUpperCase());
        return stock ? stock.Last : null;
    } catch (e) {
        console.warn(`Failed to fetch stock price for ${code}`, e);
        return null;
    }
};

// Helper to fetch Fund data via backend proxy (TEFAS)
const fetchFundPrice = async (code) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/fund/${code}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.price;
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
        let silverRate = null;

        if (Array.isArray(fxData)) {
            const usdEntry = fxData.find(item => item.Code === 'USDTRY');
            const eurEntry = fxData.find(item => item.Code === 'EURTRY');
            const goldEntry = fxData.find(item => item.Code === 'GAUTRY'); // Gram Altın
            const silverEntry = fxData.find(item => item.Code === 'XAGTRY'); // Ons Gümüş (TRY)

            if (usdEntry && typeof usdEntry.Last === 'number') usdRate = usdEntry.Last;
            if (eurEntry && typeof eurEntry.Last === 'number') eurRate = eurEntry.Last;
            if (goldEntry && typeof goldEntry.Last === 'number') goldRate = goldEntry.Last;
            // XAGTRY is ounce price, divide by 31.10 to get gram price
            if (silverEntry && typeof silverEntry.Last === 'number') {
                silverRate = silverEntry.Last / 31.10;
            } else {
                silverRate = FALLBACK_RATES.SILVER;
            }
        }

        const marketData = {
            USD: usdRate,
            EUR: eurRate,
            GOLD: goldRate,
            SILVER: silverRate,
            lastUpdated: new Date().toISOString()
        };

        // 2. Fetch Specific Asset Prices (Stocks & Funds) - Parallelized
        const specificPrices = {};

        // Pre-fetch stock data if there are stocks
        const hasStocks = assets.some(a => a.type === 'stock');
        if (hasStocks) {
            await fetchStockData();
        }

        // Create an array of promises for all asset price fetches
        const fetchPromises = assets.map(async (asset) => {
            const cleanName = (asset.name || '').trim().toUpperCase();
            if (!cleanName) return null;

            if (asset.type === 'stock') {
                const price = await fetchStockPrice(cleanName);
                if (price) return { name: cleanName, price };
            }
            if (asset.type === 'fund') {
                const price = await fetchFundPrice(cleanName);
                if (price) return { name: cleanName, price };
            }
            return null;
        });

        // Wait for all fetches to complete in parallel
        const results = await Promise.all(fetchPromises);

        // Populate specificPrices from results
        results.forEach(result => {
            if (result) {
                specificPrices[result.name] = result.price;
            }
        });

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
            SILVER: null,
            specificPrices: {},
            lastUpdated: new Date().toISOString(),
            error: true
        };
    }
};
