import express from 'express';
import cors from 'cors';


const app = express();
const PORT = 3001;

// Midas API URLs
const MIDAS_API_URL = 'https://www.getmidas.com/wp-json/midas-api/v1/midas_table_data?sortId=&return=table';
const MIDAS_FX_URL = 'https://www.getmidas.com/wp-json/midas-api/v1/midas_table_data?sortId=&return=doviz';

// Enable CORS for frontend requests
app.use(cors());

// Simple In-Memory Cache
const cache = {
    stocks: { data: null, time: 0 },
    fx: { data: null, time: 0 },
    funds: {} // Map: code -> { price, time }
};

const CACHE_DURATION = {
    STOCKS: 60 * 1000, // 1 minute
    FX: 60 * 1000,     // 1 minute
    FUNDS: 4 * 60 * 60 * 1000 // 4 hours (Funds update once daily)
};

const isCacheValid = (timestamp, duration) => {
    return (Date.now() - timestamp) < duration;
};

// Proxy endpoint for stock data
app.get('/api/stocks', async (req, res) => {
    try {
        if (isCacheValid(cache.stocks.time, CACHE_DURATION.STOCKS)) {
            console.log('[Backend] Serving stocks from cache');
            return res.json(cache.stocks.data);
        }

        console.log('[Backend] Fetching stock data from Midas API...');
        const response = await fetch(MIDAS_API_URL);
        if (!response.ok) {
            console.error('[Backend] Midas API returned:', response.status);
            return res.status(response.status).json({ error: 'Failed to fetch from Midas API' });
        }
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
            if (typeof data === 'string') {
                console.log('[Backend] Detected double‑encoded JSON, parsing again');
                data = JSON.parse(data);
            }
        } catch (e) {
            console.error('[Backend] JSON parse error:', e);
            return res.status(500).json({ error: 'Invalid JSON from Midas API' });
        }
        console.log('[Backend] Data type:', typeof data, 'Is array:', Array.isArray(data));
        console.log('[Backend] Fetched', data.length, 'stocks');
        res.json(data);
    } catch (error) {
        console.error('[Backend] Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// New endpoint for FX rates (USDTRY, EURTRY)
app.get('/api/fx', async (req, res) => {
    try {
        if (isCacheValid(cache.fx.time, CACHE_DURATION.FX)) {
            console.log('[Backend] Serving FX from cache');
            return res.json(cache.fx.data);
        }

        console.log('[Backend] Fetching FX data from Midas API...');
        const response = await fetch(MIDAS_FX_URL);
        if (!response.ok) {
            console.error('[Backend] Midas FX API returned:', response.status);
            return res.status(response.status).json({ error: 'Failed to fetch FX from Midas API' });
        }
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
            if (typeof data === 'string') {
                console.log('[Backend] Detected double‑encoded JSON in FX, parsing again');
                data = JSON.parse(data);
            }
        } catch (e) {
            console.error('[Backend] FX JSON parse error:', e);
            return res.status(500).json({ error: 'Invalid FX JSON from Midas API' });
        }
        console.log('[Backend] FX Data type:', typeof data, 'Is array:', Array.isArray(data));
        console.log('[Backend] Fetched', data.length, 'FX entries');
        res.json(data);
    } catch (error) {
        console.error('[Backend] FX Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// TEFAS Fund Data Endpoint
app.get('/api/fund/:code', async (req, res) => {
    const fundCode = req.params.code.toUpperCase();
    try {
        if (cache.funds[fundCode] && isCacheValid(cache.funds[fundCode].time, CACHE_DURATION.FUNDS)) {
            console.log(`[Backend] Serving fund ${fundCode} from cache`);
            return res.json(cache.funds[fundCode].data);
        }

        console.log(`[Backend] Fetching fund data for ${fundCode}...`);
        const response = await fetch(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`);
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from TEFAS' });
        }
        const text = await response.text();

        // Extract data from Highcharts script
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        let chartScript = null;

        while ((match = scriptRegex.exec(text)) !== null) {
            if (match[1].includes('chartMainContent_FonFiyatGrafik')) {
                chartScript = match[1];
                break;
            }
        }

        if (!chartScript) {
            return res.status(404).json({ error: 'Chart data not found' });
        }

        // Robust extraction using indexOf
        const seriesIndex = chartScript.indexOf('series:');
        if (seriesIndex === -1) return res.status(404).json({ error: 'Series not found' });

        const dataStartIndex = chartScript.indexOf('"data":', seriesIndex);
        if (dataStartIndex === -1) return res.status(404).json({ error: 'Data not found' });

        const arrayStartIndex = chartScript.indexOf('[', dataStartIndex);
        const arrayEndIndex = chartScript.indexOf(']', arrayStartIndex);

        if (arrayStartIndex === -1 || arrayEndIndex === -1) {
            return res.status(404).json({ error: 'Data array malformed' });
        }

        const dataStr = chartScript.substring(arrayStartIndex + 1, arrayEndIndex);
        const values = dataStr.split(',').map(v => parseFloat(v.trim()));

        if (values.length === 0) {
            return res.status(404).json({ error: 'No price data found' });
        }

        const lastPrice = values[values.length - 1];
        console.log(`[Backend] Found price for ${fundCode}: ${lastPrice}`);

        const responseData = {
            code: fundCode,
            price: lastPrice,
            lastUpdated: new Date().toISOString()
        };

        // Update Cache
        cache.funds[fundCode] = {
            data: responseData,
            time: Date.now()
        };

        res.json(responseData);

    } catch (error) {
        console.error('[Backend] Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Cebim Backend Proxy running on http://localhost:${PORT}`);
    console.log(`📊 Stock data endpoint: http://localhost:${PORT}/api/stocks`);
    console.log(`📊 FX data endpoint: http://localhost:${PORT}/api/fx`);
});
