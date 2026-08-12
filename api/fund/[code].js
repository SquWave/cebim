// Vercel Serverless Function for TEFAS Fund Data (Dynamic Route)

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbykSRAhMSes5cszsaBnheKQR8rclBZ9CPuI0PJrPw4DLi2sOJGyKZkC_Ma7W80emBla/exec';

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
        let lastPrice = null;

        // 1. Try Google Apps Script Proxy first
        try {
            console.log(`[Serverless] Fetching fund ${fundCode} via Google Script Proxy...`);
            const pRes = await fetch(`${GOOGLE_SCRIPT_URL}?code=${fundCode}`);
            if (pRes.ok) {
                const pData = await pRes.json();
                if (pData && pData.price) {
                    lastPrice = pData.price;
                    console.log(`[Serverless] Found price via Proxy for ${fundCode}: ${lastPrice}`);
                }
            }
        } catch (e) {
            console.warn('[Serverless] Proxy fetch failed:', e.message);
        }

        // 2. Fallback to direct TEFAS fetch if proxy failed
        if (!lastPrice) {
            console.log(`[Serverless] Proxy failed, fallback to direct TEFAS fetch for ${fundCode}...`);
            const response = await fetch(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`);
            if (response.ok) {
                const text = await response.text();
                const idx = text.indexOf('Son Fiyat');
                if (idx !== -1) {
                    const snippet = text.substring(idx, idx + 600);
                    const match = snippet.match(/([\d\.]+,[\d]+)/);
                    if (match && match[1]) {
                        lastPrice = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
                    }
                }
            }
        }

        if (!lastPrice) {
            return res.status(404).json({ error: 'Price data not found in HTML' });
        }

        const responseData = {
            code: fundCode,
            price: lastPrice,
            lastUpdated: new Date().toISOString()
        };

        // Set cache headers (10 minutes)
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('[Serverless] Error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
