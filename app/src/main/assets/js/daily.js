/* =========================================================
   QURAN SHARIF — DAILY CONTENT
   Version 3.0

   📖 আজকের আয়াত
   📜 আজকের হাদিস
   🤲 আজকের দোয়া

   FEATURES
   - প্রতি স্থানীয় দিনে একই Content
   - নতুন দিনে নতুন Random Content
   - LocalStorage cache
   - Offline fallback
   - Quran JSON: 001.json - 114.json
   - Hadith JSON: ar, bn, hadith_id, narrator, grade
   - Chapter JSON support
   - Dua API + cached data support
   - Prevent duplicate initialization/loading
========================================================= */


/* =========================================================
   1. CONFIG
========================================================= */

const DAILY_CONTENT_STORAGE_KEY =
    "quranSharif_dailyContent";

const DAILY_CONTENT_VERSION = 3;

const DAILY_QURAN_BASE_PATH =
    "data/quran/";

const DAILY_HADITH_PATHS = {
    bukhari: "data/hadith/bukhari/",
    muslim: "data/hadith/muslim/",
    tirmidhi: "data/hadith/tirmidhi/"
};

const DAILY_HADITH_BOOK_NAMES = {
    bukhari: "সহীহ বুখারী",
    muslim: "সহীহ মুসলিম",
    tirmidhi: "জামে আত-তিরমিযী"
};

const DAILY_DUA_API =
    "https://dua-api.hisnul.workers.dev/api";

const DAILY_HADITH_CHAPTER_LIMIT = 50;


/* =========================================================
   2. STATE
========================================================= */

let dailyContentLoading = false;
let dailyContentData = null;
let dailyContentLoadPromise = null;
let dailyContentDateTimer = null;


/* =========================================================
   3. FALLBACK CONTENT
========================================================= */

const DAILY_FALLBACK_AYAH = {
    surah: 94,
    ayah: 6,
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    bengali: "নিশ্চয়ই কষ্টের সাথে স্বস্তি রয়েছে।"
};

const DAILY_FALLBACK_HADITH = {
    book: "সহীহ বুখারী",
    number: "",
    narrator: "",
    grade: "",
    chapter: "",
    arabic: "",
    bengali: "নিশ্চয়ই কাজসমূহ নিয়তের উপর নির্ভরশীল।"
};

const DAILY_FALLBACK_DUA = {
    id: null,
    title: "দোয়া",
    arabic:
        "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    bengali:
        "হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দান করুন এবং আখিরাতেও কল্যাণ দান করুন।",
    reference: ""
};


/* =========================================================
   4. RANDOM HELPER
========================================================= */

function dailyRandomIndex(length) {
    if (!Number.isFinite(length) || length <= 0) {
        return 0;
    }

    return Math.floor(Math.random() * length);
}

function dailyShuffle(items) {
    const result = Array.isArray(items)
        ? [...items]
        : [];

    for (let i = result.length - 1; i > 0; i--) {
        const j = dailyRandomIndex(i + 1);

        [result[i], result[j]] =
            [result[j], result[i]];
    }

    return result;
}


/* =========================================================
   5. LOCAL DATE KEY
========================================================= */

function getDailyDateKey() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   6. SAFE LOCAL STORAGE
========================================================= */

function dailyReadStorage(key) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value);
    } catch (error) {
        console.warn(
            "Daily storage read failed:",
            key,
            error
        );

        return null;
    }
}

function dailyWriteStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.warn(
            "Daily storage write failed:",
            key,
            error
        );

        return false;
    }
}


/* =========================================================
   7. LOAD SAVED DAILY CONTENT
========================================================= */

function getSavedDailyContent() {
    const data = dailyReadStorage(
        DAILY_CONTENT_STORAGE_KEY
    );

    if (!data || typeof data !== "object") {
        return null;
    }

    if (
        data.version !== DAILY_CONTENT_VERSION
    ) {
        return null;
    }

    if (
        data.dateKey !== getDailyDateKey()
    ) {
        return null;
    }

    if (
        !data.ayah ||
        !data.hadith ||
        !data.dua
    ) {
        return null;
    }

    return data;
}


/* =========================================================
   8. SAVE DAILY CONTENT
========================================================= */

