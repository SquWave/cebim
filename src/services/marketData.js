
// Free API for currencies (USD, EUR)
const CURRENCY_API_URL = 'https://api.frankfurter.app/latest?from=TRY&to=USD,EUR';

// Fallback manual rates in case API fails
const FALLBACK_RATES = {
    USD: 34.50,
    EUR: 36.20,
    GOLD: 2950.00 // Gram Altın (TRY)
};

export const fetchMarketData = async () => {
    try {
        // 1. Fetch Currency Rates (USD/TRY, EUR/TRY)
        // Frankfurter API gives rates relative to base. 
        // If base is TRY, it gives how many USD is 1 TRY (e.g. 0.03). 
        // We want how many TRY is 1 USD. So we fetch from USD,EUR to TRY.
        const currencyResponse = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY');
        const eurResponse = await fetch('https://api.frankfurter.app/latest?from=EUR&to=TRY');

        const usdData = await currencyResponse.json();
        const eurData = await eurResponse.json();

        // 2. Fetch Gold Prices
        // Finding a free, CORS-friendly Gold API is hard. 
        // For this MVP, we will try to fetch from a public JSON if available, 
        // otherwise we might need to use a proxy or fallback.
        // Let's use a mock fetch for gold for now or a known free endpoint if possible.
        // Since reliable free Gold APIs are scarce, we'll use a fixed estimated rate for now 
        // or try to scrape/fetch from a benign source if possible. 
        // For stability, we will use a hardcoded value for Gold in this iteration 
        // but structure it so it can be easily replaced.

        // Simulating Gold API fetch
        const goldRate = FALLBACK_RATES.GOLD;

        return {
            USD: usdData.rates.TRY,
            EUR: eurData.rates.TRY,
            GOLD: goldRate,
            lastUpdated: new Date().toISOString()
        };

    } catch (error) {
        console.error("Market data fetch failed:", error);
        return {
            USD: FALLBACK_RATES.USD,
            EUR: FALLBACK_RATES.EUR,
            GOLD: FALLBACK_RATES.GOLD,
            lastUpdated: new Date().toISOString(),
            error: true
        };
    }
};
