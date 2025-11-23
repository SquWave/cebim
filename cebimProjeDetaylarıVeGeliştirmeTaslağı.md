Cebim (myPocket) Proje Planı ve Geliştirme Taslağı
Bu doküman, kişisel finans ve yatırım takibini birleştiren cross-platform uygulamasının MVP (Minimum Uygulanabilir Ürün) aşamasını tanımlar ve gelecekteki geliştirmelere zemin hazırlar.
1. Proje Kimliği ve Vizyon
Uygulama Adı (Kod Adı)
Cebim (myPocket)
Kullanıcı Hedefi
Finansal durumunun iki ana ayağını (harcama ve yatırım) tek bir ekranda yönetmek isteyen bireyler.
Temel Değer Önerisi
"Neyim var? Nereye gidiyor?" sorularına tek, net ve sade bir cevap sunmak.
Odak
Hız, Kullanılabilirlik ve Mobil-Masaüstü Uyumluluğu.

2. Tasarım ve Görsel Kimlik
Tasarım kararları, finansal verilerin yoğunluğunu dengeleyen, göz yormayan ve modern bir deneyim sunmak amacıyla alınmıştır.
2.1. Renk Paleti ve Tema
Uygulamanın temelinde güven ve odaklanmayı artıran bir Karanlık Mod (Dark Mode) benimsenmiştir.
Amaç
Renk Adı
Hex Kodu
Kullanım Alanı
Temel Tema
Arka Plan (Siyah)
#0f172a (slate-950)
Ana arkaplan rengi.
Vurgu 1 (Ana Aksiyon)
Mor/İndigo
#6366f1 (indigo-500)
Dashboard, Ana Navigasyon, Yatırım Kartları, Kaydet Butonları.
Vurgu 2 (Pozitif)
Zümrüt Yeşili
#10b981 (emerald-500)
Gelir, Pozitif Bakiye, Artış Göstergeleri.
Vurgu 3 (Negatif)
Kırmızımsı Gül
#f43f5e (rose-500)
Gider, Harcama Kartları, Azalış Göstergeleri.
Yazı Rengi
Beyaz / Açık Gri
#f1f5f9 (slate-100)
Başlıklar ve önemli metinler.

2.2. Tipografi (Font)
Özellik
Detay
Neden
Font Ailesi
Inter
Modern, yüksek okunurluk sunar ve farklı boyutlarda tutarlıdır.
Para Birimi Formatı
Türk Lirası (TRY)
Tüm parasal değerler için TR formatı kullanılacaktır. (Örn: 1.234.567,89 ₺)

2.3. İkonografi
Lucide React veya eşdeğer bir modern ikon kütüphanesi kullanılacaktır.
Örnek İkonlar: LayoutDashboard (Özet), Wallet (Cüzdan), TrendingUp (Portföy), PlusCircle (Ekle).
3. Teknik Mimari ve Stack
MVP, en hızlı geliştirmeyi ve platformlar arası uyumluluğu sağlamak amacıyla tek sayfalık bir web uygulaması (SPA) olarak tasarlanmıştır.
Alan
Seçim
Neden
Dağıtım Modeli
PWA (Progressive Web App)
Mobil cihazlarda (özellikle iOS) uygulama gibi yüklenebilme, tam ekran deneyimi ve çevrimdışı önbellekleme desteği.
Framework
React (Tek dosya .jsx formatında)
Hızlı bileşen tabanlı geliştirme ve dinamik arayüz yönetimi.
Styling
Tailwind CSS
Mobil öncelikli, hızlı ve duyarlı (responsive) UI geliştirmesi.
Depolama
localStorage
MVP için hızlı başlangıç, sunucu bağımsızlığı ve anonim kullanım. Veriler kullanıcının cihazında saklanır.

4. MVP Özellik Seti (Kesinleştirilmiş)
Bu, uygulamanın ilk sürümünde mutlaka bulunması gereken temel özelliklerdir.
4.1. Hibrit Dashboard (Ana Kontrol Paneli)
Net Servet Gösterimi: Nakit Dengesi ile Portföy Değeri toplamının tek bir büyük rakam olarak gösterilmesi.
Aylık Özet: Bu ayki toplam Gelir ve Gider durumunun karşılaştırmalı gösterimi.
Basit Dağılım Listesi: Portföydeki varlıkların (Altın, Hisse, Döviz) toplam yatırım içindeki değerleri.
4.2. Cüzdan Modülü (Gelir/Gider Yönetimi)
Hızlı İşlem Ekleme Formu: Tutar, Açıklama, Kategori ve İşlem Tipi (Gelir/Gider) girişleri.
İşlem Geçmişi: İşlemlerin tarih sırasına göre listelenmesi ve tek tıkla silme imkanı.
Nakit Dengesi: Otomatik hesaplanan (Toplam Gelir - Toplam Gider).
4.3. Portföy Modülü (Yatırım Takibi)
Varlık Kayıt Formu: Varlık Adı (Kodu), Tipi (Stok, Kripto, Döviz vb.) ve Sahip Olunan Adet/Miktar girişleri.
Manuel Fiyat Güncelleme: Varlık kartları üzerinde, birim fiyat alanının kullanıcı tarafından düzenlenerek anlık olarak toplam değerin güncellenmesi. (Canlı API Entegrasyonu bu aşamada yoktur.)
Toplam Portföy Değeri: Tüm yatırım varlıklarının değerlerinin toplanarak Dashboard'a yansıtılması.
5. Gelecek Özellikler (V1.1 ve Sonrası)
Bu özellikler, MVP başarılı olduktan sonra geliştirilecektir.
Gerçek Zamanlı Fiyatlar: Harici API'lar (BIST, CoinGecko vb.) ile otomatik fiyat çekimi.
Senkronizasyon: Firebase (Firestore) kullanılarak verilerin bulutta yedeklenmesi ve cihazlar arası senkronizasyon.
Gelişmiş Raporlama: Kategori bazında harcama pastası grafikleri ve aylık/yıllık trend analizleri.
Tekrarlayan İşlemler: Kira veya fatura gibi sabit periyodik işlemlerin otomatik kaydedilmesi.