function saveDailyContent(data) {
    if (!data || typeof data !== "object") {
        return false;
    }

    return dailyWriteStorage(
        DAILY_CONTENT_STORAGE_KEY,
        data
    );
}


/* =========================================================
   9. FETCH JSON
========================================================= */

async function dailyFetchJSON(url) {
    const response = await fetch(url, {
        cache: "no-cache"
    });

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${url}`
        );
    }

    return await response.json();
}


/* =========================================================
   10. GET FIRST AVAILABLE VALUE
========================================================= */

function getFirstValue(object, keys) {
    if (!object || typeof object !== "object") {
        return "";
    }

    for (const key of keys) {
        const value = object[key];

        if (
            value !== undefined &&
            value !== null &&
            typeof value !== "object" &&
            String(value).trim() !== ""
        ) {
            return String(value).trim();
        }
    }

    return "";
}


/* =========================================================
   11. EXTRACT ARRAY FROM JSON
========================================================= */

function extractArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (!data || typeof data !== "object") {
        return [];
    }

    const possibleKeys = [
        "ayahs",
        "verses",
        "items",
        "results",
        "data"
    ];

    for (const key of possibleKeys) {
        if (Array.isArray(data[key])) {
            return data[key];
        }
    }

    return [];
}


/* =========================================================
   12. QURAN SURAH NAME
========================================================= */

const DAILY_SURAH_NAMES = [
    "আল-ফাতিহা",
    "আল-বাকারা",
    "আলে ইমরান",
    "আন-নিসা",
    "আল-মায়িদা",
    "আল-আনআম",
    "আল-আরাফ",
    "আল-আনফাল",
    "আত-তাওবা",
    "ইউনুস",
    "হুদ",
    "ইউসুফ",
    "আর-রাদ",
    "ইবরাহিম",
    "আল-হিজর",
    "আন-নাহল",
    "আল-ইসরা",
    "আল-কাহফ",
    "মারইয়াম",
    "ত্ব-হা",
    "আল-আম্বিয়া",
    "আল-হাজ্জ",
    "আল-মুমিনুন",
    "আন-নূর",
    "আল-ফুরকান",
    "আশ-শুআরা",
    "আন-নামল",
    "আল-কাসাস",
    "আল-আনকাবুত",
    "আর-রূম",
    "লুকমান",
    "আস-সাজদাহ",
    "আল-আহযাব",
    "সাবা",
    "ফাতির",
    "ইয়াসিন",
    "আস-সাফফাত",
    "সাদ",
    "আয-যুমার",
    "গাফির",
    "ফুসসিলাত",
    "আশ-শূরা",
    "আয-যুখরুফ",
    "আদ-দুখান",
    "আল-জাসিয়াহ",
    "আল-আহকাফ",
    "মুহাম্মাদ",
    "আল-ফাতহ",
    "আল-হুজুরাত",
    "কাফ",
    "আয-যারিয়াত",
    "আত-তূর",
    "আন-নাজম",
    "আল-কামার",
    "আর-রহমান",
    "আল-ওয়াকিয়া",
    "আল-হাদিদ",
    "আল-মুজাদিলাহ",
    "আল-হাশর",
    "আল-মুমতাহিনা",
    "আস-সাফ",
    "আল-জুমুআ",
    "আল-মুনাফিকুন",
    "আত-তাগাবুন",
    "আত-তালাক",
    "আত-তাহরিম",
    "আল-মুলক",
    "আল-কলম",
    "আল-হাক্কাহ",
    "আল-মাআরিজ",
    "নূহ",
    "আল-জিন",
    "আল-মুজ্জাম্মিল",
    "আল-মুদ্দাসসির",
    "আল-কিয়ামাহ",
    "আল-ইনসান",
    "আল-মুরসালাত",
    "আন-নাবা",
    "আন-নাজিয়াত",
    "আবাসা",
    "আত-তাকভীর",
    "আল-ইনফিতার",
    "আল-মুতাফফিফিন",
    "আল-ইনশিকাক",
    "আল-বুরূজ",
    "আত-তারিক",
    "আল-আলা",
    "আল-গাশিয়াহ",
    "আল-ফজর",
    "আল-বালাদ",
    "আশ-শামস",
    "আল-লাইল",
    "আদ-দুহা",
    "আশ-শারহ",
    "আত-তিন",
    "আল-আলাক",
    "আল-কদর",
    "আল-বাইয়্যিনাহ",
    "আয-যিলযাল",
    "আল-আদিয়াত",
    "আল-কারিয়াহ",
    "আত-তাকাসুর",
    "আল-আসর",
    "আল-হুমাযাহ",
    "আল-ফীল",
    "কুরাইশ",
    "আল-মাউন",
    "আল-কাওসার",
    "আল-কাফিরুন",
    "আন-নাসর",
    "আল-মাসাদ",
    "আল-ইখলাস",
    "আল-ফালাক",
    "আন-নাস"
];


/* =========================================================
   13. NORMALIZE QURAN AYAH
========================================================= */

function normalizeDailyAyah(item, surahNumber) {
    if (!item || typeof item !== "object") {
        return null;
    }

    const arabic = getFirstValue(item, [
        "arabic",
        "textArabic",
        "uthmani",
        "arabicText",
        "ar",
        "text"
    ]);

    const bengali = getFirstValue(item, [
        "bengali",
        "bangla",
        "translationBn",
        "textBangla",
        "bn",
        "translation"
    ]);

    if (!arabic && !bengali) {
        return null;
    }

    let ayahNumber = Number(
        getFirstValue(item, [
            "numberInSurah",
            "ayahNumber",
            "ayah",
            "verse"
        ])
    );

    if (!Number.isFinite(ayahNumber) || ayahNumber < 1) {
        ayahNumber = 1;
    }

    return {
        surah: Number(surahNumber),
        ayah: ayahNumber,
        arabic: arabic || "",
        bengali: bengali || ""
    };
}


/* =========================================================
   14. LOAD QURAN SURAH FILE
========================================================= */

async function loadDailyQuranSurah(surahNumber) {
    const fileName = String(
        surahNumber
    ).padStart(3, "0");

    const url =
        `${DAILY_QURAN_BASE_PATH}${fileName}.json`;

    return await dailyFetchJSON(url);
}


/* =========================================================
   15. GET RANDOM DAILY AYAH
========================================================= */

async function getRandomDailyAyah() {
    const surahs = dailyShuffle(
        Array.from(
            { length: 114 },
            (_, index) => index + 1
        )
    );

    for (const surahNumber of surahs) {
        try {
            const data =
                await loadDailyQuranSurah(
                    surahNumber
                );

            const ayahs = extractArray(data);

            if (!ayahs.length) {
                continue;
            }

            const shuffledAyahs =
                dailyShuffle(ayahs);

            for (const item of shuffledAyahs) {
                const ayah = normalizeDailyAyah(
                    item,
                    surahNumber
                );

                if (ayah) {
                    return ayah;
                }
            }
        } catch (error) {
            console.warn(
                "Daily Quran file unavailable:",
                surahNumber,
                error
            );
        }
    }

    return { ...DAILY_FALLBACK_AYAH };
}


/* =========================================================
   16. QURAN REFERENCE
========================================================= */

function getDailyQuranReference(ayah) {
    if (!ayah) {
        return "";
    }

    const surahNumber = Number(ayah.surah);
    const ayahNumber = Number(ayah.ayah);

    const surahName =
        DAILY_SURAH_NAMES[surahNumber - 1] ||
        `সূরা ${surahNumber}`;

    return `— সূরা ${surahName} (${surahNumber}:${ayahNumber})`;
}


/* =========================================================
   17. HADITH OBJECT CHECK
========================================================= */

function isHadithLikeObject(item) {
    if (!item || typeof item !== "object") {
        return false;
    }

    if (Array.isArray(item)) {
        return false;
    }

    const arabic = getFirstValue(item, [
        "ar",
        "arabic",
        "arab",
        "arabicText",
        "hadithArabic"
    ]);

    const bengali = getFirstValue(item, [
        "bn",
        "bengali",
        "bangla",
        "translationBn",
        "translation",
        "hadith",
        "hadithText",
        "text"
    ]);

    /*
       শুধু hadith_id থাকলেই কোনো Object-কে
       হাদিস ধরা হবে না। মূল টেক্সট থাকতে হবে।
    */

    return Boolean(arabic || bengali);
}


/* =========================================================
   18. NORMALIZE HADITH
========================================================= */

function normalizeDailyHadith(item, bookName) {
    if (!isHadithLikeObject(item)) {
        return null;
    }

    const arabic = getFirstValue(item, [
        "ar",
        "arabic",
        "arab",
        "arabicText",
        "hadithArabic"
    ]);

    const bengali = getFirstValue(item, [
        "bn",
        "bengali",
        "bangla",
        "translationBn",
        "translation",
        "hadith",
        "hadithText",
        "text"
    ]);

    const number = getFirstValue(item, [
        "hadith_id",
        "hadith_number",
        "hadithNumber",
        "hadith_no",
        "number",
        "id"
    ]);

    const narrator = getFirstValue(item, [
        "narrator",
        "rawi",
        "raawi"
    ]);

    const grade = getFirstValue(item, [
        "grade",
        "status",
        "authenticity"
    ]);

    let chapterNumber = "";

    if (
        item.chapter &&
        typeof item.chapter === "object"
    ) {
        chapterNumber = getFirstValue(
            item.chapter,
            [
                "chapter_number",
                "number",
                "id"
            ]
        );
    } else if (
        item.chapter !== undefined &&
        item.chapter !== null
    ) {
        chapterNumber = String(item.chapter);
    }

    if (!chapterNumber) {
        chapterNumber = getFirstValue(item, [
            "chapter_number",
            "chapterNumber",
            "chapter_no"
        ]);
    }

    if (!arabic && !bengali) {
        return null;
    }

    return {
        book: bookName || "",
        number: number || "",
        narrator: narrator || "",
        grade: grade || "",
        chapter: chapterNumber || "",
        arabic: arabic || "",
        bengali: bengali || ""
    };
}


/* =========================================================
   19. RECURSIVE HADITH EXTRACTION
========================================================= */

function collectHadithObjects(data, result = []) {
    if (!data) {
        return result;
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            collectHadithObjects(item, result);
        }

        return result;
    }

    if (typeof data !== "object") {
        return result;
    }

    /*
       সরাসরি হাদিসের টেক্সট থাকলে যোগ করো।
    */

    if (isHadithLikeObject(data)) {
        result.push(data);
        return result;
    }

    /*
       Wrapper object হলে ভেতরের array/object খোঁজো।
    */

    for (const key of Object.keys(data)) {
        if (
            key === "meta" ||
            key === "metadata"
        ) {
            continue;
        }

        const value = data[key];

        if (value && typeof value === "object") {
            collectHadithObjects(value, result);
        }
    }

    return result;
}


/* =========================================================
   20. REMOVE DUPLICATE HADITH
========================================================= */

function removeDuplicateDailyHadith(items) {
    const seen = new Set();
    const result = [];

    for (const item of items) {
        const key = [
            item.book || "",
            item.number || "",
            item.arabic || "",
            item.bengali || ""
        ].join("|");

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(item);
    }

    return result;
}


/* =========================================================
   21. TRY A HADITH FILE
========================================================= */

async function tryDailyHadithFile(bookKey, fileName) {
    const basePath = DAILY_HADITH_PATHS[bookKey];

    if (!basePath) {
        return [];
    }

    const possiblePaths = [
        `${basePath}${fileName}`,
        `${basePath}Chapter/${fileName}`
    ];

    for (const path of possiblePaths) {
        try {
            const data = await dailyFetchJSON(path);

            const items = collectHadithObjects(data);

            if (items.length) {
                return items;
            }
        } catch (error) {
            // ফাইল না পাওয়া গেলে পরের ফাইল চেষ্টা করবে।
        }
    }

    return [];
}


/* =========================================================
   22. LOAD COMMON HADITH FILES
========================================================= */

async function loadDailyHadithFromCommonFiles(
    bookKey,
    bookName
) {
    const fileNames = [
        "hadith.json",
        "data.json",
        "1.json",
        "01.json",
        "001.json",
        "2.json",
        "02.json",
        "002.json",
        "3.json",
        "03.json",
        "003.json"
    ];

    const allItems = [];

    for (const fileName of fileNames) {
        const items = await tryDailyHadithFile(
            bookKey,
            fileName
        );

        for (const item of items) {
            const normalized = normalizeDailyHadith(
                item,
                bookName
            );

            if (normalized) {
                allItems.push(normalized);
            }
        }
    }

    return removeDuplicateDailyHadith(allItems);
}


/* =========================================================
   23. LOAD RANDOM HADITH CHAPTERS
   =========================================================
   আগের মতো ৩টি বইয়ের ৫০টি করে অধ্যায়
   ধারাবাহিকভাবে সব লোড করা হচ্ছে না।

   এতে অ্যাপ চালুর সময় অপ্রয়োজনীয়
   ১৫০টি Request হওয়ার ঝুঁকি কমে।
========================================================= */

async function loadDailyHadithFromChapters(
    bookKey,
    bookName
) {
    const allItems = [];

    /*
       কয়েকটি এলোমেলো অধ্যায় চেষ্টা করবে।
       ফাইল না থাকলে অন্য অধ্যায় চেষ্টা করবে।
    */

    const chapterNumbers = dailyShuffle(
        Array.from(
            { length: DAILY_HADITH_CHAPTER_LIMIT },
            (_, index) => index + 1
        )
    ).slice(0, 8);

    for (const chapterNumber of chapterNumbers) {
        const fileName =
            `${chapterNumber}.json`;

        const items = await tryDailyHadithFile(
            bookKey,
            fileName
        );

        for (const item of items) {
            const normalized = normalizeDailyHadith(
                item,
                bookName
            );

            if (normalized) {
                allItems.push(normalized);
            }
        }
    }

    return removeDuplicateDailyHadith(allItems);
}


/* =========================================================
   24. GET RANDOM DAILY HADITH
========================================================= */

async function getRandomDailyHadith() {
    const books = dailyShuffle([
        {
            key: "bukhari",
            name: DAILY_HADITH_BOOK_NAMES.bukhari
        },
        {
            key: "muslim",
            name: DAILY_HADITH_BOOK_NAMES.muslim
        },
        {
            key: "tirmidhi",
            name: DAILY_HADITH_BOOK_NAMES.tirmidhi
        }
    ]);

    /*
       প্রথমে সাধারণ JSON ফাইল পরীক্ষা।
    */

    for (const book of books) {
        try {
            const items =
                await loadDailyHadithFromCommonFiles(
                    book.key,
                    book.name
                );

            if (items.length) {
                return items[
                    dailyRandomIndex(items.length)
                ];
            }
        } catch (error) {
            console.warn(
                "Common Hadith load failed:",
                book.key,
                error
            );
        }
    }

    /*
       সাধারণ ফাইলে না পেলে অধ্যায়ভিত্তিক ফাইল।
    */

    for (const book of books) {
        try {
            const items =
                await loadDailyHadithFromChapters(
                    book.key,
                    book.name
                );

            if (items.length) {
                return items[
                    dailyRandomIndex(items.length)
                ];
            }
        } catch (error) {
            console.warn(
                "Chapter Hadith load failed:",
                book.key,
                error
            );
        }
    }

    /*
       সব উৎস ব্যর্থ হলে fallback।
    */

    return { ...DAILY_FALLBACK_HADITH };
}


/* =========================================================
   25. NORMALIZE DUA
========================================================= */

function normalizeDailyDua(item) {
    if (!item || typeof item !== "object") {
        return null;
    }

    /*
       API-এর segments structure।
    */

    if (
        Array.isArray(item.segments) &&
        item.segments.length
    ) {
        const segments = item.segments;

        const arabicParts = [];
        const bengaliParts = [];

        for (const segment of segments) {
            if (!segment || typeof segment !== "object") {
                continue;
            }

            const arabic = getFirstValue(segment, [
                "arabic",
                "arabic_diacless",
                "ar"
            ]);

            const bengali = getFirstValue(segment, [
                "translations",
                "translation",
                "bengali",
                "bangla",
                "bn",
                "bottom"
            ]);

            if (arabic) {
                arabicParts.push(arabic);
            }

            if (bengali) {
                bengaliParts.push(bengali);
            }
        }

        return {
            id: item.dua_global_id || item.id || null,
            title: item.duaname || item.title || "দোয়া",
            arabic: arabicParts.join(" "),
            bengali: bengaliParts.join(" "),
            reference:
                item.reference ||
                item.source ||
                ""
        };
    }

    const arabic = getFirstValue(item, [
        "arabic",
        "arabicText",
        "arabic_diacless",
        "ar"
    ]);

    const bengali = getFirstValue(item, [
        "translations",
        "translation",
        "bengali",
        "bangla",
        "translationBn",
        "bn",
        "meaning"
    ]);

    return {
        id: item.dua_global_id || item.id || null,
        title:
            item.duaname ||
            item.title ||
            item.name ||
            "দোয়া",
        arabic: arabic || "",
        bengali: bengali || "",
        reference:
            item.reference ||
            item.source ||
            ""
    };
}


/* =========================================================
   26. GET RANDOM DUA
========================================================= */

async function getRandomDailyDua() {
    /*
       প্রথমে আপনার বর্তমান Dua module-এর
       getDuaCache() থাকলে সেটি ব্যবহার করবে।

       Cache-এর format ভিন্ন হতে পারে,
       তাই normalize করার আগে যাচাই করা হয়।
    */

    try {
        if (typeof window.getDuaCache === "function") {
            const cached = await window.getDuaCache();

            if (Array.isArray(cached) && cached.length) {
                const candidates = dailyShuffle(cached);

                for (const item of candidates) {
                    const dua = normalizeDailyDua(item);

                    if (dua && (dua.arabic || dua.bengali)) {
                        return dua;
                    }
                }
            }
        }
    } catch (error) {
        console.warn(
            "Dua cache read failed:",
            error
        );
    }

    /*
       Random Dua API চেষ্টা।
    */

    try {
        const result = await dailyFetchJSON(
            `${DAILY_DUA_API}/duas/random`
        );

        const item =
            result.data ||
            result.dua ||
            result;

        const dua = normalizeDailyDua(item);

        if (dua && (dua.arabic || dua.bengali)) {
            return dua;
        }
    } catch (error) {
        console.warn(
            "Random Dua API failed:",
            error
        );
    }

    /*
       Random endpoint কাজ না করলে
       category list থেকে Dua খোঁজার চেষ্টা।
    */

    try {
        const result = await dailyFetchJSON(
            `${DAILY_DUA_API}/categories`
        );

        const categories = extractArray(result);

        if (categories.length) {
            const category = categories[
                dailyRandomIndex(categories.length)
            ];

            const categoryId =
                category.id ||
                category.category_id;

            if (categoryId !== undefined && categoryId !== null) {
                const listResult = await dailyFetchJSON(
                    `${DAILY_DUA_API}/categories/` +
                    `${encodeURIComponent(categoryId)}/duas?page=1&limit=100`
                );

                const items = extractArray(listResult);

                if (items.length) {
                    const candidates = dailyShuffle(items);

                    for (const item of candidates) {
                        const dua = normalizeDailyDua(item);

                        if (dua && (dua.arabic || dua.bengali)) {
                            return dua;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.warn(
            "Dua category API failed:",
            error
        );
    }

    return { ...DAILY_FALLBACK_DUA };
}


/* =========================================================
   27. RENDER AYAH
========================================================= */

function renderDailyAyah(ayah) {
    if (!ayah) {
        return;
    }

    const arabic = document.getElementById(
        "dailyAyahArabic"
    );

    const bengali = document.getElementById(
        "dailyAyahBengali"
    );

    const reference = document.getElementById(
        "dailyAyahReference"
    );

    if (arabic) {
        arabic.textContent = ayah.arabic || "—";
        arabic.dir = "rtl";
        arabic.lang = "ar";
    }

    if (bengali) {
        bengali.textContent =
            ayah.bengali ||
            "অনুবাদ পাওয়া যায়নি।";
    }

    if (reference) {
        reference.textContent =
            getDailyQuranReference(ayah);
    }
}


/* =========================================================
   28. RENDER HADITH
========================================================= */

function renderDailyHadith(hadith) {
    if (!hadith) {
        return;
    }

    const arabic = document.getElementById(
        "dailyHadithArabic"
    );

    const bengali = document.getElementById(
        "dailyHadithBengali"
    );

    const reference = document.getElementById(
        "dailyHadithReference"
    );

    if (arabic) {
        if (
            hadith.arabic &&
            String(hadith.arabic).trim()
        ) {
            arabic.textContent = hadith.arabic;
            arabic.style.display = "";
            arabic.dir = "rtl";
            arabic.lang = "ar";
        } else {
            arabic.textContent = "";
            arabic.style.display = "none";
        }
    }

    if (bengali) {
        bengali.textContent =
            hadith.bengali ||
            "হাদিসের বাংলা অনুবাদ পাওয়া যায়নি।";
    }

    if (reference) {
        const parts = [];

        if (hadith.book) {
            parts.push(hadith.book);
        }

        if (hadith.number) {
            parts.push(`হাদিস ${hadith.number}`);
        }

        reference.textContent = parts.length
            ? `— ${parts.join(" • ")}`
            : "";
    }
}


/* =========================================================
   29. RENDER DUA
========================================================= */

function renderDailyDua(dua) {
    if (!dua) {
        return;
    }

    const arabic = document.getElementById(
        "dailyDuaArabic"
    );

    const bengali = document.getElementById(
        "dailyDuaBengali"
    );

    const reference = document.getElementById(
        "dailyDuaReference"
    );

    if (arabic) {
        arabic.textContent = dua.arabic || "—";
        arabic.dir = "rtl";
        arabic.lang = "ar";
    }

    if (bengali) {
        bengali.textContent =
            dua.bengali ||
            "দোয়ার বাংলা অর্থ পাওয়া যায়নি।";
    }

    if (reference) {
        reference.textContent =
            dua.reference
                ? `— ${dua.reference}`
                : "";
    }
}

/* ========================= ANDROID DAILY CONTENT SYNC ========================= */

function syncDailyContentToAndroid(data) {
    try {
        if (!data || !data.dateKey) return;

        if (
            window.AndroidDailyContent &&
            typeof window.AndroidDailyContent.saveDailyContent === "function"
        ) {
            window.AndroidDailyContent.saveDailyContent(
                JSON.stringify(data)
            );
        }
    } catch (error) {
        console.warn("Android Daily Content sync failed:", error);
    }
}
/* =========================================================
   30. RENDER ALL DAILY CONTENT
========================================================= */

function renderDailyContent(data) {
    if (!data) {
        return;
    }

    if (data.ayah) {
        renderDailyAyah(data.ayah);
    }

    if (data.hadith) {
        renderDailyHadith(data.hadith);
    }

    if (data.dua) {
        renderDailyDua(data.dua);
    }
}


/* =========================================================
   31. GENERATE DAILY CONTENT
========================================================= */

async function generateDailyContent() {
    if (dailyContentLoadPromise) {
        return dailyContentLoadPromise;
    }

    if (dailyContentLoading) {
        return dailyContentData;
    }

    dailyContentLoading = true;

    dailyContentLoadPromise = (async function () {
        try {
            console.log(
                "📖 Daily Content তৈরি হচ্ছে..."
            );

            /*
               Promise.allSettled ব্যবহার করা হয়েছে,
               যাতে একটি উৎস ব্যর্থ হলেও
               বাকি কনটেন্ট পাওয়া যায়।
            */

            const results = await Promise.allSettled([
                getRandomDailyAyah(),
                getRandomDailyHadith(),
                getRandomDailyDua()
            ]);

            const ayah =
                results[0].status === "fulfilled"
                    ? results[0].value
                    : { ...DAILY_FALLBACK_AYAH };

            const hadith =
                results[1].status === "fulfilled"
                    ? results[1].value
                    : { ...DAILY_FALLBACK_HADITH };

            const dua =
                results[2].status === "fulfilled"
                    ? results[2].value
                    : { ...DAILY_FALLBACK_DUA };

            /*
               দিনের মধ্যে কনটেন্ট তৈরির সময়
               তারিখ বদলে গেলে পুরোনো দিনের
               কনটেন্ট সংরক্ষণ করা হবে না।
            */

            const dateKey = getDailyDateKey();

            const data = {
                version: DAILY_CONTENT_VERSION,
                dateKey,
                createdAt: Date.now(),
                ayah: ayah || { ...DAILY_FALLBACK_AYAH },
                hadith: hadith || { ...DAILY_FALLBACK_HADITH },
                dua: dua || { ...DAILY_FALLBACK_DUA }
            };

            dailyContentData = data;

            
if (dateKey === getDailyDateKey()) {
    saveDailyContent(data);
    dailyContentData = data;
    renderDailyContent(data);

    // Android notification-এর জন্য Daily Content পাঠানো
    syncDailyContentToAndroid(data);
} else {
    return await loadDailyContent();
}

console.log(
    "✅ Daily Content তৈরি হয়েছে:",
    data
);

            return data;
        } catch (error) {
            console.error(
                "Daily Content generation failed:",
                error
            );

            /*
               সম্পূর্ণ ব্যর্থ হলেও স্ক্রিন ফাঁকা রাখবে না।
            */

            const fallback = {
                version: DAILY_CONTENT_VERSION,
                dateKey: getDailyDateKey(),
                createdAt: Date.now(),
                ayah: { ...DAILY_FALLBACK_AYAH },
                hadith: { ...DAILY_FALLBACK_HADITH },
                dua: { ...DAILY_FALLBACK_DUA }
            };

            dailyContentData = fallback;
            saveDailyContent(fallback);
            renderDailyContent(fallback);
          syncDailyContentToAndroid(fallback);
            return fallback;
        } finally {
            dailyContentLoading = false;
            dailyContentLoadPromise = null;
        }
    })();

    return dailyContentLoadPromise;
}


/* =========================================================
   32. LOAD DAILY CONTENT
========================================================= */

async function loadDailyContent() {
    /*
       একই সময়ে দ্বিতীয়বার load হলে
       চলমান Promise-টাই ফেরত দেবে।
    */

    if (dailyContentLoadPromise) {
        return dailyContentLoadPromise;
    }

    const saved = getSavedDailyContent();

    if (saved) {
        dailyContentData = saved;

        renderDailyContent(saved);
        syncDailyContentToAndroid(saved);

        console.log(
            "✅ আজকের Content LocalStorage থেকে লোড হয়েছে"
        );

        return saved;
    }

    return await generateDailyContent();
}


/* =========================================================
   33. RESET DAILY CONTENT
   DEBUG / TEST
========================================================= */

function resetDailyContent() {
    try {
        localStorage.removeItem(
            DAILY_CONTENT_STORAGE_KEY
        );
    } catch (error) {
        console.warn(
            "Daily Content reset failed:",
            error
        );
    }

    dailyContentData = null;

    return loadDailyContent();
}


/* =========================================================
   34. CHECK FOR NEW DAY
========================================================= */

function checkDailyContentDate() {
    const currentDate = getDailyDateKey();

    if (!dailyContentData) {
        /*
           App আগে থেকেই চালু থাকলে
           Content না থাকলে পুনরায় চেষ্টা করবে।
        */

        if (!dailyContentLoading) {
            loadDailyContent();
        }

        return;
    }

    if (dailyContentData.dateKey !== currentDate) {
        console.log(
            "🔄 নতুন দিন — নতুন Daily Content"
        );

        dailyContentData = null;

        loadDailyContent();
    }
}


/* =========================================================
   35. START DATE CHECK TIMER
========================================================= */

function startDailyContentDateTimer() {
    if (dailyContentDateTimer) {
        return;
    }

    dailyContentDateTimer = setInterval(
        checkDailyContentDate,
        60 * 1000
    );
}


/* =========================================================
   36. INITIALIZE
========================================================= */

function initDailyContent() {
    loadDailyContent();
    startDailyContentDateTimer();
}


/*
   DOMContentLoaded আগে হয়ে গেলে সঙ্গে সঙ্গে
   initialize হবে। না হলে event-এর জন্য অপেক্ষা করবে।
*/

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initDailyContent,
        { once: true }
    );
} else {
    initDailyContent();
}


/* =========================================================
   37. GLOBAL EXPORT
========================================================= */

window.loadDailyContent =
    loadDailyContent;

window.generateDailyContent =
    generateDailyContent;

window.resetDailyContent =
    resetDailyContent;

window.getSavedDailyContent =
    getSavedDailyContent;

window.renderDailyContent =
    renderDailyContent;

window.checkDailyContentDate =
    checkDailyContentDate;


/* =========================================================
   END — QURAN SHARIF DAILY CONTENT v3.0
========================================================= */