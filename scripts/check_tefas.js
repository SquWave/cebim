
async function checkTefas(fundCode) {
    try {
        const url = `https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fundCode}`;
        console.log(`Fetching ${url}...`);
        const response = await fetch(url);
        const text = await response.text();

        // 1. Find the script block containing the chart
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
            console.log('Chart script not found');
            return;
        }

        // 2. Find the series array
        // Pattern: series: [{ ... }]
        const seriesMatch = chartScript.match(/series\s*:\s*\[([\s\S]*?)\]/);

        if (seriesMatch && seriesMatch[1]) {
            const seriesContent = seriesMatch[1];

            // 3. Find the data array inside the series
            // Pattern: "data": [1.1, 2.2, ...] or data: [...]
            const dataMatch = seriesContent.match(/"?data"?\s*:\s*\[([\d.,\s]+)\]/);

            if (dataMatch && dataMatch[1]) {
                const dataStr = dataMatch[1];
                // Split by comma, filter empty, parse float
                const values = dataStr.split(',').map(v => parseFloat(v.trim()));
                const lastPrice = values[values.length - 1];
                console.log(`Fund: ${fundCode}`);
                console.log(`Last Price: ${lastPrice}`);
            } else {
                console.log('Data array not found inside series');
                console.log('Series snippet:', seriesContent.substring(0, 200));
            }
        } else {
            console.log('Series array not found in script');
            console.log('Script snippet:', chartScript.substring(0, 200));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkTefas('MAC');
checkTefas('TTE');
