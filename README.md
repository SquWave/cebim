# Cebim (myPocket) 📱💸

**Cebim**, kişisel finans ve yatırım takibini tek bir yerde birleştiren, gizlilik odaklı ve kullanıcı dostu bir web uygulamasıdır.

<a href="https://ibb.co/6cwGMSCH"><img src="https://i.ibb.co/GfpG6DSW/Ekran-g-r-nt-s-2025-11-23-202122.png" alt="Cebim-Screenshot" border="0"></a>

## 🌟 Özellikler

*   **Hibrit Dashboard:** Nakit ve yatırım varlıklarınızı tek bir ekranda, net varlık olarak görüntüleyin.
*   **Cüzdan Yönetimi:** Günlük gelir ve giderlerinizi hızlıca ekleyin, kategorize edin ve takip edin.
*   **Yatırım Portföyü:** Hisse senedi, kripto para, altın ve döviz varlıklarınızı kaydedin.
*   **Manuel Fiyat Güncelleme:** Yatırımlarınızın anlık değerini kendiniz güncelleyerek portföyünüzü canlı tutun.
*   **Gizlilik Odaklı (Local-First):** Tüm verileriniz **sadece tarayıcınızda (localStorage)** saklanır. Hiçbir sunucuya veri gönderilmez.
*   **PWA Desteği:** Mobil cihazınıza uygulama olarak kurabilir ve tam ekran deneyimiyle kullanabilirsiniz.
*   **Karanlık Mod:** Göz yormayan, modern ve şık tasarım.

## 🚀 Kurulum ve Çalıştırma

Bu projeyi kendi bilgisayarınızda çalıştırmak için aşağıdaki adımları izleyin:

### Gereksinimler
*   [Node.js](https://nodejs.org/) (Sürüm 16 veya üzeri)

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

3.  **Uygulamayı Başlatın:**
    ```bash
    npm run dev
    ```
    Terminalde çıkan linke (örn: `http://localhost:5173`) tıklayarak uygulamayı açın.

## 📱 Mobil Kurulum (PWA)

1.  Uygulamayı telefonunuzun tarayıcısında açın.
2.  Tarayıcı menüsünden **"Ana Ekrana Ekle"** (Add to Home Screen) seçeneğine tıklayın.
3.  Artık Cebim'i native bir uygulama gibi kullanabilirsiniz!

## 🛠️ Teknolojiler

*   **React** (Vite ile)
*   **Tailwind CSS** (Tasarım)
*   **Lucide React** (İkonlar)
*   **LocalStorage** (Veri Saklama)

## 🔒 Güvenlik ve Gizlilik

Bu proje tamamen **istemci taraflı (client-side)** çalışır. Girdiğiniz finansal veriler, tarayıcınızın yerel depolama alanında (LocalStorage) tutulur. Tarayıcı geçmişinizi veya önbelleğinizi temizlemediğiniz sürece verileriniz korunur. Herhangi bir bulut sunucusuna veri transferi yapılmaz.

---
*Geliştirici: SquWave*
*Not: Bu proje bir vibe coding (yapuy zeka) projesidir. Öğrenim amaçlı yapılmıştır. Herhangi bir yatırım tavsiyesi içermemektedir.*
