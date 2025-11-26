
async function fetchAllFunds() {
    try {
        const url = 'https://www.tefas.gov.tr/Service.asmx/GetAllFunds';
        console.log(`Fetching ${url}...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({}) // Some ASMX services accept empty JSON body
        });

        if (!response.ok) {
            console.error('Response not OK:', response.status, response.statusText);
            const text = await response.text();
            console.log('Response body:', text.substring(0, 500));
            return;
        }

        const text = await response.text();
        console.log('Response content type:', response.headers.get('content-type'));
        console.log('Response snippet:', text.substring(0, 500));

        try {
            const data = JSON.parse(text);
            console.log('Success! Data type:', typeof data);
            if (data.d) {
                console.log('Found "d" property. Length:', data.d.length);
                console.log('First 5 items:', data.d.slice(0, 5));
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e.message);
        }

        // ASMX usually returns { d: ... }
        if (data.d) {
            console.log('Found "d" property. Length:', data.d.length);
            console.log('First 5 items:', data.d.slice(0, 5));
        } else {
            console.log('Data structure:', Object.keys(data));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

fetchAllFunds();
