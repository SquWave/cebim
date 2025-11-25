
async function checkPage() {
    try {
        const response = await fetch('https://www.hakanaltin.com/sarrafiye-gram-altin');
        const text = await response.text();
        console.log('Status:', response.status);

        // Search for "1 GR" or price-like patterns
        const index = text.indexOf('1 GR');
        if (index !== -1) {
            console.log('Found "1 GR" at index:', index);
            console.log('Context:', text.substring(index, index + 1000));
        } else {
            console.log('"1 GR" not found in response text.');
        }

        // Also check for "data-price" or similar attributes
        const priceMatch = text.match(/[\d.,]+\s*TL/);
        if (priceMatch) {
            console.log('Found potential price:', priceMatch[0]);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

checkPage();
