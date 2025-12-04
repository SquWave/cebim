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
