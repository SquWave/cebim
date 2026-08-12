async function inspectAspx() {
    try {
        const res = await fetch('https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=MAC');
        const text = await res.text();
        console.log('ASPX Length:', text.length);
        const idx = text.indexOf('Son Fiyat');
        console.log('Son Fiyat idx:', idx);
        if (idx !== -1) {
            console.log('Snippet around Son Fiyat:', text.slice(idx - 50, idx + 250));
        } else {
            console.log('Snippet start:', text.slice(0, 500));
        }
    } catch(e) {
        console.error('Error:', e.message);
    }
}

inspectAspx();
