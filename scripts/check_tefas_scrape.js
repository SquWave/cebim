
async function scrapeFundList() {
    try {
        const url = 'https://www.tefas.gov.tr/FonKarsilastirma.aspx';
        console.log(`Fetching ${url}...`);

        const response = await fetch(url);
        const text = await response.text();

        // Look for option tags which usually populate the dropdown
        // <option value="MAC">MAC - MARMARA CAPITAL HISSE SENEDI (TL) FONU (HISSE YOGUN FON)</option>

        const regex = /<option value="([A-Z0-9]{3})">([^<]+)<\/option>/g;
        let match;
        let count = 0;
        const funds = [];

        while ((match = regex.exec(text)) !== null) {
            funds.push({
                code: match[1],
                name: match[2].trim()
            });
            count++;
        }

        console.log(`Found ${count} funds.`);
        if (count > 0) {
            console.log('First 5 funds:', funds.slice(0, 5));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

scrapeFundList();
