# Cebim (myPocket) 📱💸

**Cebim**, kişisel finans ve yatırım takibini tek yerde birleştiren, gizlilik odaklı ve kullanıcı dostu PWA uygulamasıdır.

<img width="1920" height="1200" alt="Screenshot_1" src="https://github.com/user-attachments/assets/3c0f3ac3-0d89-4411-8264-4c4431f7b299" />

## 🌟 Özellikler

### 🔐 Giriş & Güvenlik
*   **Anahtarlı Giriş:** Üyelik derdi yok! Sistem tarafından üretilen "Gizli Anahtar" ile her yerden verilerinize ulaşın.
*   **QR Kod ile Giriş:** Uzun anahtarları yazmakla uğraşmayın! Mobil cihazınızdan QR kodu taratarak saniyeler içinde giriş yapın.
*   **Gizlilik Modu:** Bakiyelerinizi meraklı gözlerden koruyun! Sağ üstteki göz ikonuna tıklayarak tüm bakiye ve tutarları anında gizleyin.

### 💵 Cüzdan Yönetimi
*   **Çoklu Hesap:** Nakit, Banka, Kredi Kartı gibi farklı hesaplar oluşturun ve yönetin.
*   **Detaylı Takip:** Gelir ve giderlerinizi kategorize edin, hesap bazlı bakiyelerinizi görün.
*   **Kategori Sistemi:** Harcamalarınızı ana ve alt kategorilerle detaylıca sınıflandırın.
*   **Gelişmiş Filtreleme:** İşlemlerinizi hesap, kategori ve tarih aralığına göre filtreleyin.

### 📈 Yatırım Portföyü
*   **Desteklenen Varlıklar:** Hisse senedi, yatırım fonu, gram altın/gümüş ve döviz.
*   **Lot Bazlı Takip:** Her alım ayrı kayıt olarak tutulur, FIFO maliyet hesabı yapılır.
*   **Kâr/Zarar Analizi:** Gerçekleşmiş ve gerçekleşmemiş kar/zarar durumunuz ayrı ayrı hesaplanır.

### 📊 Analiz & İstatistikler

| Cüzdan Analizi | Portföy Performansı |
|----------------|---------------------|
| Harcama dağılımı (interaktif pasta grafik) | Gerçekleşmiş kar/zarar |
| Nakit akışı trendi | Aylık kar/zarar grafiği |
| Detaylı gelir/gider raporu | Varlık bazlı performans (aktif/satılmış) |
| Tarih bazlı filtreleme | Ortalama tutma süresi (FIFO) |

### ⚙️ Tercihler
*   **Stopaj Vergisi:** Yatırım fonlarındaki %17.5 stopaj kesintisini hesapla (opsiyonel).
*   **Bulut Senkronizasyon:** Verileriniz Firebase Firestore üzerinde güvenle saklanır.
*   **PWA Desteği:** Mobil cihazınıza uygulama olarak kurabilir ve tam ekran deneyimiyle kullanabilirsiniz.

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
*   [Node.js](https://nodejs.org/) (Sürüm 18 veya üzeri)
*   Firebase Projesi

### Adımlar

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/SquWave/cebim.git
    cd cebim
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Firebase Ayarları:**
    *   Kök dizinde `.env` adında bir dosya oluşturun.
    *   Firebase konsolundan aldığınız bilgileri şu formatta ekleyin:
        ```env
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
        VITE_FIREBASE_PROJECT_ID=your_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
        VITE_FIREBASE_APP_ID=your_app_id
        ```

4.  **Uygulamayı Başlatın:**
    ```bash
    npm run dev:all
    ```
    
    Alternatif olarak ayrı ayrı çalıştırmak isterseniz:
    *   **Backend:** `npm run server` (Port: 3001)
    *   **Frontend:** `npm run dev` (Port: 5173)

## 📱 Mobil Kurulum (PWA)

1.  Uygulamayı telefonunuzun tarayıcısında açın.
2.  Tarayıcı menüsünden **"Ana Ekrana Ekle"** seçeneğine tıklayın.
3.  Artık Cebim'i native bir uygulama gibi kullanabilirsiniz!

## 🛠️ Teknolojiler

| Frontend | Backend & Veri |
|----------|---------------|
| React 19 + Vite | Node.js + Express |
| Tailwind CSS | Firebase Firestore |
| Recharts | Midas API (BIST, döviz) |
| Lucide React | TEFAS (fon fiyatları) |

## 🔒 Güvenlik ve Gizlilik

*   **Kayıt:** Sistem size özel, 24 karakterli rastgele bir anahtar üretir.
*   **Giriş:** Bu anahtarı kullanarak veya QR kodu taratarak istediğiniz cihazdan verilerinize erişirsiniz.
*   **Anonimlik:** E-posta, telefon veya isim vermenize gerek yoktur.
*   **Gizlilik Modu:** Tüm bakiye ve tutar bilgilerinizi `₺***` ile maskeleyebilirsiniz.

> **ÖNEMLİ:** Anahtarınızı kaybederseniz verilerinizi kurtarmanın bir yolu yoktur. Lütfen anahtarınızı güvenli bir yere kaydedin.

---
*Not: Bu proje bir vibe coding (yapay zeka) projesidir. Öğrenim amaçlı yapılmıştır. Herhangi bir yatırım tavsiyesi içermemektedir.*
