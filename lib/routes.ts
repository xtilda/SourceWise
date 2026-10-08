export type Stop = { id: string; position: number; name: string; note: string; lat: number; lng: number; stayMinutes?: number; officialUrl?: string; photo?: string; photoCredit?: { name: string; source: string; license: string } };
export type CityRoute = {
  id: string; title: string; description: string; neighborhood: string;
  duration: number; mood: string; author: string; createdAt: string;
  budget: "Free" | "Low" | "Flexible"; weather: "Any" | "Rain-friendly" | "Dry day"; soloFriendly: boolean;
  cover?: string; coverCredit?: { name: string; source: string; license: string }; stops: Stop[];
};

export const moods = ["All", "Art & culture", "Slow day", "Food & drink", "After dark", "Outdoors"] as const;

export const moodLabel = (value: string) => ({All: "Tümü", "Art & culture": "Sanat & kültür", "Slow day": "Sakin bir gün", "Food & drink": "Yeme & içme", "After dark": "Akşam keşfi", Outdoors: "Açık havada"} as Record<string, string>)[value] ?? value;
export const budgetLabel = (value: string) => ({Free: "Ücretsiz", Low: "Düşük bütçe", Flexible: "Esnek bütçe"} as Record<string, string>)[value] ?? value;
export const weatherLabel = (value: string) => ({Any: "Her hava koşulu", "Rain-friendly": "Yağmura uygun", "Dry day": "Yağışsız gün"} as Record<string, string>)[value] ?? value;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b.lat - a.lat), dLng = radians(b.lng - a.lng);
  const arc = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function estimatedWalkKm(stops: Stop[]): number {
  const direct = stops.slice(1).reduce((total, stop, index) => total + distanceKm(stops[index], stop), 0);
  return Math.round(direct * 1.35 * 10) / 10;
}

