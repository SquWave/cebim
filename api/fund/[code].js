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
    const fundCode = code?.toUpperCase();

    if (!fundCode) {
        return res.status(400).json({ error: 'Fund code is required' });
    }

    try {
        console.log(`[Serverless] Fetching fund data for ${fundCode}...`);
        const response = await fetch(`https://www.tefas.gov.tr/tr/fon-detayli-analiz/${fundCode}`);

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from TEFAS' });
        }

        const text = await response.text();

        // Extract price from the Next.js rendered HTML
        // Looking for "Son Fiyat (TL)" followed by the price in the next <p> tag
        const priceRegex = /Son Fiyat \(TL\)<\/p>.*?<p[^>]*>([\d,\.]+)<\/p>/s;
        const match = text.match(priceRegex);

        if (!match || !match[1]) {
            return res.status(404).json({ error: 'Price data not found in HTML' });
        }

        // Convert Turkish locale number formatting (e.g., 15,033866 to 15.033866 or 1.234,56 to 1234.56)
        // Remove all dots (thousands separator), then replace comma with dot (decimal separator)
        const lastPrice = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));

        console.log(`[Serverless] Found price for ${fundCode}: ${lastPrice}`);

        const responseData = {
            code: fundCode,
            price: lastPrice,
            lastUpdated: new Date().toISOString()
        };

        // Set cache headers (4 hours - funds update once daily)
        res.setHeader('Cache-Control', 's-maxage=14400, stale-while-revalidate');

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('[Serverless] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
