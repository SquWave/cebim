import express from 'express';
import cors from 'cors';
import dns from 'dns';

// Fix for Node.js fetch ENOTFOUND errors on some networks (prefer IPv4)
dns.setDefaultResultOrder('ipv4first');
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

        console.log('[Backend] Fetching stock data from TradingView API...');
        
        const requestBody = {
            filter: [{ left: 'exchange', operation: 'equal', right: 'BIST' }],
            columns: ['name', 'close']
        };

        const response = await fetch('https://scanner.tradingview.com/turkey/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('[Backend] TradingView API returned:', response.status);
            return res.status(response.status).json({ error: 'Failed to fetch from TradingView API' });
        }

        const json = await response.json();
        
        if (!json || !json.data) {
             return res.status(500).json({ error: 'Invalid JSON format from TradingView API' });
        }

        const data = json.data.map(item => ({
            Code: item.d[0],
            Last: item.d[1]
        }));
        
        console.log('[Backend] Fetched', data.length, 'stocks from TradingView');
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
        const response = await fetch(`https://www.tefas.gov.tr/tr/fon-detayli-analiz/${fundCode}`);
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from TEFAS' });
        }
        const text = await response.text();

        const primaryRegex = /Son Fiyat \(TL\)<\/p>.*?<p[^>]*>([\d,\.]+)<\/p>/s;
        const fallbackRegex = /Son Fiyat.*?([\d]{1,6}[\,\.][\d]{2,8})/s;
        const match = text.match(primaryRegex) || text.match(fallbackRegex);

        if (!match || !match[1]) {
            return res.status(404).json({ error: 'Price data not found in HTML' });
        }

        const lastPrice = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
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
