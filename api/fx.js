// Vercel Serverless Function for FX Data
const MIDAS_FX_URL = 'https://www.getmidas.com/wp-json/midas-api/v1/midas_table_data?sortId=&return=doviz';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('[Serverless] Fetching FX data from Midas API...');
        const response = await fetch(MIDAS_FX_URL);

        if (!response.ok) {
            console.error('[Serverless] Midas FX API returned:', response.status);
            return res.status(response.status).json({ error: 'Failed to fetch FX from Midas API' });
        }

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
            if (typeof data === 'string') {
                console.log('[Serverless] Detected double-encoded JSON in FX, parsing again');
                data = JSON.parse(data);
            }
        } catch (e) {
            console.error('[Serverless] FX JSON parse error:', e);
            return res.status(500).json({ error: 'Invalid FX JSON from Midas API' });
        }

        console.log('[Serverless] Fetched', data.length, 'FX entries');

        // Set cache headers (1 minute)
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

        return res.status(200).json(data);
    } catch (error) {
        console.error('[Serverless] FX Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
