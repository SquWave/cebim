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
        console.log(`[Serverless] Fetching fund data for ${fundCode}...`);

        // Send realistic browser headers to bypass TEFAS bot protection on Vercel
        const response = await fetch(`https://www.tefas.gov.tr/tr/fon-detayli-analiz/${fundCode}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Referer': 'https://www.tefas.gov.tr/'
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch from TEFAS' });
        }

        const text = await response.text();

        // Primary regex pattern for TEFAS Next.js HTML structure
        const primaryRegex = /Son Fiyat \(TL\)<\/p>.*?<p[^>]*>([\d,\.]+)<\/p>/s;
        // Fallback regex pattern in case layout or spacing changes slightly
        const fallbackRegex = /Son Fiyat.*?([\d]{1,6}[\,\.][\d]{2,8})/s;

        const match = text.match(primaryRegex) || text.match(fallbackRegex);

        if (!match || !match[1]) {
            return res.status(404).json({ error: 'Price data not found in HTML' });
        }

        // Convert Turkish locale number formatting (e.g., 15,033866 to 15.033866 or 1.234,56 to 1234.56)
        const lastPrice = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));

        console.log(`[Serverless] Found price for ${fundCode}: ${lastPrice}`);

        const responseData = {
            code: fundCode,
            price: lastPrice,
            lastUpdated: new Date().toISOString()
        };

        // Set cache headers (10 minutes - ensures fresh prices after daily update)
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('[Serverless] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
