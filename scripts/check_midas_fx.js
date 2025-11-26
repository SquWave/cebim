
async function checkMidasFX() {
    try {
        const response = await fetch('http://localhost:3001/api/fx');
        const data = await response.json();

        console.log('Total items:', data.length);

        const codes = data.map(item => item.Code).sort();
        console.log('All Codes:', codes);

        const goldItems = data.filter(item =>
            item.Code.includes('XAU') ||
            item.Code.includes('GLD') ||
            item.Code.includes('ALTIN') ||
            item.Code.includes('GRAM')
        );

        console.log('Potential Gold Items:', goldItems);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkMidasFX();