const sampleRoutesBase: CityRoute[] = [
  {
    id: "karakoy-in-the-rain", title: "Yağmur sonrası Karaköy", neighborhood: "Karaköy · Beyoğlu",
    description: "Tarihi yapılar, çağdaş sanat ve sahil arasında sakin bir öğleden sonra. Keyifli duraklara zaman ayır.",
    duration: 150, mood: "Art & culture", budget: "Low", weather: "Rain-friendly", soloFriendly: true, author: "City Curator", createdAt: "2026-09-20",
    cover: "/karakoy-commons.webp",
    coverCredit: { name: "Metuboy", source: "https://commons.wikimedia.org/wiki/File:Streets_of_Karak%C3%B6y_in_%C4%B0stanbul.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "k1", position: 0, name: "SALT Galata", note: "Okuma alanlarından başla; güncel sergiyi kendi hızında gez.", lat: 41.0248, lng: 28.9731 },
      { id: "k2", position: 1, name: "Karaköy sokakları", note: "Ara sokaklardan aşağı doğru yürü; rotanın bu bölümünde keşfi sana bırakıyoruz.", lat: 41.0234, lng: 28.9764 },
      { id: "k3", position: 2, name: "İstanbul Modern", note: "Sanat, mimari ve karşı kıyının manzarası için uzun bir mola ver.", lat: 41.0254, lng: 28.9837 },
      { id: "k4", position: 3, name: "Tophane sahili", note: "Şehrin ışıkları yanmaya başlarken yürüyüşü Boğaz kıyısında bitir.", lat: 41.0251, lng: 28.9851 },
    ],
  },
  {
    id: "a-slow-way-to-moda", title: "Moda’ya yavaş yavaş", neighborhood: "Kadıköy · Moda",
    description: "Vapurla başlayan, opera binasının önünden geçen ve deniz kenarında biten telaşsız bir yürüyüş.",
    duration: 105, mood: "Slow day", budget: "Free", weather: "Dry day", soloFriendly: true, author: "City Curator", createdAt: "2026-09-18",
    cover: "/moda-commons.webp",
    coverCredit: { name: "ErkanAkbulak", source: "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_Moda.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "m1", position: 0, name: "Kadıköy Vapur İskelesi", note: "Vapur yolculuğuyla başla. Yolun kendisi de bu günün bir parçası.", lat: 40.9913, lng: 29.0221 },
      { id: "m2", position: 1, name: "Süreyya Operası", note: "Mahallenin içinden dolaşarak gel ve binanın cephesine bakmak için dur.", lat: 40.9885, lng: 29.0277 },
      { id: "m3", position: 2, name: "Moda sahili", note: "Yanına okuyacak bir şey al ya da sadece geçen vapurları izle.", lat: 40.9787, lng: 29.0268 },
    ],
  },
  {
    id: "golden-horn-wander", title: "Haliç boyunca", neighborhood: "Fener · Balat",
    description: "Tarihi binaları, karakterli sokakları ve ara sokaklarda keşfe çıkmayı sevenlere.",
    duration: 120, mood: "Outdoors", budget: "Free", weather: "Dry day", soloFriendly: true, author: "City Curator", createdAt: "2026-09-16",
    cover: "/balat-commons.webp",
    coverCredit: { name: "Cabalist12", source: "https://commons.wikimedia.org/wiki/File:Fener_Balat_-_Nakka%C5%9F_Haydar_Sok.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "b1", position: 0, name: "Fener sahili", note: "Su kıyısından başla ve mahallenin sokaklarını yokuş yukarı takip et.", lat: 41.0292, lng: 28.9499 },
      { id: "b2", position: 1, name: "Fener ara sokakları", note: "Evlerin katmanlarına ve göz hizasının üzerindeki küçük ayrıntılara dikkat et.", lat: 41.0302, lng: 28.9476 },
      { id: "b3", position: 2, name: "Balat sokakları", note: "Mahallenin içindeki son bölümde adımlarını yavaşlat.", lat: 41.0298, lng: 28.9434 },
    ],
  },
  {
    id: "yildiz-green-hour", title: "Yıldız’da sakin bir saat", neighborhood: "Beşiktaş · Yıldız",
    description: "Kalabalık sokaklardan ağaçlı patikalara geç; parkta kendine sakin bir mola ver.",
    duration: 75, mood: "Outdoors", budget: "Free", weather: "Dry day", soloFriendly: true, author: "City Curator", createdAt: "2026-09-15",
    cover: "/yildiz-commons.webp",
    coverCredit: { name: "Samaramco", source: "https://commons.wikimedia.org/wiki/File:Y%C4%B1ld%C4%B1z_park.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "y1", position: 0, name: "Yıldız Parkı girişi", note: "Alt girişten başla; patika yükseldikçe temponu düşür.", lat: 41.0472, lng: 29.0167 },
      { id: "y2", position: 1, name: "Yıldız Parkı patikaları", note: "Seni çağıran gölgeli patikayı seç; bu yürüyüşte sıkı bir programa ihtiyacın yok.", lat: 41.0498, lng: 29.0168 },
      { id: "y3", position: 2, name: "Parkın üst kısmındaki seyir noktası", note: "Dönmeden önce bir bank bul ve manzaranın tadını çıkar.", lat: 41.0521, lng: 29.0151 },
    ],
  },
  {
    id: "galata-pages", title: "Galata’da sayfalar ve sokaklar", neighborhood: "Galata · Karaköy",
    description: "Yağmurlu bir öğleden sonra için kısa bir kültür rotası. Gezmek ve okumak için zamanın var.",
    duration: 95, mood: "Art & culture", budget: "Free", weather: "Rain-friendly", soloFriendly: true, author: "City Curator", createdAt: "2026-09-14",
    cover: "/karakoy-commons.webp",
    coverCredit: { name: "Metuboy", source: "https://commons.wikimedia.org/wiki/File:Streets_of_Karak%C3%B6y_in_%C4%B0stanbul.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "g1", position: 0, name: "Galata Kulesi Meydanı", note: "Kuleye bak, ardından daha sakin ara sokaklardan aşağı in.", lat: 41.0256, lng: 28.9742 },
      { id: "g2", position: 1, name: "SALT Galata", note: "Sergileri ve okuma alanlarını keşfet; gelmeden önce güncel açılış saatlerini kontrol et.", lat: 41.0248, lng: 28.9731 },
      { id: "g3", position: 2, name: "Kamondo Merdivenleri", note: "Açık havada kısa bir sapak yaparak kıvrımlı merdivenlerde bitir.", lat: 41.0239, lng: 28.9737 },
    ],
  },
  {
    id: "moda-by-the-sea", title: "Deniz kenarında Moda", neighborhood: "Moda · Kadıköy",
    description: "Rezervasyonsuz, biletsiz ve acele etmeden yapabileceğin kolay bir sahil yürüyüşü.",
    duration: 80, mood: "Outdoors", budget: "Free", weather: "Dry day", soloFriendly: true, author: "City Curator", createdAt: "2026-09-13",
    cover: "/moda-commons.webp",
    coverCredit: { name: "ErkanAkbulak", source: "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_Moda.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "ms1", position: 0, name: "Moda Parkı", note: "Ağaçların arasından başla ve patikaları denize doğru takip et.", lat: 40.9817, lng: 29.0261 },
      { id: "ms2", position: 1, name: "Moda sahili", note: "Deniz kıyısında dur ve karşıya geçen vapurları izle.", lat: 40.9787, lng: 29.0268 },
      { id: "ms3", position: 2, name: "Moda İskelesi", note: "İskele yakınında bitir; vaktin varsa günün ışığını izlemek için biraz kal.", lat: 40.9778, lng: 29.0236 },
    ],
  },
  {
    id: "fener-small-details", title: "Fener’in küçük ayrıntıları", neighborhood: "Fener · Balat",
    description: "Cepheler, yokuşlar ve başını kaldırıp fark edeceğin ayrıntılar için kısa bir rota.",
    duration: 90, mood: "Art & culture", budget: "Free", weather: "Dry day", soloFriendly: true, author: "City Curator", createdAt: "2026-09-12",
    cover: "/balat-commons.webp",
    coverCredit: { name: "Cabalist12", source: "https://commons.wikimedia.org/wiki/File:Fener_Balat_-_Nakka%C5%9F_Haydar_Sok.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "f1", position: 0, name: "Fener sahili", note: "Haliç kıyısında çevreyi tanıyarak başla.", lat: 41.0292, lng: 28.9499 },
      { id: "f2", position: 1, name: "Fener Rum Lisesi seyir noktası", note: "Kırmızı tuğlalı binayı sokaktan izle. Bu durak dışarıdan bakmak için; iç mekân ziyareti içermiyor.", lat: 41.0299, lng: 28.9481 },
      { id: "f3", position: 2, name: "Nakkaş Haydar Sokak", note: "Renklere, kapılara ve sokağın değişen eğimine zaman ayır.", lat: 41.0301, lng: 28.9452 },
    ],
  },
  {
    id: "besiktas-to-the-trees", title: "İskeleden ağaçların arasına", neighborhood: "Beşiktaş · Yıldız",
    description: "Hareketli merkezden başlayıp yeşillikler arasında daha sakin bir öğleden sonraya yürü.",
    duration: 115, mood: "Slow day", budget: "Free", weather: "Dry day", soloFriendly: true, author: "City Curator", createdAt: "2026-09-11",
    cover: "/yildiz-commons.webp",
    coverCredit: { name: "Samaramco", source: "https://commons.wikimedia.org/wiki/File:Y%C4%B1ld%C4%B1z_park.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "bp1", position: 0, name: "Beşiktaş Vapur İskelesi", note: "Buluşmak için iyi bir nokta; sahilde biraz vakit geçir.", lat: 41.0411, lng: 29.0056 },
      { id: "bp2", position: 1, name: "Çırağan sahili", note: "Yokuşa dönmeden önce kıyı boyunca doğuya yürü.", lat: 41.0448, lng: 29.0117 },
      { id: "bp3", position: 2, name: "Yıldız Parkı girişi", note: "Burada şehrin gürültüsü yerini parkın sakinliğine bırakır.", lat: 41.0472, lng: 29.0167 },
    ],
  },
  {
    id: "karakoy-evening-light", title: "Akşam ışığında Karaköy", neighborhood: "Karaköy · Tophane",
    description: "Şehrin renk değiştirdiği saatler için su kıyısında bir yürüyüş.",
    duration: 65, mood: "After dark", budget: "Free", weather: "Dry day", soloFriendly: false, author: "City Curator", createdAt: "2026-09-10",
    cover: "/karakoy-commons.webp",
    coverCredit: { name: "Metuboy", source: "https://commons.wikimedia.org/wiki/File:Streets_of_Karak%C3%B6y_in_%C4%B0stanbul.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "ke1", position: 0, name: "Karaköy Vapur İskelesi", note: "Vapurlar yanaşırken su kıyısından başla.", lat: 41.0224, lng: 28.9779 },
      { id: "ke2", position: 1, name: "Karaköy sokakları", note: "Kısa ara sokaklardan Tophane’ye doğru yürü.", lat: 41.0234, lng: 28.9804 },
      { id: "ke3", position: 2, name: "Tophane sahili", note: "Boğaz manzarası ve şehrin ilk ışıklarıyla bitir.", lat: 41.0251, lng: 28.9851 },
    ],
  },
  {
    id: "kadikoy-culture-hour", title: "Kadıköy’de kültür molası", neighborhood: "Kadıköy · Moda",
    description: "Mimari, mahalle sokakları ve deniz kenarında bir final için kısa bir keşif.",
    duration: 95, mood: "Art & culture", budget: "Free", weather: "Rain-friendly", soloFriendly: true, author: "City Curator", createdAt: "2026-09-09",
    cover: "/moda-commons.webp",
    coverCredit: { name: "ErkanAkbulak", source: "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_Moda.jpg", license: "CC BY-SA 4.0" },
    stops: [
      { id: "kc1", position: 0, name: "Kadıköy Vapur İskelesi", note: "Vapurla karşıya geçmek güne başlamak için güzel bir yol.", lat: 40.9913, lng: 29.0221 },
      { id: "kc2", position: 1, name: "Süreyya Operası", note: "Cepheye bakmak için dur; içeri girmek istersen güncel programı kontrol et.", lat: 40.9885, lng: 29.0277 },
      { id: "kc3", position: 2, name: "Moda Parkı", note: "Ağaçların arasında bitir ya da sahile doğru devam et.", lat: 40.9817, lng: 29.0261 },
    ],
  },
];

