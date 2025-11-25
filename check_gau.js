
async function checkGAUTRY() {
    try {
        const response = await fetch('http://localhost:3001/api/fx');
        const data = await response.json();

        const gautry = data.find(item => item.Code === 'GAUTRY');
        console.log('GAUTRY:', gautry);

        const xautry = data.find(item => item.Code === 'XAUTRY');
        console.log('XAUTRY:', xautry);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkGAUTRY();
