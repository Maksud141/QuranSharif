
/* =====================================================
   QURAN SHARIF — SERVICE WORKER
   Offline Cache: Quran + Word Meaning + Hadith + Tafsir
===================================================== */
const CACHE_NAME = "quran-sharif-v107";

/* =====================================================
   ১. মূল অ্যাপ ফাইল
===================================================== */

const APP_FILES = [
    "./",
    "./index.html",

    "./css/style.css",
    "./css/responsive.css",

    "./js/app.js",
    "./js/quran.js",
    "./js/words.js",
    "./js/hadith.js",
    "./js/settings.js",
    "./js/tafsir.js"
];

/* =====================================================
   ২. কুরআনের ১১৪টি JSON
   data/quran/001.json — 114.json
===================================================== */

const QURAN_FILES = Array.from(
    { length: 114 },
    (_, i) => `./data/quran/${String(i + 1).padStart(3, "0")}.json`
);

/* =====================================================
   ৩. শব্দে শব্দে অর্থের ১১৪টি JSON
   data/surah-1.json — surah-114.json
===================================================== */

const WORD_FILES = Array.from(
    { length: 114 },
    (_, i) => `./data/surah-${i + 1}.json`
);

/* =====================================================
   ৪. সহীহ বুখারী ও সহীহ মুসলিম
===================================================== */

const HADITH_FILES = [
    "./data/hadith/bukhari/bukhari.json",
    "./data/hadith/muslim/muslim.json",
    "./data/hadith/tirmidhi/tirmidhi.json",

    // বুখারী — ৯৭ অধ্যায়
    ...Array.from(
        { length: 97 },
        (_, i) => `./data/hadith/bukhari/Chapter/${i + 1}.json`
    ),

    // মুসলিম — ৫৬ অধ্যায়
    ...Array.from(
        { length: 56 },
        (_, i) => `./data/hadith/muslim/Chapter/${i + 1}.json`
    ),
    // তিরমিজি ৪৬ অধ্যায়
    ...Array.from(
        { length: 46 },
    (_, i) => `./data/hadith/tirmidhi/Chapter/${i + 1}.json`
  )
];

/* =====================================================
   ৫. চারটি বাংলা তাফসির
   প্রতিটি ফোল্ডারে 001.json — 114.json
===================================================== */

const TAFSIR_FOLDERS = [
    "abu-bakr-zakaria",
    "ahsanul_bayaan",
    "fathul_majid",
    "ibn_kathir"
];

const TAFSIR_FILES = TAFSIR_FOLDERS.flatMap(folder =>
    Array.from(
        { length: 114 },
        (_, i) =>
            `./data/tafsir/${folder}/${String(i + 1).padStart(3, "0")}.json`
    )
);

/* =====================================================
   ৬. সব ফাইল একত্র করা
===================================================== */

const ALL_FILES = [
    ...new Set([
        ...APP_FILES,
        ...QURAN_FILES,
        ...WORD_FILES,
        ...HADITH_FILES,
        ...TAFSIR_FILES
    ])
];

/* =====================================================
   ৭. INSTALL — ১০টি করে ফাইল ক্যাশ
===================================================== */

self.addEventListener("install", event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        const failedFiles = [];

        console.log("📥 মোট ফাইল ক্যাশ করার তালিকা:", ALL_FILES.length);

        for (let i = 0; i < ALL_FILES.length; i += 10) {
            const batch = ALL_FILES.slice(i, i + 10);

            const results = await Promise.allSettled(
                batch.map(async path => {
                    const fileURL = new URL(
                        path,
                        self.registration.scope
                    ).href;

                    const response = await fetch(fileURL, {
                        cache: "reload"
                    });

                    if (!response.ok) {
                        throw new Error(
                            `HTTP ${response.status}: ${path}`
                        );
                    }

                    await cache.put(fileURL, response);
                })
            );

            results.forEach((result, index) => {
                if (result.status === "rejected") {
                    failedFiles.push({
                        file: batch[index],
                        error: String(result.reason)
                    });
                }
            });

            console.log(
                `📦 ক্যাশ অগ্রগতি: ${Math.min(i + 10, ALL_FILES.length)}/${ALL_FILES.length}`
            );
        }

        console.log("📊 মোট ফাইল:", ALL_FILES.length);
        console.log("❌ ব্যর্থ ফাইল:", failedFiles.length);

        if (failedFiles.length > 0) {
            console.error("❌ ক্যাশ হয়নি এমন ফাইল:", failedFiles);
        } else {
            console.log("✅ সব তালিকাভুক্ত ফাইল ক্যাশ হয়েছে");
        }

        await self.skipWaiting();
    })());
});

/* =====================================================
   ৮. ACTIVATE — পুরোনো অ্যাপ ক্যাশ মুছে ফেলা
===================================================== */

self.addEventListener("activate", event => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();

        await Promise.all(
            cacheNames.map(cacheName => {
                if (
                    cacheName.startsWith("quran-sharif-") &&
                    cacheName !== CACHE_NAME
                ) {
                    return caches.delete(cacheName);
                }
            })
        );

        await self.clients.claim();

        console.log("✅ Quran Sharif Service Worker সক্রিয়");
    })());
});

/* =====================================================
   ৯. FETCH — আগে ক্যাশ, পরে নেটওয়ার্ক
===================================================== */

self.addEventListener("fetch", event => {
    const request = event.request;

    // শুধু GET রিকোয়েস্ট
    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // অন্য ওয়েবসাইটের রিকোয়েস্ট নিয়ন্ত্রণ করবে না
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith((async () => {
        try {
            // আগে ক্যাশ পরীক্ষা
            const cachedResponse = await caches.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            // ক্যাশে না থাকলে নেটওয়ার্ক থেকে আনার চেষ্টা
            const networkResponse = await fetch(request);

            // সফল রেসপন্স ক্যাশে রাখা
            if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAME);

                await cache.put(
                    request,
                    networkResponse.clone()
                );
            }

            return networkResponse;

        } catch (error) {
            console.warn(
                "⚠️ ফাইল পাওয়া যায়নি:",
                request.url
            );

            // অফলাইনে পেজ খোলার অনুরোধ
            if (request.mode === "navigate") {
                const cache = await caches.open(CACHE_NAME);

                const homePage = await cache.match(
                    new URL("./index.html", self.registration.scope).href
                );

                if (homePage) {
                    return homePage;
                }
            }

            // অনুপস্থিত ফাইলের জন্য স্পষ্ট ত্রুটি
            return new Response(
                "ফাইলটি ক্যাশে নেই। ইন্টারনেট চালু করে আবার চেষ্টা করুন।",
                {
                    status: 503,
                    statusText: "Offline resource unavailable",
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8"
                    }
                }
            );
        }
    })());
});