const curatedStay: Record<string, number> = {
  k1: 35, k2: 15, k3: 50, k4: 20,
  m1: 15, m2: 15, m3: 35,
  b1: 15, b2: 25, b3: 30,
  y1: 10, y2: 35, y3: 20,
  g1: 15, g2: 40, g3: 15,
  ms1: 20, ms2: 30, ms3: 20,
  f1: 10, f2: 25, f3: 25,
  bp1: 15, bp2: 20, bp3: 35,
  ke1: 15, ke2: 20, ke3: 25,
  kc1: 15, kc2: 20, kc3: 30,
};

const curatedDetails: Record<string, Partial<Stop>> = {
  k1: { officialUrl: "https://saltonline.org/en/1500/contact" },
  g2: { officialUrl: "https://saltonline.org/en/1500/contact" },
  k2: { photo: "/karakoy-commons.webp", photoCredit: { name: "Metuboy", source: "https://commons.wikimedia.org/wiki/File:Streets_of_Karak%C3%B6y_in_%C4%B0stanbul.jpg", license: "CC BY-SA 4.0" } },
  ke2: { photo: "/karakoy-commons.webp", photoCredit: { name: "Metuboy", source: "https://commons.wikimedia.org/wiki/File:Streets_of_Karak%C3%B6y_in_%C4%B0stanbul.jpg", license: "CC BY-SA 4.0" } },
  k3: { officialUrl: "https://www.istanbulmodern.org/en/visit/museum", photo: "/istanbul-modern-commons.webp", photoCredit: { name: "Dosseman", source: "https://commons.wikimedia.org/wiki/File:Istanbul_Museum_of_Modern_Art_Exterior_in_2024_5619.jpg", license: "CC BY-SA 4.0" } },
  m2: { officialUrl: "https://sureyyaoperasi.kadikoy.bel.tr/en/", photo: "/sureyya-commons.webp", photoCredit: { name: "Basak", source: "https://commons.wikimedia.org/wiki/File:20240408_S%C3%BCreyya_Operas%C4%B1.jpg", license: "CC BY-SA 4.0" } },
  kc2: { officialUrl: "https://sureyyaoperasi.kadikoy.bel.tr/en/", photo: "/sureyya-commons.webp", photoCredit: { name: "Basak", source: "https://commons.wikimedia.org/wiki/File:20240408_S%C3%BCreyya_Operas%C4%B1.jpg", license: "CC BY-SA 4.0" } },
  m3: { photo: "/moda-commons.webp", photoCredit: { name: "ErkanAkbulak", source: "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_Moda.jpg", license: "CC BY-SA 4.0" } },
  ms2: { photo: "/moda-commons.webp", photoCredit: { name: "ErkanAkbulak", source: "https://commons.wikimedia.org/wiki/File:Kad%C4%B1k%C3%B6y_Moda.jpg", license: "CC BY-SA 4.0" } },
  b3: { photo: "/balat-commons.webp", photoCredit: { name: "Cabalist12", source: "https://commons.wikimedia.org/wiki/File:Fener_Balat_-_Nakka%C5%9F_Haydar_Sok.jpg", license: "CC BY-SA 4.0" } },
  f3: { photo: "/balat-commons.webp", photoCredit: { name: "Cabalist12", source: "https://commons.wikimedia.org/wiki/File:Fener_Balat_-_Nakka%C5%9F_Haydar_Sok.jpg", license: "CC BY-SA 4.0" } },
  y2: { photo: "/yildiz-commons.webp", photoCredit: { name: "Samaramco", source: "https://commons.wikimedia.org/wiki/File:Y%C4%B1ld%C4%B1z_park.jpg", license: "CC BY-SA 4.0" } },
  bp3: { photo: "/yildiz-commons.webp", photoCredit: { name: "Samaramco", source: "https://commons.wikimedia.org/wiki/File:Y%C4%B1ld%C4%B1z_park.jpg", license: "CC BY-SA 4.0" } },
  g1: { photo: "/galata-tower-commons.webp", photoCredit: { name: "Martin Falbisoner", source: "https://commons.wikimedia.org/wiki/File:Galata_Tower_January_2015.JPG", license: "CC BY-SA 4.0" } },
  f2: { photo: "/fener-school-commons.webp", photoCredit: { name: "Hamdigumus", source: "https://commons.wikimedia.org/wiki/File:%C3%96zel_Fener_Rum_Ortaokulu_ve_Lisesi_2015.jpg", license: "CC0" } },
};

export const sampleRoutes: CityRoute[] = sampleRoutesBase.map((route) => ({
  ...route,
  stops: route.stops.map((stop) => ({ ...stop, stayMinutes: curatedStay[stop.id] ?? 20, ...curatedDetails[stop.id] })),
}));
