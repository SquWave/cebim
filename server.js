import express from 'express';
import cors from 'cors';


const app = express();
const PORT = 3001;

// Midas API URLs
const MIDAS_API_URL = 'https://www.getmidas.com/wp-json/midas-api/v1/midas_table_data?sortId=&return=table';
const MIDAS_FX_URL = 'https://www.getmidas.com/wp-json/midas-api/v1/midas_table_data?sortId=&return=doviz';

// Enable CORS for frontend requests
app.use(cors());

// Proxy endpoint for stock data
app.get('/api/stocks', async (req, res) => {
    try {
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

app.listen(PORT, () => {
    console.log(`\n🚀 Cebim Backend Proxy running on http://localhost:${PORT}`);
    console.log(`📊 Stock data endpoint: http://localhost:${PORT}/api/stocks`);
    console.log(`📊 FX data endpoint: http://localhost:${PORT}/api/fx`);
});
