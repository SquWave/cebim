
// Free API for currencies (USD, EUR only)
const CURRENCY_API_URL = 'http://localhost:3001/api/fx';

// Stock data via backend proxy (bypasses CORS)
const MIDAS_API_URL = 'http://localhost:3001/api/stocks';

// Fallback manual rates
const FALLBACK_RATES = {
    USD: 34.50,
    EUR: 36.20,
    GOLD: 2950.00 // Gram Altın
};

// Cache for Midas Data
let cachedStockData = [];
let lastStockFetch = 0;
const CACHE_DURATION = 1000 * 60 * 1; // 1 minute cache for live prices

// Static List of Popular TEFAS Funds for Autocomplete (Updated from User CSV)
export const TEFAS_FUNDS = [
    { code: 'KLH', name: 'ATLAS PORTFÖY KATILIM HİSSE SENEDİ SERBEST FON (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'HAM', name: 'HEDEF PORTFÖY ALTIN KATILIM FONU' },
    { code: 'KGM', name: 'KUVEYT TÜRK PORTFÖY GÜMÜŞ KATILIM FON SEPETİ FONU' },
    { code: 'KZL', name: 'KUVEYT TÜRK PORTFÖY ALTIN KATILIM FONU' },
    { code: 'RBA', name: 'ALBARAKA PORTFÖY BEREKET VAKFI NA DESTEK ALTIN KATILIM FONU' },
    { code: 'RJG', name: 'RE-PIE PORTFÖY ALTIN KATILIM FONU' },
    { code: 'NJF', name: 'NUROL PORTFÖY ALTIN KATILIM FONU' },
    { code: 'PKF', name: 'ATA PORTFÖY ALTIN KATILIM FONU' },
    { code: 'MKG', name: 'AKTİF PORTFÖY ALTIN KATILIM FONU' },
    { code: 'KZU', name: 'KUVEYT TÜRK PORTFÖY İKİNCİ ALTIN KATILIM FONU' },
    { code: 'OGD', name: 'OYAK PORTFÖY ALTIN KATILIM FONU' },
    { code: 'KUT', name: 'KUVEYT TÜRK PORTFÖY KIYMETLİ MADENLER KATILIM FONU' },
    { code: 'KMF', name: 'AZİMUT PORTFÖY ALTIN KATILIM FONU' },
    { code: 'TCA', name: 'ZİRAAT PORTFÖY ALTIN KATILIM FONU' },
    { code: 'GOL', name: 'GARANTİ PORTFÖY ALTIN KATILIM FONU' },
    { code: 'TAL', name: 'ATLAS PORTFÖY ALTIN KATILIM FONU' },
    { code: 'KKL', name: 'ALLBATROSS PORTFÖY KISA VADELİ KATILIM SERBEST (TL) FON' },
    { code: 'ZP8', name: 'ZİRAAT PORTFÖY KEHRİBAR PARA PİYASASI KATILIM SERBEST (TL) FON' },
    { code: 'NJY', name: 'NUROL PORTFÖY BİRİNCİ KATILIM FONU' },
    { code: 'HPH', name: 'HEDEF PORTFÖY PARA PİYASASI KATILIM FONU' },
    { code: 'NSA', name: 'NEO PORTFÖY PARA PİYASASI KATILIM SERBEST FON' },
    { code: 'PPK', name: 'QNB PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'EKF', name: 'QİNVEST PORTFÖY KİRA SERTİFİKASI KATILIM (TL) FONU' },
    { code: 'GKH', name: 'GARANTİ PORTFÖY PARA PİYASASI KATILIM SERBEST (TL) FON' },
    { code: 'GPF', name: 'GARANTİ PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'MPK', name: 'AKTİF PORTFÖY KİRA SERTİFİKASI KATILIM (TL) FONU' },
    { code: 'GO2', name: 'ONE PORTFÖY KATILIM FON SEPETİ FONU' },
    { code: 'RKV', name: 'RE-PIE PORTFÖY KISA VADELİ KATILIM SERBEST (TL) FON' },
    { code: 'KTR', name: 'KUVEYT TÜRK PORTFÖY BİRİNCİ KATILIM SERBEST (TL) FON' },
    { code: 'KSK', name: 'AZİMUT PORTFÖY İKİNCİ PARA PİYASASI KATILIM FONU' },
    { code: 'AC1', name: 'PARDUS PORTFÖY KISA VADELİ KATILIM SERBEST FONU' },
    { code: 'OTK', name: 'OYAK PORTFÖY BİRİNCİ KATILIM SERBEST FON' },
    { code: 'PVK', name: 'ALBARAKA PORTFÖY KISA VADELİ KATILIM SERBEST (TL) FON' },
    { code: 'MPF', name: 'AKTİF PORTFÖY KISA VADELİ KİRA SERTİFİKASI KATILIM (TL) FONU' },
    { code: 'VFK', name: 'ZİRAAT PORTFÖY İKİNCİ KISA VADELİ KİRA SERTİFİKALARI KATILIM (TL) FONU' },
    { code: 'RBT', name: 'ALBARAKA PORTFÖY KİRA SERTİFİKALARI  KATILIM FONU' },
    { code: 'RKS', name: 'ROTA PORTFÖY KİRA SERTİFİKALARI KATILIM FONU' },
    { code: 'KSV', name: 'KUVEYT TÜRK PORTFÖY KISA VADELİ KATILIM SERBEST (TL) FON' },
    { code: 'RBV', name: 'ALBARAKA PORTFÖY KISA VADELİ KİRA SERTİFİKALARI KATILIM (TL) FONU' },
    { code: 'YFV', name: 'YAPI KREDİ PORTFÖY KİRA SERTİFİKALARI KATILIM FONU' },
    { code: 'ZPG', name: 'ZİRAAT PORTFÖY KİRA SERTİFİKALARI (SUKUK) KATILIM FONU' },
    { code: 'CPU', name: 'AKTİF PORTFÖY TEKNOLOJİ KATILIM FONU' },
    { code: 'KLU', name: 'KUVEYT TÜRK PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'DPK', name: 'DENİZ PORTFÖY KİRA SERTİFİKALARI KATILIM (TL) FONU' },
    { code: 'SPT', name: 'AKTİF PORTFÖY KATILIM FON SEPETİ FONU' },
    { code: 'GLS', name: 'AZİMUT PORTFÖY  KİRA SERTİFİKALARI (SUKUK) KATILIM FONU' },
    { code: 'KTV', name: 'KUVEYT TÜRK PORTFÖY KISA VADELİ KİRA SERTİFİKALARI KATILIM (TL) FONU' },
    { code: 'AIS', name: 'AK PORTFÖY PARA PİYASASI KATILIM FONU' },
    { code: 'IV8', name: 'INVEO PORTFÖY KİRA SERTİFİKALARI KATILIM FONU' },
    { code: 'ZBI', name: 'ZİRAAT PORTFÖY TEMKİNLİ KATILIM FONU' },
    { code: 'FFH', name: 'QNB PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'IAT', name: 'İŞ PORTFÖY KİRA SERTİFİKALARI KATILIM (TL) FONU' },
    { code: 'KCV', name: 'KUVEYT TÜRK PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'YCY', name: 'İSTANBUL PORTFÖY KATILIM FON SEPETİ FONU' },
    { code: 'RBR', name: 'RE-PIE  PORTFÖY BİRİNCİ KATILIM SERBEST FON' },
    { code: 'CVK', name: 'INVEO PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'KTJ', name: 'KUVEYT TÜRK PORTFÖY TEKNOLOJİ KATILIM FONU' },
    { code: 'KTM', name: 'KUVEYT TÜRK PORTFÖY BİRİNCİ KATILIM (TL) FONU' },
    { code: 'PDD', name: 'QİNVEST PORTFÖY KATILIM FONU' },
    { code: 'KTN', name: 'KUVEYT TÜRK PORTFÖY KİRA SERTİFİKALARI KATILIM (TL) FONU' },
    { code: 'KAV', name: 'KUVEYT TÜRK PORTFÖY ALTINCI KATILIM SERBEST (DÖVİZ-AVRO) FON' },
    { code: 'FCK', name: 'ONE PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'ZP9', name: 'ZİRAAT PORTFÖY AKİK KATILIM SERBEST (DÖVİZ-AVRO) FON' },
    { code: 'KRA', name: 'TRİVE PORTFÖY KİRA SERTİFİKALARI KATILIM FONU' },
    { code: 'KHC', name: 'PARDUS PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'RBK', name: 'ALBARAKA PORTFÖY KATILIM FONU' },
    { code: 'TPZ', name: 'TEB PORTFÖY KİRA SERTİFİKALARI (DÖVİZ) KATILIM FONU' },
    { code: 'ZPF', name: 'ZİRAAT PORTFÖY KATILIM FONU (DÖVİZ)' },
    { code: 'KTT', name: 'KUVEYT TÜRK PORTFÖY DÖRDÜNCÜ KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'FBC', name: 'ONE PORTFÖY KAR PAYI ÖDEYEN KATILIM FONU' },
    { code: 'PBK', name: 'QİNVEST PORTFÖY BİRİNCİ KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'KDT', name: 'GARANTİ PORTFÖY KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'KIS', name: 'QİNVEST PORTFÖY KİRA SERTİFİKASI KATILIM (DÖVİZ) FONU' },
    { code: 'CKS', name: 'İŞ PORTFÖY BİRİNCİ KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'TRU', name: 'TERA PORTFÖY KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'ZP6', name: 'ZİRAAT PORTFÖY SEDEF KATILIM SERBEST (DÖVİZ - AMERİKAN DOLARI) FON' },
    { code: 'KPD', name: 'KUVEYT TÜRK PORTFÖY KAR PAYI ÖDEYEN KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'KDL', name: 'KUVEYT TÜRK PORTFÖY BEŞİNCİ KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'KNJ', name: 'KUVEYT TÜRK PORTFÖY ENERJİ KATILIM FONU' },
    { code: 'YHK', name: 'YAPI KREDİ PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KSR', name: 'KUVEYT TÜRK PORTFÖY SÜRDÜRÜLEBİLİRLİK KATILIM FONU' },
    { code: 'RBH', name: 'ALBARAKA PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'DKH', name: 'DENİZ PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'HKH', name: 'HEDEF PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'ELZ', name: 'QİNVEST PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'IVF', name: 'İSTANBUL PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KTI', name: 'AZİMUT PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KPC', name: 'KUVEYT TÜRK PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'ZPE', name: 'ZİRAAT PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'ZCK', name: 'ZİRAAT PORTFÖY AGRESİF KATILIM FONU' },
    { code: 'MPS', name: 'AKTİF PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'YSL', name: 'YAPI KREDİ PORTFÖY KAR PAYI ÖDEYEN KİRA SERTİFİKALARI KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'GKF', name: 'GLOBAL MD PORTFÖY KATILIM FONU' },
    { code: 'KST', name: 'ALLBATROSS PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KPA', name: 'KUVEYT TÜRK PORTFÖY KAR PAYI ÖDEYEN KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KHJ', name: 'ATLAS PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'TLZ', name: 'ATA PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'GKV', name: 'GARANTİ PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'RPI', name: 'ROTA PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'OHK', name: 'OYAK PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KTS', name: 'KUVEYT TÜRK PORTFÖY KATILIM HİSSE SENEDİ SERBEST FON (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KPU', name: 'KUVEYT TÜRK PORTFÖY İKİNCİ KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'HFI', name: 'HEDEF PORTFÖY İKİNCİ KATILIM HİSSE SENEDİ SERBEST FON (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'RKH', name: 'RE-PIE PORTFÖY KATILIM HİSSE SENEDİ SERBEST (TL) FON (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KH1', name: 'AK PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'TLK', name: 'AKTİF PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'CKF', name: 'ALBARAKA PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'PPG', name: 'ALBARAKA PORTFÖY PARA PİYASASI KATILIM FONU' },
    { code: 'KLS', name: 'ALLBATROSS PORTFÖY KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'RCV', name: 'AZİMUT PORTFÖY BİRİNCİ ÇOKLU VARLIK KATILIM FONU' },
    { code: 'CVL', name: 'A1 CAPİTAL PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'BCO', name: 'BULLS PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'BTK', name: 'BV PORTFÖY TEKNOLOJİ KATILIM FONU' },
    { code: 'DKL', name: 'DENİZ PORTFÖY BİRİNCİ KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'VRK', name: 'DENİZ PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'DNP', name: 'DENİZ PORTFÖY PARA PİYASASI KATILIM SERBEST (TL) FON' },
    { code: 'EPI', name: 'EMAA BLUE PORTFÖY İNŞAAT SEKTÖRÜ KATILIM FONU' },
    { code: 'EPK', name: 'EMAA BLUE PORTFÖY KIYMETLİ MADENLER KATILIM FON SEPETİ FONU' },
    { code: 'EPA', name: 'EMAA BLUE PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'FAK', name: 'FONMAP PORTFÖY ALTIN KATILIM FONU' },
    { code: 'GUK', name: 'GARANTİ PORTFÖY GÜMÜŞ KATILIM SERBEST FON' },
    { code: 'GPN', name: 'GARANTİ PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'KVK', name: 'HEDEF PORTFÖY KATILIM İSTATİSTİKSEL ARBİTRAJ SERBEST FON' },
    { code: 'IAY', name: 'INVEO PORTFÖY ALTIN KATILIM FONU' },
    { code: 'NVK', name: 'INVEO PORTFÖY KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'PRR', name: 'INVEO PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'TIL', name: 'İŞ PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'KPI', name: 'İŞ PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'KCL', name: 'KARE PORTFÖY ÇOKLU VARLIK KATILIM FONU' },
    { code: 'KKC', name: 'KARE PORTFÖY KATILIM SERBEST (DÖVİZ-AVRO) FON' },
    { code: 'KUA', name: 'KUVEYT TÜRK PORTFÖY AGRESİF KATILIM FONU' },
    { code: 'KDE', name: 'KUVEYT TÜRK PORTFÖY DENGELİ KATILIM FONU' },
    { code: 'KUD', name: 'KUVEYT TÜRK PORTFÖY DİNAMİK KATILIM FONU' },
    { code: 'KIK', name: 'KUVEYT TÜRK PORTFÖY İKİNCİ KATILIM FONU' },
    { code: 'KME', name: 'KUVEYT TÜRK PORTFÖY TEMKİNLİ KATILIM FONU' },
    { code: 'MKA', name: 'MARMARA CAPİTAL PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'MTK', name: 'MT PORTFÖY KATILIM HİSSE SENEDİ (TL) FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'MPE', name: 'MT PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'NKA', name: 'NEO PORTFÖY KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'NME', name: 'NUROL PORTFÖY MERCAN KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'NSP', name: 'NUROL PORTFÖY PARA PİYASASI KATILIM FONU' },
    { code: 'NZU', name: 'NUROL PORTFÖY ZÜMRÜT KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'FTL', name: 'ONE PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'PP1', name: 'PARDUS PORTFÖY BİRİNCİ KATILIM FONU' },
    { code: 'PHK', name: 'PHİLLİP PORTFÖY KATILIM HİSSE SENEDİ FONU (HİSSE SENEDİ YOĞUN FON)' },
    { code: 'PKD', name: 'PUSULA PORTFÖY İKİNCİ DENGE KATILIM SERBEST FON' },
    { code: 'RRP', name: 'RE-PIE PORTFÖY PARA PİYASASI KATILIM (TL) FON' },
    { code: 'PKR', name: 'ROTA PORTFÖY PARA PİYASASI KATILIM FONU' },
    { code: 'DNK', name: 'TACİRLER PORTFÖY DENGE KATILIM SERBEST FON' },
    { code: 'TLV', name: 'TERA PORTFÖY PARA PİYASASI KATILIM (TL) FONU' },
    { code: 'BKY', name: 'YAPI KREDİ PORTFÖY BİRİNCİ KATILIM SERBEST (DÖVİZ) FON' },
    { code: 'BDA', name: 'YAPI KREDİ PORTFÖY BİRİNCİ KATILIM SERBEST (DÖVİZ-AVRO) FON' },
    { code: 'PKT', name: 'YAPI KREDİ PORTFÖY PARA PİYASASI KATILIM SERBEST (TL) FON' }
];

// Fetch all stocks from Midas
// src/services/marketData.js
export const fetchMidasStocks = async () => {
    const now = Date.now();
    if (cachedStockData.length > 0 && (now - lastStockFetch < CACHE_DURATION)) {
        console.log('[fetchMidasStocks] Using cached data');
        return cachedStockData;
    }

    console.log('[fetchMidasStocks] Fetching fresh data from backend...');
    try {
        const response = await fetch(MIDAS_API_URL);
        console.log('[fetchMidasStocks] Response status:', response.status);

        // Backend her zaman JSON dizi döndürür → json() ile ayrıştır
        const data = await response.json();

        console.log('[fetchMidasStocks] Data type:', typeof data, 'Is array:', Array.isArray(data));
        console.log('[fetchMidasStocks] Fetched', data.length, 'stocks');
        cachedStockData = data;
        lastStockFetch = now;
        return data;
    } catch (e) {
        console.error('[fetchMidasStocks] Failed to fetch Midas data', e);
        return [];
    }
};

// Search stocks using cached Midas data
export const searchStocks = async (query) => {
    console.log('[searchStocks] Called with query:', query);
    if (cachedStockData.length === 0) {
        console.log('[searchStocks] Cache empty, fetching...');
        await fetchMidasStocks();
        console.log('[searchStocks] Fetched data, count:', cachedStockData.length);
    }
    const q = query.toUpperCase();
    const results = cachedStockData
        .filter(item => item.Code && item.Code.startsWith(q))
        .slice(0, 5)
        .map(item => ({ code: item.Code, name: item.Code })); // Midas data doesn't have full name, using Code
    console.log('[searchStocks] Results:', results);
    return results;
};

// Helper to fetch BIST data (Midas API)
const fetchStockPrice = async (code) => {
    try {
        if (cachedStockData.length === 0) {
            await fetchMidasStocks();
        }
        const stock = cachedStockData.find(item => item.Code === code.toUpperCase());
        return stock ? stock.Last : null;
    } catch (e) {
        console.warn(`Failed to fetch stock price for ${code}`, e);
        return null;
    }
};

// Helper to fetch Fund data via backend proxy (TEFAS)
const fetchFundPrice = async (code) => {
    try {
        const response = await fetch(`http://localhost:3001/api/fund/${code}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.price;
    } catch (e) {
        console.warn(`Failed to fetch fund price for ${code}`, e);
        return null;
    }
};

export const fetchMarketData = async (assets = []) => {
    try {
        // 1. Fetch FX rates (USDTRY, EURTRY, GAUTRY)
        const fxResponse = await fetch(CURRENCY_API_URL);
        const fxData = await fxResponse.json();

        let usdRate = null;
        let eurRate = null;
        let goldRate = null;

        if (Array.isArray(fxData)) {
            const usdEntry = fxData.find(item => item.Code === 'USDTRY');
            const eurEntry = fxData.find(item => item.Code === 'EURTRY');
            const goldEntry = fxData.find(item => item.Code === 'GAUTRY'); // Gram Altın

            if (usdEntry && typeof usdEntry.Last === 'number') usdRate = usdEntry.Last;
            if (eurEntry && typeof eurEntry.Last === 'number') eurRate = eurEntry.Last;
            if (goldEntry && typeof goldEntry.Last === 'number') goldRate = goldEntry.Last;
        }

        const marketData = {
            USD: usdRate,
            EUR: eurRate,
            GOLD: goldRate,
            lastUpdated: new Date().toISOString()
        };

        // 2. Fetch Specific Asset Prices (Stocks & Funds) - Parallelized
        const specificPrices = {};

        // Pre-fetch Midas data if there are stocks
        const hasStocks = assets.some(a => a.type === 'stock');
        if (hasStocks) {
            await fetchMidasStocks();
        }

        // Create an array of promises for all asset price fetches
        const fetchPromises = assets.map(async (asset) => {
            if (asset.type === 'stock' && asset.name) {
                const price = await fetchStockPrice(asset.name);
                if (price) return { name: asset.name.toUpperCase(), price };
            }
            if (asset.type === 'fund' && asset.name) {
                const price = await fetchFundPrice(asset.name);
                if (price) return { name: asset.name.toUpperCase(), price };
            }
            return null;
        });

        // Wait for all fetches to complete in parallel
        const results = await Promise.all(fetchPromises);

        // Populate specificPrices from results
        results.forEach(result => {
            if (result) {
                specificPrices[result.name] = result.price;
            }
        });

        return {
            ...marketData,
            specificPrices,
            error: false
        };

    } catch (error) {
        console.error("Market data fetch failed:", error);
        return {
            USD: null,
            EUR: null,
            GOLD: null,
            specificPrices: {},
            lastUpdated: new Date().toISOString(),
            error: true
        };
    }
};
