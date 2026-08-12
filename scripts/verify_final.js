const GAS_URL = 'https://script.google.com/macros/s/AKfycbykSRAhMSes5cszsaBnheKQR8rclBZ9CPuI0PJrPw4DLi2sOJGyKZkC_Ma7W80emBla/exec';
const VERCEL_URL = 'https://cebim-app.vercel.app/api/fund/';
const testFunds = ['MAC', 'TTE', 'KZL', 'HAM', 'GOL'];

async function runTests() {
    console.log('--- 1. Testing Google Apps Script Proxy ---');
    for (const code of testFunds) {
        try {
            const res = await fetch(`${GAS_URL}?code=${code}`);
            const data = await res.json();
            console.log(`GAS [${code}]:`, data);
        } catch(e) {
            console.error(`GAS [${code}] Error:`, e.message);
        }
    }

    console.log('\n--- 2. Testing Live Vercel Endpoint ---');
    for (const code of testFunds) {
        try {
            const res = await fetch(`${VERCEL_URL}${code}?t=${Date.now()}`);
            const data = await res.json();
            console.log(`Vercel [${code}]:`, data);
        } catch(e) {
            console.error(`Vercel [${code}] Error:`, e.message);
        }
    }
}

runTests();
