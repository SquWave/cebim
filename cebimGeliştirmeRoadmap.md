Cebim Geliştirme Yol Haritası
Bu doküman, MVP aşaması tamamlanan "Cebim" projesinin, kişisel kullanıma odaklı, kayıt gerektirmeyen ancak cihazlar arası senkronizasyon sunan bir yapıya dönüşmesi için izlenecek stratejiyi içerir.
📅 Faz 1: "Anahtarlı Senkronizasyon & Bulut" (V1.1)
Hedef: Kayıt/Üyelik prosedürleri olmadan verileri cihazlar arasında (Telefon <-> Bilgisayar) eşitlemek.
Tahmini Süre: 2 Hafta
1.1. "Kişisel Erişim Anahtarı" (Secret Key) Sistemi
Klasik üyelik (E-posta/Şifre) yerine, şahsi kullanım için basitleştirilmiş bir kimlik doğrulama yapısı kurulacak.
Giriş Ekranı: Uygulama açılışında sadece tek bir input alanı olacak: "Senkronizasyon Anahtarınızı Belirleyin/Girin".
Teknik Mantık: Girilen anahtar (Örn: benim-gizli-kasa-2024) SHA-256 gibi bir algoritma ile hash'lenerek benzersiz bir userID'ye dönüştürülecek.
Çoklu Kullanım: Sen kendi anahtarınla kendi verine ulaşırken, kodu başkasıyla paylaşırsan o kişi de kendi anahtarını girerek kendi veritabanını oluşturabilecek. Veriler birbirine karışmayacak.
1.2. Firestore Veritabanı Yapılandırması
Veri Yolu: /users/{hash_of_secret_key}/...
Bu yapı sayesinde veritabanı herkesin verisini ayrı tutar ancak kimsenin kim olduğunu bilmez (Anonimlik).
Koleksiyonlar:
transactions (Gelir/Giderler)
assets (Yatırım Varlıkları - Fonlar dahil)
Real-time Sync: Firebase'in onSnapshot özelliği ile telefonunda bir harcama girdiğinde, açık olan bilgisayar ekranında sayfa yenilemeden veri güncellenecek.
1.3. Yedekleme / Geri Yükleme
📈 Faz 2: "Canlı Veri & Genişletilmiş Portföy" (V1.2)
Hedef: Manuel fiyat girişini bitirmek ve Fon/Borsa verilerini ücretsiz kaynaklardan çekmek.
Tahmini Süre: 3 Hafta
2.1. Piyasa Verileri Entegrasyonu (Tamamen Ücretsiz)
Ücretli API'lar yerine, gecikmeli veriyi kabul eden ücretsiz kaynaklar kullanılacak.
Yatırım Fonları (TEFAS):
Kaynak: TEFAS verileri halka açıktır ancak doğrudan API vermez.
Çözüm: Basit bir Fetch fonksiyonu ile fon kodundan (Örn: MAC, TTE) son fiyatın çekilmesi. Gerekirse araya hafif bir proxy katmanı konulacak.
Borsa İstanbul (BIST):
Kaynak: Yahoo Finance API (Gayri resmi ama sağlam).
Format: THYAO.IS kodu ile sorgulama yapılır. Veriler 15dk gecikmeli gelir ancak kapanış fiyatı takibi için yeterlidir ve ücretsizdir.
Kripto Paralar: CoinGecko API (Ücretsiz sürüm).
Döviz & Altın: Frankfurt API veya Yahoo Finance (TRY=X, GC=F).
2.2. Varlık Tipi Genişletmesi
Mevcut yapıya yeni bir varlık tipi eklenecek:
Tip: fund (Yatırım Fonu)
Veri: Fon Kodu (Örn: AFT), Adet.
Hesaplama: Adet * Son TEFAS Fiyatı.
📊 Faz 3: "Kişisel Analiz Paneli" (V1.3)
Hedef: Şahsi finansal sağlığı ölçmek.
Tahmini Süre: 2 Hafta
3.1. Varlık Dağılım Grafikleri
Fon/Hisse/Nakit Oranı: "Portföyümün %30'u Yerli Hisse, %20'si Yabancı Fon" gibi detaylı kırılım (Pasta Grafik).
Fon Getiri Analizi: (İleri Seviye) Fonun günlük değişim yüzdesinin gösterimi.
3.2. Bütçe Limitleri
Kategorilere (Market, Benzin vb.) aylık "soft limit" koyma. Limiti aşınca sadece görsel olarak kırmızıya dönme (Engelleyici değil, bilgilendirici).
🛠️ Teknik Dönüşüm Notları
State Management: Veriler artık localStorage yerine buluttan geleceği için React Context API ile "Canlı Veri Akışı" (Stream) yönetilecek.
API Proxy (Edge Function): Yahoo Finance ve TEFAS gibi kaynaklara tarayıcıdan doğrudan istek atmak bazen "CORS" hatası verir. Bunu aşmak için Vercel/Netlify üzerinde çalışacak mini bir ücretsiz proxy fonksiyonu yazılacak.
Güvenlik: Veritabanı kuralları (Firestore Rules) sadece anahtarı bilenin okuma/yazma yapabileceği şekilde ayarlanacak.
📱 Mobil Web (PWA) İyileştirmeleri (UX Odaklı)
MVP sürümünde başarılan tam ekran (standalone) deneyimini, "native uygulama" hissiyatına taşımak için eklenecek etkileşimler:
Dokunmatik Jestler (Swipe Actions):
Cüzdan ve Portföy listelerinde, bir öğeyi sola kaydırarak "Sil" veya "Düzenle" butonlarını açığa çıkarma (iOS Mail uygulaması mantığı).
Pull-to-Refresh (Yenilemek için Çek):
Listenin en tepesindeyken ekranı aşağı çekerek piyasa verilerini veya senkronizasyonu manuel tetikleme mekanizması.
Haptik Geri Bildirim (Titreşim):
Butonlara basıldığında veya işlem başarılı olduğunda hafif titreşim tepkileri (Haptic Feedback) eklenerek fiziksel hissiyatın artırılması.
