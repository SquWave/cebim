// Vercel Serverless Function for TEFAS Fund Data (Dynamic Route)

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { code } = req.query;
    const fundCode = code?.trim().toUpperCase();

    if (!fundCode) {
        return res.status(400).json({ error: 'Fund code is required' });
    }

    try {
        console.log(`[Serverless] Fetching official TEFAS JSON API for ${fundCode}...`);

        const response = await fetch('https://www.tefas.gov.tr/api/funds/fonFiyatBilgiGetir', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ fonKodu: fundCode, dil: 'TR', periyod: 1 })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from TEFAS JSON API' });
        }

        const data = await response.json();
        const list = data.resultList || [];

        if (list.length === 0) {
            return res.status(404).json({ error: `Fund price not found for ${fundCode}` });
        }

        // Get the latest price entry (last item in resultList)
        const latestEntry = list[list.length - 1];
        const lastPrice = typeof latestEntry.fiyat === 'number' ? latestEntry.fiyat : parseFloat(latestEntry.fiyat);

        console.log(`[Serverless] Found price for ${fundCode}: ${lastPrice} (${latestEntry.tarih})`);

        const responseData = {
            code: fundCode,
            price: lastPrice,
            date: latestEntry.tarih,
            lastUpdated: new Date().toISOString()
        };

        // Cache for 10 minutes
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('[Serverless] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
