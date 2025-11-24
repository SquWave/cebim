// Free API for currencies
// We fetch base=TRY to get 1 TRY = X USD. Then we invert to get 1 USD = Y TRY.
const CURRENCY_API_URL = 'https://api.frankfurter.app/latest?from=TRY&to=USD,EUR,GBP,CHF,CAD';

// Fallback manual rates
const FALLBACK_RATES = {
    USD: 34.50,
    EUR: 36.20,
    GBP: 43.50,
    CHF: 39.00,
    CAD: 24.80,
    GOLD: 2950.00 // Gram Altın
};

// Helper to fetch BIST data (Yahoo Finance)
// Note: Direct browser calls to Yahoo Finance often fail due to CORS. 
// In a real production app, this should go through a backend proxy.
const fetchStockPrice = async (code) => {
    try {
        const symbol = code.toUpperCase().endsWith('.IS') ? code.toUpperCase() : `${code.toUpperCase()}.IS`;
        // Using a public CORS proxy for demo purposes. 
        // If this fails, we return null so user can enter manually.
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        return price;
    } catch (e) {
        console.warn(`Failed to fetch stock price for ${code}`, e);
        return null;
    }
};

// Helper to fetch Fund data (TEFAS via proxy or fallback)
const fetchFundPrice = async (code) => {
    try {
        // TEFAS data is hard to get directly. 
        // For this MVP, we will try to fetch from a public financial data endpoint if available.
        // Currently simulating a fetch or using a mock for common funds.
        // In a real app, we would scrape TEFAS or use a paid API.

        // Mocking some popular funds for demonstration
        const MOCK_FUNDS = {
            'MAC': 0.5423,
            'TTE': 4.2312,
            'AFT': 0.8912,
            'YAS': 1.2345
        };

        return MOCK_FUNDS[code.toUpperCase()] || null;
    } catch (e) {
        console.warn(`Failed to fetch fund price for ${code}`, e);
        return null;
    }
};

export const fetchMarketData = async (assets = []) => {
    try {
        // 1. Fetch Currency Rates
        const currencyResponse = await fetch(CURRENCY_API_URL);
        const currencyData = await currencyResponse.json();
        const rates = currencyData.rates; // 1 TRY = X Currency

        const marketData = {
            USD: 1 / rates.USD,
            EUR: 1 / rates.EUR,
            GBP: 1 / rates.GBP,
            CHF: 1 / rates.CHF,
            CAD: 1 / rates.CAD,
            GOLD: FALLBACK_RATES.GOLD, // Still using fallback for Gold
            lastUpdated: new Date().toISOString()
        };

        // 2. Fetch Specific Asset Prices (Stocks & Funds)
        // We only fetch for assets that are currently in the portfolio to save bandwidth
        const specificPrices = {};

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
            ...FALLBACK_RATES,
            specificPrices: {},
            lastUpdated: new Date().toISOString(),
            error: true
        };
    }
};
