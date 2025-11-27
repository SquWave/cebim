# Cebim (myPocket) 📱💸

**Cebim**, kişisel finans ve yatırım takibini tek bir yerde birleştiren, gizlilik odaklı ve kullanıcı dostu bir web uygulamasıdır.

<img width="1919" height="978" alt="Cebim-Screenshot" src="https://github.com/user-attachments/assets/eeb7ad4f-4471-4706-a078-ca29f5f561f2" />

## 🌟 Özellikler

*   **QR Kod ile Giriş:** Uzun anahtarları yazmakla uğraşmayın! Mobil cihazınızdan QR kodu taratarak saniyeler içinde giriş yapın.
*   **Canlı Piyasa Verileri:** Midas API ve TEFAS entegrasyonu ile BIST hisse senetleri, yatırım fonları, döviz kurları (USD, EUR) ve gram altın fiyatlarını anlık olarak takip edin. Otomatik güncelleme sayesinde portföyünüz her zaman güncel kalır.
*   **Akıllı Otomatik Tamamlama:** Hisse senedi ve fon kodlarını ararken anında öneriler alın.
*   **Kâr/Zarar Analizi:** Varlıklarınızın maliyet ve güncel değerini karşılaştırarak net kâr/zarar durumunuzu görüntüleyin.
*   **Ayarlar Sayfası:** Gizli anahtarınızı ve giriş QR kodunuzu güvenli bir şekilde görüntüleyin.
*   **Bulut Senkronizasyon:** Verileriniz Firebase Firestore üzerinde güvenle saklanır. Telefonunuzda girdiğiniz veri anında bilgisayarınızda görünür.
*   **Anahtarlı Giriş:** Üyelik derdi yok! Sistem tarafından üretilen "Gizli Anahtar" ile her yerden verilerinize ulaşın.
*   **Hibrit Dashboard:** Nakit ve yatırım varlıklarınızı tek bir ekranda, net varlık olarak görüntüleyin.
*   **Cüzdan Yönetimi:**
    *   **Çoklu Hesap:** Nakit, Banka, Kredi Kartı gibi farklı hesaplar oluşturun ve yönetin.
    *   **Transfer:** Hesaplar arası para transferi yapın.
    *   **Detaylı Takip:** Gelir ve giderlerinizi kategorize edin, hesap bazlı bakiyelerinizi görün.
    *   **Düzenleme:** Hesapları ve geçmiş işlemleri (tutar, açıklama, tarih vb.) kolayca düzenleyin.
*   **Yatırım Portföyü:** Hisse senedi, yatırım fonu, gram altın ve döviz varlıklarınızı kaydedin.
*   **PWA Desteği:** Mobil cihazınıza uygulama olarak kurabilir ve tam ekran deneyimiyle kullanabilirsiniz.
*   **Karanlık Mod:** Göz yormayan, modern ve şık tasarım.

## 🚀 Kurulum ve Çalıştırma

Bu projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
*   [Node.js](https://nodejs.org/) (Sürüm 16 veya üzeri - Tercihen v20+)
*   Firebase Projesi (Kendi veritabanınızı kullanmak için)

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
    
    Bu proje, canlı verileri çekmek için yerel bir backend sunucusuna ihtiyaç duyar. Hem frontend hem de backend'i tek komutla başlatmak için:

    ```bash
    npm run dev:all
    ```
    
    Alternatif olarak ayrı ayrı çalıştırmak isterseniz:
    *   **Backend:** `npm run server` (Port: 3001)
    *   **Frontend:** `npm run dev` (Port: 5173)

    Terminalde çıkan linke (örn: `http://localhost:5173`) tıklayarak uygulamayı açın.

## 📱 Mobil Kurulum (PWA)

1.  Uygulamayı telefonunuzun tarayıcısında açın.
2.  Tarayıcı menüsünden **"Ana Ekrana Ekle"** (Add to Home Screen) seçeneğine tıklayın.
3.  Artık Cebim'i native bir uygulama gibi kullanabilirsiniz!

## 🛠️ Teknolojiler

### Frontend
*   **React** (Vite ile)
*   **Tailwind CSS** (Tasarım)
*   **Lucide React** (İkonlar)
*   **QR Code & Scanner** (Hızlı Giriş)

### Backend & Veri
*   **Node.js + Express** (Backend Proxy Sunucusu)
*   **Midas API** (Canlı Borsa, Döviz ve Altın Verileri)
*   **Firebase Firestore** (Bulut Veritabanı & Senkronizasyon)

## 🔒 Güvenlik ve Gizlilik

Bu proje **"Sistem Tarafından Üretilen Güvenli Anahtar"** yöntemiyle çalışır.
*   **Kayıt:** Sistem size özel, 24 karakterli, kırılması imkansız rastgele bir anahtar üretir.
*   **Giriş:** Bu anahtarı kullanarak veya QR kodu taratarak istediğiniz cihazdan verilerinize erişirsiniz.
*   **Anonimlik:** E-posta, telefon veya isim vermenize gerek yoktur.
*   **Veri:** Verileriniz Google Firebase altyapısında, sadece anahtar sahibinin erişebileceği şekilde saklanır.

> **ÖNEMLİ:** Anahtarınızı kaybederseniz verilerinizi kurtarmanın bir yolu yoktur. Lütfen anahtarınızı güvenli bir yere kaydedin.

> **KAMERA ERİŞİMİ NOTU:** QR Kod ile giriş özelliği, mobil tarayıcıların güvenlik politikaları gereği sadece **HTTPS** (Güvenli Bağlantı) veya **localhost** üzerinde çalışır. Yerel ağ (IP adresi) üzerinden yapılan testlerde kamera açılmayabilir. Uygulama yayına alındığında bu sorun ortadan kalkacaktır.

---
*Not: Bu proje bir vibe coding (yapay zeka) projesidir. Öğrenim amaçlı yapılmıştır. Herhangi bir yatırım tavsiyesi içermemektedir.*
