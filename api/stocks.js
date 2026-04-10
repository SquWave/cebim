// Vercel Serverless Function for Stock Data
const TRADINGVIEW_API_URL = 'https://scanner.tradingview.com/turkey/scan';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('[Serverless] Fetching stock data from TradingView API...');
        
        const requestBody = {
            filter: [{ left: 'exchange', operation: 'equal', right: 'BIST' }],
            columns: ['name', 'close']
        };

        const response = await fetch(TRADINGVIEW_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('[Serverless] TradingView API returned:', response.status);
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

        console.log('[Serverless] Fetched', data.length, 'stocks from TradingView');

        // Set cache headers (1 minute)
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error) {
        console.error('[Serverless] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
