export const DEFAULT_INCOME_CATEGORIES = [
    {
        id: 'inc_salary',
        name: 'Maaş & İş Geliri',
        type: 'income',
        icon: 'Briefcase',
        subcategories: ['Maaş', 'Prim & Bonus', 'Yemek & Yol']
    },
    {
        id: 'inc_investment',
        name: 'Finansal & Yatırım Geliri',
        type: 'income',
        icon: 'TrendingUp',
        subcategories: ['Yatırım Karı (Satış)', 'Temettü', 'Faiz Getirisi', 'Kira Geliri']
    },
    {
        id: 'inc_extra',
        name: 'Ek Gelir',
        type: 'income',
        icon: 'Gift',
        subcategories: ['Freelance / Proje', 'Satış', 'Hediye / Destek']
    },
    {
        id: 'inc_other',
        name: 'Geri Ödemeler & Diğer',
        type: 'income',
        icon: 'RefreshCw',
        subcategories: ['Borç Tahsilatı', 'İadeler', 'Diğer']
    }
];

export const DEFAULT_EXPENSE_CATEGORIES = [
    {
        id: 'exp_housing',
        name: 'Yaşam & Konut',
        type: 'expense',
        icon: 'Home',
        subcategories: ['Kira / Aidat', 'Faturalar', 'İletişim', 'Ev Bakımı']
    },
    {
        id: 'exp_food',
        name: 'Gıda & Mutfak',
        type: 'expense',
        icon: 'Utensils',
        subcategories: ['Market / Pazar', 'Restoran / Kafe', 'Sipariş (Online)']
    },
    {
        id: 'exp_transport',
        name: 'Ulaşım',
        type: 'expense',
        icon: 'Bus',
        subcategories: ['Toplu Taşıma', 'Taksi / Araç Çağırma', 'Uzun Mesafe']
    },
    {
        id: 'exp_vehicle',
        name: 'Araç',
        type: 'expense',
        icon: 'Car',
        subcategories: ['Yakıt', 'Bakım & Onarım', 'Sigorta & Kasko', 'Vergi & Ceza', 'Yıkama & Otopark']
    },
    {
        id: 'exp_shopping',
        name: 'Alışveriş & Kişisel',
        type: 'expense',
        icon: 'ShoppingBag',
        subcategories: ['Giyim & Aksesuar', 'Elektronik', 'Kişisel Bakım', 'Ev Eşyası']
    },
    {
        id: 'exp_entertainment',
        name: 'Eğlence & Aktivite',
        type: 'expense',
        icon: 'Film',
        subcategories: ['Dijital Abonelikler', 'Sosyal Aktivite', 'Hobi', 'Tatil']
    },
    {
        id: 'exp_health',
        name: 'Sağlık',
        type: 'expense',
        icon: 'HeartPulse',
        subcategories: ['İlaç / Eczane', 'Doktor / Hastane', 'Sigorta (Sağlık)']
    },
    {
        id: 'exp_financial',
        name: 'Finansal Giderler & Diğer',
        type: 'expense',
        icon: 'CreditCard',
        subcategories: ['Yatırım', 'Kredi Ödemesi', 'Kredi Kartı Ödemesi', 'Eğitim', 'Vergi', 'Diğer']
    }
];
