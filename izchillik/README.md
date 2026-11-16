# Izchillik — Shaxsiy samaradorlik ilovasi (PWA)

O'zbek tilidagi mobil-birinchi (mobile-first) shaxsiy odatlar, vazifalar, marralar va XP/daraja kuzatuv ilovasi.

## Texnologiyalar
- React 18 + TypeScript (strict)
- Vite + Tailwind CSS + Lucide React
- IndexedDB (`idb`) + `navigator.storage.persist()`
- `vite-plugin-pwa` (oflayn kesh, manifest, o'rnatish)
- Vitest (o'yin mantig'i unit testlari)

## Mahalliy ishga tushirish

    npm install
    npm test
    npm run dev
    npm run build

## Netlify orqali deploy qilish
1. Loyihani GitHub omboriga yuklang.
2. Netlify da **Add new site -> Import an existing project** ni tanlang.
3. Build buyrug'i: `npm run build`, publish papkasi: `dist` (`netlify.toml` faylida ham ko'rsatilgan, SPA redirect bilan).

## Bildirishnomalar arxitekturasi (Halol tushuntirish)
Brauzerdagi oddiy JavaScript taymeri ilova yopilganda ishlay olmaydi. Shu sababli ikki bosqichli yondashuv ko'zda tutilgan:

1. **Ilova ochiq yoki o'rnatilgan holatda (hozir ishlaydi):**
   `Sozlamalar -> Kunlik eslatma` yoqilganda har 30 soniyada vaqt tekshiriladi va `Notification API` / Service Worker `showNotification` orqali xabar beriladi.
2. **Ilova yopiq paytdagi haqiqiy fon Push-bildirishnomalari (Backend talab qiladi):**
   - **VAPID kalitlari:** `npx web-push generate-vapid-keys` orqali ochiq va maxfiy kalit yarating.
   - **Obuna saqlash:** `registration.pushManager.subscribe(...)` orqali olingan `PushSubscription` obyektini Netlify Function (`/.netlify/functions/subscribe`) orqali ma'lumotlar bazasiga (masalan Supabase, Upstash Redis yoki Netlify Blobs) saqlang.
   - **Service Worker:** Maxsus SW faylida `self.addEventListener('push', ...)` qo'shing.
   - **Rejali yuborish:** Netlify Scheduled Function (`schedule = "*/15 * * * *"`) har 15 daqiqada `web-push` kutubxonasi yordamida mos vaqtdagi obunachilarga push yuboradi.
   - **iOS cheklovi:** Apple iOS (16.4+) da Web Push **faqat** foydalanuvchi Safari orqali saytni **Asosiy ekranga qo'shganda (Add to Home Screen)** va o'sha PWA ilovasi ichidan ruxsat berganda ishlaydi.